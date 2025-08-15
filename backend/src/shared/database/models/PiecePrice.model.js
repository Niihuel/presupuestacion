const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const PiecePrice = sequelize.define('PiecePrice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  piece_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  zone_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  base_price: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  adjustment: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0
  },
  final_price: {
    type: DataTypes.VIRTUAL,
    get() {
      return parseFloat(this.base_price) + parseFloat(this.adjustment);
    }
  },
  effective_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'piece_prices',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['piece_id', 'zone_id', 'effective_date']
    }
  ]
});

// Método estático para obtener precio actual
PiecePrice.getCurrentPrice = async function(pieceId, zoneId) {
  const price = await this.findOne({
    where: {
      piece_id: pieceId,
      zone_id: zoneId,
      effective_date: {
        [sequelize.Op.lte]: new Date()
      },
      [sequelize.Op.or]: [
        { expiry_date: null },
        { expiry_date: { [sequelize.Op.gte]: new Date() } }
      ]
    },
    order: [['effective_date', 'DESC']]
  });
  
  return price;
};

module.exports = PiecePrice;