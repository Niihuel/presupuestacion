const router = require('express').Router();
const zoneController = require('../controllers/zone.controller');
const { authenticate, authorize } = require('@compartido/middleware/auth.middleware');
const { validateZone, validateZonePrices } = require('@compartido/validators/zone.validator');
const { orsDistance } = require('../services/routing.service');

// Rutas públicas (requieren autenticación)
router.use(authenticate);

// Obtener todas las zonas
router.get('/', zoneController.getAllZones);

// Obtener estadísticas de zonas
router.get('/stats', zoneController.getZonesStats);

// Obtener zonas activas (para selectores)
router.get('/active', zoneController.getActiveZones);

// Buscar zona más cercana
router.get('/nearest', zoneController.findNearestZone);

// Obtener una zona específica
router.get('/:id', zoneController.getZoneById);

// Calcular distancia desde una zona
router.get('/:id/distance', zoneController.calculateDistance);

// Calcular distancia por carretera con ORS (camiones)
router.post('/routing/distance', async (req, res, next) => {
  try {
    const { origin, destination, vehicle } = req.body || {};
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({ success: false, message: 'origin/destination inválidos' });
    }
    const result = await orsDistance(origin, destination, vehicle);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Obtener precios de una zona
router.get('/:zoneId/prices', zoneController.getZonePrices);

// Rutas administrativas (permitir a usuarios regulares gestionar zonas)
router.use(authorize('admin', 'superadmin', 'user'));

// Crear nueva zona
router.post('/', validateZone, zoneController.createZone);

// Actualizar zona
router.put('/:id', validateZone, zoneController.updateZone);

// Eliminar zona
router.delete('/:id', zoneController.deleteZone);

// Establecer precios para una zona
router.post('/:zoneId/prices', validateZonePrices, zoneController.setZonePrices);

// Copiar precios entre zonas
router.post('/copy-prices', zoneController.copyZonePrices);

module.exports = router;