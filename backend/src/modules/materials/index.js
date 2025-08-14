/**
 * Módulo de Materiales
 * 
 * Exporta todos los componentes del módulo de materiales
 */

const materialController = require('./controllers/material.controller');
const materialService = require('./services/material.service');
const materialRoutes = require('./routes/material.routes');

module.exports = {
  controller: materialController,
  service: materialService,
  routes: materialRoutes
};
