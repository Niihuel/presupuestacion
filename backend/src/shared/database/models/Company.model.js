const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  underscored: true,
  timestamps: true,
  paranoid: true
});

module.exports = Company;