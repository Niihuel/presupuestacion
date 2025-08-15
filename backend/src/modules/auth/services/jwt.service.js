// src/modules/auth/services/jwt.service.js
// Este archivo contiene el servicio para la generación y verificación de JSON Web Tokens (JWT).
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('@utilidades/logger');

class JWTService {
  /**
   * @summary Genera un token de acceso.
   * @param {object} user - El objeto de usuario para el cual se generará el token.
   * @returns {string} El token de acceso JWT.
   */
  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVendor: user.isVendor,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4() // Unique token ID for blacklisting
    };

    const options = {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: process.env.JWT_ISSUER || 'pretensa-api',
      audience: process.env.JWT_AUDIENCE || 'pretensa-client'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * @summary Genera un token de refresco.
   * @param {object} user - El objeto de usuario para el cual se generará el token.
   * @returns {string} El token de refresco JWT.
   */
  generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      tokenType: 'refresh',
      jti: uuidv4()
    };

    const options = {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: process.env.JWT_ISSUER || 'pretensa-api',
      audience: process.env.JWT_AUDIENCE || 'pretensa-client'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, options);
  }

  /**
   * @summary Genera tanto el token de acceso como el de refresco.
   * @param {object} user - El objeto de usuario.
   * @returns {object} Un objeto que contiene el token de acceso, el token de refresco, el tipo de token y el tiempo de expiración.
   */
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRE || '15m'
    };
  }

  /**
   * @summary Verifica un token de acceso.
   * @param {string} token - El token de acceso JWT a verificar.
   * @returns {object} El payload decodificado del token si es válido.
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'pretensa-api',
        audience: process.env.JWT_AUDIENCE || 'pretensa-client'
      });
    } catch (error) {
      logger.error('Error verifying access token:', error.message);
      throw error;
    }
  }

  /**
   * @summary Verifica un token de refresco.
   * @param {string} token - El token de refresco JWT a verificar.
   * @returns {object} El payload decodificado del token si es válido.
   */
  verifyRefreshToken(token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: process.env.JWT_ISSUER || 'pretensa-api',
        audience: process.env.JWT_AUDIENCE || 'pretensa-client'
      });

      if (payload.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      logger.error('Error verifying refresh token:', error.message);
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header
   * @returns {string|null} Token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} Is expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }
}

module.exports = new JWTService();