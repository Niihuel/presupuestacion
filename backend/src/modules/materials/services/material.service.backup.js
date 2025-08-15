/**
 * Servicio de Materiales
 * 
 * Maneja toda la lógica de negocio relacionada con materiales:
 * - CRUD de materiales
 * - Gestión de stock por planta
 * - Control de precios y proveedores
 * - Cálculos de costos para piezas
 * - Reportes y estadísticas
 */

const { executeQuery, getPool, sql } = require('../../../config/database');
const { AppError } = require('@utilidades');

class MaterialService {
  /**
   * Obtener lista de materiales con filtros
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
      let whereConditions = [];
      let params = [];

      // Filtro base de activos
      if (!includeInactive) {
        whereConditions.push('m.is_active = ?');
        params.push(true);
      }

      // Filtro de búsqueda
      if (search) {
        whereConditions.push('(m.name LIKE ? OR m.code LIKE ? OR m.description LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Filtro por categoría
      if (category) {
        whereConditions.push('m.category = ?');
        params.push(category);
      }

      // Construir WHERE clause
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query principal con información completa
      const query = `
        SELECT 
          m.id,
          m.name,
          m.code,
          m.category,
          m.unit,
          m.description,
          m.min_stock,
          m.is_active,
          m.created_at,
          m.updated_at,
          -- Stock information
          SUM(COALESCE(mps.current_stock, 0)) as total_stock,
          COUNT(DISTINCT mps.plant_id) as plants_count,
          -- Price information
          AVG(mpp.price) as average_price,
          -- Status calculations
          CASE 
            WHEN SUM(COALESCE(mps.current_stock, 0)) = 0 THEN 'out'
            WHEN SUM(COALESCE(mps.current_stock, 0)) <= m.min_stock THEN 'low'
            ELSE 'available'
          END as stock_status,
          CASE 
            WHEN MAX(mpp.updated_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'updated'
            ELSE 'outdated'
          END as price_status,
          -- Suppliers info
          GROUP_CONCAT(
            DISTINCT CONCAT(ms.name, ':', ms.is_default)
            SEPARATOR '; '
          ) as suppliers_info
        FROM materials m
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id 
          AND mpp.valid_from <= CURDATE() 
          AND (mpp.valid_until IS NULL OR mpp.valid_until >= CURDATE())
        LEFT JOIN material_suppliers ms ON m.id = ms.material_id AND ms.is_active = TRUE
        ${whereClause}
        GROUP BY m.id
      `;

      // Aplicar filtros adicionales después del GROUP BY
      let havingConditions = [];
      if (plant) {
        // Necesitamos verificar que el material esté disponible en la planta específica
        const plantCheckQuery = `
          ${query}
          HAVING COUNT(CASE WHEN mps.plant_id = ? THEN 1 END) > 0
        `;
        params.push(plant);
      }

      if (stockStatus) {
        switch (stockStatus) {
          case 'available':
            havingConditions.push('stock_status = "available"');
            break;
          case 'low':
            havingConditions.push('stock_status = "low"');
            break;
          case 'out':
            havingConditions.push('stock_status = "out"');
            break;
        }
      }

      if (priceStatus) {
        havingConditions.push(`price_status = "${priceStatus}"`);
      }

      let finalQuery = query;
      if (havingConditions.length > 0) {
        finalQuery += ` HAVING ${havingConditions.join(' AND ')}`;
      }

      finalQuery += ` ORDER BY m.name ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

      // Preparar parámetros para SQL Server
      const pool = await getPool();
      const request = pool.request();
      
      // Agregar parámetros
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      request.input('limit', sql.Int, limit);
      request.input('offset', sql.Int, offset);

      // Reemplazar ? por @param{index} en la query
      let sqlServerQuery = finalQuery;
      params.forEach((param, index) => {
        sqlServerQuery = sqlServerQuery.replace('?', `@param${index}`);
      });

      // Ejecutar query principal
      const result = await request.query(sqlServerQuery);
      const materials = result.recordset;

      // Query para contar total (sin LIMIT)
      const countQuery = `
        SELECT COUNT(DISTINCT m.id) as total
        FROM materials m
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id 
        LEFT JOIN material_suppliers ms ON m.id = ms.material_id
        ${whereClause}
      `;

      const countRequest = pool.request();
      params.slice(0, -2).forEach((param, index) => {
        countRequest.input(`param${index}`, param);
      });

      let countSqlServerQuery = countQuery;
      params.slice(0, -2).forEach((param, index) => {
        countSqlServerQuery = countSqlServerQuery.replace('?', `@param${index}`);
      });

      const countResult = await countRequest.query(countSqlServerQuery);
      const total = countResult.recordset[0].total;

      // Procesar datos de materials
      const processedMaterials = materials.map(material => ({
        ...material,
        availablePlants: material.plants_count || 0,
        suppliers: material.suppliers_info 
          ? material.suppliers_info.split('; ').map(info => {
              const [name, isDefault] = info.split(':');
              return { name, isDefault: isDefault === '1' };
            })
          : [],
        stats: {
          totalStock: material.total_stock || 0,
          averagePrice: material.average_price || 0,
          plantsCount: material.plants_count || 0
        }
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
   * Obtener un material específico con toda su información
   */
  async getMaterialById(id) {
    try {
      // Material principal
      const pool = await getPool();
      const request = pool.request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        SELECT * FROM materials WHERE id = @id AND is_active = 1
      `);

      if (!result.recordset || result.recordset.length === 0) {
        throw new AppError('Material no encontrado', 404);
      }

      const material = result.recordset[0];

      // Proveedores
      const suppliers = await db.query(`
        SELECT id, name, contact_info, is_default, is_active
        FROM material_suppliers 
        WHERE material_id = ? AND is_active = TRUE
        ORDER BY is_default DESC, name ASC
      `, [id]);

      // Stock por planta
      const plantStocks = await db.query(`
        SELECT 
          mps.*,
          z.name as plant_name,
          z.location
        FROM material_plant_stock mps
        INNER JOIN zones z ON mps.plant_id = z.id
        WHERE mps.material_id = ?
        ORDER BY z.name ASC
      `, [id]);

      // Precios actuales por planta
      const plantPrices = await db.query(`
        SELECT 
          mpp.*,
          z.name as plant_name,
          ms.name as supplier_name
        FROM material_plant_prices mpp
        INNER JOIN zones z ON mpp.plant_id = z.id
        LEFT JOIN material_suppliers ms ON mpp.supplier_id = ms.id
        WHERE mpp.material_id = ? 
          AND mpp.valid_from <= CURDATE() 
          AND (mpp.valid_until IS NULL OR mpp.valid_until >= CURDATE())
        ORDER BY z.name ASC
      `, [id]);

      // Fórmulas de piezas que usan este material
      const associatedPieces = await db.query(`
        SELECT 
          pmf.*,
          p.name as piece_name,
          p.code as piece_code
        FROM piece_material_formulas pmf
        INNER JOIN piezas p ON pmf.piece_id = p.id
        WHERE pmf.material_id = ?
        ORDER BY p.name ASC
      `, [id]);

      return {
        ...material,
        suppliers,
        plantStocks,
        plantPrices,
        associatedPieces,
        stats: {
          totalStock: plantStocks.reduce((sum, stock) => sum + parseFloat(stock.current_stock || 0), 0),
          averagePrice: plantPrices.reduce((sum, price) => sum + parseFloat(price.price || 0), 0) / (plantPrices.length || 1),
          plantsCount: plantStocks.length,
          associatedPieces: associatedPieces.length
        }
      };
    } catch (error) {
      console.error('Error getting material by ID:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener material', 500);
    }
  }

  /**
   * Crear un nuevo material
   */
  async createMaterial(materialData, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        name,
        code,
        category,
        unit,
        description,
        minStock = 0,
        suppliers = [],
        plantPrices = {},
        plantStocks = {}
      } = materialData;

      // Validar que el código no exista
      const [existingMaterial] = await connection.query(
        'SELECT id FROM materials WHERE code = ?',
        [code]
      );

      if (existingMaterial) {
        throw new AppError(`Ya existe un material con el código ${code}`, 400);
      }

      // Insertar material principal
      const [materialResult] = await connection.query(`
        INSERT INTO materials (name, code, category, unit, description, min_stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, code, category, unit, description, minStock]);

      const materialId = materialResult.insertId;

      // Insertar proveedores
      for (const supplier of suppliers) {
        if (supplier.name.trim()) {
          await connection.query(`
            INSERT INTO material_suppliers (material_id, name, contact_info, is_default)
            VALUES (?, ?, ?, ?)
          `, [materialId, supplier.name, supplier.contactInfo || '', supplier.isDefault || false]);
        }
      }

      // Insertar precios por planta
      for (const [plantId, price] of Object.entries(plantPrices)) {
        if (price && price > 0) {
          await connection.query(`
            INSERT INTO material_plant_prices (material_id, plant_id, price, valid_from)
            VALUES (?, ?, ?, CURDATE())
          `, [materialId, plantId, price]);
        }
      }

      // Insertar stock por planta
      for (const [plantId, stock] of Object.entries(plantStocks)) {
        if (stock && stock >= 0) {
          await connection.query(`
            INSERT INTO material_plant_stock (material_id, plant_id, current_stock, last_inventory_date)
            VALUES (?, ?, ?, CURDATE())
          `, [materialId, plantId, stock]);

          // Registrar movimiento inicial
          await connection.query(`
            INSERT INTO material_stock_movements (
              material_id, plant_id, movement_type, quantity, 
              previous_stock, new_stock, reference_type, reason, created_by
            ) VALUES (?, ?, 'in', ?, 0, ?, 'inventory', 'Stock inicial', ?)
          `, [materialId, plantId, stock, stock, userId]);
        }
      }

      await connection.commit();

      // Obtener el material creado con toda la información
      const newMaterial = await this.getMaterialById(materialId);
      return newMaterial;

    } catch (error) {
      await connection.rollback();
      console.error('Error creating material:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear material', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un material
   */
  async updateMaterial(id, materialData, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        name,
        code,
        category,
        unit,
        description,
        minStock,
        suppliers = [],
        plantPrices = {},
        plantStocks = {}
      } = materialData;

      // Verificar que el material existe
      const [existingMaterial] = await connection.query(
        'SELECT * FROM materials WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (!existingMaterial) {
        throw new AppError('Material no encontrado', 404);
      }

      // Validar que el código no esté en uso por otro material
      if (code !== existingMaterial.code) {
        const [duplicateCode] = await connection.query(
          'SELECT id FROM materials WHERE code = ? AND id != ?',
          [code, id]
        );

        if (duplicateCode) {
          throw new AppError(`Ya existe un material con el código ${code}`, 400);
        }
      }

      // Actualizar material principal
      await connection.query(`
        UPDATE materials 
        SET name = ?, code = ?, category = ?, unit = ?, description = ?, min_stock = ?, updated_at = NOW()
        WHERE id = ?
      `, [name, code, category, unit, description, minStock, id]);

      // Actualizar proveedores (eliminar existentes y crear nuevos)
      await connection.query('DELETE FROM material_suppliers WHERE material_id = ?', [id]);
      
      for (const supplier of suppliers) {
        if (supplier.name.trim()) {
          await connection.query(`
            INSERT INTO material_suppliers (material_id, name, contact_info, is_default)
            VALUES (?, ?, ?, ?)
          `, [id, supplier.name, supplier.contactInfo || '', supplier.isDefault || false]);
        }
      }

      // Actualizar precios por planta
      for (const [plantId, price] of Object.entries(plantPrices)) {
        if (price && price > 0) {
          // Obtener precio actual
          const [currentPrice] = await connection.query(`
            SELECT price FROM material_plant_prices 
            WHERE material_id = ? AND plant_id = ? AND valid_from <= CURDATE() 
            AND (valid_until IS NULL OR valid_until >= CURDATE())
          `, [id, plantId]);

          if (currentPrice && parseFloat(currentPrice.price) !== parseFloat(price)) {
            // Cerrar precio actual
            await connection.query(`
              UPDATE material_plant_prices 
              SET valid_until = CURDATE()
              WHERE material_id = ? AND plant_id = ? AND valid_until IS NULL
            `, [id, plantId]);

            // Insertar nuevo precio
            await connection.query(`
              INSERT INTO material_plant_prices (material_id, plant_id, price, valid_from)
              VALUES (?, ?, ?, CURDATE())
            `, [id, plantId, price]);
          } else if (!currentPrice) {
            // Insertar precio si no existe
            await connection.query(`
              INSERT INTO material_plant_prices (material_id, plant_id, price, valid_from)
              VALUES (?, ?, ?, CURDATE())
            `, [id, plantId, price]);
          }
        }
      }

      await connection.commit();

      // Obtener el material actualizado
      const updatedMaterial = await this.getMaterialById(id);
      return updatedMaterial;

    } catch (error) {
      await connection.rollback();
      console.error('Error updating material:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar material', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un material (soft delete)
   */
  async deleteMaterial(id) {
    try {
      // Verificar que no esté siendo usado en fórmulas de piezas
      const [associatedPieces] = await db.query(`
        SELECT COUNT(*) as count FROM piece_material_formulas WHERE material_id = ?
      `, [id]);

      if (associatedPieces.count > 0) {
        throw new AppError(
          `No se puede eliminar el material porque está siendo usado en ${associatedPieces.count} pieza(s)`,
          400
        );
      }

      // Soft delete
      const [result] = await db.query(`
        UPDATE materials SET is_active = FALSE, updated_at = NOW() WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        throw new AppError('Material no encontrado', 404);
      }

      return { message: 'Material eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting material:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar material', 500);
    }
  }

  /**
   * Obtener estadísticas de materiales
   */
  async getMaterialsStats() {
    try {
      const stats = await db.query(`
        SELECT 
          COUNT(*) as total_materials,
          COUNT(CASE WHEN stock_status = 'available' THEN 1 END) as materials_available,
          COUNT(CASE WHEN stock_status = 'low' THEN 1 END) as materials_low_stock,
          COUNT(CASE WHEN stock_status = 'out' THEN 1 END) as materials_out_stock,
          COUNT(CASE WHEN price_status = 'updated' THEN 1 END) as prices_updated,
          COUNT(CASE WHEN price_status = 'outdated' THEN 1 END) as prices_outdated,
          AVG(average_price) as avg_material_price,
          SUM(total_stock) as total_stock_all_materials
        FROM v_materials_with_stock
      `);

      const [categoryStats] = await db.query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(average_price) as avg_price
        FROM v_materials_with_stock
        GROUP BY category
        ORDER BY count DESC
      `);

      return {
        overview: stats[0],
        byCategory: categoryStats
      };
    } catch (error) {
      console.error('Error getting materials stats:', error);
      throw new AppError('Error al obtener estadísticas de materiales', 500);
    }
  }

  /**
   * Calcular costo de materiales para una pieza
   */
  async calculatePieceMaterialCost(pieceId, plantId, quantity = 1) {
    try {
      // Obtener fórmula de materiales para la pieza
      const formula = await db.query(`
        SELECT 
          pmf.*,
          m.name as material_name,
          m.unit,
          mps.current_stock,
          mpp.price as current_price
        FROM piece_material_formulas pmf
        INNER JOIN materials m ON pmf.material_id = m.id
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id AND mps.plant_id = ?
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id AND mpp.plant_id = ?
          AND mpp.valid_from <= CURDATE() 
          AND (mpp.valid_until IS NULL OR mpp.valid_until >= CURDATE())
        WHERE pmf.piece_id = ? AND m.is_active = TRUE
      `, [plantId, plantId, pieceId]);

      if (formula.length === 0) {
        return {
          pieceId,
          plantId,
          quantity,
          materials: [],
          totalCost: 0,
          hasInsufficientMaterials: false,
          hasLowStockMaterials: false,
          errors: ['No hay fórmula de materiales definida para esta pieza']
        };
      }

      let totalCost = 0;
      let hasInsufficientMaterials = false;
      let hasLowStockMaterials = false;
      const materials = [];

      for (const material of formula) {
        const neededQuantity = material.quantity_per_unit * material.waste_factor * quantity;
        const availableStock = material.current_stock || 0;
        const unitPrice = material.current_price || 0;
        const materialCost = neededQuantity * unitPrice;

        totalCost += materialCost;

        // Verificar disponibilidad
        if (availableStock < neededQuantity) {
          hasInsufficientMaterials = true;
        } else if (availableStock <= (neededQuantity * 1.2)) { // 20% de margen
          hasLowStockMaterials = true;
        }

        materials.push({
          materialId: material.material_id,
          name: material.material_name,
          unit: material.unit,
          quantityPerUnit: material.quantity_per_unit,
          wasteFactor: material.waste_factor,
          quantity: neededQuantity,
          availableStock,
          unitPrice,
          cost: materialCost,
          sufficient: availableStock >= neededQuantity
        });
      }

      return {
        pieceId,
        plantId,
        quantity,
        materials,
        totalCost,
        hasInsufficientMaterials,
        hasLowStockMaterials
      };
    } catch (error) {
      console.error('Error calculating piece material cost:', error);
      throw new AppError('Error al calcular costo de materiales', 500);
    }
  }

  /**
   * Actualizar stock de un material en una planta
   */
  async updateMaterialStock(materialId, plantId, stockData, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { currentStock, movement } = stockData;

      // Obtener stock actual
      const [currentStockRecord] = await connection.query(`
        SELECT current_stock FROM material_plant_stock 
        WHERE material_id = ? AND plant_id = ?
      `, [materialId, plantId]);

      const previousStock = currentStockRecord ? parseFloat(currentStockRecord.current_stock) : 0;
      const newStock = parseFloat(currentStock);
      const quantity = newStock - previousStock;

      // Actualizar o insertar stock
      if (currentStockRecord) {
        await connection.query(`
          UPDATE material_plant_stock 
          SET current_stock = ?, last_movement_date = NOW(), updated_at = NOW()
          WHERE material_id = ? AND plant_id = ?
        `, [newStock, materialId, plantId]);
      } else {
        await connection.query(`
          INSERT INTO material_plant_stock (material_id, plant_id, current_stock, last_movement_date)
          VALUES (?, ?, ?, NOW())
        `, [materialId, plantId, newStock]);
      }

      // Registrar movimiento
      if (quantity !== 0) {
        const movementType = quantity > 0 ? 'in' : 'out';
        
        await connection.query(`
          INSERT INTO material_stock_movements (
            material_id, plant_id, movement_type, quantity, 
            previous_stock, new_stock, reference_type, reason, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          materialId, plantId, movementType, Math.abs(quantity),
          previousStock, newStock, movement.type || 'adjustment',
          movement.reason || '', movement.notes || '', userId
        ]);
      }

      await connection.commit();

      return { message: 'Stock actualizado correctamente' };
    } catch (error) {
      await connection.rollback();
      console.error('Error updating material stock:', error);
      throw new AppError('Error al actualizar stock', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener historial de precios de un material
   */
  async getMaterialPriceHistory(materialId) {
    try {
      const history = await db.query(`
        SELECT 
          mph.*,
          z.name as plant_name,
          ms.name as supplier_name
        FROM material_price_history mph
        INNER JOIN zones z ON mph.plant_id = z.id
        LEFT JOIN material_suppliers ms ON mph.supplier_id = ms.id
        WHERE mph.material_id = ?
        ORDER BY mph.changed_at DESC
        LIMIT 100
      `, [materialId]);

      return history;
    } catch (error) {
      console.error('Error getting material price history:', error);
      throw new AppError('Error al obtener historial de precios', 500);
    }
  }

  /**
   * Obtener estadísticas generales de materiales
   */
  async getMaterialsStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_materials,
          COUNT(CASE WHEN m.is_active = 1 THEN 1 END) as active_materials,
          COUNT(DISTINCT m.category) as total_categories,
          COUNT(CASE WHEN mps.current_stock > mps.minimum_stock THEN 1 END) as good_stock,
          COUNT(CASE WHEN mps.current_stock <= mps.minimum_stock AND mps.current_stock > 0 THEN 1 END) as low_stock,
          COUNT(CASE WHEN mps.current_stock = 0 THEN 1 END) as out_of_stock,
          AVG(mpp.price) as avg_price
        FROM materials m
        LEFT JOIN material_plant_stock mps ON m.id = mps.material_id
        LEFT JOIN material_plant_prices mpp ON m.id = mpp.material_id AND mpp.is_active = 1
      `;

      const pool = await getPool();
      const request = pool.request();
      const result = await request.query(query);
      const stats = result.recordset[0];

      return {
        totalMaterials: parseInt(stats.total_materials) || 0,
        activeMaterials: parseInt(stats.active_materials) || 0,
        totalCategories: parseInt(stats.total_categories) || 0,
        stockStatus: {
          good: parseInt(stats.good_stock) || 0,
          low: parseInt(stats.low_stock) || 0,
          out: parseInt(stats.out_of_stock) || 0
        },
        averagePrice: parseFloat(stats.avg_price) || 0
      };
    } catch (error) {
      console.error('Error getting materials stats:', error);
      throw new AppError('Error al obtener estadísticas de materiales', 500);
    }
  }
}

module.exports = new MaterialService();
