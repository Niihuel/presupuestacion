/**
 * Índice de modelos de base de datos
 * 
 * Centraliza la exportación de todos los modelos de Sequelize
 * para facilitar las importaciones
 */

const Customer = require('./Customer.model');
const User = require('./User.model');
const Company = require('./Company.model');
const Project = require('./Project.model');
const Quotation = require('./Quotation.model');
const QuotationItem = require('./QuotationItem.model');
const QuotationMounting = require('./QuotationMounting.model');
const Zone = require('./Zone.model');
const Piece = require('./Piece.model');
const PiecePrice = require('./PiecePrice.model');
const Calculista = require('./Calculista.model');
const SystemConfig = require('./SystemConfig.model');
const Role = require('./Role.model');
const RolePermission = require('./RolePermission.model');
const UserRole = require('./UserRole.model');
const FreightRate = require('./FreightRate.model');
const MountingRate = require('./MountingRate.model');

// Definir asociaciones
try {
  // Quotation associations
  Quotation.belongsTo(Customer, { 
    foreignKey: 'customer_id', 
    as: 'customer' 
  });
  
  Quotation.belongsTo(Project, { 
    foreignKey: 'project_id', 
    as: 'project' 
  });
  
  Quotation.belongsTo(Zone, { 
    foreignKey: 'production_zone_id', 
    as: 'productionZone' 
  });

  Quotation.belongsTo(User, { 
    foreignKey: 'vendor_id', 
    as: 'vendor' 
  });

  // Customer associations
  Customer.hasMany(Quotation, { 
    foreignKey: 'customer_id', 
    as: 'quotations' 
  });

  Customer.hasMany(Project, { 
    foreignKey: 'customer_id', 
    as: 'projects' 
  });

  // Project associations
  Project.belongsTo(Customer, { 
    foreignKey: 'customer_id', 
    as: 'customer' 
  });

  Project.belongsTo(Calculista, {
    foreignKey: 'calculista_id',
    as: 'calculista'
  });

  Project.belongsTo(Zone, {
    foreignKey: 'zone_id',
    as: 'zone'
  });

  Project.hasMany(Quotation, { 
    foreignKey: 'project_id', 
    as: 'quotations' 
  });

  // Calculista associations
  Calculista.hasMany(Project, {
    foreignKey: 'calculista_id',
    as: 'projects'
  });

  // Zone associations
  Zone.hasMany(Project, {
    foreignKey: 'zone_id',
    as: 'projects'
  });

  // Zone associations
  Zone.hasMany(Quotation, { 
    foreignKey: 'production_zone_id', 
    as: 'quotations' 
  });

  Zone.hasMany(PiecePrice, {
    foreignKey: 'zone_id',
    as: 'piecePrices'
  });

  // Piece associations
  Piece.hasMany(PiecePrice, {
    foreignKey: 'piece_id',
    as: 'prices'
  });

  // PiecePrice associations
  PiecePrice.belongsTo(Piece, {
    foreignKey: 'piece_id',
    as: 'piece'
  });

  PiecePrice.belongsTo(Zone, {
    foreignKey: 'zone_id',
    as: 'zone'
  });

  // RBAC associations
  // Users <-> Roles (many-to-many)
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });

  // Roles <-> Permissions (many-to-many)
  // Nota: permissions tabla existe en DB; la representamos como modelo “Permission” on the fly o consultamos directo.

} catch (error) {
  console.error('Error defining model associations:', error);
}

module.exports = {
  Customer,
  User,
  Company,
  Project,
  Quotation,
  QuotationItem,
  QuotationMounting,
  Zone,
  Piece,
  PiecePrice,
  Calculista,
  SystemConfig,
  Role,
  RolePermission,
  UserRole,
  FreightRate,
  MountingRate
};
