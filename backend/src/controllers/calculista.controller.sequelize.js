/**
 * Controlador de Calculistas con Sequelize ORM
 * 
 * Maneja todas las operaciones CRUD para calculistas del sistema.
 * Reemplaza la funcionalidad de diseñadores adaptada al proceso de presupuestación.
 * Usa Sequelize ORM siguiendo el patrón del proyecto.
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0 - Sequelize ORM
 */

const { Op } = require('sequelize');
const { catchAsync, ApiResponse } = require('@utilidades');
const { Calculista, Project } = require('@modelos');

/**
 * Obtener todos los calculistas con paginación y filtros
 */
const getAllCalculistas = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    specialty = '',
    active = 'true'
  } = req.query;

  // Construcción de filtros
  const whereClause = {};
  
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }

  if (specialty) {
    whereClause.specialty = { [Op.like]: `%${specialty}%` };
  }

  if (active !== 'all') {
    whereClause.active = active === 'true';
  }

  // Calcular offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Consulta con paginación usando Sequelize
    const { count, rows } = await Calculista.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['name', 'ASC']],
      attributes: [
        'id', 'name', 'email', 'phone', 'specialty', 
        'license_number', 'notes', 'active', 
        'created_at', 'updated_at'
      ]
    });

    const totalPages = Math.ceil(count / limit);

    return res.json(ApiResponse.success({
      calculistas: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    }, 'Calculistas obtenidos correctamente'));

  } catch (error) {
    console.error('Error al obtener calculistas:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Obtener calculista por ID
 */
const getCalculistaById = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const calculista = await Calculista.findByPk(id, {
      attributes: [
        'id', 'name', 'email', 'phone', 'specialty', 
        'license_number', 'notes', 'active', 
        'created_at', 'updated_at'
      ]
    });

    if (!calculista) {
      return res.status(404).json(ApiResponse.error('Calculista no encontrado', 'CALCULISTA_NOT_FOUND'));
    }

    return res.json(ApiResponse.success(calculista, 'Calculista obtenido correctamente'));

  } catch (error) {
    console.error('Error al obtener calculista:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Crear nuevo calculista
 */
const createCalculista = catchAsync(async (req, res) => {
  const {
    name,
    email,
    phone,
    specialty,
    license_number,
    notes,
    active = true
  } = req.body;

  // Validaciones básicas
  if (!name || name.trim().length === 0) {
    return res.status(400).json(ApiResponse.error('El nombre es requerido', 'VALIDATION_ERROR'));
  }

  try {
    // Verificar si el email ya existe (si se proporciona)
    if (email) {
      const existingCalculista = await Calculista.findOne({
        where: { email }
      });

      if (existingCalculista) {
        return res.status(400).json(ApiResponse.error('Ya existe un calculista con este email', 'EMAIL_EXISTS'));
      }
    }

    // Crear calculista
    const newCalculista = await Calculista.create({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      specialty: specialty || null,
      license_number: license_number || null,
      notes: notes || null,
      active: active
    });

    return res.status(201).json(ApiResponse.success(newCalculista, 'Calculista creado correctamente'));

  } catch (error) {
    console.error('Error al crear calculista:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json(ApiResponse.error(messages.join(', '), 'VALIDATION_ERROR'));
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(ApiResponse.error('Ya existe un calculista con este email', 'EMAIL_EXISTS'));
    }

    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Actualizar calculista
 */
const updateCalculista = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    specialty,
    license_number,
    notes,
    active
  } = req.body;

  // Validaciones básicas
  if (!name || name.trim().length === 0) {
    return res.status(400).json(ApiResponse.error('El nombre es requerido', 'VALIDATION_ERROR'));
  }

  try {
    // Verificar que el calculista existe
    const calculista = await Calculista.findByPk(id);

    if (!calculista) {
      return res.status(404).json(ApiResponse.error('Calculista no encontrado', 'CALCULISTA_NOT_FOUND'));
    }

    // Verificar email único (si se está cambiando)
    if (email && email !== calculista.email) {
      const emailExists = await Calculista.findOne({
        where: { 
          email,
          id: { [Op.ne]: id }
        }
      });

      if (emailExists) {
        return res.status(400).json(ApiResponse.error('Ya existe un calculista con este email', 'EMAIL_EXISTS'));
      }
    }

    // Actualizar calculista
    await calculista.update({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      specialty: specialty || null,
      license_number: license_number || null,
      notes: notes || null,
      active: active !== undefined ? active : calculista.active
    });

    return res.json(ApiResponse.success(calculista, 'Calculista actualizado correctamente'));

  } catch (error) {
    console.error('Error al actualizar calculista:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json(ApiResponse.error(messages.join(', '), 'VALIDATION_ERROR'));
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(ApiResponse.error('Ya existe un calculista con este email', 'EMAIL_EXISTS'));
    }

    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Eliminar calculista (soft delete)
 */
const deleteCalculista = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el calculista existe
    const calculista = await Calculista.findByPk(id);

    if (!calculista) {
      return res.status(404).json(ApiResponse.error('Calculista no encontrado', 'CALCULISTA_NOT_FOUND'));
    }

    // Verificar si tiene proyectos asociados
    const projectsCount = await Project.count({
      where: { calculista_id: id }
    });

    if (projectsCount > 0) {
      return res.status(400).json(ApiResponse.error(
        'No se puede eliminar el calculista porque tiene proyectos asociados', 
        'CALCULISTA_HAS_PROJECTS'
      ));
    }

    // Soft delete (desactivar)
    await calculista.update({ active: false });

    return res.json(ApiResponse.success(null, 'Calculista eliminado correctamente'));

  } catch (error) {
    console.error('Error al eliminar calculista:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Obtener calculistas activos (para selectores)
 */
const getActiveCalculistas = catchAsync(async (req, res) => {
  try {
    const calculistas = await Calculista.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'specialty'],
      order: [['name', 'ASC']]
    });

    return res.json(ApiResponse.success(calculistas, 'Calculistas activos obtenidos correctamente'));

  } catch (error) {
    console.error('Error al obtener calculistas activos:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

/**
 * Toggle activo/inactivo de un calculista
 */
const toggleCalculistaStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const calculista = await Calculista.findByPk(id);

    if (!calculista) {
      return res.status(404).json(ApiResponse.error('Calculista no encontrado', 'CALCULISTA_NOT_FOUND'));
    }

    await calculista.update({ active });

    const status = active ? 'activado' : 'desactivado';
    return res.json(ApiResponse.success(calculista, `Calculista ${status} correctamente`));

  } catch (error) {
    console.error('Error al cambiar estado del calculista:', error);
    return res.status(500).json(ApiResponse.error('Error interno del servidor', 'DATABASE_ERROR'));
  }
});

module.exports = {
  getAllCalculistas,
  getCalculistaById,
  createCalculista,
  updateCalculista,
  deleteCalculista,
  getActiveCalculistas,
  toggleCalculistaStatus
};
