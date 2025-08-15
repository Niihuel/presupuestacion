const { catchAsync, AppError } = require('@shared/utils/app.error');
const { executeQuery } = require('@compartido/database/database');

class ProcessParametersController {
  /**
   * Obtener parámetros de proceso para una zona y mes
   */
  getParameters = catchAsync(async (req, res) => {
    const { zone_id, month_date } = req.query;
    
    if (!zone_id || !month_date) {
      throw new AppError('zone_id y month_date son requeridos', 400);
    }

    const query = `
      SELECT 
        pp.*,
        z.name as zone_name,
        z.code as zone_code
      FROM process_parameters pp
      JOIN zones z ON pp.zone_id = z.id
      WHERE pp.zone_id = @zone_id
        AND pp.month_date = @month_date
    `;

    const result = await executeQuery(query, {
      zone_id: parseInt(zone_id),
      month_date: month_date
    });

    if (result.recordset.length === 0) {
      // Intentar obtener el mes anterior como fallback
      const prevMonth = new Date(month_date);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().slice(0, 7) + '-01';

      const fallbackResult = await executeQuery(query, {
        zone_id: parseInt(zone_id),
        month_date: prevMonthStr
      });

      if (fallbackResult.recordset.length > 0) {
        return res.json({
          success: true,
          data: fallbackResult.recordset[0],
          fallback: true,
          message: 'Usando parámetros del mes anterior'
        });
      }

      throw new AppError('No se encontraron parámetros para la zona y mes especificados', 404);
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  });

  /**
   * Crear o actualizar parámetros de proceso
   */
  upsertParameters = catchAsync(async (req, res) => {
    const {
      zone_id,
      month_date,
      energia_curado_tn,
      gg_fabrica_tn,
      gg_empresa_tn,
      utilidad_tn,
      ingenieria_tn,
      precio_hora,
      horas_por_tn_acero,
      horas_por_m3_hormigon
    } = req.body;

    // Validaciones
    if (!zone_id || !month_date) {
      throw new AppError('zone_id y month_date son requeridos', 400);
    }

    // Verificar si ya existe
    const checkQuery = `
      SELECT id FROM process_parameters 
      WHERE zone_id = @zone_id AND month_date = @month_date
    `;

    const existing = await executeQuery(checkQuery, {
      zone_id: parseInt(zone_id),
      month_date: month_date
    });

    let query;
    if (existing.recordset.length > 0) {
      // Actualizar
      query = `
        UPDATE process_parameters
        SET energia_curado_tn = @energia_curado_tn,
            gg_fabrica_tn = @gg_fabrica_tn,
            gg_empresa_tn = @gg_empresa_tn,
            utilidad_tn = @utilidad_tn,
            ingenieria_tn = @ingenieria_tn,
            precio_hora = @precio_hora,
            horas_por_tn_acero = @horas_por_tn_acero,
            horas_por_m3_hormigon = @horas_por_m3_hormigon,
            updated_at = GETDATE()
        WHERE zone_id = @zone_id AND month_date = @month_date
      `;
    } else {
      // Insertar
      query = `
        INSERT INTO process_parameters (
          zone_id, month_date, energia_curado_tn, gg_fabrica_tn,
          gg_empresa_tn, utilidad_tn, ingenieria_tn, precio_hora,
          horas_por_tn_acero, horas_por_m3_hormigon, created_at, updated_at
        ) VALUES (
          @zone_id, @month_date, @energia_curado_tn, @gg_fabrica_tn,
          @gg_empresa_tn, @utilidad_tn, @ingenieria_tn, @precio_hora,
          @horas_por_tn_acero, @horas_por_m3_hormigon, GETDATE(), GETDATE()
        )
      `;
    }

    await executeQuery(query, {
      zone_id: parseInt(zone_id),
      month_date: month_date,
      energia_curado_tn: parseFloat(energia_curado_tn) || 0,
      gg_fabrica_tn: parseFloat(gg_fabrica_tn) || 0,
      gg_empresa_tn: parseFloat(gg_empresa_tn) || 0,
      utilidad_tn: parseFloat(utilidad_tn) || 0,
      ingenieria_tn: parseFloat(ingenieria_tn) || 0,
      precio_hora: parseFloat(precio_hora) || 0,
      horas_por_tn_acero: parseFloat(horas_por_tn_acero) || 0,
      horas_por_m3_hormigon: parseFloat(horas_por_m3_hormigon) || 0
    });

    res.json({
      success: true,
      message: existing.recordset.length > 0 ? 'Parámetros actualizados' : 'Parámetros creados'
    });
  });

  /**
   * Obtener parámetros de múltiples zonas para comparación
   */
  getParametersComparison = catchAsync(async (req, res) => {
    const { month_date } = req.query;
    
    if (!month_date) {
      throw new AppError('month_date es requerido', 400);
    }

    const currentMonth = month_date;
    const prevMonth = new Date(month_date);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7) + '-01';

    const query = `
      SELECT 
        z.id as zone_id,
        z.name as zone_name,
        z.code as zone_code,
        pp_current.*,
        pp_prev.energia_curado_tn as prev_energia_curado_tn,
        pp_prev.gg_fabrica_tn as prev_gg_fabrica_tn,
        pp_prev.gg_empresa_tn as prev_gg_empresa_tn,
        pp_prev.utilidad_tn as prev_utilidad_tn,
        pp_prev.ingenieria_tn as prev_ingenieria_tn,
        pp_prev.precio_hora as prev_precio_hora,
        pp_prev.horas_por_tn_acero as prev_horas_por_tn_acero,
        pp_prev.horas_por_m3_hormigon as prev_horas_por_m3_hormigon
      FROM zones z
      LEFT JOIN process_parameters pp_current 
        ON z.id = pp_current.zone_id AND pp_current.month_date = @current_month
      LEFT JOIN process_parameters pp_prev 
        ON z.id = pp_prev.zone_id AND pp_prev.month_date = @prev_month
      WHERE z.is_active = 1
      ORDER BY z.display_order, z.name
    `;

    const result = await executeQuery(query, {
      current_month: currentMonth,
      prev_month: prevMonthStr
    });

    // Calcular deltas
    const data = result.recordset.map(row => {
      const calculateDelta = (current, prev) => {
        if (!current || !prev || prev === 0) return null;
        return ((current - prev) / prev * 100).toFixed(2);
      };

      return {
        ...row,
        deltas: {
          energia_curado_tn: calculateDelta(row.energia_curado_tn, row.prev_energia_curado_tn),
          gg_fabrica_tn: calculateDelta(row.gg_fabrica_tn, row.prev_gg_fabrica_tn),
          gg_empresa_tn: calculateDelta(row.gg_empresa_tn, row.prev_gg_empresa_tn),
          utilidad_tn: calculateDelta(row.utilidad_tn, row.prev_utilidad_tn),
          ingenieria_tn: calculateDelta(row.ingenieria_tn, row.prev_ingenieria_tn),
          precio_hora: calculateDelta(row.precio_hora, row.prev_precio_hora),
          horas_por_tn_acero: calculateDelta(row.horas_por_tn_acero, row.prev_horas_por_tn_acero),
          horas_por_m3_hormigon: calculateDelta(row.horas_por_m3_hormigon, row.prev_horas_por_m3_hormigon)
        }
      };
    });

    res.json({
      success: true,
      data: data,
      current_month: currentMonth,
      previous_month: prevMonthStr
    });
  });

  /**
   * Copiar parámetros del mes anterior
   */
  copyFromPreviousMonth = catchAsync(async (req, res) => {
    const { zone_id, target_month } = req.body;
    
    if (!zone_id || !target_month) {
      throw new AppError('zone_id y target_month son requeridos', 400);
    }

    const sourceMonth = new Date(target_month);
    sourceMonth.setMonth(sourceMonth.getMonth() - 1);
    const sourceMonthStr = sourceMonth.toISOString().slice(0, 7) + '-01';

    // Verificar que existan parámetros en el mes origen
    const sourceQuery = `
      SELECT * FROM process_parameters 
      WHERE zone_id = @zone_id AND month_date = @source_month
    `;

    const sourceResult = await executeQuery(sourceQuery, {
      zone_id: parseInt(zone_id),
      source_month: sourceMonthStr
    });

    if (sourceResult.recordset.length === 0) {
      throw new AppError('No hay parámetros en el mes anterior para copiar', 404);
    }

    const sourceParams = sourceResult.recordset[0];

    // Verificar si ya existen en el mes destino
    const checkQuery = `
      SELECT id FROM process_parameters 
      WHERE zone_id = @zone_id AND month_date = @target_month
    `;

    const existing = await executeQuery(checkQuery, {
      zone_id: parseInt(zone_id),
      target_month: target_month
    });

    if (existing.recordset.length > 0) {
      throw new AppError('Ya existen parámetros para el mes destino', 400);
    }

    // Copiar parámetros
    const insertQuery = `
      INSERT INTO process_parameters (
        zone_id, month_date, energia_curado_tn, gg_fabrica_tn,
        gg_empresa_tn, utilidad_tn, ingenieria_tn, precio_hora,
        horas_por_tn_acero, horas_por_m3_hormigon, created_at, updated_at
      ) VALUES (
        @zone_id, @month_date, @energia_curado_tn, @gg_fabrica_tn,
        @gg_empresa_tn, @utilidad_tn, @ingenieria_tn, @precio_hora,
        @horas_por_tn_acero, @horas_por_m3_hormigon, GETDATE(), GETDATE()
      )
    `;

    await executeQuery(insertQuery, {
      zone_id: parseInt(zone_id),
      month_date: target_month,
      energia_curado_tn: sourceParams.energia_curado_tn,
      gg_fabrica_tn: sourceParams.gg_fabrica_tn,
      gg_empresa_tn: sourceParams.gg_empresa_tn,
      utilidad_tn: sourceParams.utilidad_tn,
      ingenieria_tn: sourceParams.ingenieria_tn,
      precio_hora: sourceParams.precio_hora,
      horas_por_tn_acero: sourceParams.horas_por_tn_acero,
      horas_por_m3_hormigon: sourceParams.horas_por_m3_hormigon
    });

    res.json({
      success: true,
      message: 'Parámetros copiados exitosamente',
      source_month: sourceMonthStr,
      target_month: target_month
    });
  });
}

module.exports = new ProcessParametersController();