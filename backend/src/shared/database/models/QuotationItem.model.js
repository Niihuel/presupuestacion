const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const QuotationItem = sequelize.define('QuotationItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  piece_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 1
  },
  length: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  width: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  height: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  unit_price: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  price_adjustment: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  total_price: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  weight: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  is_optional: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'quotation_items',
  underscored: true,
  timestamps: true
});

// Hooks para calcular el precio total (considerando ancho cuando aplica)
QuotationItem.beforeSave(async (item) => {
  const adjustedPrice = item.unit_price * (1 + item.price_adjustment / 100);
  const effectiveLength = parseFloat(item.length || 0) || 0;
  const width = parseFloat(item.width || 0) || 0;
  const measure = (effectiveLength || 1) * (width > 0 ? width : 1);
  item.total_price = adjustedPrice * (item.quantity || 0) * measure;
});

module.exports = QuotationItem;