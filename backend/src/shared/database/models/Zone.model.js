const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

/**
 * Modelo de Zone con funcionalidades de geolocalización
 * 
 * Define la estructura para las zonas/ubicaciones de la empresa
 * Incluye cálculo de distancias geográficas
 */

class Zone extends Model {
  /**
   * Calcula la distancia entre esta zona y unas coordenadas específicas
   * Utiliza la fórmula de Haversine para calcular distancias en la superficie terrestre
   * 
   * @param {number} lat - Latitud de destino
   * @param {number} lng - Longitud de destino  
   * @returns {number} - Distancia en kilómetros
   */
  calculateDistance(lat, lng) {
    if (!this.latitude || !this.longitude) {
      throw new Error('La zona no tiene coordenadas definidas');
    }

    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat - this.latitude);
    const dLng = this.toRad(lng - this.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(this.latitude)) * Math.cos(this.toRad(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Convierte grados a radianes
   * @param {number} degrees - Grados a convertir
   * @returns {number} - Radianes
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Verifica si la zona está activa
   * @returns {boolean} - true si está activa
   */
  isActive() {
    return this.is_active === true;
  }

  /**
   * Obtiene información completa de contacto
   * @returns {Object} - Objeto con información de contacto
   */
  getContactInfo() {
    return {
      name: this.contact_name,
      phone: this.contact_phone,
      email: this.contact_email,
      address: this.address,
      city: this.city,
      state: this.state
    };
  }

  /**
   * Obtiene todas las zonas activas
   * @returns {Promise<Zone[]>} - Array de zonas activas
   */
  static async getActive() {
    return await this.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Encuentra la zona más cercana a unas coordenadas
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Promise<Object>} - Zona más cercana con distancia
   */
  static async findNearest(lat, lng) {
    const zones = await this.getActive();
    let nearest = null;
    let minDistance = Infinity;

    zones.forEach(zone => {
      if (zone.latitude && zone.longitude) {
        const distance = zone.calculateDistance(lat, lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = {
            zone,
            distance
          };
        }
      }
    });

    return nearest;
  }

  /**
   * Obtiene la zona principal (primera por orden de display)
   * @returns {Promise<Zone|null>} - Zona principal
   */
  static async getPrincipal() {
    return await this.findOne({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['name', 'ASC']]
    });
  }
}

Zone.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'El código no puede estar vacío'
      },
      len: {
        args: [1, 10],
        msg: 'El código debe tener entre 1 y 10 caracteres'
      }
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre no puede estar vacío'
      },
      len: {
        args: [1, 100],
        msg: 'El nombre debe tener entre 1 y 100 caracteres'
      }
    }
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
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
  zone_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo de zona: Planta Principal, Planta Secundaria, Depósito, etc.'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: {
        args: [-90],
        msg: 'La latitud debe estar entre -90 y 90 grados'
      },
      max: {
        args: [90],
        msg: 'La latitud debe estar entre -90 y 90 grados'
      }
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: {
        args: [-180],
        msg: 'La longitud debe estar entre -180 y 180 grados'
      },
      max: {
        args: [180],
        msg: 'La longitud debe estar entre -180 y 180 grados'
      }
    }
  },
  contact_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location_iframe: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Código iframe de Google Maps para mostrar ubicación'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'El orden debe ser mayor o igual a 0'
      }
    }
  }
}, {
  sequelize,
  modelName: 'Zone',
  tableName: 'zones',
  underscored: true,
  timestamps: false, // Disable automatic timestamps to avoid SQL Server date format issues
  paranoid: false,
  indexes: [
    {
      fields: ['is_active']
    },
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['display_order']
    }
  ]
});

module.exports = Zone;