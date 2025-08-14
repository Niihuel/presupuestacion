/**
 * Modelo de Calculista
 * 
 * Define la estructura y métodos para el manejo de calculistas en el sistema
 * de presupuestación. Reemplaza la funcionalidad de diseñadores.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class Calculista extends Model {
  // Métodos de instancia

  /**
   * Obtiene el nombre completo con especialidad
   * @returns {string} - Nombre con especialidad
   */
  getDisplayName() {
    return this.specialty ? `${this.name} - ${this.specialty}` : this.name;
  }

  /**
   * Verifica si el calculista está activo
   * @returns {boolean} - Verdadero si está activo
   */
  isActive() {
    return this.active;
  }

  /**
   * Obtiene la información completa del calculista
   * @returns {Object} - Información completa
   */
  getFullInfo() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      specialty: this.specialty,
      license_number: this.license_number,
      notes: this.notes,
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Métodos estáticos

  /**
   * Encuentra un calculista por su email
   * @param {string} email - El email del calculista
   * @returns {Promise<Calculista|null>} - La instancia del calculista o nulo
   */
  static async findByEmail(email) {
    return this.findOne({ where: { email } });
  }

  /**
   * Obtiene todos los calculistas activos
   * @returns {Promise<Calculista[]>} - Array de calculistas activos
   */
  static async getActive() {
    return this.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Busca calculistas por término de búsqueda
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Calculista[]>} - Array de calculistas encontrados
   */
  static async search(searchTerm) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } },
          { phone: { [Op.like]: `%${searchTerm}%` } },
          { specialty: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Obtiene calculistas por especialidad
   * @param {string} specialty - Especialidad a buscar
   * @returns {Promise<Calculista[]>} - Array de calculistas
   */
  static async getBySpecialty(specialty) {
    return this.findAll({
      where: { specialty },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Cuenta proyectos asociados a un calculista
   * @param {number} calculistaId - ID del calculista
   * @returns {Promise<number>} - Número de proyectos
   */
  static async countProjects(calculistaId) {
    const { Project } = require('./index');
    return Project.count({
      where: { calculista_id: calculistaId }
    });
  }
}

// Definir el modelo
Calculista.init({
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
      },
      len: {
        args: [2, 255],
        msg: 'El nombre debe tener entre 2 y 255 caracteres'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: {
        args: [0, 50],
        msg: 'El teléfono no puede tener más de 50 caracteres'
      }
    }
  },
  specialty: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'La especialidad no puede tener más de 255 caracteres'
      }
    }
  },
  license_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'El número de matrícula no puede tener más de 100 caracteres'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  modelName: 'Calculista',
  tableName: 'calculistas',
  timestamps: true,
  paranoid: false, // Deshabilitado porque la tabla no tiene deleted_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (calculista, options) => {
      calculista.updated_at = new Date();
    }
  }
});

module.exports = Calculista;
