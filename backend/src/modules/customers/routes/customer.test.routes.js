// Archivo temporal para probar la API de clientes sin autenticación
// modules/customers/routes/customer.test.routes.js
const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customer.controller');

// Rutas de clientes SIN autenticación para testing
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
