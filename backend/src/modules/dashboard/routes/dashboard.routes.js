/**
 * Rutas del Dashboard
 * 
 * Define las rutas para las operaciones del dashboard
 * incluyendo métricas, estadísticas y KPIs
 * 
 * @author Sistema de Presupuestación
 * @version 3.0.0 - Dashboard Implementation
 */

const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Middleware de logging para dashboard
router.use((req, res, next) => {
  console.log(`[Dashboard] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Rutas del dashboard
router.get('/stats', getDashboardStats);

module.exports = router;
