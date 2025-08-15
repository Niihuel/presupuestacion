const { getPool, sql } = require('../../../config/database');
const { AppError } = require('@utilidades');

class MaterialService {
  /** Generar código para material: MAT-YYYY-XXX */
  async generateMaterialCode() {
    try {
      const pool = await getPool();
      const currentYear = new Date().getFullYear();
      const prefix = `MAT-${currentYear}-`;

      const query = `SELECT code FROM materials WHERE code LIKE @prefix`;
      const result = await pool
        .request()
        .input('prefix', sql.NVarChar, `${prefix}%`)
        .query(query);

      const rows = Array.isArray(result?.recordset) ? result.recordset : [];
      const existingNumbers = rows
        .map((row) => {
          const m = (row.code || '').match(/MAT-\d{4}-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);

      let next = 1;
      while (existingNumbers.includes(next)) next++;
      return `${prefix}${String(next).padStart(3, '0')}`;
    } catch (error) {
      // Fallback robusto en caso de que la tabla no exista o haya error de conexión
      const currentYear = new Date().getFullYear();
      return `MAT-${currentYear}-001`;
    }
  }
  /**
   * Obtener lista de materiales con filtros y paginación
   */
  async getMaterials(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        plant = '',
        stockStatus = '',
        priceStatus = '',
        includeInactive = false
      } = filters;

      const offset = (page - 1) * limit;
      const pool = await getPool();

      // Construir condiciones WHERE
      let whereConditions = [];
      let params = [];

      // Filtro base de activos
      if (!includeInactive) {
        whereConditions.push('m.is_active = 1');
      }

      // Filtro de búsqueda
      if (search) {
        whereConditions.push('(m.name LIKE @search OR m.description LIKE @search)');
        params.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
      }

      // Filtro por categoría
      if (category) {
        whereConditions.push('m.category = @category');
        params.push({ name: 'category', type: sql.NVarChar, value: category });
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query principal con sintaxis SQL Server
      const query = `
        SELECT 
          m.id,
          m.name,
          m.category,
          m.subcategory,
          m.unit,
          m.description,
          m.minimum_stock,
          m.is_active,
          m.created_at,
          m.updated_at,
          -- Stock information
          ISNULL(SUM(mps.current_stock), 0) as total_stock,
          COUNT(DISTINCT mps.zone_id) as plants_count,
          -- Price information  
          AVG(mpp.price) as average_price,
          -- Status calculations
          CASE 
            WHEN ISNULL(SUM(mps.current_stock), 0) = 0 THEN 'out'
            WHEN ISNULL(SUM(mps.current_stock), 0) <= m.minimum_stock THEN 'low'
            ELSE 'available'
          END as stock_status,
          CASE 
            WHEN MAX(mpp.updated_at) >= DATEADD(day, -30, GETDATE()) THEN 'updated'
            ELSE 'outdated'
          END as price_status
        FROM materials m
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id 
          AND mpp.valid_from <= CAST(GETDATE() AS DATE)
          AND (mpp.valid_until IS NULL OR mpp.valid_until >= CAST(GETDATE() AS DATE))
          AND mpp.is_active = 1
        ${whereClause}
        GROUP BY m.id, m.name, m.category, m.subcategory, m.unit, m.description, 
                 m.minimum_stock, m.is_active, m.created_at, m.updated_at
      `;

      // Aplicar filtros adicionales con HAVING
      let havingConditions = [];
      
      if (plant) {
        havingConditions.push('COUNT(CASE WHEN mps.zone_id = @plant THEN 1 END) > 0');
        params.push({ name: 'plant', type: sql.Int, value: parseInt(plant) });
      }

      if (stockStatus) {
        switch (stockStatus) {
          case 'available':
            havingConditions.push("(CASE WHEN ISNULL(SUM(mps.current_stock), 0) = 0 THEN 'out' WHEN ISNULL(SUM(mps.current_stock), 0) <= m.minimum_stock THEN 'low' ELSE 'available' END) = 'available'");
            break;
          case 'low':
            havingConditions.push("(CASE WHEN ISNULL(SUM(mps.current_stock), 0) = 0 THEN 'out' WHEN ISNULL(SUM(mps.current_stock), 0) <= m.minimum_stock THEN 'low' ELSE 'available' END) = 'low'");
            break;
          case 'out':
            havingConditions.push("(CASE WHEN ISNULL(SUM(mps.current_stock), 0) = 0 THEN 'out' WHEN ISNULL(SUM(mps.current_stock), 0) <= m.minimum_stock THEN 'low' ELSE 'available' END) = 'out'");
            break;
        }
      }

      if (priceStatus) {
        havingConditions.push("(CASE WHEN MAX(mpp.updated_at) >= DATEADD(day, -30, GETDATE()) THEN 'updated' ELSE 'outdated' END) = @priceStatus");
        params.push({ name: 'priceStatus', type: sql.NVarChar, value: priceStatus });
      }

      let finalQuery = query;
      if (havingConditions.length > 0) {
        finalQuery += ` HAVING ${havingConditions.join(' AND ')}`;
      }

      finalQuery += ` ORDER BY m.name ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

      // Preparar parámetros
      const request = pool.request();
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });
      request.input('limit', sql.Int, parseInt(limit));
      request.input('offset', sql.Int, offset);

      // Ejecutar query principal
      const result = await request.query(finalQuery);
      const materials = result.recordset;

      // Query para contar total
      const countQuery = `
        SELECT COUNT(DISTINCT m.id) as total
        FROM materials m
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id 
        ${whereClause}
      `;

      const countRequest = pool.request();
      params.filter(p => !['limit', 'offset', 'plant', 'priceStatus'].includes(p.name)).forEach(param => {
        countRequest.input(param.name, param.type, param.value);
      });

      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;

      // Procesar datos de materials
      const processedMaterials = materials.map(material => ({
        id: material.id,
        name: material.name,
        category: material.category,
        subcategory: material.subcategory,
        unit: material.unit,
        description: material.description,
        minimum_stock: material.minimum_stock,
        is_active: material.is_active,
        created_at: material.created_at,
        updated_at: material.updated_at,
        availablePlants: parseInt(material.plants_count) || 0,
        stats: {
          totalStock: parseFloat(material.total_stock) || 0,
          averagePrice: parseFloat(material.average_price) || 0,
          plantsCount: parseInt(material.plants_count) || 0
        },
        stock_status: material.stock_status || 'unknown',
        price_status: material.price_status || 'unknown'
      }));

      return {
        materials: processedMaterials,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting materials:', error);
      throw new AppError('Error al obtener materiales', 500);
    }
  }

  /**
   * Obtener estadísticas de materiales
   */
  async getMaterialsStats() {
    try {
      const pool = await getPool();
      
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN m.is_active = 1 THEN 1 END) as active,
          COUNT(CASE WHEN m.is_active = 0 THEN 1 END) as inactive,
          COUNT(DISTINCT m.category) as categories,
          -- Stock stats
          SUM(CASE WHEN ISNULL(stock_summary.total_stock, 0) = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN ISNULL(stock_summary.total_stock, 0) > 0 AND ISNULL(stock_summary.total_stock, 0) <= m.minimum_stock THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN ISNULL(stock_summary.total_stock, 0) > m.minimum_stock THEN 1 ELSE 0 END) as in_stock
        FROM materials m
        LEFT JOIN (
          SELECT 
            material_id,
            SUM(current_stock) as total_stock
          FROM material_plant_stock
          GROUP BY material_id
        ) stock_summary ON m.id = stock_summary.material_id
      `;

      const result = await pool.request().query(query);
      const stats = result.recordset[0];

      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        categories: parseInt(stats.categories) || 0,
        stock: {
          out_of_stock: parseInt(stats.out_of_stock) || 0,
          low_stock: parseInt(stats.low_stock) || 0,
          in_stock: parseInt(stats.in_stock) || 0
        }
      };
    } catch (error) {
      console.error('Error getting materials stats:', error);
      throw new AppError('Error al obtener estadísticas de materiales', 500);
    }
  }

  /**
   * Obtener material por ID
   */
  async getMaterialById(id) {
    try {
      const pool = await getPool();
      
      const query = `
        SELECT 
          m.*,
          -- Stock por planta
          (
            SELECT 
              z.name as zone_name,
              mps.current_stock,
              mps.reserved_stock,  
              mps.available_stock,
              mps.minimum_stock,
              mps.location
            FROM material_plant_stock mps
            INNER JOIN zones z ON mps.zone_id = z.id
            WHERE mps.material_id = m.id
            FOR JSON AUTO
          ) as plant_stock,
          -- Precios por planta
          (
            SELECT 
              z.name as zone_name,
              mpp.price,
              mpp.currency,
              mpp.valid_from,
              mpp.valid_until,
              ms.supplier_name
            FROM material_plant_prices mpp
            INNER JOIN zones z ON mpp.zone_id = z.id
            LEFT JOIN material_suppliers ms ON mpp.supplier_id = ms.id
            WHERE mpp.material_id = m.id AND mpp.is_active = 1
            FOR JSON AUTO
          ) as plant_prices
        FROM materials m
        WHERE m.id = @id
      `;

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(query);

      if (result.recordset.length === 0) {
        throw new AppError('Material no encontrado', 404);
      }

      const material = result.recordset[0];
      
      return {
        ...material,
        plant_stock: material.plant_stock ? JSON.parse(material.plant_stock) : [],
        plant_prices: material.plant_prices ? JSON.parse(material.plant_prices) : []
      };
    } catch (error) {
      console.error('Error getting material by ID:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener material', 500);
    }
  }

  /**
   * Crear nuevo material
   */
  async createMaterial(materialData) {
    try {
      const pool = await getPool();
      
      const {
        name,
        description,
        category,
        subcategory,
        unit,
        density,
        minimum_stock,
        maximum_stock,
        reorder_point,
        lead_time_days,
        notes
      } = materialData;

      const query = `
        INSERT INTO materials (
          name, description, category, subcategory, unit, density,
          minimum_stock, maximum_stock, reorder_point, lead_time_days, notes
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @description, @category, @subcategory, @unit, @density,
          @minimum_stock, @maximum_stock, @reorder_point, @lead_time_days, @notes
        )
      `;

      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('description', sql.NVarChar, description || null)
        .input('category', sql.NVarChar, category)
        .input('subcategory', sql.NVarChar, subcategory || null)
        .input('unit', sql.NVarChar, unit)
        .input('density', sql.Decimal(10, 4), density || null)
        .input('minimum_stock', sql.Decimal(12, 4), minimum_stock || 0)
        .input('maximum_stock', sql.Decimal(12, 4), maximum_stock || null)
        .input('reorder_point', sql.Decimal(12, 4), reorder_point || 0)
        .input('lead_time_days', sql.Int, lead_time_days || 7)
        .input('notes', sql.NVarChar, notes || null)
        .query(query);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating material:', error);
      if (error.number === 2627) { // Unique constraint violation
        throw new AppError('Ya existe un material con ese nombre', 409);
      }
      throw new AppError('Error al crear material', 500);
    }
  }

  /**
   * Actualizar material
   */
  async updateMaterial(id, materialData) {
    try {
      const pool = await getPool();
      
      const {
        name,
        description,
        category,
        subcategory,
        unit,
        density,
        minimum_stock,
        maximum_stock,
        reorder_point,
        lead_time_days,
        notes,
        is_active
      } = materialData;

      const query = `
        UPDATE materials 
        SET 
          name = @name,
          description = @description,
          category = @category,
          subcategory = @subcategory,
          unit = @unit,
          density = @density,
          minimum_stock = @minimum_stock,
          maximum_stock = @maximum_stock,
          reorder_point = @reorder_point,
          lead_time_days = @lead_time_days,
          notes = @notes,
          is_active = @is_active,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `;

      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('name', sql.NVarChar, name)
        .input('description', sql.NVarChar, description || null)
        .input('category', sql.NVarChar, category)
        .input('subcategory', sql.NVarChar, subcategory || null)
        .input('unit', sql.NVarChar, unit)
        .input('density', sql.Decimal(10, 4), density || null)
        .input('minimum_stock', sql.Decimal(12, 4), minimum_stock || 0)
        .input('maximum_stock', sql.Decimal(12, 4), maximum_stock || null)
        .input('reorder_point', sql.Decimal(12, 4), reorder_point || 0)
        .input('lead_time_days', sql.Int, lead_time_days || 7)
        .input('notes', sql.NVarChar, notes || null)
        .input('is_active', sql.Bit, is_active !== undefined ? is_active : true)
        .query(query);

      if (result.recordset.length === 0) {
        throw new AppError('Material no encontrado', 404);
      }

      return result.recordset[0];
    } catch (error) {
      console.error('Error updating material:', error);
      if (error instanceof AppError) throw error;
      if (error.number === 2627) {
        throw new AppError('Ya existe un material con ese nombre', 409);
      }
      throw new AppError('Error al actualizar material', 500);
    }
  }

  /**
   * Eliminar material (soft delete)
   */
  async deleteMaterial(id) {
    try {
      const pool = await getPool();
      
      const query = `
        UPDATE materials 
        SET is_active = 0, updated_at = GETDATE()
        WHERE id = @id AND is_active = 1
      `;

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(query);

      if (result.rowsAffected[0] === 0) {
        throw new AppError('Material no encontrado o ya está inactivo', 404);
      }

      return { message: 'Material eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting material:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar material', 500);
    }
  }

  /**
   * Obtener piezas que utilizan este material (Where Used / BOM Analysis)
   */
  async getWhereUsed(materialId, zoneId, monthDate) {
    try {
      const pool = await getPool();
      
      // Query para obtener piezas que usan este material con cálculo de impacto
      const query = `
        WITH material_price AS (
          SELECT TOP 1 price
          FROM material_plant_prices
          WHERE material_id = @material_id
            AND zone_id = @zone_id
            AND valid_from <= @month_date
            AND (valid_until IS NULL OR valid_until >= @month_date)
            AND is_active = 1
          ORDER BY valid_from DESC
        ),
        piece_costs AS (
          SELECT 
            p.id as piece_id,
            p.code as piece_code,
            p.name as piece_name,
            um.code as unit_code,
            pmf.quantity_per_unit,
            pmf.waste_factor,
            -- Consumo efectivo = quantity * (1 + waste)
            pmf.quantity_per_unit * (1 + ISNULL(pmf.waste_factor, 0)) as effective_consumption,
            -- Costo aportado = consumo efectivo * precio del material
            pmf.quantity_per_unit * (1 + ISNULL(pmf.waste_factor, 0)) * ISNULL(mp.price, 0) as contributed_cost,
            mp.price as material_price,
            -- Obtener costo total de materiales de la pieza
            (
              SELECT SUM(pmf2.quantity_per_unit * (1 + ISNULL(pmf2.waste_factor, 0)) * ISNULL(mpp2.price, 0))
              FROM piece_material_formulas pmf2
              LEFT JOIN (
                SELECT m2.id, 
                  (SELECT TOP 1 price 
                   FROM material_plant_prices mpp3
                   WHERE mpp3.material_id = m2.id
                     AND mpp3.zone_id = @zone_id
                     AND mpp3.valid_from <= @month_date
                     AND (mpp3.valid_until IS NULL OR mpp3.valid_until >= @month_date)
                     AND mpp3.is_active = 1
                   ORDER BY mpp3.valid_from DESC
                  ) as price
                FROM materials m2
              ) mpp2 ON pmf2.material_id = mpp2.id
              WHERE pmf2.piece_id = p.id
            ) as total_material_cost
          FROM pieces p
          INNER JOIN piece_material_formulas pmf ON p.id = pmf.piece_id
          INNER JOIN units_of_measure um ON p.unit_id = um.id
          CROSS JOIN material_price mp
          WHERE pmf.material_id = @material_id
            AND p.is_active = 1
        )
        SELECT 
          piece_id,
          piece_code,
          piece_name,
          unit_code,
          quantity_per_unit,
          waste_factor,
          effective_consumption,
          material_price,
          contributed_cost,
          total_material_cost,
          -- Porcentaje de participación
          CASE 
            WHEN total_material_cost > 0 
            THEN (contributed_cost / total_material_cost) * 100
            ELSE 0
          END as participation_percent,
          -- Precio publicado más reciente de la pieza
          (
            SELECT TOP 1 pp.base_price
            FROM piece_prices pp
            WHERE pp.piece_id = piece_id
              AND pp.zone_id = @zone_id
              AND pp.effective_date <= @month_date
            ORDER BY pp.effective_date DESC
          ) as published_price
        FROM piece_costs
        ORDER BY participation_percent DESC, piece_name
      `;

      const result = await pool.request()
        .input('material_id', sql.Int, materialId)
        .input('zone_id', sql.Int, zoneId)
        .input('month_date', sql.Date, monthDate)
        .query(query);

      // Obtener información del material
      const materialQuery = `
        SELECT code, name, unit, category
        FROM materials
        WHERE id = @material_id
      `;

      const materialResult = await pool.request()
        .input('material_id', sql.Int, materialId)
        .query(materialQuery);

      const material = materialResult.recordset[0];

      return {
        material: material,
        zone_id: zoneId,
        month_date: monthDate,
        affected_pieces: result.recordset,
        total_pieces: result.recordset.length,
        total_impact: result.recordset.reduce((sum, p) => sum + (p.contributed_cost || 0), 0)
      };
    } catch (error) {
      console.error('Error getting where used:', error);
      throw new AppError('Error al obtener uso del material', 500);
    }
  }

  /**
   * Cerrar mes para precios de materiales
   */
  async closeMonth(zoneId, monthDate, userId) {
    try {
      const pool = await getPool();
      
      // Verificar si el mes ya está cerrado
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM material_plant_prices
        WHERE zone_id = @zone_id
          AND YEAR(valid_from) = YEAR(@month_date)
          AND MONTH(valid_from) = MONTH(@month_date)
          AND is_closed = 1
      `;

      const checkResult = await pool.request()
        .input('zone_id', sql.Int, zoneId)
        .input('month_date', sql.Date, monthDate)
        .query(checkQuery);

      if (checkResult.recordset[0].count > 0) {
        throw new AppError('El mes ya está cerrado para esta zona', 400);
      }

      // Marcar todos los precios del mes como cerrados
      const closeQuery = `
        UPDATE material_plant_prices
        SET is_closed = 1,
            closed_by = @user_id,
            closed_at = GETDATE()
        WHERE zone_id = @zone_id
          AND YEAR(valid_from) = YEAR(@month_date)
          AND MONTH(valid_from) = MONTH(@month_date)
          AND is_active = 1
      `;

      const result = await pool.request()
        .input('zone_id', sql.Int, zoneId)
        .input('month_date', sql.Date, monthDate)
        .input('user_id', sql.Int, userId)
        .query(closeQuery);

      return {
        message: 'Mes cerrado correctamente',
        affected_records: result.rowsAffected[0]
      };
    } catch (error) {
      console.error('Error closing month:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cerrar el mes', 500);
    }
  }

  /**
   * Importar precios desde CSV
   */
  async importPricesFromCSV(zoneId, monthDate, data, userId) {
    try {
      const pool = await getPool();
      const transaction = pool.transaction();
      await transaction.begin();

      let imported = 0;
      let failed = 0;
      const errors = [];

      try {
        for (const row of data) {
          try {
            // Buscar material por código
            const materialQuery = `
              SELECT id FROM materials WHERE code = @code AND is_active = 1
            `;

            const materialResult = await transaction.request()
              .input('code', sql.NVarChar, row.material_code)
              .query(materialQuery);

            if (materialResult.recordset.length === 0) {
              errors.push(`Material ${row.material_code} no encontrado`);
              failed++;
              continue;
            }

            const materialId = materialResult.recordset[0].id;

            // Insertar o actualizar precio
            const upsertQuery = `
              MERGE material_plant_prices AS target
              USING (SELECT @material_id as material_id, @zone_id as zone_id, @month_date as valid_from) AS source
              ON target.material_id = source.material_id 
                AND target.zone_id = source.zone_id
                AND target.valid_from = source.valid_from
              WHEN MATCHED THEN
                UPDATE SET 
                  price = @price,
                  updated_by = @user_id,
                  updated_at = GETDATE()
              WHEN NOT MATCHED THEN
                INSERT (material_id, zone_id, price, valid_from, is_active, created_by, created_at)
                VALUES (@material_id, @zone_id, @price, @month_date, 1, @user_id, GETDATE());
            `;

            await transaction.request()
              .input('material_id', sql.Int, materialId)
              .input('zone_id', sql.Int, zoneId)
              .input('price', sql.Decimal(15, 2), parseFloat(row.price))
              .input('month_date', sql.Date, monthDate)
              .input('user_id', sql.Int, userId)
              .query(upsertQuery);

            imported++;
          } catch (error) {
            errors.push(`Error en fila: ${error.message}`);
            failed++;
          }
        }

        await transaction.commit();

        return {
          success: true,
          imported: imported,
          failed: failed,
          errors: errors
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error importing prices:', error);
      throw new AppError('Error al importar precios', 500);
    }
  }

  /**
   * Exportar precios a CSV
   */
  async exportPricesToCSV(zoneId, monthDate) {
    try {
      const pool = await getPool();
      
      const query = `
        SELECT 
          m.code as material_code,
          m.name as material_name,
          m.category,
          m.unit,
          mpp.price,
          mpp.valid_from,
          mpp.valid_until
        FROM materials m
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id
          AND mpp.zone_id = @zone_id
          AND mpp.valid_from <= @month_date
          AND (mpp.valid_until IS NULL OR mpp.valid_until >= @month_date)
          AND mpp.is_active = 1
        WHERE m.is_active = 1
        ORDER BY m.category, m.name
      `;

      const result = await pool.request()
        .input('zone_id', sql.Int, zoneId)
        .input('month_date', sql.Date, monthDate)
        .query(query);

      // Generar CSV
      const headers = ['Código', 'Nombre', 'Categoría', 'Unidad', 'Precio', 'Vigente Desde', 'Vigente Hasta'];
      const rows = result.recordset.map(row => [
        row.material_code,
        row.material_name,
        row.category,
        row.unit,
        row.price || 0,
        row.valid_from ? new Date(row.valid_from).toISOString().split('T')[0] : '',
        row.valid_until ? new Date(row.valid_until).toISOString().split('T')[0] : ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('Error exporting prices:', error);
      throw new AppError('Error al exportar precios', 500);
    }
  }

  /**
   * Recalcular impacto de cambio de precio en piezas
   */
  async recalculateImpact(materialId, zoneId, monthDate) {
    try {
      const pool = await getPool();
      
      // Obtener piezas afectadas con nuevo cálculo
      const whereUsed = await this.getWhereUsed(materialId, zoneId, monthDate);
      
      // Para cada pieza afectada, recalcular su precio total si es necesario
      const updates = [];
      
      for (const piece of whereUsed.affected_pieces) {
        // Calcular nuevo precio usando TVF
        const priceQuery = `
          SELECT total FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @as_of_date)
        `;

        const priceResult = await pool.request()
          .input('piece_id', sql.Int, piece.piece_id)
          .input('zone_id', sql.Int, zoneId)
          .input('as_of_date', sql.Date, monthDate)
          .query(priceQuery);

        if (priceResult.recordset.length > 0) {
          const newPrice = priceResult.recordset[0].total;
          const oldPrice = piece.published_price || 0;
          const delta = newPrice - oldPrice;
          const deltaPercent = oldPrice > 0 ? (delta / oldPrice) * 100 : 0;

          updates.push({
            piece_id: piece.piece_id,
            piece_code: piece.piece_code,
            piece_name: piece.piece_name,
            old_price: oldPrice,
            new_price: newPrice,
            delta: delta,
            delta_percent: deltaPercent
          });
        }
      }

      return {
        material_id: materialId,
        zone_id: zoneId,
        month_date: monthDate,
        affected_pieces: whereUsed.affected_pieces.length,
        price_updates: updates,
        total_impact: updates.reduce((sum, u) => sum + Math.abs(u.delta), 0)
      };
    } catch (error) {
      console.error('Error recalculating impact:', error);
      throw new AppError('Error al recalcular impacto', 500);
    }
  }
}

module.exports = new MaterialService();
