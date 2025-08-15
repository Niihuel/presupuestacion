const express = require('express');
const router = express.Router();

const plantaController = require('../../../controllers/planta.controller');

router.get('/', plantaController.getAllPlantas);
router.get('/active', plantaController.getActivePlantas);
router.get('/nearest', plantaController.findNearestPlanta);
router.get('/:id', plantaController.getPlantaById);
router.post('/', plantaController.createPlanta);
router.put('/:id', plantaController.updatePlanta);
router.delete('/:id', plantaController.deletePlanta);
router.patch('/:id/toggle-status', plantaController.togglePlantaStatus);
router.post('/:id/calculate-distance', plantaController.calculateDistance);

module.exports = router;