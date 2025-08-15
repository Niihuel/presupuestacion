// modules/projects/controllers/project.controller.js
const { Project, Customer } = require('../../../shared/database/models');
const ApiResponse = require('../../../shared/utils/ApiResponse');
const { logger } = require('../../../shared/utils/logger');
const { Op } = require('sequelize');
const { logCrud } = require('../../admin/services/auditLogger.service');

// Mapear status string a ID - usando los estados reales de la BD
const mapStatusToId = (status) => {
  const statusMap = {
    'planning': null,        // Sin estado (null para "Planificación")
    'consultation': 1,       // En Consulta
    'budgeted': 2,          // Presupuestado  
    'approved': 3,          // Aprobado
    'production': 4,        // En Producción
    'delivered': 5,         // Entregado
    'cancelled': 6          // Cancelado
  };
  return statusMap[status] !== undefined ? statusMap[status] : null;
};

/**
 * Obtener todos los proyectos
 */
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      customer_id,
      status_id,
      designer_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtros
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status_id) whereClause.status_id = status_id;
    if (customer_id) whereClause.customer_id = customer_id;
    if (designer_id) whereClause.designer_id = designer_id;

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'code', 'notes', 'status_id', 'designer_id', 
        'delivery_deadline', 'approval_date', 'foundation_date', 'delivery_date', 
        'production_end_date', 'city', 'location_iframe',
        'customer_id', 'calculista_id', 'zone_id', 'is_active',
        'created_at', 'updated_at', 'created_by'
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    const responseData = {
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        limit: parseInt(limit)
      }
    };

    console.log('=== DEBUG: Respuesta de getProjects ===');
    console.log('Total projects found:', count);
    console.log('Projects array length:', projects.length);
    console.log('Response structure:', Object.keys(responseData));
    console.log('Sample project (first):', projects[0] ? JSON.stringify(projects[0], null, 2) : 'No projects');
    console.log('=====================================');

    return res.json(
      ApiResponse.success(responseData, 'Proyectos obtenidos exitosamente')
    );
  } catch (error) {
    logger.error('Error getting projects:', error);
    next(error);
  }
};

/**
 * Obtener un proyecto por ID
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json(
        ApiResponse.error('Proyecto no encontrado', 404)
      );
    }

    return res.json(
      ApiResponse.success(project, 'Proyecto obtenido exitosamente')
    );
  } catch (error) {
    logger.error('Error getting project by id:', error);
    next(error);
  }
};

/**
 * Generar código automático para proyecto
 */
const generateProjectCode = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `PROJ-${currentYear}-`;
    
    // Buscar todos los códigos del año actual
    const existingCodes = await Project.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: `${prefix}%`
        }
      },
      raw: true
    });
    
    // Extraer números existentes
    const existingNumbers = existingCodes
      .map(project => {
        const match = project.code.match(/PROJ-\d{4}-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    // Encontrar el siguiente número disponible
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    // Formatear con ceros a la izquierda (3 dígitos)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const newCode = `${prefix}${formattedNumber}`;
    
    return res.json(
      ApiResponse.success({ code: newCode }, 'Código generado exitosamente')
    );
  } catch (error) {
    logger.error('Error generating project code:', error);
    next(error);
  }
};

/**
 * Crear un nuevo proyecto
 */
const createProject = async (req, res, next) => {
  try {
    const rawData = req.body;
    
    console.log('=== DEBUG: Datos recibidos en createProject ===');
    console.log('RawData:', JSON.stringify(rawData, null, 2));
    console.log('=====================================');
    
    // Crear fecha en formato compatible con SQL Server
    const now = new Date();
    const sqlServerDate = now.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss'
    
    // Preparar datos para ubicación
    let cityData = null;
    let iframeData = null;
    let latitude = rawData.latitude;
    let longitude = rawData.longitude;
    
    if (rawData.location) {
      if (rawData.location.includes('<iframe')) {
        // Si contiene iframe, separar dirección e iframe
        iframeData = rawData.location;
        // Extraer la dirección del parámetro q del iframe
        const qMatch = rawData.location.match(/[?&]q=([^&]*)/);
        if (qMatch) {
          cityData = decodeURIComponent(qMatch[1]);
        }
      } else {
        // Si es solo texto, es la dirección
        cityData = rawData.location;
      }
    }
    
    // Si se envía también location_text separado (para el futuro)
    if (rawData.location_text) {
      cityData = rawData.location_text;
    }
    
    // Si se envía iframe separado
    if (rawData.location_iframe) {
      iframeData = rawData.location_iframe;
    }
    
    // Preparar solo los campos que existen en el modelo Project
    const projectData = {
      name: rawData.name,
      code: rawData.code || null,
      customer_id: rawData.customer_id || null,
      status_id: mapStatusToId(rawData.status), // mapear status string a ID
      city: cityData,
      location_iframe: iframeData,
      latitude,
      longitude,
      notes: rawData.description || null,
      is_active: rawData.is_active !== undefined ? rawData.is_active : true,
      // Campos que requiere la base de datos con valores por defecto
      country: 'Argentina',
      distance_from_cba: 0,
      distance_from_bsas: 0,
      distance_from_vm: 0,
      technical_tracking: false,
      preframes_revision: 0,
      waterproofing_revision: 0,
      neoprenes_revision: 0,
      mounting_accessories_revision: 0,
      polystyrene_revision: 0,
      // Fechas en formato SQL Server
      created_at: sqlServerDate,
      updated_at: sqlServerDate
    };
    
    console.log('=== DEBUG: Datos procesados para crear proyecto ===');
    console.log('ProjectData:', JSON.stringify(projectData, null, 2));
    console.log('City:', cityData);
    console.log('Iframe:', iframeData ? 'SI (length: ' + iframeData.length + ')' : 'NO');
    console.log('SqlServerDate:', sqlServerDate);
    console.log('=====================================');

    // Filtrar campos undefined/null/vacíos
    const cleanData = Object.fromEntries(
      Object.entries(projectData).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    
    console.log('=== DEBUG: Datos limpios para crear proyecto ===');
    console.log('CleanData:', JSON.stringify(cleanData, null, 2));
    console.log('=====================================');

    // Crear proyecto directamente (igual que en clientes)
    const project = await Project.create(cleanData);

    // Obtener el proyecto creado con la información del cliente
    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    try { logCrud({ userId: req.user?.id, entity: 'projects', entityId: project.id, action: 'create', data: { name: project.name } }); } catch (_) {}

    return res.status(201).json(
      ApiResponse.success(createdProject, 'Proyecto creado exitosamente')
    );
  } catch (error) {
    logger.error('Error creating project:', error);
    next(error);
  }
};

/**
 * Actualizar un proyecto
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawData = req.body;

    console.log('=== DEBUG: Datos recibidos en updateProject ===');
    console.log('ID:', id);
    console.log('RawData:', JSON.stringify(rawData, null, 2));
    console.log('=====================================');

    // Preparar datos para ubicación
    let cityData = rawData.city; // Conservar valor actual si no se cambia
    let iframeData = rawData.location_iframe; // Conservar valor actual si no se cambia
    
    if (rawData.location) {
      if (rawData.location.includes('<iframe')) {
        // Si contiene iframe, separar dirección e iframe
        iframeData = rawData.location;
        // Extraer la dirección del parámetro q del iframe
        const qMatch = rawData.location.match(/[?&]q=([^&]*)/);
        if (qMatch) {
          cityData = decodeURIComponent(qMatch[1]);
        }
      } else {
        // Si es solo texto, es la dirección
        cityData = rawData.location;
      }
    }
    
    // Si se envía también location_text separado (para el futuro)
    if (rawData.location_text) {
      cityData = rawData.location_text;
    }

    // Crear fecha en formato compatible con SQL Server para updated_at
    const now = new Date();
    const sqlServerDate = now.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss'

    // Preparar datos de actualización - mapear campos frontend a campos BD
    const updateData = {
      name: rawData.name,
      code: rawData.code,
      notes: rawData.description || rawData.notes, // description del frontend -> notes en BD
      status_id: mapStatusToId(rawData.status), // convertir string status a ID
      customer_id: rawData.customer_id,
      city: cityData,
      location_iframe: iframeData,
      latitude: rawData.latitude,
      longitude: rawData.longitude,
      is_active: rawData.is_active !== undefined ? rawData.is_active : true,
      updated_at: sqlServerDate
    };

    console.log('=== DEBUG: Datos procesados para actualizar proyecto ===');
    console.log('UpdateData:', JSON.stringify(updateData, null, 2));
    console.log('City:', cityData);
    console.log('Iframe:', iframeData ? 'SI (length: ' + iframeData.length + ')' : 'NO');
    console.log('=====================================');

    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json(
        ApiResponse.error('Proyecto no encontrado', 404)
      );
    }

    await project.update(updateData);
    try { logCrud({ userId: req.user?.id, entity: 'projects', entityId: project.id, action: 'update' }); } catch (_) {}

    // Obtener el proyecto actualizado con la información del cliente
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    return res.json(
      ApiResponse.success(updatedProject, 'Proyecto actualizado exitosamente')
    );
  } catch (error) {
    logger.error('Error updating project:', error);
    next(error);
  }
};

/**
 * Eliminar un proyecto
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json(
        ApiResponse.error('Proyecto no encontrado', 404)
      );
    }

    await project.destroy();
    try { logCrud({ userId: req.user?.id, entity: 'projects', entityId: id, action: 'delete' }); } catch (_) {}

    return res.json(
      ApiResponse.success(null, 'Proyecto eliminado exitosamente')
    );
  } catch (error) {
    logger.error('Error deleting project:', error);
    next(error);
  }
};

/**
 * Obtener proyectos por cliente
 * Nota: La relación es indirecta a través de quotations
 */
const getProjectsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    // Como no hay relación directa, por ahora devolvemos un array vacío
    // TODO: Implementar búsqueda a través de quotations
    const projects = [];

    return res.json(
      ApiResponse.success(projects, 'Proyectos del cliente obtenidos exitosamente')
    );
  } catch (error) {
    logger.error('Error getting projects by customer:', error);
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  generateProjectCode,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByCustomer
};
