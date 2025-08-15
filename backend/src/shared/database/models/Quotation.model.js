const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  production_zone_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected', 'expired'),
    defaultValue: 'draft'
  },
  quotation_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiry_days: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delivery_terms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_terms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Subtotales y cálculos
  subtotal_materials: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  general_expenses_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 15
  },
  general_expenses_amount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  profit_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10
  },
  profit_amount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  subtotal_before_tax: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 21
  },
  tax_amount: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  
  // Montaje y flete
  mounting_subtotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  freight_subtotal: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  additionals_total: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  
  // Total final
  total: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'quotations',
  underscored: true,
  timestamps: true,
  paranoid: false // Deshabilitado porque la tabla no tiene deleted_at
});

// Asociaciones
Quotation.associate = (models) => {
  Quotation.hasMany(models.QuotationItem, {
    foreignKey: 'quotation_id',
    as: 'items'
  });
  
  Quotation.hasMany(models.QuotationMounting, {
    foreignKey: 'quotation_id',
    as: 'mountingItems'
  });
  
  Quotation.belongsTo(models.Zone, {
    foreignKey: 'production_zone_id',
    as: 'productionZone'
  });
  
  Quotation.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });
};

// Método para calcular totales
Quotation.prototype.calculateTotals = async function() {
  const QuotationItem = require('./QuotationItem.model');
  const QuotationMounting = require('./QuotationMounting.model');
  
  // 1. Calcular subtotal de materiales
  const items = await QuotationItem.findAll({
    where: { quotation_id: this.id }
  });
  
  this.subtotal_materials = items.reduce((sum, item) => {
    return sum + parseFloat(item.total_price || 0);
  }, 0);
  
  // 2. Gastos generales
  this.general_expenses_amount = this.subtotal_materials * (this.general_expenses_percentage / 100);
  
  // 3. Utilidad (sobre subtotal + gastos generales)
  const baseForProfit = this.subtotal_materials + this.general_expenses_amount;
  this.profit_amount = baseForProfit * (this.profit_percentage / 100);
  
  // 4. Subtotal antes de impuestos
  this.subtotal_before_tax = this.subtotal_materials + this.general_expenses_amount + this.profit_amount;
  
  // 5. IVA
  this.tax_amount = this.subtotal_before_tax * (this.tax_rate / 100);
  
  // 6. Calcular montaje
  const mountingItems = await QuotationMounting.findAll({
    where: { quotation_id: this.id }
  });
  
  this.mounting_subtotal = mountingItems.reduce((sum, item) => {
    return sum + parseFloat(item.total_price || 0);
  }, 0);
  
  // 7. Total final (mantener consistencia con campos existentes)
  this.total = this.subtotal_before_tax + this.tax_amount + this.mounting_subtotal + this.freight_subtotal + (parseFloat(this.additionals_total || 0));
  
  await this.save();
  return this;
};

module.exports = Quotation;