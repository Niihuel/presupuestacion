// modules/customers/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customer.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas de clientes
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
