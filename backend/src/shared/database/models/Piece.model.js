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