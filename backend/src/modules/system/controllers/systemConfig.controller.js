/**
 * Controlador de Configuración del Sistema
 * 
 * Maneja todas las operaciones relacionadas con la configuración
 * del sistema de presupuestación
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0
 */

const { SystemConfig } = require('@modelos');
const { AppError, catchAsync, ApiResponse } = require('@utilidades');
const { logger } = require('@utilidades/logger');

/**
 * Configuraciones por defecto del sistema
 */
const DEFAULT_CONFIG = {
  general: {
    company_name: 'Mi Empresa',
    company_cuit: '',
    company_address: '',
    company_phone: '',
    currency: 'ARS',
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  quotation: {
    base_profit_margin: 15,
    general_expenses: 10,
    tax_rate: 21,
    validity_days: 30,
    mounting_hour_cost: 2500,
    hours_per_sqm: 0.5
  },
  pricing: {
    auto_inflation_adjustment: false,
    monthly_adjustment: 2.5,
    last_adjustment_date: null,
    wholesale_margin: 10,
    retail_margin: 20,
    premium_margin: 25
  },
  zones: {
    cost_per_km: 50,
    free_distance_km: 10,
    auto_distance_calculation: true,
    auto_zone_assignment: false,
    max_service_radius: 500
  },
  notifications: {
    new_quotation: true,
    quotation_approved: true,
    expiration_reminder: true,
    reminder_days: 3,
    admin_email: '',
    security_alerts: true,
    system_reports: false
  },
  system: {
    auto_backup: true,
    backup_frequency: 'daily',
    backup_retention_days: 30,
    session_timeout: 60,
    max_login_attempts: 5,
    two_factor_auth: false
  }
};

class SystemConfigController {
  /**
   * Obtener configuración completa del sistema
   */
  getSystemConfig = catchAsync(async (req, res) => {
    let config = await SystemConfig.findOne();
    
    if (!config) {
      // Crear configuración por defecto si no existe
      config = await SystemConfig.create({
        config: DEFAULT_CONFIG,
        version: '1.0.0',
        created_by: req.user.id
      });
    }

    res.json({
      success: true,
      data: { config: config.config },
      message: 'Configuración obtenida exitosamente'
    });
  });

  /**
   * Obtener una sección específica de configuración
   */
  getSystemConfigSection = catchAsync(async (req, res) => {
    const { section } = req.params;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: DEFAULT_CONFIG,
        version: '1.0.0',
        created_by: req.user.id
      });
    }

    const sectionConfig = config.config[section];
    
    if (!sectionConfig) {
      throw new AppError(`Sección de configuración '${section}' no encontrada`, 404);
    }

    res.json({
      success: true,
      data: { config: sectionConfig },
      message: `Configuración de ${section} obtenida exitosamente`
    });
  });

  /**
   * Actualizar configuración completa del sistema
   */
  updateSystemConfig = catchAsync(async (req, res) => {
    const { config: newConfig } = req.body;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: newConfig,
        version: '1.0.0',
        created_by: req.user.id,
        updated_by: req.user.id
      });
    } else {
      // Crear historial de cambios
      const previousConfig = config.config;
      
      // Actualizar configuración
      config.config = { ...config.config, ...newConfig };
      config.updated_by = req.user.id;
      config.updated_at = new Date();
      await config.save();

      // Registrar en historial (si tienes tabla de historial)
      // await SystemConfigHistory.create({
      //   config_id: config.id,
      //   previous_config: previousConfig,
      //   new_config: config.config,
      //   changed_by: req.user.id
      // });
    }

    logger.info(`System configuration updated by user ${req.user.id}`);

    res.json({
      success: true,
      data: { config: config.config },
      message: 'Configuración actualizada exitosamente'
    });
  });

  /**
   * Actualizar una sección específica de configuración
   */
  updateSystemConfigSection = catchAsync(async (req, res) => {
    const { section } = req.params;
    const sectionData = req.body;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: DEFAULT_CONFIG,
        version: '1.0.0',
        created_by: req.user.id
      });
    }

    if (!config.config[section]) {
      throw new AppError(`Sección de configuración '${section}' no encontrada`, 404);
    }

    // Actualizar solo la sección específica
    config.config[section] = { ...config.config[section], ...sectionData };
    config.updated_by = req.user.id;
    config.updated_at = new Date();
    await config.save();

    logger.info(`System configuration section '${section}' updated by user ${req.user.id}`);

    res.json({
      success: true,
      data: { config: config.config[section] },
      message: `Configuración de ${section} actualizada exitosamente`
    });
  });

  /**
   * Resetear configuración a valores por defecto
   */
  resetSystemConfig = catchAsync(async (req, res) => {
    const { section } = req.params;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: DEFAULT_CONFIG,
        version: '1.0.0',
        created_by: req.user.id
      });
    } else {
      if (section) {
        // Resetear solo una sección
        if (!DEFAULT_CONFIG[section]) {
          throw new AppError(`Sección de configuración '${section}' no existe`, 404);
        }
        config.config[section] = DEFAULT_CONFIG[section];
      } else {
        // Resetear toda la configuración
        config.config = DEFAULT_CONFIG;
      }
      
      config.updated_by = req.user.id;
      config.updated_at = new Date();
      await config.save();
    }

    const message = section 
      ? `Configuración de ${section} restablecida a valores por defecto`
      : 'Configuración restablecida a valores por defecto';

    logger.info(`System configuration ${section ? `section '${section}'` : ''} reset by user ${req.user.id}`);

    res.json({
      success: true,
      data: { config: section ? config.config[section] : config.config },
      message
    });
  });

  /**
   * Exportar configuración actual
   */
  exportSystemConfig = catchAsync(async (req, res) => {
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: DEFAULT_CONFIG,
        version: '1.0.0',
        created_by: req.user.id
      });
    }

    const exportData = {
      version: config.version,
      exported_at: new Date().toISOString(),
      exported_by: req.user.username,
      config: config.config
    };

    res.json({
      success: true,
      data: exportData,
      message: 'Configuración exportada exitosamente'
    });
  });

  /**
   * Importar configuración desde archivo
   */
  importSystemConfig = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Archivo de configuración requerido', 400);
    }

    let importData;
    try {
      const fileContent = req.file.buffer.toString('utf8');
      importData = JSON.parse(fileContent);
    } catch (error) {
      throw new AppError('Archivo de configuración inválido', 400);
    }

    if (!importData.config) {
      throw new AppError('Formato de archivo de configuración inválido', 400);
    }

    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        config: importData.config,
        version: importData.version || '1.0.0',
        created_by: req.user.id
      });
    } else {
      config.config = importData.config;
      config.version = importData.version || config.version;
      config.updated_by = req.user.id;
      config.updated_at = new Date();
      await config.save();
    }

    logger.info(`System configuration imported by user ${req.user.id}`);

    res.json({
      success: true,
      data: { config: config.config },
      message: 'Configuración importada exitosamente'
    });
  });

  /**
   * Validar configuración actual
   */
  validateSystemConfig = catchAsync(async (req, res) => {
    let config = await SystemConfig.findOne();
    
    if (!config) {
      res.json({
        success: true,
        data: { 
          isValid: false, 
          errors: ['No existe configuración del sistema'] 
        },
        message: 'Validación completada'
      });
      return;
    }

    const errors = [];
    const warnings = [];

    // Validaciones básicas
    if (!config.config.general?.company_name) {
      warnings.push('Nombre de empresa no configurado');
    }

    if (!config.config.general?.company_cuit) {
      warnings.push('CUIT de empresa no configurado');
    }

    if (!config.config.notifications?.admin_email) {
      warnings.push('Email de administrador no configurado');
    }

    // Validaciones numéricas
    if (config.config.quotation?.base_profit_margin < 0 || config.config.quotation?.base_profit_margin > 100) {
      errors.push('Margen de ganancia base debe estar entre 0 y 100%');
    }

    if (config.config.quotation?.tax_rate < 0 || config.config.quotation?.tax_rate > 30) {
      errors.push('Tasa de impuesto debe estar entre 0 y 30%');
    }

    const isValid = errors.length === 0;

    res.json({
      success: true,
      data: { 
        isValid, 
        errors, 
        warnings,
        validatedAt: new Date().toISOString()
      },
      message: 'Validación completada'
    });
  });

  /**
   * Obtener configuraciones por defecto
   */
  getDefaultConfigs = catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: { config: DEFAULT_CONFIG },
      message: 'Configuraciones por defecto obtenidas exitosamente'
    });
  });
}

module.exports = new SystemConfigController();
