/**
 * Controlador para fórmulas de materiales por pieza
 */

const pieceMaterialFormulaService = require('../services/pieceMaterialFormula.service');
const { successResponse, errorResponse } = require('@utilidades');

class PieceMaterialFormulaController {

  /**
   * GET /api/pieces/:pieceId/materials-formula
   * Obtener fórmula de materiales de una pieza
   */
  async getPieceFormula(req, res) {
    try {
      const { pieceId } = req.params;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      const formula = await pieceMaterialFormulaService.getPieceFormula(parseInt(pieceId));
      
      successResponse(res, formula, 'Fórmula obtenida correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * PUT /api/pieces/:pieceId/materials-formula
   * Actualizar fórmula completa de una pieza
   */
  async updatePieceFormula(req, res) {
    try {
      const { pieceId } = req.params;
      const { materials } = req.body;
      const userId = req.user?.id;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      if (!Array.isArray(materials)) {
        return errorResponse(res, { message: 'La fórmula debe ser un array de materiales', statusCode: 400 });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      // Validar fórmula
      const validation = await pieceMaterialFormulaService.validateFormula(parseInt(pieceId), materials);
      
      if (!validation.valid) {
        return errorResponse(res, { 
          message: 'Fórmula inválida', 
          statusCode: 400,
          details: validation.errors 
        });
      }

      const updatedFormula = await pieceMaterialFormulaService.updatePieceFormula(
        parseInt(pieceId), 
        materials, 
        userId
      );
      
      successResponse(res, {
        formula: updatedFormula,
        validation: validation.warnings.length > 0 ? { warnings: validation.warnings } : null
      }, 'Fórmula actualizada correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/pieces/:pieceId/materials-formula/material
   * Agregar material a la fórmula
   */
  async addMaterialToFormula(req, res) {
    try {
      const { pieceId } = req.params;
      const materialData = req.body;
      const userId = req.user?.id;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      if (!materialData.materialId || !materialData.quantityPerUnit) {
        return errorResponse(res, { 
          message: 'Faltan campos requeridos: materialId, quantityPerUnit', 
          statusCode: 400 
        });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      const updatedFormula = await pieceMaterialFormulaService.addMaterialToFormula(
        parseInt(pieceId), 
        materialData, 
        userId
      );
      
      successResponse(res, updatedFormula, 'Material agregado a la fórmula correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * DELETE /api/pieces/:pieceId/materials-formula/material/:materialId
   * Remover material de la fórmula
   */
  async removeMaterialFromFormula(req, res) {
    try {
      const { pieceId, materialId } = req.params;
      
      if (!pieceId || isNaN(pieceId) || !materialId || isNaN(materialId)) {
        return errorResponse(res, { message: 'IDs inválidos', statusCode: 400 });
      }

      const updatedFormula = await pieceMaterialFormulaService.removeMaterialFromFormula(
        parseInt(pieceId), 
        parseInt(materialId)
      );
      
      successResponse(res, updatedFormula, 'Material removido de la fórmula correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/:materialId/pieces
   * Obtener piezas que usan un material específico
   */
  async getPiecesUsingMaterial(req, res) {
    try {
      const { materialId } = req.params;
      
      if (!materialId || isNaN(materialId)) {
        return errorResponse(res, { message: 'ID de material inválido', statusCode: 400 });
      }

      const pieces = await pieceMaterialFormulaService.getPiecesUsingMaterial(parseInt(materialId));
      
      successResponse(res, pieces, 'Piezas obtenidas correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/pieces/:pieceId/materials-formula/validate
   * Validar fórmula de materiales
   */
  async validateFormula(req, res) {
    try {
      const { pieceId } = req.params;
      const { materials } = req.body;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      if (!Array.isArray(materials)) {
        return errorResponse(res, { message: 'La fórmula debe ser un array de materiales', statusCode: 400 });
      }

      const validation = await pieceMaterialFormulaService.validateFormula(parseInt(pieceId), materials);
      
      successResponse(res, validation, 'Validación completada');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * POST /api/pieces/:sourceId/materials-formula/copy/:targetId
   * Copiar fórmula de una pieza a otra
   */
  async copyFormula(req, res) {
    try {
      const { sourceId, targetId } = req.params;
      const userId = req.user?.id;
      
      if (!sourceId || isNaN(sourceId) || !targetId || isNaN(targetId)) {
        return errorResponse(res, { message: 'IDs inválidos', statusCode: 400 });
      }

      if (!userId) {
        return errorResponse(res, { message: 'Usuario no autenticado', statusCode: 401 });
      }

      const copiedFormula = await pieceMaterialFormulaService.copyFormula(
        parseInt(sourceId), 
        parseInt(targetId), 
        userId
      );
      
      successResponse(res, copiedFormula, 'Fórmula copiada correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/materials/usage-stats
   * Obtener estadísticas de uso de materiales
   */
  async getMaterialUsageStats(req, res) {
    try {
      const stats = await pieceMaterialFormulaService.getMaterialUsageStats();
      
      successResponse(res, stats, 'Estadísticas obtenidas correctamente');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  /**
   * GET /api/pieces/:pieceId/materials-formula/similar
   * Buscar fórmulas similares
   */
  async findSimilarFormulas(req, res) {
    try {
      const { pieceId } = req.params;
      
      if (!pieceId || isNaN(pieceId)) {
        return errorResponse(res, { message: 'ID de pieza inválido', statusCode: 400 });
      }

      const similarPieces = await pieceMaterialFormulaService.findSimilarFormulas(parseInt(pieceId));
      
      successResponse(res, similarPieces, 'Fórmulas similares encontradas');
    } catch (error) {
      errorResponse(res, error);
    }
  }
}

module.exports = new PieceMaterialFormulaController();
