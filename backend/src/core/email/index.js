/**
 * Índice del módulo de email
 * 
 * Exporta el servicio de email y plantillas
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const emailService = require('./email.service');
const emailTemplates = require('./email.templates');

module.exports = {
  emailService,
  emailTemplates
};
