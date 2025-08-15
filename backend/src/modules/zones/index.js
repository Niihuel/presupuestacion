/**
 * Módulo de Zonas
 * 
 * Maneja todas las operaciones relacionadas con zonas de producción
 * y precios por zona
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

const zoneController = require('./controllers/zone.controller');
const zoneRoutes = require('./routes/zone.routes');

module.exports = {
  zoneController,
  zoneRoutes
};
