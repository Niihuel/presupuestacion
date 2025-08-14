/**
 * Servicio para gestión de materiales
 * 
 * Maneja todas las operaciones relacionadas con materiales:
 * - CRUD de materiales
 * - Gestión de stock por planta
 * - Control de precios por proveedor
 * - Estadísticas y reportes
 * - Importación/exportación
 * - Fórmulas de materiales para piezas
 */

import api from './api';

class MaterialService {
  /**
   * Obtener lista de materiales con filtros
   */
  async getMaterials(params = {}) {
    const { data } = await api.get('/materials', { params });
    return data;
  }

  /**
   * Obtener un material específico
   */
  async getMaterial(materialId) {
    const { data } = await api.get(`/materials/${materialId}`);
    return data;
  }

  /**
   * Crear un nuevo material
   */
  async createMaterial(materialData) {
    const { data } = await api.post('/materials', materialData);
    return data;
  }

  /**
   * Actualizar un material
   */
  async updateMaterial(materialId, materialData) {
    const { data } = await api.put(`/materials/${materialId}`, materialData);
    return data;
  }

  /**
   * Eliminar un material
   */
  async deleteMaterial(materialId) {
    const { data } = await api.delete(`/materials/${materialId}`);
    return data;
  }

  /**
   * Obtener estadísticas de materiales
   */
  async getMaterialsStats() {
    const { data } = await api.get('/materials/stats');
    return data;
  }

  /**
   * Obtener historial de precios de un material
   */
  async getMaterialPriceHistory(materialId) {
    const { data } = await api.get(`/materials/${materialId}/price-history`);
    return data;
  }

  /**
   * Obtener stock de un material por planta
   */
  async getMaterialStockByPlant(materialId) {
    const { data } = await api.get(`/materials/${materialId}/stock-by-plant`);
    return data;
  }

  /**
   * Calcular costo de materiales para una pieza
   */
  async calculatePieceMaterialCost(pieceId, plantId, quantity = 1) {
    const { data } = await api.post(`/pieces/${pieceId}/calculate-material-cost`, {
      plantId,
      quantity
    });
    return data;
  }

  /**
   * Verificar disponibilidad de materiales para una pieza
   */
  async checkMaterialAvailability(pieceId, plantId, quantity = 1) {
    const { data } = await api.post(`/pieces/${pieceId}/check-material-availability`, {
      plantId,
      quantity
    });
    return data;
  }

  // ===========================================
  // FÓRMULAS DE MATERIALES POR PIEZA
  // ===========================================

  /**
   * Obtener fórmula de materiales de una pieza
   */
  async getPieceFormula(pieceId) {
    const { data } = await api.get(`/pieces/${pieceId}/materials-formula`);
    return data;
  }

  /**
   * Actualizar fórmula completa de una pieza
   */
  async updatePieceFormula(pieceId, materials) {
    const { data } = await api.put(`/pieces/${pieceId}/materials-formula`, {
      materials
    });
    return data;
  }

  /**
   * Agregar material individual a la fórmula
   */
  async addMaterialToFormula(pieceId, materialData) {
    const { data } = await api.post(`/pieces/${pieceId}/materials-formula/material`, materialData);
    return data;
  }

  /**
   * Remover material de la fórmula
   */
  async removeMaterialFromFormula(pieceId, materialId) {
    const { data } = await api.delete(`/pieces/${pieceId}/materials-formula/material/${materialId}`);
    return data;
  }

  /**
   * Validar fórmula de materiales
   */
  async validatePieceFormula(pieceId, materials) {
    const { data } = await api.post(`/pieces/${pieceId}/materials-formula/validate`, {
      materials
    });
    return data;
  }

  /**
   * Copiar fórmula de una pieza a otra
   */
  async copyPieceFormula(sourceId, targetId) {
    const { data } = await api.post(`/pieces/${sourceId}/materials-formula/copy/${targetId}`);
    return data;
  }

  /**
   * Buscar fórmulas similares
   */
  async findSimilarFormulas(pieceId) {
    const { data } = await api.get(`/pieces/${pieceId}/materials-formula/similar`);
    return data;
  }

  /**
   * Obtener piezas que usan un material específico
   */
  async getPiecesUsingMaterial(materialId) {
    const { data } = await api.get(`/materials/${materialId}/pieces`);
    return data;
  }

  /**
   * Obtener estadísticas de uso de materiales
   */
  async getMaterialUsageStats() {
    const { data } = await api.get('/materials/usage-stats');
    return data;
  }

  /**
   * Actualizar stock de un material en una planta
   */
  async updateMaterialStock(materialId, plantId, stockData) {
    const { data } = await api.put(`/materials/${materialId}/stock/${plantId}`, stockData);
    return data;
  }

  /**
   * Actualizar precio de un material en una planta
   */
  async updateMaterialPrice(materialId, plantId, priceData) {
    const { data } = await api.put(`/materials/${materialId}/price/${plantId}`, priceData);
    return data;
  }

  /**
   * Importar materiales desde archivo
   */
  async importMaterials(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const { data } = await api.post('/materials/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  /**
   * Exportar materiales
   */
  async exportMaterials(params = {}) {
    const response = await api.get('/materials/export', {
      params,
      responseType: 'blob',
    });

    // Crear URL para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `materiales_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  }

  async generateMaterialCode() {
    const { data } = await api.get('/materials/generate-code');
    return data;
  }

  /**
   * Obtener materiales disponibles para una pieza
   */
  async getMaterialsForPiece(pieceId) {
    const { data } = await api.get(`/pieces/${pieceId}/available-materials`);
    return data;
  }

  /**
   * Obtener fórmula de materiales de una pieza
   */
  async getPieceMaterialFormula(pieceId) {
    const { data } = await api.get(`/pieces/${pieceId}/material-formula`);
    return data;
  }

  /**
   * Actualizar fórmula de materiales de una pieza
   */
  async updatePieceMaterialFormula(pieceId, formula) {
    const { data } = await api.put(`/pieces/${pieceId}/material-formula`, { formula });
    return data;
  }

  /**
   * Calcular costo de materiales para una pieza
   */
  async calculatePieceMaterialCost(pieceId, plantId, quantity = 1) {
    const { data } = await api.post(`/pieces/${pieceId}/calculate-material-cost`, {
      plantId,
      quantity
    });
    return data;
  }

  /**
   * Verificar disponibilidad de materiales para una pieza
   */
  async checkMaterialAvailability(pieceId, plantId, quantity = 1) {
    const { data } = await api.post(`/pieces/${pieceId}/check-material-availability`, {
      plantId,
      quantity
    });
    return data;
  }

  /**
   * Obtener proveedores de un material
   */
  async getMaterialSuppliers(materialId) {
    const { data } = await api.get(`/materials/${materialId}/suppliers`);
    return data;
  }

  /**
   * Agregar proveedor a un material
   */
  async addMaterialSupplier(materialId, supplierData) {
    const { data } = await api.post(`/materials/${materialId}/suppliers`, supplierData);
    return data;
  }

  /**
   * Actualizar proveedor de un material
   */
  async updateMaterialSupplier(materialId, supplierId, supplierData) {
    const { data } = await api.put(`/materials/${materialId}/suppliers/${supplierId}`, supplierData);
    return data;
  }

  /**
   * Eliminar proveedor de un material
   */
  async removeMaterialSupplier(materialId, supplierId) {
    const { data } = await api.delete(`/materials/${materialId}/suppliers/${supplierId}`);
    return data;
  }

  /**
   * Obtener materiales con stock bajo
   */
  async getLowStockMaterials(plantId = null) {
    const params = plantId ? { plantId } : {};
    const { data } = await api.get('/materials/low-stock', { params });
    return data;
  }

  /**
   * Obtener materiales sin stock
   */
  async getOutOfStockMaterials(plantId = null) {
    const params = plantId ? { plantId } : {};
    const { data } = await api.get('/materials/out-of-stock', { params });
    return data;
  }

  /**
   * Generar reporte de consumo de materiales
   */
  async getMaterialConsumptionReport(params = {}) {
    const { data } = await api.get('/materials/consumption-report', { params });
    return data;
  }

  /**
   * Generar reporte de costos de materiales
   */
  async getMaterialCostReport(params = {}) {
    const { data } = await api.get('/materials/cost-report', { params });
    return data;
  }

  /**
   * Obtener categorías de materiales
   */
  async getMaterialCategories() {
    const { data } = await api.get('/materials/categories');
    return data;
  }

  /**
   * Obtener unidades de medida disponibles
   */
  async getMaterialUnits() {
    const { data } = await api.get('/materials/units');
    return data;
  }

  /**
   * Buscar materiales por código o nombre
   */
  async searchMaterials(query, limit = 10) {
    const { data } = await api.get('/materials/search', {
      params: { q: query, limit }
    });
    return data;
  }

  /**
   * Duplicar un material
   */
  async duplicateMaterial(materialId, newData = {}) {
    const { data } = await api.post(`/materials/${materialId}/duplicate`, newData);
    return data;
  }

  /**
   * Activar/desactivar un material
   */
  async toggleMaterialStatus(materialId, isActive) {
    const { data } = await api.patch(`/materials/${materialId}/status`, { isActive });
    return data;
  }

  // ================================
  // PRECIOS VIGENTES (INSUMOS)
  // ================================

  async getVigenteMaterialPrices(zoneId, asOf = null) {
    const params = new URLSearchParams();
    if (zoneId) params.set('zone_id', String(zoneId));
    if (asOf) params.set('as_of', asOf);
    const response = await api.get(`/materials/prices?${params.toString()}`);
    return response.data?.data || [];
  }

  async setMaterialPrice({ material_id, zone_id, price, valid_from = null }) {
    const payload = { material_id, zone_id, price, ...(valid_from ? { valid_from } : {}) };
    const response = await api.post('/materials/prices', payload);
    return response.data;
  }

  async closeMaterialPricesMonth(zone_id, month_date) {
    const response = await api.post('/materials/prices/close-month', { zone_id, month_date });
    return response.data?.data || [];
  }
}

export const materialService = new MaterialService();
export default materialService;
