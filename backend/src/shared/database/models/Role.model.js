const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class Role extends Model {}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    assignable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

module.exports = Role;



