const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

/**
 * Modelo de Configuración del Sistema
 * 
 * Define la estructura para almacenar la configuración global
 * del sistema de presupuestación
 */

class SystemConfig extends Model {
  /**
   * Obtiene un valor de configuración específico
   * 
   * @param {string} section - Sección de configuración (general, quotation, pricing, etc.)
   * @param {string} key - Clave específica dentro de la sección
   * @returns {any} - Valor de configuración
   */
  getConfigValue(section, key = null) {
    if (!this.config || !this.config[section]) {
      return null;
    }

    if (key) {
      return this.config[section][key] || null;
    }

    return this.config[section];
  }

  /**
   * Establece un valor de configuración específico
   * 
   * @param {string} section - Sección de configuración
   * @param {string|object} keyOrData - Clave específica o objeto completo de datos
   * @param {any} value - Valor a establecer (solo si keyOrData es string)
   */
  setConfigValue(section, keyOrData, value = null) {
    if (!this.config) {
      this.config = {};
    }

    if (!this.config[section]) {
      this.config[section] = {};
    }

    if (typeof keyOrData === 'string' && value !== null) {
      // Establecer valor específico
      this.config[section][keyOrData] = value;
    } else if (typeof keyOrData === 'object') {
      // Establecer objeto completo
      this.config[section] = { ...this.config[section], ...keyOrData };
    }

    // Marcar como modificado para Sequelize
    this.changed('config', true);
  }

  /**
   * Valida la estructura de configuración
   * 
   * @returns {object} - Resultado de validación { valid: boolean, errors: array }
   */
  validateConfig() {
    const errors = [];
    const requiredSections = ['general', 'quotation', 'pricing', 'zones', 'notifications', 'system'];

    if (!this.config || typeof this.config !== 'object') {
      errors.push('La configuración debe ser un objeto válido');
      return { valid: false, errors };
    }

    // Validar secciones requeridas
    requiredSections.forEach(section => {
      if (!this.config[section]) {
        errors.push(`Falta la sección requerida: ${section}`);
      }
    });

    // Validaciones específicas por sección
    if (this.config.general) {
      if (!this.config.general.companyName || typeof this.config.general.companyName !== 'string') {
        errors.push('El nombre de la empresa es requerido');
      }
    }

    if (this.config.quotation) {
      if (typeof this.config.quotation.defaultValidityDays !== 'number' || this.config.quotation.defaultValidityDays <= 0) {
        errors.push('Los días de validez por defecto deben ser un número positivo');
      }
    }

    if (this.config.pricing) {
      if (typeof this.config.pricing.defaultMargin !== 'number' || this.config.pricing.defaultMargin < 0) {
        errors.push('El margen por defecto debe ser un número no negativo');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Combina configuración con valores por defecto
   * 
   * @param {object} defaults - Configuración por defecto
   * @returns {object} - Configuración combinada
   */
  mergeWithDefaults(defaults) {
    const merged = { ...defaults };
    
    if (this.config) {
      Object.keys(this.config).forEach(section => {
        if (merged[section]) {
          merged[section] = { ...merged[section], ...this.config[section] };
        } else {
          merged[section] = this.config[section];
        }
      });
    }

    return merged;
  }
}

// Definición del modelo
SystemConfig.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identificador único de configuración'
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0.0',
    comment: 'Versión de la configuración'
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Configuración del sistema en formato JSON',
    validate: {
      isValidJSON(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('La configuración debe ser un objeto JSON válido');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si esta configuración está activa'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario que creó la configuración',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario que actualizó la configuración',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Metadatos adicionales sobre la configuración'
  }
}, {
  sequelize,
  modelName: 'SystemConfig',
  tableName: 'system_configs',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['isActive'],
      name: 'idx_system_config_active'
    },
    {
      fields: ['version'],
      name: 'idx_system_config_version'
    },
    {
      fields: ['createdAt'],
      name: 'idx_system_config_created'
    }
  ],
  hooks: {
    beforeSave: (systemConfig, options) => {
      // Validar configuración antes de guardar
      const validation = systemConfig.validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
      }
    },
    afterCreate: (systemConfig, options) => {
      console.log(`Nueva configuración del sistema creada - ID: ${systemConfig.id}, Versión: ${systemConfig.version}`);
    },
    afterUpdate: (systemConfig, options) => {
      console.log(`Configuración del sistema actualizada - ID: ${systemConfig.id}, Versión: ${systemConfig.version}`);
    }
  }
});

module.exports = SystemConfig;
