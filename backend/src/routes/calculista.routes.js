/**
 * Rutas para Calculistas
 * 
 * Define todas las rutas relacionadas con la gestión de calculistas
 * Versión simplificada para pruebas iniciales
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0 - Versión básica
 */

const express = require('express');
const router = express.Router();

// Importar controlador
const calculistaController = require('../controllers/calculista.controller');

// Middleware de autenticación
const { authenticate, authorize } = require('../shared/middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * @route   GET /api/v1/calculistas
 * @desc    Obtener todos los calculistas con paginación y filtros
 * @access  Private
 */
router.get('/', calculistaController.getAllCalculistas);

/**
 * @route   GET /api/v1/calculistas/active
 * @desc    Obtener calculistas activos (para selectores)
 * @access  Private
 */
router.get('/active', calculistaController.getActiveCalculistas);

/**
 * @route   GET /api/v1/calculistas/:id
 * @desc    Obtener calculista por ID
 * @access  Private
 */
router.get('/:id', calculistaController.getCalculistaById);

/**
 * @route   POST /api/v1/calculistas
 * @desc    Crear nuevo calculista
 * @access  Admin
 */
router.post('/', authorize('admin', 'superadmin'), calculistaController.createCalculista);

/**
 * @route   PUT /api/v1/calculistas/:id
 * @desc    Actualizar calculista
 * @access  Admin
 */
router.put('/:id', authorize('admin', 'superadmin'), calculistaController.updateCalculista);

/**
 * @route   DELETE /api/v1/calculistas/:id
 * @desc    Eliminar calculista (soft delete)
 * @access  Admin
 */
router.delete('/:id', authorize('admin', 'superadmin'), calculistaController.deleteCalculista);

/**
 * @route   PATCH /api/v1/calculistas/:id/toggle-status
 * @desc    Toggle activo/inactivo de un calculista
 * @access  Admin
 */
router.patch('/:id/toggle-status', authorize('admin', 'superadmin'), calculistaController.toggleCalculistaStatus);

module.exports = router;
