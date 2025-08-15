/**
 * Modelo de Planta
 * 
 * Define la estructura para las plantas/ubicaciones de la empresa
 * para el cálculo de distancias en presupuestación.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class Planta extends Model {
  // Métodos de instancia

  /**
   * Obtiene la dirección completa
   * @returns {string} - Dirección completa
   */
  getFullAddress() {
    return `${this.address}, ${this.city}, ${this.province}, ${this.country}`;
  }

  /**
   * Verifica si la planta está activa
   * @returns {boolean} - Verdadero si está activa
   */
  isActive() {
    return this.active;
  }

  /**
   * Obtiene las coordenadas como objeto
   * @returns {Object|null} - Coordenadas {lat, lng} o null
   */
  getCoordinates() {
    if (this.latitude && this.longitude) {
      return {
        lat: parseFloat(this.latitude),
        lng: parseFloat(this.longitude)
      };
    }
    return null;
  }

  /**
   * Calcula la distancia a otra coordenada usando la fórmula de Haversine
   * @param {number} lat - Latitud destino
   * @param {number} lng - Longitud destino
   * @returns {number} - Distancia en kilómetros
   */
  calculateDistance(lat, lng) {
    if (!this.latitude || !this.longitude) {
      return null;
    }

    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat - this.latitude);
    const dLng = this.deg2rad(lng - this.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(this.latitude)) * Math.cos(this.deg2rad(lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Convierte grados a radianes
   * @param {number} deg - Grados
   * @returns {number} - Radianes
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Métodos estáticos

  /**
   * Obtiene todas las plantas activas
   * @returns {Promise<Planta[]>} - Array de plantas activas
   */
  static async getActive() {
    return this.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Encuentra la planta más cercana a unas coordenadas
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Promise<Object>} - Planta más cercana con distancia
   */
  static async findNearest(lat, lng) {
    const plantas = await this.getActive();
    let nearest = null;
    let minDistance = Infinity;

    plantas.forEach(planta => {
      const distance = planta.calculateDistance(lat, lng);
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        nearest = {
          planta,
          distance
        };
      }
    });

    return nearest;
  }

  /**
   * Obtiene la planta principal (primera por defecto)
   * @returns {Promise<Planta|null>} - Planta principal
   */
  static async getPrincipal() {
    return this.findOne({
      where: { active: true },
      order: [['id', 'ASC']]
    });
  }
}

// Definir el modelo
Planta.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido'
      }
    }
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La dirección es requerida'
      }
    }
  },
  city: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La ciudad es requerida'
      }
    }
  },
  province: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La provincia es requerida'
      }
    }
  },
  country: {
    type: DataTypes.STRING(255),
    defaultValue: 'Argentina',
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Planta',
  tableName: 'plantas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (planta, options) => {
      planta.updated_at = new Date();
    }
  }
});

module.exports = Planta;
