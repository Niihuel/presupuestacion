/**
 * Rutas para Plantas
 * 
 * Define todas las rutas relacionadas con la gestión de plantas/ubicaciones
 * para cálculo de distancias en presupuestación
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Importar controlador
const plantaController = require('../controllers/planta.controller');

// Middleware de autenticación (si tienes uno)
// const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/v1/plantas
 * @desc    Obtener todas las plantas con paginación y filtros
 * @access  Private
 */
router.get('/', plantaController.getAllPlantas);

/**
 * @route   GET /api/v1/plantas/active
 * @desc    Obtener plantas activas (para selectores)
 * @access  Private
 */
router.get('/active', plantaController.getActivePlantas);

/**
 * @route   GET /api/v1/plantas/nearest
 * @desc    Buscar planta más cercana a unas coordenadas
 * @access  Private
 */
router.get('/nearest', plantaController.findNearestPlanta);

/**
 * @route   GET /api/v1/plantas/:id
 * @desc    Obtener planta por ID
 * @access  Private
 */
router.get('/:id', plantaController.getPlantaById);

/**
 * @route   POST /api/v1/plantas
 * @desc    Crear nueva planta
 * @access  Private
 */
router.post('/', plantaController.createPlanta);

/**
 * @route   PUT /api/v1/plantas/:id
 * @desc    Actualizar planta
 * @access  Private
 */
router.put('/:id', plantaController.updatePlanta);

/**
 * @route   DELETE /api/v1/plantas/:id
 * @desc    Eliminar planta
 * @access  Private
 */
router.delete('/:id', plantaController.deletePlanta);

/**
 * @route   PATCH /api/v1/plantas/:id/toggle-status
 * @desc    Cambiar estado activo/inactivo de planta
 * @access  Private
 */
router.patch('/:id/toggle-status', plantaController.togglePlantaStatus);

/**
 * @route   POST /api/v1/plantas/:id/calculate-distance
 * @desc    Calcular distancia entre planta y coordenadas
 * @access  Private
 */
router.post('/:id/calculate-distance', plantaController.calculateDistance);

module.exports = router;
