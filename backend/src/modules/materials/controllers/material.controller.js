/**
 * Controlador de Materiales
 * 
 * Maneja todas las peticiones HTTP relacionadas con materiales
 */

const materialService = require('../services/material.service');
const { successResponse, errorResponse } = require('../../../shared/utils');
const { logCrud } = require('../../admin/services/auditLogger.service');

class MaterialController {
  /**
   * GET /api/materials/generate-code
   */
  async generateMaterialCode(req, res) {
    try {
      const code = await materialService.generateMaterialCode();
      successResponse(res, { code }, 'Código generado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }
  /**
   * GET /api/materials
   * Obtener lista de materiales con filtros
   */
  async getMaterials(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100), // Max 100 items per page
        search: req.query.search || '',
        category: req.query.category || '',
        plant: req.query.plant || '',
        stockStatus: req.query.stockStatus || '',
        priceStatus: req.query.priceStatus || '',
        includeInactive: req.query.includeInactive === 'true'
      };

      const result = await materialService.getMaterials(filters);
      
      successResponse(res, result, 'Materiales obtenidos correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/:id
   * Obtener un material específico
   */
  async getMaterial(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      const material = await materialService.getMaterialById(parseInt(id));
      
      successResponse(res, material, 'Material obtenido correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/materials
   * Crear un nuevo material
   */
  async createMaterial(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      // Validar datos requeridos
      const { name, code, category, unit } = req.body;
      
      if (!name || !code || !category || !unit) {
        return errorResponse(res, { 
          message: 'Faltan campos requeridos: name, code, category, unit',
          statusCode: 400 
        });
      }

      const material = await materialService.createMaterial(req.body, userId);
      try { logCrud({ userId, entity: 'materials', entityId: material.id, action: 'create' }); } catch (_) {}
      
      successResponse(res, material, 'Material creado correctamente', 201);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * PUT /api/materials/:id
   * Actualizar un material existente
   */
  async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      const material = await materialService.updateMaterial(parseInt(id), req.body, userId);
      try { logCrud({ userId, entity: 'materials', entityId: parseInt(id), action: 'update' }); } catch (_) {}
      
      successResponse(res, material, 'Material actualizado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * DELETE /api/materials/:id
   * Eliminar un material (soft delete)
   */
  async deleteMaterial(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      const result = await materialService.deleteMaterial(parseInt(id));
      try { logCrud({ userId: req.user?.id, entity: 'materials', entityId: parseInt(id), action: 'delete' }); } catch (_) {}
      
      successResponse(res, result, 'Material eliminado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/stats
   * Obtener estadísticas de materiales
   */
  async getMaterialsStats(req, res) {
    try {
      const stats = await materialService.getMaterialsStats();
      
      successResponse(res, stats, 'Estadísticas obtenidas correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/:id/price-history
   * Obtener historial de precios de un material
   */
  async getMaterialPriceHistory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      const history = await materialService.getMaterialPriceHistory(parseInt(id));
      
      successResponse(res, history, 'Historial de precios obtenido correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/:id/stock-by-plant
   * Obtener stock de un material por planta
   */
  async getMaterialStockByPlant(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      const material = await materialService.getMaterialById(parseInt(id));
      
      successResponse(res, material.plantStocks, 'Stock por planta obtenido correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * PUT /api/materials/:id/stock/:plantId
   * Actualizar stock de un material en una planta
   */
  async updateMaterialStock(req, res) {
    try {
      const { id, plantId } = req.params;
      const userId = req.user?.id;
      
      if (!id || isNaN(id) || !plantId || isNaN(plantId)) {
        return errorResponse(res, { message: 'IDs inválidos', statusCode: 400 });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      const result = await materialService.updateMaterialStock(
        parseInt(id), 
        parseInt(plantId), 
        req.body, 
        userId
      );
      
      successResponse(res, result, 'Stock actualizado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * PUT /api/materials/:id/price/:plantId
   * Actualizar precio de un material en una planta
   */
  async updateMaterialPrice(req, res) {
    try {
      const { id, plantId } = req.params;
      const { price, supplierId, validUntil, notes } = req.body;
      const userId = req.user?.id;
      
      if (!id || isNaN(id) || !plantId || isNaN(plantId)) {
        return errorResponse(res, { message: 'IDs inválidos', statusCode: 400 });
      }

      if (!price || price <= 0) {
        return errorResponse(res, { message: 'Precio inválido', statusCode: 400 });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      // Actualizar el material con nuevo precio
      const materialData = {
        plantPrices: {
          [plantId]: price
        }
      };

      const result = await materialService.updateMaterial(parseInt(id), materialData, userId);
      
      successResponse(res, result, 'Precio actualizado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/pieces/:pieceId/calculate-material-cost
   * Calcular costo de materiales para una pieza
   */
  async calculatePieceMaterialCost(req, res) {
    try {
      const { pieceId } = req.params;
      const { plantId, quantity = 1 } = req.body;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      if (!plantId || isNaN(plantId)) {
        return errorResponse(res, { message: 'ID de planta requerido', statusCode: 400 });
      }

      const calculation = await materialService.calculatePieceMaterialCost(
        parseInt(pieceId),
        parseInt(plantId),
        parseInt(quantity) || 1
      );
      
      successResponse(res, calculation, 'Cálculo realizado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/pieces/:pieceId/check-material-availability
   * Verificar disponibilidad de materiales para una pieza
   */
  async checkMaterialAvailability(req, res) {
    try {
      const { pieceId } = req.params;
      const { plantId, quantity = 1 } = req.body;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      if (!plantId || isNaN(plantId)) {
        return errorResponse(res, { message: 'ID de planta requerido', statusCode: 400 });
      }

      const calculation = await materialService.calculatePieceMaterialCost(
        parseInt(pieceId),
        parseInt(plantId),
        parseInt(quantity) || 1
      );

      // Retornar solo información de disponibilidad
      const availability = {
        pieceId: calculation.pieceId,
        plantId: calculation.plantId,
        quantity: calculation.quantity,
        available: !calculation.hasInsufficientMaterials,
        hasLowStock: calculation.hasLowStockMaterials,
        materials: calculation.materials.map(m => ({
          materialId: m.materialId,
          name: m.name,
          needed: m.quantity,
          available: m.availableStock,
          sufficient: m.sufficient
        }))
      };
      
      successResponse(res, availability, 'Disponibilidad verificada correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/categories
   * Obtener categorías de materiales
   */
  async getMaterialCategories(req, res) {
    try {
      const categories = [
        'Hormigón',
        'Acero',
        'Insertos Metálicos',
        'Geotextil',
        'Aditivos',
        'Herramientas',
        'Otros'
      ];
      
      successResponse(res, categories, 'Categorías obtenidas correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/units
   * Obtener unidades de medida disponibles
   */
  async getMaterialUnits(req, res) {
    try {
      const units = [
        'kg',
        'm³',
        'm²',
        'm',
        'litros',
        'toneladas',
        'unidades',
        'piezas'
      ];
      
      successResponse(res, units, 'Unidades obtenidas correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/search
   * Búsqueda rápida de materiales
   */
  async searchMaterials(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;
      
      if (!query || query.length < 2) {
        return successResponse(res, [], 'Query muy corto');
      }

      const results = await materialService.getMaterials({
        search: query,
        limit: Math.min(parseInt(limit), 50)
      });
      
      // Simplificar respuesta para búsqueda
      const simplifiedResults = results.materials.map(material => ({
        id: material.id,
        name: material.name,
        code: material.code,
        category: material.category,
        unit: material.unit,
        stockStatus: material.stock_status
      }));
      
      successResponse(res, simplifiedResults, 'Búsqueda completada');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/low-stock
   * Obtener materiales con stock bajo
   */
  async getLowStockMaterials(req, res) {
    try {
      const { plantId } = req.query;
      
      const filters = {
        stockStatus: 'low',
        limit: 100
      };

      if (plantId) {
        filters.plant = plantId;
      }

      const results = await materialService.getMaterials(filters);
      
      successResponse(res, results.materials, 'Materiales con stock bajo obtenidos');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/out-of-stock
   * Obtener materiales sin stock
   */
  async getOutOfStockMaterials(req, res) {
    try {
      const { plantId } = req.query;
      
      const filters = {
        stockStatus: 'out',
        limit: 100
      };

      if (plantId) {
        filters.plant = plantId;
      }

      const results = await materialService.getMaterials(filters);
      
      successResponse(res, results.materials, 'Materiales sin stock obtenidos');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/:id/where-used
   * Obtener piezas que utilizan este material (BOM / Factor fundamental)
   */
  async getWhereUsed(req, res) {
    try {
      const { id } = req.params;
      const { zone_id, month_date } = req.query;
      
      if (!id || isNaN(id)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      if (!zone_id) {
        return errorResponse(res, { message: 'zone_id es requerido', statusCode: 400 });
      }

      const date = month_date || new Date().toISOString().split('T')[0];
      const result = await materialService.getWhereUsed(parseInt(id), parseInt(zone_id), date);
      
      successResponse(res, result, 'Uso del material obtenido correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/materials/prices/close-month
   * Cerrar mes para precios de materiales
   */
  async closeMonth(req, res) {
    try {
      const { zone_id, month_date } = req.body;
      const userId = req.user?.id;
      
      if (!zone_id || !month_date) {
        return errorResponse(res, { 
          message: 'zone_id y month_date son requeridos',
          statusCode: 400 
        });
      }

      const result = await materialService.closeMonth(
        parseInt(zone_id), 
        month_date, 
        userId
      );
      
      successResponse(res, result, 'Mes cerrado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/materials/import-csv
   * Importar precios de materiales desde CSV
   */
  async importFromCSV(req, res) {
    try {
      const { zone_id, month_date, data } = req.body;
      const userId = req.user?.id;
      
      if (!zone_id || !month_date || !data) {
        return errorResponse(res, { 
          message: 'zone_id, month_date y data son requeridos',
          statusCode: 400 
        });
      }

      const result = await materialService.importPricesFromCSV(
        parseInt(zone_id),
        month_date,
        data,
        userId
      );
      
      successResponse(res, result, 'Precios importados correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/export-csv
   * Exportar precios de materiales a CSV
   */
  async exportToCSV(req, res) {
    try {
      const { zone_id, month_date } = req.query;
      
      if (!zone_id) {
        return errorResponse(res, { 
          message: 'zone_id es requerido',
          statusCode: 400 
        });
      }

      const date = month_date || new Date().toISOString().split('T')[0];
      const csvData = await materialService.exportPricesToCSV(
        parseInt(zone_id),
        date
      );
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="material_prices_${zone_id}_${date}.csv"`);
      res.send(csvData);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/materials/recalculate-impact
   * Recalcular impacto de cambios de precio en piezas
   */
  async recalculateImpact(req, res) {
    try {
      const { material_id, zone_id, month_date } = req.body;
      
      if (!material_id || !zone_id) {
        return errorResponse(res, { 
          message: 'material_id y zone_id son requeridos',
          statusCode: 400 
        });
      }

      const date = month_date || new Date().toISOString().split('T')[0];
      const result = await materialService.recalculateImpact(
        parseInt(material_id),
        parseInt(zone_id),
        date
      );
      
      successResponse(res, result, 'Impacto recalculado correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }
}

module.exports = new MaterialController();
