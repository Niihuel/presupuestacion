const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class RolePermission extends Model {}

RolePermission.init(
  {
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    permission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    allow: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    scope: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: false,
    underscored: true
  }
);

module.exports = RolePermission;



