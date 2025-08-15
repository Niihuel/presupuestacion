/**
 * Models Index
 * Centralized export of all database models
 */

// Import models from their respective modules
const User = require('@modelos/User.model');
const Company = require('@modelos/Company.model');
const Customer = require('@modelos/Customer.model'); 
const Project = require('@modelos/Project.model');
const Zone = require('@modelos/Zone.model');
const Piece = require('@modelos/Piece.model');
const PiecePrice = require('@modelos/PiecePrice.model');
const Quotation = require('@modelos/Quotation.model');
const QuotationItem = require('@modelos/QuotationItem.model');
const QuotationMounting = require('@modelos/QuotationMounting.model');

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
