const { sequelize } = require('./database');

// Import all models
const User = require('./User.model');
const Zone = require('./Zone.model');
const Piece = require('./Piece.model');
const Customer = require('./Customer.model');
const Project = require('./Project.model');
const Company = require('./Company.model');
const PiecePrice = require('./PiecePrice.model');
const Quotation = require('./Quotation.model');
const QuotationItem = require('./QuotationItem.model');
const QuotationMounting = require('./QuotationMounting.model');

// Define associations
// User associations
User.hasMany(Quotation, { foreignKey: 'vendor_id', as: 'vendorQuotations' });
User.hasMany(Quotation, { foreignKey: 'created_by', as: 'createdQuotations' });
User.hasMany(PiecePrice, { foreignKey: 'created_by', as: 'createdPrices' });
User.hasMany(Customer, { foreignKey: 'created_by', as: 'createdCustomers' });
User.hasMany(Project, { foreignKey: 'created_by', as: 'createdProjects' });
User.hasMany(Project, { foreignKey: 'design_user_id', as: 'designProjects' });
User.hasMany(Project, { foreignKey: 'tracking_user_id', as: 'trackingProjects' });

// Zone associations
Zone.hasMany(PiecePrice, { foreignKey: 'zone_id', as: 'piecePrices' });
Zone.hasMany(Quotation, { foreignKey: 'production_zone_id', as: 'quotations' });

// Piece associations
Piece.hasMany(PiecePrice, { foreignKey: 'piece_id', as: 'prices' });
Piece.hasMany(QuotationItem, { foreignKey: 'piece_id', as: 'quotationItems' });

// Customer associations
Customer.hasMany(Quotation, { foreignKey: 'customer_id', as: 'quotations' });
Customer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Project associations
Project.hasMany(Quotation, { foreignKey: 'project_id', as: 'quotations' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Project.belongsTo(User, { foreignKey: 'design_user_id', as: 'designUser' });
Project.belongsTo(User, { foreignKey: 'tracking_user_id', as: 'trackingUser' });

// Company associations
Company.hasMany(Quotation, { foreignKey: 'company_id', as: 'quotations' });

// PiecePrice associations
PiecePrice.belongsTo(Piece, { foreignKey: 'piece_id', as: 'piece' });
PiecePrice.belongsTo(Zone, { foreignKey: 'zone_id', as: 'zone' });
PiecePrice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Quotation associations
Quotation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Quotation.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Quotation.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Quotation.belongsTo(User, { foreignKey: 'vendor_id', as: 'vendor' });
Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Quotation.belongsTo(Zone, { foreignKey: 'production_zone_id', as: 'productionZone' });
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });
Quotation.hasMany(QuotationMounting, { foreignKey: 'quotation_id', as: 'mountings' });

// QuotationItem associations
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
QuotationItem.belongsTo(Piece, { foreignKey: 'piece_id', as: 'piece' });

// QuotationMounting associations
QuotationMounting.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });

// Export all models
module.exports = {
  sequelize,
  User,
  Zone,
  Piece,
  Customer,
  Project,
  Company,
  PiecePrice,
  Quotation,
  QuotationItem,
  QuotationMounting
};