/**
 * Controlador de autenticación
 * 
 * Maneja todas las operaciones relacionadas con la autenticación de usuarios
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('@modelos/User.model');
const jwtService = require('../services/jwt.service');
const { emailService } = require('../../../core/email');
const { logger, AppError, catchAsync, ApiResponse } = require('@utilidades');
const { getEffectivePermissions } = require('../../admin/services/rbac.service');
const { logLogin } = require('../../admin/services/auditLogger.service');

class AuthController {
  /**
   * Registra un nuevo usuario en el sistema
   * 
   * @summary Registra un nuevo usuario en el sistema.
   */
  register = catchAsync(async (req, res, next) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Errores de validación', 400, errors.array());
    }

    const { email, username, password, firstName, lastName, phone } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('Ya existe una cuenta con este email', 400);
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new AppError('El nombre de usuario ya está en uso', 400);
    }

    // Crear usuario (inactivo por defecto)
    const user = await User.create({
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      phone,
      is_active: false, // Usuario requiere aprobación manual
      is_verified: false
    });

    // Establecer contraseña
    await user.setPassword(password);
    
    // Generar token de aprobación para administrador
    const approvalToken = require('crypto').randomBytes(32).toString('hex');
    user.email_verification_token = approvalToken;
    user.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    await user.save();

    // Enviar email de notificación al administrador
    try {
      await emailService.sendNewUserRegistrationEmail(user);
      
      // Crear notificación del sistema para administradores
      req.notifications.system(
        'Nuevo usuario registrado',
        `${user.first_name} ${user.last_name} se ha registrado y requiere aprobación`,
        {
          metadata: {
            userId: user.id,
            userEmail: user.email,
            actionRequired: 'approval'
          },
          persistent: true
        }
      );
    } catch (error) {
      logger.error('Error enviando email de notificación de administrador:', error);
    }

    return ApiResponse.success(
      res, 
      { message: 'Usuario registrado, pendiente de aprobación' },
      'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea activada.',
      201
    );
  });

  /**
   * @summary Inicia sesión de un usuario.
   */
  login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body; // Cambiar a username

    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      throw new AppError('Nombre de usuario o contraseña incorrectos', 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
      await emailService.sendAccountLockedEmail(user);
      throw new AppError('Cuenta bloqueada temporalmente', 423);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AppError('Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea activada.', 401);
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      throw new AppError('Nombre de usuario o contraseña incorrectos', 401);
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const tokens = jwtService.generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Permisos efectivos para alimentar el frontend
    let permissions = {};
    try {
      permissions = await getEffectivePermissions(user.id);
    } catch (e) {
      logger.warn('No se pudieron calcular permisos efectivos en login: ' + e.message);
    }

    // Audit login
    try {
      logLogin({ userId: user.id, username: user.username, ip: req.ip, userAgent: req.get('user-agent') });
    } catch (_) {}

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          tokenType: tokens.tokenType,
          expiresIn: tokens.expiresIn
        },
        permissions
      }
    });
  });

  /**
   * @summary Cierra la sesión de un usuario.
   */
  logout = catchAsync(async (req, res, next) => {
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  });

  /**
   * @summary Refresca el token de acceso.
   */
  refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new AppError('Refresh token no encontrado', 401);
    }

    // Verify refresh token
    const payload = jwtService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(payload.sub);
    if (!user || !user.is_active) {
      throw new AppError('Usuario no encontrado o inactivo', 401);
    }

    // Generate new tokens
    const tokens = jwtService.generateTokens(user);

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn
      }
    });
  });

  /**
   * Verify email
   */
  verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
      throw new AppError('Token de verificación no proporcionado', 400);
    }

    // Find user by token
    const user = await User.findByEmailVerificationToken(token);
    if (!user) {
      throw new AppError('Token inválido o expirado', 400);
    }

    // Verify user
    user.is_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });
  });

  /**
   * Resend verification email
   */
  resendVerification = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (user.is_verified) {
      throw new AppError('Email ya verificado', 400);
    }

    // Generate new token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send email
    await emailService.sendVerificationEmail(user, verificationToken);

    res.json({
      success: true,
      message: 'Email de verificación enviado'
    });
  });

  /**
   * Forgot password
   */
  forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones'
      });
      return;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      user.password_reset_token = null;
      user.password_reset_expires = null;
      await user.save();
      throw new AppError('Error enviando email', 500);
    }

    res.json({
      success: true,
      message: 'Email de restablecimiento enviado'
    });
  });

  /**
   * Reset password
   */
  resetPassword = catchAsync(async (req, res, next) => {
    const { token, password } = req.body;

    // Find user by token
    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      throw new AppError('Token inválido o expirado', 400);
    }

    // Set new password
    await user.setPassword(password);
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Generate new tokens
    const tokens = jwtService.generateTokens(user);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          tokenType: tokens.tokenType,
          expiresIn: tokens.expiresIn
        }
      }
    });
  });

  /**
   * Change password (authenticated)
   */
  changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    // Validate current password
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }

    // Set new password
    await user.setPassword(newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  });

  /**
   * OAuth callback handler
   */
  oauthCallback = catchAsync(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Verificar si es un usuario nuevo registrado con OAuth
    const isNewUser = user.isNewUser || false;

    // Generate tokens
    const tokens = jwtService.generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    if (isNewUser) {
      // Si es un usuario nuevo, redirigir al login 
      res.redirect(`${process.env.CLIENT_URL}/login?registered=google`);
    } else {
      // Si es un usuario existente que está haciendo login, ir al dashboard
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${tokens.accessToken}`);
    }
  });

  /**
   * Get current user
   */
  getMe = catchAsync(async (req, res, next) => {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  });

  /**
   * Update profile
   */
  updateProfile = catchAsync(async (req, res, next) => {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    // Update fields
    if (firstName !== undefined) user.first_name = firstName;
    if (lastName !== undefined) user.last_name = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: user.toJSON()
      }
    });
  });

  /**
   * Get all pending users (admin only)
   */
  getPendingUsers = catchAsync(async (req, res, next) => {
    const pendingUsers = await User.findAll({
      where: {
        is_active: false,
        oauth_provider: null // Solo usuarios registrados manualmente
      },
      attributes: ['id', 'email', 'username', 'first_name', 'last_name', 'phone', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: pendingUsers
      }
    });
  });

  /**
   * Approve user (admin only)
   */
  approveUser = catchAsync(async (req, res, next) => {
    const { id, token } = req.query;
    
    if (!id || !token) {
      throw new AppError('ID de usuario y token requeridos', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (user.is_active) {
      return ApiResponse.success(res, null, 'El usuario ya está activo');
    }

    // Validate approval token
    if (user.email_verification_token !== token) {
      throw new AppError('Token de aprobación inválido', 400);
    }

    // Check if token has expired
    if (user.email_verification_expires && new Date() > user.email_verification_expires) {
      throw new AppError('Token de aprobación expirado', 400);
    }

    // Activate user
    user.is_active = true;
    user.is_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();

    // Send approval notification to user
    try {
      await emailService.sendAccountApprovedEmail(user);
    } catch (error) {
      logger.error('Error sending approval email:', error);
    }

    res.json({
      success: true,
      message: 'Usuario aprobado exitosamente'
    });
  });

  /**
   * Reject user (admin only)
   */
  rejectUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (user.is_active) {
      throw new AppError('No se puede rechazar un usuario activo', 400);
    }

    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario rechazado y eliminado exitosamente'
    });
  });
}

module.exports = new AuthController();