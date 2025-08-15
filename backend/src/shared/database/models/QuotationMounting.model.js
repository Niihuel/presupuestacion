const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const QuotationMounting = sequelize.define('QuotationMounting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  total_price: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'quotation_mounting',
  underscored: true,
  timestamps: true
});

// Hook para calcular el precio total
QuotationMounting.beforeSave(async (item) => {
  item.total_price = item.unit_price * item.quantity;
});

module.exports = QuotationMounting;