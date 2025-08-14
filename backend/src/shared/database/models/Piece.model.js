const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Piece = sequelize.define('Piece', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  family_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  width: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  length: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  thickness: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  height: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  diameter: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  volume: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  section: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  seismic_zone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  concrete_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  wind_pressure: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  length_from: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  length_to: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 999999
  },
  units_per_truck: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_roof_surface: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_floor_surface: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_prestressed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_enclosure: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allows_optional: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_individual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_surface: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requires_index_sheet: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  drawing_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  can_quote: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  formula_coefficient: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 1
  },
  global_coefficient: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 2
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pieces',
  underscored: true,
  timestamps: true,
  paranoid: true,
  // Asegurar tipos compatibles con MSSQL y offsets
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Piece;