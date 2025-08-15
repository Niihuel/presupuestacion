/**
 * Componente SystemConfig
 * 
 * Panel de configuración del sistema con categorías organizadas
 */

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload,
  Shield,
  Mail,
  Database,
  Palette,
  Globe,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  Key,
  Lock,
  Server
} from 'lucide-react';
import useAdminHook from '@compartido/hooks/useAdminHook';

const SystemConfig = () => {
  const { 
    useGetSystemConfig,
    useUpdateSystemConfig,
    useBackupSystemConfig,
    useRestoreSystemConfig
  } = useAdminHook();

  const { data: config = {}, isLoading, refetch } = useGetSystemConfig();
  const updateConfigMutation = useUpdateSystemConfig();
  const backupMutation = useBackupSystemConfig();
  const restoreMutation = useRestoreSystemConfig();

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Pestañas de configuración
  const configTabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'database', name: 'Base de Datos', icon: Database },
    { id: 'appearance', name: 'Apariencia', icon: Palette },
    { id: 'localization', name: 'Localización', icon: Globe },
    { id: 'backup', name: 'Respaldo', icon: Download }
  ];

  // Manejar cambio en formulario
  const handleInputChange = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
    
    // Limpiar error si existe
    if (errors[`${section}.${key}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${key}`]: undefined
      }));
    }
  };

  // Validar configuración
  const validateConfig = () => {
    const newErrors = {};

    // Validaciones generales
    if (formData.general?.site_name && formData.general.site_name.length < 3) {
      newErrors['general.site_name'] = 'El nombre del sitio debe tener al menos 3 caracteres';
    }

    // Validaciones de email
    if (formData.email?.smtp_host && !formData.email.smtp_port) {
      newErrors['email.smtp_port'] = 'El puerto SMTP es requerido';
    }

    if (formData.email?.from_email && !/\S+@\S+\.\S+/.test(formData.email.from_email)) {
      newErrors['email.from_email'] = 'Email no válido';
    }

    // Validaciones de seguridad
    if (formData.security?.session_timeout && formData.security.session_timeout < 5) {
      newErrors['security.session_timeout'] = 'El timeout debe ser al menos 5 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar configuración
  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    try {
      await updateConfigMutation.mutateAsync(formData);
      setHasChanges(false);
      refetch();
    } catch (error) {
      setErrors({ submit: error.message || 'Error al guardar la configuración' });
    }
  };

  // Realizar backup
  const handleBackup = async () => {
    try {
      await backupMutation.mutateAsync();
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  // Renderizar campos de configuración por sección
  const renderConfigSection = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'security':
        return <SecurityConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'email':
        return <EmailConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'database':
        return <DatabaseConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'appearance':
        return <AppearanceConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'localization':
        return <LocalizationConfig formData={formData} onChange={handleInputChange} errors={errors} />;
      case 'backup':
        return <BackupConfig onBackup={() => setShowBackupModal(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
          <p className="text-gray-600">Gestiona la configuración y parámetros del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              disabled={updateConfigMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateConfigMutation.isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Error general */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-sm text-red-700">{errors.submit}</span>
        </div>
      )}

      {/* Panel de configuración */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex">
          {/* Sidebar con pestañas */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {configTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando configuración...</p>
              </div>
            ) : (
              renderConfigSection()
            )}
          </div>
        </div>
      </div>

      {/* Modal de backup */}
      {showBackupModal && (
        <BackupModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          onConfirm={handleBackup}
          isLoading={backupMutation.isLoading}
        />
      )}
    </div>
  );
};

// Componente de configuración general
const GeneralConfig = ({ formData, onChange, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración General</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del sitio
          </label>
          <input
            type="text"
            value={formData.general?.site_name || ''}
            onChange={(e) => onChange('general', 'site_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
              errors['general.site_name'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Sistema de Presupuestación"
          />
          {errors['general.site_name'] && (
            <p className="mt-1 text-sm text-red-600">{errors['general.site_name']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL del sitio
          </label>
          <input
            type="url"
            value={formData.general?.site_url || ''}
            onChange={(e) => onChange('general', 'site_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="https://presupuestos.empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email del administrador
          </label>
          <input
            type="email"
            value={formData.general?.admin_email || ''}
            onChange={(e) => onChange('general', 'admin_email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="admin@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zona horaria
          </label>
          <select
            value={formData.general?.timezone || ''}
            onChange={(e) => onChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
            <option value="America/Santiago">Santiago (GMT-3)</option>
            <option value="America/Montevideo">Montevideo (GMT-3)</option>
            <option value="America/Bogota">Bogotá (GMT-5)</option>
            <option value="America/Lima">Lima (GMT-5)</option>
            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción del sistema
        </label>
        <textarea
          value={formData.general?.description || ''}
          onChange={(e) => onChange('general', 'description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          placeholder="Sistema para la gestión de presupuestos y cotizaciones..."
        />
      </div>

      <div className="mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.general?.maintenance_mode || false}
            onChange={(e) => onChange('general', 'maintenance_mode', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Modo mantenimiento</span>
        </label>
        <p className="mt-1 text-sm text-gray-500">
          Cuando está activado, solo los administradores pueden acceder al sistema
        </p>
      </div>
    </div>
  </div>
);

// Componente de configuración de seguridad
const SecurityConfig = ({ formData, onChange, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Seguridad</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de sesión (minutos)
          </label>
          <input
            type="number"
            min="5"
            max="1440"
            value={formData.security?.session_timeout || ''}
            onChange={(e) => onChange('security', 'session_timeout', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
              errors['security.session_timeout'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="30"
          />
          {errors['security.session_timeout'] && (
            <p className="mt-1 text-sm text-red-600">{errors['security.session_timeout']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intentos de login máximos
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={formData.security?.max_login_attempts || ''}
            onChange={(e) => onChange('security', 'max_login_attempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bloqueo temporal (minutos)
          </label>
          <input
            type="number"
            min="5"
            max="60"
            value={formData.security?.lockout_duration || ''}
            onChange={(e) => onChange('security', 'lockout_duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="15"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitud mínima de contraseña
          </label>
          <input
            type="number"
            min="6"
            max="20"
            value={formData.security?.min_password_length || ''}
            onChange={(e) => onChange('security', 'min_password_length', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="8"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.security?.require_strong_passwords || false}
            onChange={(e) => onChange('security', 'require_strong_passwords', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Requerir contraseñas seguras</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.security?.enable_two_factor || false}
            onChange={(e) => onChange('security', 'enable_two_factor', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Habilitar autenticación de dos factores</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.security?.force_https || false}
            onChange={(e) => onChange('security', 'force_https', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Forzar conexiones HTTPS</span>
        </label>
      </div>
    </div>
  </div>
);

// Componente de configuración de email
const EmailConfig = ({ formData, onChange, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Email</h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servidor SMTP
            </label>
            <input
              type="text"
              value={formData.email?.smtp_host || ''}
              onChange={(e) => onChange('email', 'smtp_host', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puerto SMTP
            </label>
            <input
              type="number"
              value={formData.email?.smtp_port || ''}
              onChange={(e) => onChange('email', 'smtp_port', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                errors['email.smtp_port'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="587"
            />
            {errors['email.smtp_port'] && (
              <p className="mt-1 text-sm text-red-600">{errors['email.smtp_port']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario SMTP
            </label>
            <input
              type="text"
              value={formData.email?.smtp_username || ''}
              onChange={(e) => onChange('email', 'smtp_username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="usuario@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña SMTP
            </label>
            <input
              type="password"
              value={formData.email?.smtp_password || ''}
              onChange={(e) => onChange('email', 'smtp_password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email remitente
            </label>
            <input
              type="email"
              value={formData.email?.from_email || ''}
              onChange={(e) => onChange('email', 'from_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                errors['email.from_email'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="noreply@empresa.com"
            />
            {errors['email.from_email'] && (
              <p className="mt-1 text-sm text-red-600">{errors['email.from_email']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre remitente
            </label>
            <input
              type="text"
              value={formData.email?.from_name || ''}
              onChange={(e) => onChange('email', 'from_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="Sistema de Presupuestos"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email?.smtp_secure || false}
              onChange={(e) => onChange('email', 'smtp_secure', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Usar conexión segura (TLS/SSL)</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email?.enable_notifications || false}
              onChange={(e) => onChange('email', 'enable_notifications', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Habilitar notificaciones por email</span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Componente de configuración de base de datos
const DatabaseConfig = ({ formData, onChange }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Base de Datos</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Atención</h4>
            <p className="text-sm text-yellow-700">
              Los cambios en la configuración de base de datos requieren reiniciar el sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conexiones máximas
          </label>
          <input
            type="number"
            min="10"
            max="100"
            value={formData.database?.max_connections || ''}
            onChange={(e) => onChange('database', 'max_connections', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeout de conexión (segundos)
          </label>
          <input
            type="number"
            min="5"
            max="60"
            value={formData.database?.connection_timeout || ''}
            onChange={(e) => onChange('database', 'connection_timeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia de backup automático
          </label>
          <select
            value={formData.database?.auto_backup_frequency || ''}
            onChange={(e) => onChange('database', 'auto_backup_frequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Deshabilitado</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Retener backups (días)
          </label>
          <input
            type="number"
            min="7"
            max="365"
            value={formData.database?.backup_retention_days || ''}
            onChange={(e) => onChange('database', 'backup_retention_days', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="30"
          />
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.database?.enable_query_logging || false}
            onChange={(e) => onChange('database', 'enable_query_logging', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Habilitar logging de consultas</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.database?.enable_ssl || false}
            onChange={(e) => onChange('database', 'enable_ssl', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Habilitar conexión SSL</span>
        </label>
      </div>
    </div>
  </div>
);

// Otros componentes de configuración (simplificados)
const AppearanceConfig = ({ formData, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Apariencia</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
        <select
          value={formData.appearance?.theme || ''}
          onChange={(e) => onChange('appearance', 'theme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
          <option value="auto">Automático</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color primario</label>
        <input
          type="color"
          value={formData.appearance?.primary_color || '#8B5CF6'}
          onChange={(e) => onChange('appearance', 'primary_color', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
    </div>
  </div>
);

const LocalizationConfig = ({ formData, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Localización</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
        <select
          value={formData.localization?.language || ''}
          onChange={(e) => onChange('localization', 'language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
        <select
          value={formData.localization?.currency || ''}
          onChange={(e) => onChange('localization', 'currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="ARS">Peso Argentino (ARS)</option>
          <option value="USD">Dólar Americano (USD)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="CLP">Peso Chileno (CLP)</option>
        </select>
      </div>
    </div>
  </div>
);

const BackupConfig = ({ onBackup }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Backup y Restauración</h3>
    <div className="space-y-4">
      <button
        onClick={onBackup}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
      >
        <Download className="w-4 h-4 mr-2" />
        Crear Backup Completo
      </button>
      <p className="text-sm text-gray-600">
        Crea un backup completo de la configuración del sistema
      </p>
    </div>
  </div>
);

// Modal de confirmación de backup
const BackupModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Crear Backup</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">
            ¿Deseas crear un backup completo de la configuración del sistema? 
            Este proceso puede tomar unos minutos.
          </p>
        </div>
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear Backup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
