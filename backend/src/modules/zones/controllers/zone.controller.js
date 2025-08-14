const { Zone, PiecePrice, Piece } = require('../../../shared/database/models');
const { AppError, catchAsync, ApiResponse } = require('../../../shared/utils');
const { Op } = require('sequelize');

class ZoneController {
  // Obtener todas las zonas
  getAllZones = catchAsync(async (req, res) => {
    const zones = await Zone.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: zones
    });
  });

  // Obtener una zona específica
  getZoneById = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const zone = await Zone.findByPk(id);
    
    if (!zone) {
      throw new AppError('Zona no encontrada', 404);
    }

    res.json({
      success: true,
      data: zone
    });
  });

  // Crear nueva zona
  createZone = catchAsync(async (req, res) => {
    const { code, name, description, address, city, state, zone_type, location_iframe } = req.body;

    const existingZone = await Zone.findOne({ where: { code } });
    if (existingZone) {
      throw new AppError('Ya existe una zona con ese código', 400);
    }

    const zone = await Zone.create({
      code: code.toUpperCase(),
      name,
      description,
      address,
      city,
      state,
      zone_type,
      location_iframe
    });

    return ApiResponse.success(res, zone, 'Zona creada exitosamente', 201);
  });

  // Actualizar zona
  updateZone = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, address, city, state, zone_type, is_active, location_iframe } = req.body;

    const zone = await Zone.findByPk(id);
    
    if (!zone) {
      throw new AppError('Zona no encontrada', 404);
    }

    // Preparar datos para actualizar
    const updateData = {
      name,
      description,
      address,
      city,
      state,
      zone_type,
      is_active,
      location_iframe
    };

    // Filtrar valores undefined/null para evitar problemas
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await zone.update(updateData);

    res.json({
      success: true,
      message: 'Zona actualizada exitosamente',
      data: zone
    });
  });

  // Eliminar zona
  deleteZone = catchAsync(async (req, res) => {
    const { id } = req.params;

    const zone = await Zone.findByPk(id);
    
    if (!zone) {
      throw new AppError('Zona no encontrada', 404);
    }

    // Verificar si hay precios asociados
    const pricesCount = await PiecePrice.count({ where: { zone_id: id } });
    
    if (pricesCount > 0) {
      // Solo desactivar la zona si tiene precios asociados
      await zone.update({ is_active: false });
      res.json({
        success: true,
        message: 'Zona desactivada exitosamente (tenía precios asociados)',
        data: zone
      });
    } else {
      // Eliminar completamente si no tiene precios asociados
      await zone.destroy();
      res.json({
        success: true,
        message: 'Zona eliminada exitosamente',
        data: null
      });
    }
  });

  // Obtener precios de piezas para una zona
  getZonePrices = catchAsync(async (req, res) => {
    const { zoneId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;
    const { Op } = require('sequelize');

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }

    const pieces = await Piece.findAndCountAll({
      where: whereClause,
      include: [{
        model: PiecePrice,
        as: 'prices',
        where: { zone_id: zoneId },
        required: false,
        order: [['effective_date', 'DESC']],
        limit: 1
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: pieces.rows,
      pagination: {
        total: pieces.count,
        page: parseInt(page),
        totalPages: Math.ceil(pieces.count / limit)
      }
    });
  });

  // Establecer precios para múltiples piezas en una zona
  setZonePrices = catchAsync(async (req, res) => {
    const { zoneId } = req.params;
    const { prices } = req.body; // Array de { pieceId, basePrice, adjustment }

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      throw new AppError('Zona no encontrada', 404);
    }

    const results = [];

    for (const priceData of prices) {
      // Desactivar precio anterior si existe
      await PiecePrice.update(
        { expiry_date: new Date() },
        {
          where: {
            piece_id: priceData.pieceId,
            zone_id: zoneId,
            expiry_date: null
          }
        }
      );

      // Crear nuevo precio
      const newPrice = await PiecePrice.create({
        piece_id: priceData.pieceId,
        zone_id: zoneId,
        base_price: priceData.basePrice,
        adjustment: priceData.adjustment || 0,
        effective_date: new Date(),
        created_by: req.user.id
      });

      results.push(newPrice);
    }

    res.json({
      success: true,
      message: `Se actualizaron ${results.length} precios`,
      data: results
    });
  });

  // Copiar precios de una zona a otra
  copyZonePrices = catchAsync(async (req, res) => {
    const { sourceZoneId, targetZoneId } = req.body;
    const { adjustmentPercentage = 0 } = req.body; // Porcentaje de ajuste opcional

    // Verificar que ambas zonas existan
    const [sourceZone, targetZone] = await Promise.all([
      Zone.findByPk(sourceZoneId),
      Zone.findByPk(targetZoneId)
    ]);

    if (!sourceZone || !targetZone) {
      throw new AppError('Zona origen o destino no encontrada', 404);
    }

    // Obtener precios actuales de la zona origen
    const sourcePrices = await PiecePrice.findAll({
      where: {
        zone_id: sourceZoneId,
        expiry_date: null
      }
    });

    const results = [];

    for (const sourcePrice of sourcePrices) {
      // Desactivar precio anterior en zona destino si existe
      await PiecePrice.update(
        { expiry_date: new Date() },
        {
          where: {
            piece_id: sourcePrice.piece_id,
            zone_id: targetZoneId,
            expiry_date: null
          }
        }
      );

      // Calcular nuevo precio con ajuste
      const adjustedPrice = sourcePrice.base_price * (1 + adjustmentPercentage / 100);

      // Crear nuevo precio
      const newPrice = await PiecePrice.create({
        piece_id: sourcePrice.piece_id,
        zone_id: targetZoneId,
        base_price: adjustedPrice,
        adjustment: 0,
        effective_date: new Date(),
        created_by: req.user.id
      });

      results.push(newPrice);
    }

    res.json({
      success: true,
      message: `Se copiaron ${results.length} precios de ${sourceZone.name} a ${targetZone.name}`,
      data: results
    });
  });

  // Obtener zonas activas (para selectores)
  getActiveZones = catchAsync(async (req, res) => {
    const zones = await Zone.getActive();

    res.json({
      success: true,
      data: zones,
      message: 'Zonas activas obtenidas exitosamente'
    });
  });

  // Buscar zona más cercana a unas coordenadas
  findNearestZone = catchAsync(async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw new AppError('Se requieren las coordenadas lat y lng', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new AppError('Las coordenadas deben ser números válidos', 400);
    }

    if (latitude < -90 || latitude > 90) {
      throw new AppError('La latitud debe estar entre -90 y 90 grados', 400);
    }

    if (longitude < -180 || longitude > 180) {
      throw new AppError('La longitud debe estar entre -180 y 180 grados', 400);
    }

    const nearest = await Zone.findNearest(latitude, longitude);

    if (!nearest) {
      throw new AppError('No se encontraron zonas con coordenadas definidas', 404);
    }

    res.json({
      success: true,
      data: nearest,
      message: 'Zona más cercana encontrada'
    });
  });

  // Calcular distancia entre una zona y unas coordenadas
  calculateDistance = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw new AppError('Se requieren las coordenadas lat y lng', 400);
    }

    const zone = await Zone.findByPk(id);
    if (!zone) {
      throw new AppError('Zona no encontrada', 404);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new AppError('Las coordenadas deben ser números válidos', 400);
    }

    try {
      const distance = zone.calculateDistance(latitude, longitude);
      
      res.json({
        success: true,
        data: {
          zone: {
            id: zone.id,
            name: zone.name,
            code: zone.code
          },
          distance,
          unit: 'km'
        },
        message: 'Distancia calculada exitosamente'
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  });

  // Obtener estadísticas básicas de zonas
  getZonesStats = catchAsync(async (req, res) => {
    const { period = '30d' } = req.query;
    
    // Contar zonas activas e inactivas
    const totalZones = await Zone.count();
    const activeZones = await Zone.count({ where: { is_active: true } });
    const inactiveZones = totalZones - activeZones;

    // Estadísticas básicas
    const stats = {
      total_zones: totalZones,
      active_zones: activeZones,
      inactive_zones: inactiveZones,
      period: period
    };

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas de zonas obtenidas exitosamente'
    });
  });
}

module.exports = new ZoneController();