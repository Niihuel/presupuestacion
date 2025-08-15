/**
 * Índice principal de módulos
 * 
 * Centraliza la exportación de todos los módulos de la aplicación
 * siguiendo Clean Architecture
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

// Importar rutas de cada módulo
const authRoutes = require('./auth/routes/auth.routes');
const quotationRoutes = require('./quotations/routes/quotation.routes');
const zoneRoutes = require('./zones/routes/zone.routes');
const { customerRoutes } = require('./customers');
const { projectRoutes } = require('./projects');
const { pieceRoutes } = require('./pieces');
const { routes: dashboardRoutes } = require('./dashboard');
const systemRoutes = require('./system');
const adminRoutes = require('./admin');
const { routes: materialRoutes } = require('./materials');
const logisticsRoutes = require('./logistics');

module.exports = {
  authRoutes,
  quotationRoutes,
  zoneRoutes,
  customerRoutes,
  projectRoutes,
  pieceRoutes,
  dashboardRoutes,
  systemRoutes,
  materialRoutes,
  adminRoutes,
  logisticsRoutes
};
