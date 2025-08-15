const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class UserRole extends Model {}

UserRole.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false,
    underscored: true
  }
);

module.exports = UserRole;



