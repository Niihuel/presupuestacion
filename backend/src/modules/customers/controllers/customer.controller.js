// modules/customers/controllers/customer.controller.js
const { Customer } = require('../../../shared/database/models');
const ApiResponse = require('../../../shared/utils/ApiResponse');
const { logger } = require('../../../shared/utils/logger');

/**
 * Obtener todos los clientes
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Construcción de condiciones de búsqueda
    const whereCondition = {};
    if (search) {
      const { Op } = require('sequelize');
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { tax_id: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    return res.json(
      ApiResponse.success({
        customers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }, 'Clientes obtenidos exitosamente')
    );
  } catch (error) {
    logger.error('Error getting customers:', error);
    next(error);
  }
};

/**
 * Obtener un cliente por ID
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json(
        ApiResponse.error('Cliente no encontrado', 404)
      );
    }

    return res.json(
      ApiResponse.success(customer, 'Cliente obtenido exitosamente')
    );
  } catch (error) {
    logger.error('Error getting customer by id:', error);
    next(error);
  }
};

/**
 * Crear un nuevo cliente
 */
const createCustomer = async (req, res, next) => {
  try {
    const customerData = req.body;
    
    // Crear fecha en formato compatible con SQL Server
    const now = new Date();
    const sqlServerDate = now.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss'
    
    // Campos permitidos para crear cliente
    const allowedFields = {
      name: customerData.name,
      tax_id: customerData.tax_id,
      city: customerData.city,
      country: customerData.country || 'Argentina',
      phone: customerData.phone,
      email: customerData.email,
      notes: customerData.notes,
      address: customerData.address,
      company: customerData.company,
      street: customerData.street, // Por si viene del frontend como street
      is_active: true,
      created_at: sqlServerDate,  // Fecha manual en formato SQL Server
      updated_at: sqlServerDate   // Fecha manual en formato SQL Server
    };
    
    // Filtrar campos undefined/null/vacíos
    const cleanData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    
    const customer = await Customer.create(cleanData);

    return res.status(201).json(
      ApiResponse.success(customer, 'Cliente creado exitosamente')
    );
  } catch (error) {
    logger.error('Error creating customer:', error);
    next(error);
  }
};

/**
 * Actualizar un cliente
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerData = req.body;

    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json(
        ApiResponse.error('Cliente no encontrado', 404)
      );
    }

    // Crear fecha de actualización en formato compatible con SQL Server
    const now = new Date();
    const sqlServerDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Campos permitidos para actualizar cliente
    const allowedFields = {
      name: customerData.name,
      tax_id: customerData.tax_id,
      city: customerData.city,
      country: customerData.country,
      phone: customerData.phone,
      email: customerData.email,
      notes: customerData.notes,
      address: customerData.address,
      company: customerData.company,
      street: customerData.street, // Por si viene del frontend como street
      is_active: customerData.is_active,
      updated_at: sqlServerDate   // Fecha manual en formato SQL Server
    };
    
    // Filtrar campos undefined/null (pero permitir cadenas vacías para poder limpiar campos)
    const cleanData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => 
        value !== undefined && value !== null
      )
    );

    await customer.update(cleanData);

    return res.json(
      ApiResponse.success(customer, 'Cliente actualizado exitosamente')
    );
  } catch (error) {
    logger.error('Error updating customer:', error);
    next(error);
  }
};

/**
 * Eliminar un cliente
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json(
        ApiResponse.error('Cliente no encontrado', 404)
      );
    }

    await customer.destroy();

    return res.json(
      ApiResponse.success(null, 'Cliente eliminado exitosamente')
    );
  } catch (error) {
    logger.error('Error deleting customer:', error);
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
