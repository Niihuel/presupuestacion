/**
 * Módulo de Autenticación
 * 
 * Maneja todas las operaciones relacionadas con autenticación,
 * autorización y gestión de usuarios
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

const authController = require('./controllers/auth.controller');
const authRoutes = require('./routes/auth.routes');
const jwtService = require('./services/jwt.service');

module.exports = {
  authController,
  authRoutes,
  jwtService
};
