// src/shared/middleware/auth.middleware.js
// Este archivo contiene los middlewares para la autenticación y autorización de usuarios.
const passport = require('passport');
const { AppError, logger } = require('@utilidades');
const jwtService = require('../../modules/auth/services/jwt.service');
const User = require('../database/models/User.model');

/**
 * @summary Autentica a un usuario utilizando un token JWT.
 * @description Extrae el token del encabezado de autorización, lo verifica y, si es válido, adjunta el usuario a la solicitud.
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AppError('Token no proporcionado', 401);
    }

    // Verify token
    const payload = jwtService.verifyAccessToken(token);

    // Get user
    const user = await User.findByPk(payload.sub);
    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (!user.is_active) {
      throw new AppError('Cuenta desactivada', 401);
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido', 401));
    }
    next(error);
  }
};

/**
 * @summary Autenticación opcional.
 * @description Intenta autenticar al usuario si se proporciona un token, pero no falla si el token no está presente o no es válido.
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = jwtService.verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
        req.tokenPayload = payload;
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
    logger.debug('Optional auth error:', error.message);
  }

  next();
};

/**
 * @summary Autoriza a un usuario basándose en su rol.
 * @description Verifica si el rol del usuario autenticado está incluido en los roles permitidos.
 * @param {...string} roles - Los roles permitidos para acceder al recurso.
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }

    next();
  };
};

/**
 * @summary Verifica si un usuario tiene un permiso específico.
 * @description Comprueba si el usuario autenticado tiene el permiso necesario para realizar una acción en un módulo determinado.
 * @param {string} module - El módulo al que pertenece el permiso.
 * @param {string} action - La acción que se quiere realizar.
 */
const { userHasPermission } = require('../../modules/admin/services/rbac.service');

exports.checkPermission = (module, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    // Superadmin bypasses all permission checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    try {
      // Check if user has the required permission
      const permission = await userHasPermission(req.user, module, action);
      
      if (!permission) {
        return next(new AppError('No tienes permisos para realizar esta acción', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Comprueba si el usuario es el propietario del recurso
 */
exports.checkOwnership = (modelGetter) => {
  return async (req, res, next) => {
    try {
      const resource = await modelGetter(req);
      
      if (!resource) {
        return next(new AppError('Recurso no encontrado', 404));
      }

      // Check ownership
      const userId = req.user.id;
      const ownerId = resource.userId || resource.created_by || resource.user_id;

      if (ownerId !== userId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new AppError('No tienes permisos para acceder a este recurso', 403));
      }

      // Attach resource to request
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Requiere un correo electrónico verificado
 */
exports.requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('No autenticado', 401));
  }

  if (!req.user.isVerified) {
    return next(new AppError('Por favor verifica tu email antes de continuar', 403));
  }

  next();
};

/**
 * Límite de velocidad por usuario (más estricto que el basado en IP)
 */
exports.userRateLimit = (maxRequests = 10, windowMinutes = 1) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const window = windowMinutes * 60 * 1000;

    // Clean old entries
    const userRequests = requests.get(userId) || [];
    const validRequests = userRequests.filter(time => now - time < window);

    if (validRequests.length >= maxRequests) {
      return next(new AppError('Demasiadas solicitudes. Por favor espera un momento.', 429));
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
};