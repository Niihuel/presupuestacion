const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  designer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  code: {
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
  distance_from_cba: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  distance_from_bsas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  distance_from_vm: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  documentation_location: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  location_iframe: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shelf: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shelf_level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  box: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  warehouse: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  delivery_deadline: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  approval_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  foundation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  production_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  technical_tracking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  design_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tracking_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  index_sheet_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preframes_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  waterproofing_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  neoprenes_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  mounting_accessories_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  polystyrene_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preframes_revision: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  waterproofing_revision: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  neoprenes_revision: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mounting_accessories_revision: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  polystyrene_revision: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'projects',
  underscored: true,
  timestamps: false, // Deshabilitado para SQL Server - usa defaults de DB
  paranoid: false // Deshabilitado porque la tabla no tiene deleted_at
});

module.exports = Project;