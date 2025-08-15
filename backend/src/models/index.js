/**
 * Models Index
 * Centralized export of all database models
 */

// Import models from their respective modules
const User = require('../shared/database/models/User.model');
const Company = require('../shared/database/models/Company.model');
const Customer = require('../shared/database/models/Customer.model'); 
const Project = require('../shared/database/models/Project.model');
const Zone = require('../shared/database/models/Zone.model');
const Piece = require('../shared/database/models/Piece.model');
const PiecePrice = require('../shared/database/models/PiecePrice.model');
const Quotation = require('../shared/database/models/Quotation.model');
const QuotationItem = require('../shared/database/models/QuotationItem.model');
const QuotationMounting = require('../shared/database/models/QuotationMounting.model');

// Export all models
module.exports = {
  User,
  Company,
  Customer,
  Project,
  Zone,
  Piece,
  PiecePrice,
  Quotation,
  QuotationItem,
  QuotationMounting
};
