// modules/projects/routes/project.routes.js
const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  generateProjectCode,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByCustomer
} = require('../controllers/project.controller');
const { authenticate } = require('@compartido/middleware/auth.middleware');
const { parseLatLngFromIframe, orsForwardGeocode } = require('../services/geocoding.service');

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas de proyectos
router.get('/', getProjects);
router.get('/generate-code', generateProjectCode);
router.get('/customer/:customerId', getProjectsByCustomer);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// POST /projects/geocode
router.post('/geocode', async (req, res, next) => {
  try {
    const { iframe, address } = req.body || {};
    // 1) intentar del iframe
    let coords = parseLatLngFromIframe(iframe);
    // 2) fallback geocoding por texto con ORS
    if (!coords && address) {
      coords = await orsForwardGeocode(address);
    }
    if (!coords) return res.status(404).json({ success: false, message: 'No se pudieron obtener coordenadas' });
    res.json({ success: true, data: { lat: coords.lat, lng: coords.lng } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
