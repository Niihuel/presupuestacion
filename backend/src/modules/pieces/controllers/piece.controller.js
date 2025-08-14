// modules/pieces/controllers/piece.controller.js
const { Piece, Zone, PiecePrice } = require('../../../shared/database/models');
const ApiResponse = require('../../../shared/utils/ApiResponse');
const { logger } = require('../../../shared/utils/logger');
const { Op } = require('sequelize');
const { Piece: PieceModel } = require('../../../shared/database/models');
/**
 * Generar código automático para pieza
 * Formato: PIE-YYYY-XXX
 */
const generatePieceCode = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `PIE-${currentYear}-`;

    const existingCodes = await PieceModel.findAll({
      attributes: ['code'],
      where: { code: { [Op.like]: `${prefix}%` } },
      raw: true,
    });

    const existingNumbers = existingCodes
      .map((p) => {
        const match = (p.code || '').match(/PIE-\d{4}-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) nextNumber++;

    const formatted = String(nextNumber).padStart(3, '0');
    const code = `${prefix}${formatted}`;
    return res.json(ApiResponse.success({ code }, 'Código de pieza generado'));
  } catch (error) {
    logger.error('Error generating piece code:', error);
    next(error);
  }
};

/**
 * Obtener todas las piezas
 */
const getPieces = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      category = '',
      family_id = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      is_active: true
    };

    // Filtros
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (category) whereClause.category = category;
    if (family_id) whereClause.family_id = family_id;

    const { count, rows: pieces } = await Piece.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          required: false,
          paranoid: false,
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    const responseData = {
      pieces,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        limit: parseInt(limit)
      }
    };

    return res.json(
      ApiResponse.success(responseData, 'Piezas obtenidas exitosamente')
    );
  } catch (error) {
    logger.error('Error getting pieces:', error);
    next(error);
  }
};

/**
 * Obtener una pieza por ID
 */
const getPieceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const piece = await Piece.findByPk(id, {
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          required: false,
          paranoid: false,
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    if (!piece) {
      return res.status(404).json(
        ApiResponse.error('Pieza no encontrada', 404)
      );
    }

    return res.json(
      ApiResponse.success(piece, 'Pieza obtenida exitosamente')
    );
  } catch (error) {
    logger.error('Error getting piece by id:', error);
    next(error);
  }
};

/**
 * Crear una nueva pieza
 */
const createPiece = async (req, res, next) => {
  try {
    const { prices, ...pieceData } = req.body;
    
    // Crear la pieza primero
    const piece = await Piece.create(pieceData);

    // Si hay precios, crearlos
    if (prices && prices.length > 0) {
      const priceData = prices.map(price => ({
        piece_id: piece.id,
        zone_id: price.zoneId,
        base_price: price.price,
        adjustment: 0
      }));
      
      await PiecePrice.bulkCreate(priceData);
    }

    // Obtener la pieza con sus relaciones
    const pieceWithRelations = await Piece.findByPk(piece.id, {
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    return res.status(201).json(
      ApiResponse.success(pieceWithRelations, 'Pieza creada exitosamente')
    );
  } catch (error) {
    logger.error('Error creating piece:', error);
    next(error);
  }
};

/**
 * Actualizar una pieza
 */
const updatePiece = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prices, ...updateData } = req.body;

    const piece = await Piece.findByPk(id);
    
    if (!piece) {
      return res.status(404).json(
        ApiResponse.error('Pieza no encontrada', 404)
      );
    }

    // Actualizar la pieza
    await piece.update(updateData);

    // Si hay precios, actualizar/crear precios
    if (prices && prices.length > 0) {
      // Eliminar precios existentes
      await PiecePrice.destroy({ where: { piece_id: id } });
      
      // Crear nuevos precios
      const priceData = prices.filter(p => p.price > 0).map(price => ({
        piece_id: id,
        zone_id: price.zoneId,
        base_price: price.price,
        adjustment: 0
      }));
      
      if (priceData.length > 0) {
        await PiecePrice.bulkCreate(priceData);
      }
    }

    // Obtener la pieza actualizada con sus relaciones
    const updatedPiece = await Piece.findByPk(id, {
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          required: false,
          paranoid: false,
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    return res.json(
      ApiResponse.success(updatedPiece, 'Pieza actualizada exitosamente')
    );
  } catch (error) {
    logger.error('Error updating piece:', error);
    next(error);
  }
};

/**
 * Eliminar una pieza
 */
const deletePiece = async (req, res, next) => {
  try {
    const { id } = req.params;

    const piece = await Piece.findByPk(id);
    
    if (!piece) {
      return res.status(404).json(
        ApiResponse.error('Pieza no encontrada', 404)
      );
    }

    await piece.destroy();

    return res.json(
      ApiResponse.success(null, 'Pieza eliminada exitosamente')
    );
  } catch (error) {
    logger.error('Error deleting piece:', error);
    next(error);
  }
};

/**
 * Obtener piezas por zona
 */
const getPiecesByZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    
    const pieces = await Piece.findAll({
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          required: true,
          paranoid: false,
          where: { zone_id: zoneId },
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json(
      ApiResponse.success(pieces, 'Piezas de la zona obtenidas exitosamente')
    );
  } catch (error) {
    logger.error('Error getting pieces by zone:', error);
    next(error);
  }
};

/**
 * Obtener precios de una pieza
 */
const getPiecePrices = async (req, res, next) => {
  try {
    const { pieceId } = req.params;
    
    const prices = await PiecePrice.findAll({
      where: { piece_id: pieceId },
      paranoid: false,
      include: [
        {
          model: Zone,
          as: 'zone',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json(
      ApiResponse.success(prices, 'Precios de la pieza obtenidos exitosamente')
    );
  } catch (error) {
    logger.error('Error getting piece prices:', error);
    next(error);
  }
};

/**
 * Actualizar precio de una pieza
 */
const updatePiecePrice = async (req, res, next) => {
  try {
    const { pieceId } = req.params;
    const priceData = req.body;

    // Buscar si ya existe un precio para esta pieza
    let piecePrice = await PiecePrice.findOne({
      where: { piece_id: pieceId }
    });

    if (piecePrice) {
      await piecePrice.update(priceData);
    } else {
      piecePrice = await PiecePrice.create({
        piece_id: pieceId,
        ...priceData
      });
    }

    return res.json(
      ApiResponse.success(piecePrice, 'Precio de la pieza actualizado exitosamente')
    );
  } catch (error) {
    logger.error('Error updating piece price:', error);
    next(error);
  }
};

module.exports = {
  getPieces,
  getPieceById,
  createPiece,
  updatePiece,
  deletePiece,
  getPiecesByZone,
  getPiecePrices,
  updatePiecePrice,
  generatePieceCode,
};
