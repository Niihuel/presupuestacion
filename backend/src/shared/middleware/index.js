// src/middlewares/index.js

const authMiddleware = require('./auth.middleware');
const validationMiddleware = require('./validation.middleware');
const errorHandler = require('./error.handler');

module.exports = {
  ...authMiddleware,
  ...validationMiddleware,
  errorHandler
};