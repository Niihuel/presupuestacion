const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const FreightRate = sequelize.define('FreightRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  km_from: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  km_to: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  rate_under_12m: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  rate_over_12m: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  effective_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'freight_rates',
  underscored: true,
  timestamps: false
});

module.exports = FreightRate;


