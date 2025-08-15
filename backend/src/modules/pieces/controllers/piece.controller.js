// modules/pieces/controllers/piece.controller.js
const { catchAsync, AppError } = require('@shared/utils/app.error');
const { executeQuery } = require('@shared/database/database');
const ApiResponse = require('@shared/utils/ApiResponse');

const generatePieceCode = async (req, res, next) => {
  try {
    const query = `
      SELECT CONCAT('PIEZ-', YEAR(GETDATE()), '-', 
        RIGHT('000' + CAST(ISNULL(MAX(CAST(RIGHT(code, 3) AS INT)), 0) + 1 AS VARCHAR), 3)
      ) AS code
      FROM pieces 
      WHERE code LIKE CONCAT('PIEZ-', YEAR(GETDATE()), '-%')
    `;
    
    const result = await executeQuery(query);
    const code = result.recordset[0]?.code || `PIEZ-${new Date().getFullYear()}-001`;
    
    res.json(ApiResponse.success({ code }, 'Código generado exitosamente'));
  } catch (error) {
    next(error);
  }
};

const getPieces = async (req, res, next) => {
  try {
    const { 
      search, 
      family_id, 
      zone_id, 
      page = 1, 
      limit = 20,
      is_active = true
    } = req.query;

    let query = `
      SELECT 
        p.*,
        pf.name as family_name,
        u.name as unit_name,
        u.code as unit_code,
        z.name as production_zone_name,
        (
          SELECT COUNT(DISTINCT pp.zone_id) 
          FROM piece_prices pp 
          WHERE pp.piece_id = p.id
        ) as zones_with_price
      FROM pieces p
      LEFT JOIN piece_families pf ON p.family_id = pf.id
      LEFT JOIN units_of_measure u ON p.unit_id = u.id
      LEFT JOIN zones z ON p.production_zone_id = z.id
      WHERE 1=1
    `;

    const params = {};

    if (search) {
      query += ` AND (p.name LIKE @search OR p.code LIKE @search OR p.description LIKE @search)`;
      params.search = `%${search}%`;
    }

    if (family_id) {
      query += ` AND p.family_id = @family_id`;
      params.family_id = parseInt(family_id);
    }

    if (is_active !== undefined) {
      query += ` AND p.is_active = @is_active`;
      params.is_active = is_active === 'true' || is_active === true ? 1 : 0;
    }

    // Agregar precio si se especifica zona
    if (zone_id) {
      query = `
        WITH PiecesWithPrice AS (
          ${query}
        )
        SELECT 
          pwp.*,
          pp.base_price,
          pp.adjustment,
          pp.final_price,
          pp.effective_date as price_date
        FROM PiecesWithPrice pwp
        LEFT JOIN piece_prices pp ON pwp.id = pp.piece_id 
          AND pp.zone_id = @zone_id
          AND pp.effective_date = (
            SELECT MAX(pp2.effective_date)
            FROM piece_prices pp2
            WHERE pp2.piece_id = pwp.id 
              AND pp2.zone_id = @zone_id
              AND pp2.effective_date <= GETDATE()
          )
      `;
      params.zone_id = parseInt(zone_id);
    }

    query += ` ORDER BY p.created_at DESC`;

    // Paginación
    const offset = (page - 1) * limit;
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = offset;
    params.limit = parseInt(limit);

    const result = await executeQuery(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) as total FROM pieces p WHERE 1=1`;
    const countParams = {};
    
    if (search) {
      countQuery += ` AND (p.name LIKE @search OR p.code LIKE @search)`;
      countParams.search = `%${search}%`;
    }
    
    if (family_id) {
      countQuery += ` AND p.family_id = @family_id`;
      countParams.family_id = parseInt(family_id);
    }
    
    if (is_active !== undefined) {
      countQuery += ` AND p.is_active = @is_active`;
      countParams.is_active = is_active === 'true' || is_active === true ? 1 : 0;
    }

    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult.recordset[0].total;

    res.json(ApiResponse.paginated(
      result.recordset,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      'Piezas obtenidas exitosamente'
    ));
  } catch (error) {
    next(error);
  }
};

const getPieceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        p.kg_acero_por_um,
        p.volumen_m3_por_um,
        p.peso_tn_por_um,
        p.categoria_ajuste,
        pf.name as family_name,
        u.name as unit_name,
        u.code as unit_code,
        z.name as production_zone_name,
        (
          SELECT 
            pp2.zone_id,
            z2.name as zone_name,
            pp2.base_price,
            pp2.adjustment,
            pp2.final_price,
            pp2.effective_date
          FROM piece_prices pp2
          JOIN zones z2 ON pp2.zone_id = z2.id
          WHERE pp2.piece_id = p.id
            AND pp2.effective_date = (
              SELECT MAX(pp3.effective_date)
              FROM piece_prices pp3
              WHERE pp3.piece_id = pp2.piece_id 
                AND pp3.zone_id = pp2.zone_id
                AND pp3.effective_date <= GETDATE()
            )
          FOR JSON PATH
        ) as prices,
        (
          SELECT 
            pmf.material_id,
            m.code as material_code,
            m.name as material_name,
            pmf.quantity_per_unit,
            pmf.waste_factor
          FROM piece_material_formulas pmf
          JOIN materials m ON pmf.material_id = m.id
          WHERE pmf.piece_id = p.id
          FOR JSON PATH
        ) as bom
      FROM pieces p
      LEFT JOIN piece_families pf ON p.family_id = pf.id
      LEFT JOIN units_of_measure u ON p.unit_id = u.id
      LEFT JOIN zones z ON p.production_zone_id = z.id
      WHERE p.id = @id
    `;

    const result = await executeQuery(query, { id: parseInt(id) });

    if (result.recordset.length === 0) {
      throw new AppError('Pieza no encontrada', 404);
    }

    const piece = result.recordset[0];
    if (piece.prices) {
      piece.prices = JSON.parse(piece.prices);
    }
    if (piece.bom) {
      piece.bom = JSON.parse(piece.bom);
    }

    res.json(ApiResponse.success(piece, 'Pieza obtenida exitosamente'));
  } catch (error) {
    next(error);
  }
};

const createPiece = async (req, res, next) => {
  try {
    const { 
      code, name, description, family_id, unit_id,
      um, categoriaAjuste, production_zone_id,
      length, width, height, weight, volume,
      pesoPorUM_tn, kgAceroPorUM, volumenM3PorUM,
      formula_coefficient, global_coefficient,
      prices = []
    } = req.body;

    // Validaciones
    if (!name || !family_id || !unit_id) {
      throw new AppError('Nombre, familia y unidad son requeridos', 400);
    }

    // Insertar pieza con nuevos campos técnicos
    const insertQuery = `
      INSERT INTO pieces (
        code, name, description, family_id, unit_id,
        length, width, height, weight, volume,
        formula_coefficient, global_coefficient,
        production_zone_id, categoria_ajuste,
        kg_acero_por_um, volumen_m3_por_um, peso_tn_por_um,
        is_active, created_at, updated_at
      ) OUTPUT INSERTED.id
      VALUES (
        @code, @name, @description, @family_id, @unit_id,
        @length, @width, @height, @weight, @volume,
        @formula_coefficient, @global_coefficient,
        @production_zone_id, @categoria_ajuste,
        @kg_acero_por_um, @volumen_m3_por_um, @peso_tn_por_um,
        1, GETDATE(), GETDATE()
      )
    `;

    const result = await executeQuery(insertQuery, {
      code: code || null,
      name,
      description: description || null,
      family_id: parseInt(family_id),
      unit_id: parseInt(unit_id),
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      weight: parseFloat(weight) || 0,
      volume: parseFloat(volume) || 0,
      formula_coefficient: parseFloat(formula_coefficient) || 1,
      global_coefficient: parseFloat(global_coefficient) || 2,
      production_zone_id: production_zone_id ? parseInt(production_zone_id) : null,
      categoria_ajuste: categoriaAjuste || null,
      kg_acero_por_um: parseFloat(kgAceroPorUM) || 0,
      volumen_m3_por_um: parseFloat(volumenM3PorUM) || 0,
      peso_tn_por_um: parseFloat(pesoPorUM_tn) || null
    });

    const pieceId = result.recordset[0].id;

    // Insertar precios si se proporcionan
    if (prices && prices.length > 0) {
      for (const price of prices) {
        const priceQuery = `
          INSERT INTO piece_prices (
            piece_id, zone_id, base_price, adjustment, effective_date, created_at, updated_at
          ) VALUES (
            @piece_id, @zone_id, @base_price, 0, GETDATE(), GETDATE(), GETDATE()
          )
        `;
        
        await executeQuery(priceQuery, {
          piece_id: pieceId,
          zone_id: parseInt(price.zoneId),
          base_price: parseFloat(price.price) || 0
        });
      }
    }

    res.status(201).json(ApiResponse.success(
      { id: pieceId },
      'Pieza creada exitosamente',
      201
    ));
  } catch (error) {
    next(error);
  }
};

const updatePiece = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code, name, description, family_id, unit_id,
      um, categoriaAjuste, production_zone_id,
      length, width, height, weight, volume,
      pesoPorUM_tn, kgAceroPorUM, volumenM3PorUM,
      formula_coefficient, global_coefficient,
      prices = []
    } = req.body;

    // Verificar que la pieza existe
    const checkQuery = `SELECT id FROM pieces WHERE id = @id`;
    const checkResult = await executeQuery(checkQuery, { id: parseInt(id) });
    
    if (checkResult.recordset.length === 0) {
      throw new AppError('Pieza no encontrada', 404);
    }

    // Actualizar pieza con nuevos campos técnicos
    const updateQuery = `
      UPDATE pieces SET
        code = @code,
        name = @name,
        description = @description,
        family_id = @family_id,
        unit_id = @unit_id,
        length = @length,
        width = @width,
        height = @height,
        weight = @weight,
        volume = @volume,
        formula_coefficient = @formula_coefficient,
        global_coefficient = @global_coefficient,
        production_zone_id = @production_zone_id,
        categoria_ajuste = @categoria_ajuste,
        kg_acero_por_um = @kg_acero_por_um,
        volumen_m3_por_um = @volumen_m3_por_um,
        peso_tn_por_um = @peso_tn_por_um,
        updated_at = GETDATE()
      WHERE id = @id
    `;

    await executeQuery(updateQuery, {
      id: parseInt(id),
      code: code || null,
      name,
      description: description || null,
      family_id: parseInt(family_id),
      unit_id: parseInt(unit_id),
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      weight: parseFloat(weight) || 0,
      volume: parseFloat(volume) || 0,
      formula_coefficient: parseFloat(formula_coefficient) || 1,
      global_coefficient: parseFloat(global_coefficient) || 2,
      production_zone_id: production_zone_id ? parseInt(production_zone_id) : null,
      categoria_ajuste: categoriaAjuste || null,
      kg_acero_por_um: parseFloat(kgAceroPorUM) || 0,
      volumen_m3_por_um: parseFloat(volumenM3PorUM) || 0,
      peso_tn_por_um: parseFloat(pesoPorUM_tn) || null
    });

    // Actualizar precios si se proporcionan
    if (prices && prices.length > 0) {
      for (const price of prices) {
        // Verificar si ya existe un precio para esta zona
        const checkPriceQuery = `
          SELECT id FROM piece_prices 
          WHERE piece_id = @piece_id AND zone_id = @zone_id
            AND effective_date = CAST(GETDATE() AS DATE)
        `;
        
        const priceCheck = await executeQuery(checkPriceQuery, {
          piece_id: parseInt(id),
          zone_id: parseInt(price.zoneId)
        });

        if (priceCheck.recordset.length > 0) {
          // Actualizar precio existente
          const updatePriceQuery = `
            UPDATE piece_prices SET
              base_price = @base_price,
              updated_at = GETDATE()
            WHERE piece_id = @piece_id AND zone_id = @zone_id
              AND effective_date = CAST(GETDATE() AS DATE)
          `;
          
          await executeQuery(updatePriceQuery, {
            piece_id: parseInt(id),
            zone_id: parseInt(price.zoneId),
            base_price: parseFloat(price.price) || 0
          });
        } else {
          // Insertar nuevo precio
          const insertPriceQuery = `
            INSERT INTO piece_prices (
              piece_id, zone_id, base_price, adjustment, effective_date, created_at, updated_at
            ) VALUES (
              @piece_id, @zone_id, @base_price, 0, CAST(GETDATE() AS DATE), GETDATE(), GETDATE()
            )
          `;
          
          await executeQuery(insertPriceQuery, {
            piece_id: parseInt(id),
            zone_id: parseInt(price.zoneId),
            base_price: parseFloat(price.price) || 0
          });
        }
      }
    }

    res.json(ApiResponse.success(null, 'Pieza actualizada exitosamente'));
  } catch (error) {
    next(error);
  }
};

const deletePiece = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la pieza existe
    const checkQuery = `SELECT id FROM pieces WHERE id = @id`;
    const checkResult = await executeQuery(checkQuery, { id: parseInt(id) });
    
    if (checkResult.recordset.length === 0) {
      throw new AppError('Pieza no encontrada', 404);
    }

    // Soft delete
    const deleteQuery = `
      UPDATE pieces 
      SET is_active = 0, deleted_at = GETDATE(), updated_at = GETDATE()
      WHERE id = @id
    `;

    await executeQuery(deleteQuery, { id: parseInt(id) });

    res.json(ApiResponse.success(null, 'Pieza eliminada exitosamente'));
  } catch (error) {
    next(error);
  }
};

const getPiecesByZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    const query = `
      SELECT 
        p.*,
        pf.name as family_name,
        u.name as unit_name,
        pp.base_price,
        pp.adjustment,
        pp.final_price,
        pp.effective_date
      FROM pieces p
      LEFT JOIN piece_families pf ON p.family_id = pf.id
      LEFT JOIN units_of_measure u ON p.unit_id = u.id
      LEFT JOIN piece_prices pp ON p.id = pp.piece_id 
        AND pp.zone_id = @zone_id
        AND pp.effective_date = (
          SELECT MAX(pp2.effective_date)
          FROM piece_prices pp2
          WHERE pp2.piece_id = p.id 
            AND pp2.zone_id = @zone_id
            AND pp2.effective_date <= GETDATE()
        )
      WHERE p.is_active = 1
      ORDER BY pf.display_order, p.name
    `;

    const result = await executeQuery(query, { zone_id: parseInt(zoneId) });

    res.json(ApiResponse.success(
      result.recordset,
      'Piezas por zona obtenidas exitosamente'
    ));
  } catch (error) {
    next(error);
  }
};

const getPiecePrices = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        pp.id,
        pp.zone_id,
        z.name as zone_name,
        z.code as zone_code,
        pp.base_price,
        pp.adjustment,
        pp.final_price,
        pp.effective_date,
        pp.expiry_date
      FROM piece_prices pp
      JOIN zones z ON pp.zone_id = z.id
      WHERE pp.piece_id = @piece_id
        AND pp.effective_date = (
          SELECT MAX(pp2.effective_date)
          FROM piece_prices pp2
          WHERE pp2.piece_id = pp.piece_id 
            AND pp2.zone_id = pp.zone_id
            AND pp2.effective_date <= GETDATE()
        )
      ORDER BY z.display_order, z.name
    `;

    const result = await executeQuery(query, { piece_id: parseInt(id) });

    res.json(ApiResponse.success(
      result.recordset,
      'Precios de pieza obtenidos exitosamente'
    ));
  } catch (error) {
    next(error);
  }
};

const updatePiecePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { zone_id, price, adjustment = 0, effective_date } = req.body;

    if (!zone_id || price === undefined) {
      throw new AppError('zone_id y price son requeridos', 400);
    }

    const effectiveDate = effective_date || new Date().toISOString().split('T')[0];

    // Verificar si ya existe un precio para esa fecha
    const checkQuery = `
      SELECT id FROM piece_prices 
      WHERE piece_id = @piece_id AND zone_id = @zone_id AND effective_date = @effective_date
    `;

    const checkResult = await executeQuery(checkQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      effective_date: effectiveDate
    });

    if (checkResult.recordset.length > 0) {
      // Actualizar precio existente
      const updateQuery = `
        UPDATE piece_prices 
        SET base_price = @price, adjustment = @adjustment, updated_at = GETDATE()
        WHERE piece_id = @piece_id AND zone_id = @zone_id AND effective_date = @effective_date
      `;

      await executeQuery(updateQuery, {
        piece_id: parseInt(id),
        zone_id: parseInt(zone_id),
        price: parseFloat(price),
        adjustment: parseFloat(adjustment),
        effective_date: effectiveDate
      });
    } else {
      // Insertar nuevo precio
      const insertQuery = `
        INSERT INTO piece_prices (
          piece_id, zone_id, base_price, adjustment, effective_date, created_at, updated_at
        ) VALUES (
          @piece_id, @zone_id, @price, @adjustment, @effective_date, GETDATE(), GETDATE()
        )
      `;

      await executeQuery(insertQuery, {
        piece_id: parseInt(id),
        zone_id: parseInt(zone_id),
        price: parseFloat(price),
        adjustment: parseFloat(adjustment),
        effective_date: effectiveDate
      });
    }

    res.json(ApiResponse.success(null, 'Precio actualizado exitosamente'));
  } catch (error) {
    next(error);
  }
};

/**
 * Calcular precio por UM usando TVF de costo v2
 * GET /api/pieces/:pieceId/price?zoneId=&asOf=&um=&compare=&publish=
 */
const calculatePiecePrice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { zone_id, as_of_date, compare, publish } = req.query;

  if (!zone_id) {
    throw new AppError('zone_id es requerido', 400);
  }

  const date = as_of_date || new Date().toISOString().split('T')[0];

  // Usar TVF v2 para obtener desglose completo de costos
  const query = `
    SELECT * FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @as_of_date)
  `;

  const result = await executeQuery(query, {
    piece_id: parseInt(id),
    zone_id: parseInt(zone_id),
    as_of_date: date
  });

  if (result.recordset.length === 0) {
    throw new AppError('No se pudo calcular el precio para esta pieza', 404);
  }

  const breakdown = result.recordset[0];
  
  // Obtener información de la pieza para validaciones
  const pieceQuery = `
    SELECT 
      p.id, p.name, p.code, 
      p.kg_acero_por_um, p.volumen_m3_por_um, p.peso_tn_por_um,
      um.code as unit_code, um.name as unit_name
    FROM pieces p
    INNER JOIN units_of_measure um ON p.unit_id = um.id
    WHERE p.id = @piece_id
  `;
  
  const pieceResult = await executeQuery(pieceQuery, {
    piece_id: parseInt(id)
  });
  
  const pieceData = pieceResult.recordset[0];

  // Warnings para datos faltantes
  const warnings = [];
  const missingPrices = [];
  
  if (breakdown.missing_geom === 1) {
    warnings.push('Faltan datos geométricos para el cálculo completo (kg_acero, m³_hormigón o peso_tn por UM)');
  }
  
  if (breakdown.missing_process_params === 1) {
    warnings.push('No hay parámetros de proceso configurados para esta zona/mes');
  }

  // Verificar materiales sin precio
  const materialsQuery = `
    SELECT DISTINCT m.code, m.name
    FROM piece_material_formulas pmf
    INNER JOIN materials m ON pmf.material_id = m.id
    LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id 
      AND mpp.zone_id = @zone_id 
      AND mpp.is_active = 1
      AND mpp.valid_from <= @as_of_date
      AND (mpp.valid_until IS NULL OR mpp.valid_until >= @as_of_date)
    WHERE pmf.piece_id = @piece_id AND mpp.id IS NULL
  `;
  
  const missingMaterialsResult = await executeQuery(materialsQuery, {
    piece_id: parseInt(id),
    zone_id: parseInt(zone_id),
    as_of_date: date
  });
  
  if (missingMaterialsResult.recordset.length > 0) {
    missingPrices.push(...missingMaterialsResult.recordset.map(m => ({
      type: 'material',
      code: m.code,
      name: m.name
    })));
    warnings.push(`Faltan precios para ${missingMaterialsResult.recordset.length} material(es)`);
  }

  // Preparar respuesta base
  const response = {
    piece_id: parseInt(id),
    piece_code: pieceData.code,
    piece_name: pieceData.name,
    zone_id: parseInt(zone_id),
    as_of_date: date,
    unit: {
      code: pieceData.unit_code,
      name: pieceData.unit_name
    },
    breakdown: {
      materiales: parseFloat(breakdown.materiales) || 0,
      proceso_por_tn: parseFloat(breakdown.proceso_por_tn) || 0,
      mano_obra_hormigon: parseFloat(breakdown.mano_obra_hormigon) || 0,
      mano_obra_acero: parseFloat(breakdown.mano_obra_acero) || 0,
      total: parseFloat(breakdown.total) || 0
    },
    technical_data: {
      kg_acero_por_um: parseFloat(pieceData.kg_acero_por_um) || 0,
      volumen_m3_por_um: parseFloat(pieceData.volumen_m3_por_um) || 0,
      peso_tn_por_um: parseFloat(pieceData.peso_tn_por_um) || 0
    },
    warnings: warnings.length > 0 ? warnings : undefined,
    missing_prices: missingPrices.length > 0 ? missingPrices : undefined
  };

  // Si compare=true, calcular comparación con mes anterior
  if (compare === 'true') {
    const previousMonth = new Date(date);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousDate = previousMonth.toISOString().split('T')[0];
    
    // Obtener precio del mes anterior usando función helper
    const previousPriceQuery = `
      SELECT dbo.FN_get_piece_price_previous_month(@piece_id, @zone_id, @current_date) as previous_price
    `;
    
    const previousResult = await executeQuery(previousPriceQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      current_date: date
    });
    
    const previousPrice = previousResult.recordset[0]?.previous_price || 0;
    
    if (previousPrice > 0) {
      const currentPrice = parseFloat(breakdown.total);
      const delta = currentPrice - previousPrice;
      const deltaPercent = (delta / previousPrice) * 100;
      
      response.comparison = {
        previous_month_date: previousDate,
        previous_price: previousPrice,
        current_price: currentPrice,
        delta: delta,
        delta_percent: deltaPercent,
        factor: currentPrice / previousPrice,
        trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'equal'
      };
    }
  }

  // Si publish=true, publicar el precio
  if (publish === 'true') {
    // No publicar si faltan datos críticos
    if (missingPrices.length > 0) {
      throw new AppError('No se puede publicar el precio: faltan precios de materiales', 400);
    }
    
    const publishQuery = `
      DECLARE @price_id INT;
      EXEC dbo.SP_publish_piece_price 
        @piece_id = @piece_id,
        @zone_id = @zone_id,
        @effective_date = @effective_date,
        @price_per_unit = @price,
        @created_by = @user_id,
        @price_id = @price_id OUTPUT;
      SELECT @price_id as price_id;
    `;
    
    const publishResult = await executeQuery(publishQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      effective_date: date,
      price: parseFloat(breakdown.total),
      user_id: req.user?.id || 1
    });
    
    response.published = {
      price_id: publishResult.recordset[0].price_id,
      message: 'Precio publicado exitosamente'
    };
  }

  res.json(ApiResponse.success(response, 'Precio calculado exitosamente'));
});

/**
 * Publicar precio de pieza para un mes/zona
 */
const publishPiecePrice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { zone_id, effective_date, price } = req.body;

  if (!zone_id || !effective_date) {
    throw new AppError('zone_id y effective_date son requeridos', 400);
  }

  let finalPrice = price;

  // Si no se proporciona precio, calcularlo usando TVF
  if (!finalPrice) {
    const calcQuery = `
      SELECT total FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @as_of_date)
    `;

    const calcResult = await executeQuery(calcQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      as_of_date: effective_date
    });

    if (calcResult.recordset.length === 0) {
      throw new AppError('No se pudo calcular el precio', 500);
    }

    finalPrice = calcResult.recordset[0].total;
  }

  // Verificar si ya existe precio publicado para esa fecha
  const checkQuery = `
    SELECT id FROM piece_prices 
    WHERE piece_id = @piece_id AND zone_id = @zone_id AND effective_date = @effective_date
  `;

  const checkResult = await executeQuery(checkQuery, {
    piece_id: parseInt(id),
    zone_id: parseInt(zone_id),
    effective_date: effective_date
  });

  if (checkResult.recordset.length > 0) {
    // Actualizar precio existente
    const updateQuery = `
      UPDATE piece_prices 
      SET base_price = @price, updated_at = GETDATE(), created_by = @user_id
      WHERE piece_id = @piece_id AND zone_id = @zone_id AND effective_date = @effective_date
    `;

    await executeQuery(updateQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      price: parseFloat(finalPrice),
      effective_date: effective_date,
      user_id: req.user?.id || null
    });
  } else {
    // Insertar nuevo precio
    const insertQuery = `
      INSERT INTO piece_prices (
        piece_id, zone_id, base_price, adjustment, effective_date, 
        created_by, created_at, updated_at
      ) VALUES (
        @piece_id, @zone_id, @price, 0, @effective_date, 
        @user_id, GETDATE(), GETDATE()
      )
    `;

    await executeQuery(insertQuery, {
      piece_id: parseInt(id),
      zone_id: parseInt(zone_id),
      price: parseFloat(finalPrice),
      effective_date: effective_date,
      user_id: req.user?.id || null
    });
  }

  res.json(ApiResponse.success({
    piece_id: parseInt(id),
    zone_id: parseInt(zone_id),
    price: parseFloat(finalPrice),
    effective_date: effective_date
  }, 'Precio publicado exitosamente'));
});

/**
 * Obtener histórico de precios de una pieza
 */
const getPieceHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { zone_id, limit = 12 } = req.query;

  let query = `
    SELECT 
      pp.id,
      pp.zone_id,
      z.name as zone_name,
      pp.base_price as price_per_unit,
      pp.effective_date,
      pp.created_at,
      pp.updated_at,
      u.first_name + ' ' + u.last_name as created_by_name
    FROM piece_prices pp
    INNER JOIN zones z ON pp.zone_id = z.id
    LEFT JOIN users u ON pp.created_by = u.id
    WHERE pp.piece_id = @piece_id
      ${zone_id ? 'AND pp.zone_id = @zone_id' : ''}
      AND pp.is_active = 1
    ORDER BY pp.effective_date DESC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const result = await executeQuery(query, {
    piece_id: parseInt(id),
    zone_id: zone_id ? parseInt(zone_id) : null,
    limit: parseInt(limit)
  });

  // Calcular deltas mes a mes
  const history = result.recordset.map((price, index) => {
    const previousPrice = result.recordset[index + 1];
    if (previousPrice && previousPrice.zone_id === price.zone_id) {
      const delta = price.price_per_unit - previousPrice.price_per_unit;
      const deltaPercent = (delta / previousPrice.price_per_unit) * 100;
      
      return {
        ...price,
        previous_price: previousPrice.price_per_unit,
        delta: delta,
        delta_percent: deltaPercent,
        trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'equal'
      };
    }
    return price;
  });

  res.json(ApiResponse.success(history, 'Histórico de precios obtenido exitosamente'));
});

module.exports = {
  generatePieceCode,
  getPieces,
  getPieceById,
  createPiece,
  updatePiece,
  deletePiece,
  getPiecesByZone,
  getPiecePrices,
  updatePiecePrice,
  calculatePiecePrice,
  publishPiecePrice,
  getPieceHistory
};
