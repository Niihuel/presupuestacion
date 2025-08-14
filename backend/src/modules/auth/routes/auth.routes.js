// src/modules/auth/routes/auth.routes.js
const router = require('express').Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');
const { requireAdmin } = require('../../../shared/middleware/admin.middleware');
const { 
  validateRegister,
  validateLogin,
  validateEmail,
  validatePassword,
  validatePasswordChange,
  validateProfileUpdate
} = require('../../../shared/middleware/validation.middleware');

// Rutas públicas
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Verificación de correo electrónico
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', validateEmail, authController.resendVerification);

// Restablecimiento de contraseña
router.post('/forgot-password', validateEmail, authController.forgotPassword);
router.post('/reset-password', validatePassword, authController.resetPassword);

// Rutas OAuth - Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  authController.oauthCallback
);

// Ruta pública para aprobación de usuarios (protegida por token)
router.get('/approve-user', authController.approveUser);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

router.get('/me', authController.getMe);
router.patch('/me', validateProfileUpdate, authController.updateProfile);
router.post('/change-password', validatePasswordChange, authController.changePassword);

// Rutas de administración (solo admins)
router.get('/pending-users', requireAdmin, authController.getPendingUsers);
router.delete('/reject-user/:id', requireAdmin, authController.rejectUser);

module.exports = router;