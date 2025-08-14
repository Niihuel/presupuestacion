/**
 * Rutas para Configuración del Sistema
 * 
 * Define todas las rutas relacionadas con la configuración
 * del sistema de presupuestación
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Importar controlador
const systemConfigController = require('../controllers/systemConfig.controller');

// Middleware de autenticación y autorización
const { authenticate, authorize } = require('../../../shared/middleware/auth.middleware');

// Configurar multer para subida de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 // 1MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JSON'));
    }
  }
});

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * @route   GET /api/v1/system/config
 * @desc    Obtener configuración completa del sistema
 * @access  Private (Admin)
 */
router.get('/config', authorize('admin', 'superadmin'), systemConfigController.getSystemConfig);

/**
 * @route   GET /api/v1/system/config/defaults
 * @desc    Obtener configuraciones por defecto
 * @access  Private (Admin)
 */
router.get('/config/defaults', authorize('admin', 'superadmin'), systemConfigController.getDefaultConfigs);

/**
 * @route   GET /api/v1/system/config/export
 * @desc    Exportar configuración actual
 * @access  Private (Admin)
 */
router.get('/config/export', authorize('admin', 'superadmin'), systemConfigController.exportSystemConfig);

/**
 * @route   GET /api/v1/system/config/:section
 * @desc    Obtener una sección específica de configuración
 * @access  Private (Admin)
 */
router.get('/config/:section', authorize('admin', 'superadmin'), systemConfigController.getSystemConfigSection);

/**
 * @route   PUT /api/v1/system/config
 * @desc    Actualizar configuración completa del sistema
 * @access  Private (Admin)
 */
router.put('/config', authorize('admin', 'superadmin'), systemConfigController.updateSystemConfig);

/**
 * @route   PUT /api/v1/system/config/:section
 * @desc    Actualizar una sección específica de configuración
 * @access  Private (Admin)
 */
router.put('/config/:section', authorize('admin', 'superadmin'), systemConfigController.updateSystemConfigSection);

/**
 * @route   POST /api/v1/system/config/reset
 * @desc    Resetear toda la configuración a valores por defecto
 * @access  Private (SuperAdmin)
 */
router.post('/config/reset', authorize('superadmin'), systemConfigController.resetSystemConfig);

/**
 * @route   POST /api/v1/system/config/:section/reset
 * @desc    Resetear una sección específica a valores por defecto
 * @access  Private (Admin)
 */
router.post('/config/:section/reset', authorize('admin', 'superadmin'), systemConfigController.resetSystemConfig);

/**
 * @route   POST /api/v1/system/config/import
 * @desc    Importar configuración desde archivo JSON
 * @access  Private (SuperAdmin)
 */
router.post('/config/import', 
  authorize('superadmin'), 
  upload.single('config'), 
  systemConfigController.importSystemConfig
);

/**
 * @route   POST /api/v1/system/config/validate
 * @desc    Validar configuración actual
 * @access  Private (Admin)
 */
router.post('/config/validate', authorize('admin', 'superadmin'), systemConfigController.validateSystemConfig);

module.exports = router;
