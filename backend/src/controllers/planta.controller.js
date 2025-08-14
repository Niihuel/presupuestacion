/**
 * Controlador de Plantas con Sequelize ORM
 * 
 * Maneja todas las operaciones CRUD para plantas/ubicaciones del sistema.
 * Para cálculo de distancias en presupuestación.
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0 - Sequelize ORM
 */

const { Op } = require('sequelize');
const { catchAsync, ApiResponse } = require('../shared/utils');
const { Planta } = require('../shared/database/models');

/**
 * Obtener todas las plantas con paginación y filtros
 */
const getAllPlantas = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    active = 'true'
  } = req.query;

  // Construcción de filtros
  const whereClause = {};
  
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { city: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } }
    ];
  }

  if (active !== 'all') {
    whereClause.active = active === 'true';
  }

  // Calcular offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Consulta con paginación usando Sequelize
    const { count, rows } = await Planta.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['name', 'ASC']],
      attributes: [
        'id', 'name', 'address', 'city', 'province', 'country',
        'latitude', 'longitude', 'phone', 'manager', 'notes', 
        'active', 'created_at', 'updated_at'
      ]
    });

    const totalPages = Math.ceil(count / limit);

    return res.json(ApiResponse.success({
      plantas: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    }, 'Plantas obtenidas correctamente'));

  } catch (error) {
    console.error('Error al obtener plantas:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Obtener planta por ID
 */
const getPlantaById = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const planta = await Planta.findByPk(id, {
      attributes: [
        'id', 'name', 'address', 'city', 'province', 'country',
        'latitude', 'longitude', 'phone', 'manager', 'notes', 
        'active', 'created_at', 'updated_at'
      ]
    });

    if (!planta) {
      return res.status(404).json(ApiResponse.error('Planta no encontrada', 'PLANTA_NOT_FOUND'));
    }

    return res.json(ApiResponse.success(planta, 'Planta obtenida correctamente'));

  } catch (error) {
    console.error('Error al obtener planta:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Obtener plantas activas (para selectores)
 */
const getActivePlantas = catchAsync(async (req, res) => {
  try {
    const plantas = await Planta.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'city', 'latitude', 'longitude'],
      order: [['name', 'ASC']]
    });

    return res.json(ApiResponse.success(plantas, 'Plantas activas obtenidas correctamente'));
  } catch (error) {
    console.error('Error al obtener plantas activas:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Crear nueva planta
 */
const createPlanta = catchAsync(async (req, res) => {
  const {
    name,
    address,
    city,
    province,
    country,
    latitude,
    longitude,
    phone,
    manager,
    notes
  } = req.body;

  try {
    // Validaciones básicas
    if (!name || !address || !city) {
      return res.status(400).json(ApiResponse.error('Nombre, dirección y ciudad son obligatorios', 'VALIDATION_ERROR'));
    }

    // Crear la planta
    const newPlanta = await Planta.create({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province?.trim(),
      country: country?.trim() || 'Argentina',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone: phone?.trim(),
      manager: manager?.trim(),
      notes: notes?.trim(),
      active: true
    });

    return res.status(201).json(ApiResponse.success(newPlanta, 'Planta creada correctamente'));

  } catch (error) {
    console.error('Error al crear planta:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(ApiResponse.error('Ya existe una planta con ese nombre', 'DUPLICATE_PLANTA'));
    }
    
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Actualizar planta
 */
const updatePlanta = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    city,
    province,
    country,
    latitude,
    longitude,
    phone,
    manager,
    notes,
    active
  } = req.body;

  try {
    const planta = await Planta.findByPk(id);
    
    if (!planta) {
      return res.status(404).json(ApiResponse.error('Planta no encontrada', 'PLANTA_NOT_FOUND'));
    }

    // Validaciones básicas
    if (!name || !address || !city) {
      return res.status(400).json(ApiResponse.error('Nombre, dirección y ciudad son obligatorios', 'VALIDATION_ERROR'));
    }

    // Actualizar la planta
    await planta.update({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province?.trim(),
      country: country?.trim() || 'Argentina',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone: phone?.trim(),
      manager: manager?.trim(),
      notes: notes?.trim(),
      active: active !== undefined ? active : planta.active
    });

    return res.json(ApiResponse.success(planta, 'Planta actualizada correctamente'));

  } catch (error) {
    console.error('Error al actualizar planta:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(ApiResponse.error('Ya existe una planta con ese nombre', 'DUPLICATE_PLANTA'));
    }
    
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Eliminar planta (soft delete)
 */
const deletePlanta = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const planta = await Planta.findByPk(id);
    
    if (!planta) {
      return res.status(404).json(ApiResponse.error('Planta no encontrada', 'PLANTA_NOT_FOUND'));
    }

    // Verificar si tiene proyectos asociados
    const proyectosAsociados = await planta.countProjects();
    
    if (proyectosAsociados > 0) {
      return res.status(400).json(ApiResponse.error(
        'No se puede eliminar la planta porque tiene proyectos asociados', 
        'PLANTA_HAS_PROJECTS'
      ));
    }

    // Eliminar la planta
    await planta.destroy();

    return res.json(ApiResponse.success(null, 'Planta eliminada correctamente'));

  } catch (error) {
    console.error('Error al eliminar planta:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Cambiar estado activo/inactivo de planta
 */
const togglePlantaStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const planta = await Planta.findByPk(id);
    
    if (!planta) {
      return res.status(404).json(ApiResponse.error('Planta no encontrada', 'PLANTA_NOT_FOUND'));
    }

    // Cambiar estado
    await planta.update({ active: !planta.active });

    return res.json(ApiResponse.success(planta, 
      `Planta ${planta.active ? 'activada' : 'desactivada'} correctamente`));

  } catch (error) {
    console.error('Error al cambiar estado de planta:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Calcular distancia entre planta y coordenadas
 */
const calculateDistance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  try {
    const planta = await Planta.findByPk(id);
    
    if (!planta) {
      return res.status(404).json(ApiResponse.error('Planta no encontrada', 'PLANTA_NOT_FOUND'));
    }

    if (!planta.latitude || !planta.longitude) {
      return res.status(400).json(ApiResponse.error('La planta no tiene coordenadas configuradas', 'NO_COORDINATES'));
    }

    if (!latitude || !longitude) {
      return res.status(400).json(ApiResponse.error('Coordenadas de destino son obligatorias', 'VALIDATION_ERROR'));
    }

    const distance = planta.calculateDistance(parseFloat(latitude), parseFloat(longitude));

    return res.json(ApiResponse.success({
      planta: {
        id: planta.id,
        name: planta.name,
        coordinates: planta.getCoordinates()
      },
      destination: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      distance: {
        kilometers: Math.round(distance * 100) / 100,
        meters: Math.round(distance * 1000)
      }
    }, 'Distancia calculada correctamente'));

  } catch (error) {
    console.error('Error al calcular distancia:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Buscar planta más cercana a unas coordenadas
 */
const findNearestPlanta = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    if (!latitude || !longitude) {
      return res.status(400).json(ApiResponse.error('Coordenadas son obligatorias', 'VALIDATION_ERROR'));
    }

    const nearestPlanta = await Planta.findNearest(parseFloat(latitude), parseFloat(longitude));

    if (!nearestPlanta) {
      return res.status(404).json(ApiResponse.error('No se encontraron plantas con coordenadas', 'NO_PLANTAS_WITH_COORDINATES'));
    }

    return res.json(ApiResponse.success(nearestPlanta, 'Planta más cercana encontrada'));

  } catch (error) {
    console.error('Error al buscar planta más cercana:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

module.exports = {
  getAllPlantas,
  getPlantaById,
  getActivePlantas,
  createPlanta,
  updatePlanta,
  deletePlanta,
  togglePlantaStatus,
  calculateDistance,
  findNearestPlanta
};
