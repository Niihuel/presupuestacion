// src/middlewares/admin.middleware.js
const { AppError } = require('../utils');

/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 */
const requireAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return next(new AppError('Usuario no autenticado', 401));
  }
  
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return next(new AppError('Acceso denegado. Se requieren permisos de administrador.', 403));
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario tenga permisos de super administrador
 */
const requireSuperAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return next(new AppError('Usuario no autenticado', 401));
  }
  
  if (user.role !== 'superadmin') {
    return next(new AppError('Acceso denegado. Se requieren permisos de super administrador.', 403));
  }
  
  next();
};

module.exports = {
  requireAdmin,
  requireSuperAdmin
};
