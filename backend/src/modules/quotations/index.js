/**
 * Módulo de Presupuestos
 * 
 * Maneja todas las operaciones relacionadas con presupuestos,
 * items de presupuesto y montajes
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

const quotationController = require('./controllers/quotation.controller');
const quotationRoutes = require('./routes/quotation.routes');

module.exports = {
  quotationController,
  quotationRoutes
};
