const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  contact_method_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tax_id: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  tax_category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  street: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  street_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  apartment: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  neighborhood: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'Argentina'
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Dirección completa del cliente'
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Empresa o razón social del cliente'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fax: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_position: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  commercial_references: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bank_references: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'customers',
  underscored: true,
  timestamps: false, // Disable automatic timestamps completely
  paranoid: false // Deshabilitado porque la tabla no tiene deleted_at
});

module.exports = Customer;