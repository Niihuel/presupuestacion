const router = require('express').Router();
const processParametersController = require('../controllers/processParameters.controller');
const { authenticate } = require('@shared/middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de parámetros de proceso
router.get('/', processParametersController.getParameters);
router.post('/', processParametersController.upsertParameters);
router.get('/comparison', processParametersController.getParametersComparison);
router.post('/copy-from-previous', processParametersController.copyFromPreviousMonth);

module.exports = router;