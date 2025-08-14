/**
 * Servicio para manejo de fórmulas de materiales por pieza
 * 
 * Permite:
 * - Definir qué materiales necesita cada pieza
 * - Gestionar cantidades y factores de desperdicio
 * - Calcular costos automáticamente por planta
 */

const db = require('../../../config/database');
const { AppError } = require('../../../shared/utils');

class PieceMaterialFormulaService {
  
  /**
   * Obtener fórmula de materiales para una pieza
   */
  async getPieceFormula(pieceId) {
    try {
      const formula = await db.query(`
        SELECT 
          pmf.*,
          m.name as material_name,
          m.code as material_code,
          m.category as material_category,
          m.unit as material_unit,
          m.description as material_description
        FROM piece_material_formulas pmf
        INNER JOIN materials m ON pmf.material_id = m.id
        WHERE pmf.piece_id = ? AND m.is_active = TRUE
        ORDER BY m.category, m.name
      `, [pieceId]);

      return formula;
    } catch (error) {
      console.error('Error getting piece formula:', error);
      throw new AppError('Error al obtener fórmula de la pieza', 500);
    }
  }

  /**
   * Crear o actualizar fórmula completa de una pieza
   */
  async updatePieceFormula(pieceId, materialsFormula, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Eliminar fórmula existente
      await connection.query(
        'DELETE FROM piece_material_formulas WHERE piece_id = ?',
        [pieceId]
      );

      // Insertar nueva fórmula
      for (const formula of materialsFormula) {
        await connection.query(`
          INSERT INTO piece_material_formulas (
            piece_id, material_id, quantity_per_unit, waste_factor, is_optional, notes
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          pieceId,
          formula.materialId,
          formula.quantityPerUnit,
          formula.wasteFactor || 1.0,
          formula.isOptional || false,
          formula.notes || ''
        ]);
      }

      await connection.commit();

      // Retornar fórmula actualizada
      return await this.getPieceFormula(pieceId);

    } catch (error) {
      await connection.rollback();
      console.error('Error updating piece formula:', error);
      throw new AppError('Error al actualizar fórmula de la pieza', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Agregar material individual a una fórmula
   */
  async addMaterialToFormula(pieceId, materialData, userId) {
    try {
      const {
        materialId,
        quantityPerUnit,
        wasteFactor = 1.0,
        isOptional = false,
        notes = ''
      } = materialData;

      // Verificar que no exista ya
      const [existing] = await db.query(`
        SELECT id FROM piece_material_formulas 
        WHERE piece_id = ? AND material_id = ?
      `, [pieceId, materialId]);

      if (existing) {
        throw new AppError('El material ya está en la fórmula de esta pieza', 400);
      }

      // Insertar nueva entrada
      await db.query(`
        INSERT INTO piece_material_formulas (
          piece_id, material_id, quantity_per_unit, waste_factor, is_optional, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [pieceId, materialId, quantityPerUnit, wasteFactor, isOptional, notes]);

      return await this.getPieceFormula(pieceId);

    } catch (error) {
      console.error('Error adding material to formula:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al agregar material a la fórmula', 500);
    }
  }

  /**
   * Remover material de una fórmula
   */
  async removeMaterialFromFormula(pieceId, materialId) {
    try {
      const result = await db.query(`
        DELETE FROM piece_material_formulas 
        WHERE piece_id = ? AND material_id = ?
      `, [pieceId, materialId]);

      if (result.affectedRows === 0) {
        throw new AppError('Material no encontrado en la fórmula', 404);
      }

      return await this.getPieceFormula(pieceId);

    } catch (error) {
      console.error('Error removing material from formula:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al remover material de la fórmula', 500);
    }
  }

  /**
   * Obtener todas las piezas que usan un material específico
   */
  async getPiecesUsingMaterial(materialId) {
    try {
      const pieces = await db.query(`
        SELECT 
          pmf.*,
          p.name as piece_name,
          p.code as piece_code,
          p.category as piece_category,
          p.weight as piece_weight
        FROM piece_material_formulas pmf
        INNER JOIN pieces p ON pmf.piece_id = p.id
        WHERE pmf.material_id = ? AND p.is_active = TRUE
        ORDER BY p.category, p.name
      `, [materialId]);

      return pieces;
    } catch (error) {
      console.error('Error getting pieces using material:', error);
      throw new AppError('Error al obtener piezas que usan el material', 500);
    }
  }

  /**
   * Validar fórmula de materiales
   */
  async validateFormula(pieceId, materialsFormula) {
    const errors = [];
    const warnings = [];

    try {
      // Verificar que todos los materiales existan y estén activos
      for (const formula of materialsFormula) {
        const [material] = await db.query(`
          SELECT id, name, is_active FROM materials WHERE id = ?
        `, [formula.materialId]);

        if (!material) {
          errors.push(`Material con ID ${formula.materialId} no existe`);
        } else if (!material.is_active) {
          warnings.push(`Material ${material.name} está inactivo`);
        }

        // Validar cantidades
        if (!formula.quantityPerUnit || formula.quantityPerUnit <= 0) {
          errors.push(`Cantidad por unidad debe ser mayor a 0 para material ${material?.name || formula.materialId}`);
        }

        if (formula.wasteFactor && formula.wasteFactor < 1.0) {
          warnings.push(`Factor de desperdicio menor a 1.0 para material ${material?.name || formula.materialId}`);
        }
      }

      // Verificar duplicados
      const materialIds = materialsFormula.map(f => f.materialId);
      const uniqueIds = new Set(materialIds);
      if (materialIds.length !== uniqueIds.size) {
        errors.push('Hay materiales duplicados en la fórmula');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Error validating formula:', error);
      return {
        valid: false,
        errors: ['Error al validar la fórmula'],
        warnings: []
      };
    }
  }

  /**
   * Copiar fórmula de una pieza a otra
   */
  async copyFormula(sourcePieceId, targetPieceId, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener fórmula origen
      const sourceFormula = await connection.query(`
        SELECT material_id, quantity_per_unit, waste_factor, is_optional, notes
        FROM piece_material_formulas
        WHERE piece_id = ?
      `, [sourcePieceId]);

      if (sourceFormula.length === 0) {
        throw new AppError('La pieza origen no tiene fórmula definida', 400);
      }

      // Eliminar fórmula existente en destino
      await connection.query(
        'DELETE FROM piece_material_formulas WHERE piece_id = ?',
        [targetPieceId]
      );

      // Copiar fórmula
      for (const formula of sourceFormula) {
        await connection.query(`
          INSERT INTO piece_material_formulas (
            piece_id, material_id, quantity_per_unit, waste_factor, is_optional, notes
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          targetPieceId,
          formula.material_id,
          formula.quantity_per_unit,
          formula.waste_factor,
          formula.is_optional,
          formula.notes
        ]);
      }

      await connection.commit();

      return await this.getPieceFormula(targetPieceId);

    } catch (error) {
      await connection.rollback();
      console.error('Error copying formula:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al copiar fórmula', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de uso de materiales
   */
  async getMaterialUsageStats() {
    try {
      const stats = await db.query(`
        SELECT 
          m.id,
          m.name,
          m.category,
          COUNT(pmf.piece_id) as pieces_count,
          AVG(pmf.quantity_per_unit) as avg_quantity_per_unit,
          SUM(pmf.quantity_per_unit) as total_quantity_used
        FROM materials m
        LEFT JOIN piece_material_formulas pmf ON m.id = pmf.material_id
        WHERE m.is_active = TRUE
        GROUP BY m.id, m.name, m.category
        ORDER BY pieces_count DESC, m.name
      `);

      return stats;
    } catch (error) {
      console.error('Error getting material usage stats:', error);
      throw new AppError('Error al obtener estadísticas de uso de materiales', 500);
    }
  }

  /**
   * Buscar fórmulas similares
   */
  async findSimilarFormulas(pieceId) {
    try {
      // Obtener materiales de la pieza actual
      const currentFormula = await this.getPieceFormula(pieceId);
      
      if (currentFormula.length === 0) {
        return [];
      }

      const materialIds = currentFormula.map(f => f.material_id);
      
      // Buscar piezas con materiales similares
      const similarPieces = await db.query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.category,
          COUNT(pmf.material_id) as matching_materials,
          COUNT(DISTINCT pmf.material_id) as total_materials
        FROM pieces p
        INNER JOIN piece_material_formulas pmf ON p.id = pmf.piece_id
        WHERE pmf.material_id IN (${materialIds.map(() => '?').join(',')})
          AND p.id != ?
          AND p.is_active = TRUE
        GROUP BY p.id, p.name, p.code, p.category
        HAVING matching_materials >= ?
        ORDER BY matching_materials DESC, total_materials ASC
        LIMIT 10
      `, [...materialIds, pieceId, Math.ceil(materialIds.length * 0.5)]);

      return similarPieces;

    } catch (error) {
      console.error('Error finding similar formulas:', error);
      throw new AppError('Error al buscar fórmulas similares', 500);
    }
  }
}

module.exports = new PieceMaterialFormulaService();
