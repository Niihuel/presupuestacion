/**
 * Sistema de Configuración - Módulo Principal
 * 
 * Centraliza todas las funcionalidades relacionadas con
 * la configuración del sistema de presupuestación
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Importar rutas del módulo
const systemConfigRoutes = require('./routes/systemConfig.routes');
const policiesRoutes = require('./routes/policies.routes');

// Montar las rutas
router.use('/system', systemConfigRoutes);
router.use('/policies', policiesRoutes);

module.exports = router;
