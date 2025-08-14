/**
 * Página Principal de Configuración
 * 
 * Centro de configuración del sistema con:
 * - Configuración general del sistema
 * - Parámetros de presupuestación
 * - Configuración de precios y márgenes
 * - Configuración de zonas y plantas
 * - Configuración de notificaciones
 * - Diseño corporativo unificado
 */

import { useState } from 'react';
import { 
  Settings, 
  Save,
  RotateCcw,
  Calculator,
  DollarSign,
  MapPin,
  Bell,
  Database,
  Shield,
  Mail,
  Palette,
  Globe,
  Clock,
  Percent,
  Building,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// Hooks y servicios
import { useSystemConfig, useUpdateSystemConfig } from '@shared/hooks/useSystemConfigHook';
import { useNotifications } from '../shared/hooks/useNotifications';

const Configuracion = () => {
  // Estados locales
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({});

  // Notificaciones
  const { success, error, warning } = useNotifications();

  // Hooks de datos
  const { 
    data: systemConfig = {}, 
    isLoading: configLoading, 
    error: configError,
    refetch: refetchConfig
  } = useSystemConfig();

  const updateConfigMutation = useUpdateSystemConfig();

  // Tabs de configuración
  const configTabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Configuración general del sistema'
    },
    {
      id: 'presupuestacion',
      label: 'Presupuestación',
      icon: Calculator,
      description: 'Parámetros para cálculo de presupuestos'
    },
    {
      id: 'precios',
      label: 'Precios y Márgenes',
      icon: DollarSign,
      description: 'Configuración de precios base y márgenes'
    },
    {
      id: 'zonas',
      label: 'Zonas y Plantas',
      icon: MapPin,
      description: 'Configuración de zonas de producción'
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Configuración de alertas y notificaciones'
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: Database,
      description: 'Configuración técnica del sistema'
    }
  ];

  // Obtener tab actual
  const currentTab = configTabs.find(tab => tab.id === activeTab);

  // Handlers de formulario
  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      success('Configuración guardada correctamente');
      setHasChanges(false);
      refetchConfig();
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      error('Error al guardar la configuración');
    }
  };

  const handleResetChanges = () => {
    setFormData({});
    setHasChanges(false);
    warning('Cambios descartados');
  };

  // Componente de sección de configuración
  const ConfigSection = ({ title, description, children, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        {Icon && (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  // Componente de campo de entrada
  const InputField = ({ label, value, onChange, type = 'text', placeholder, suffix, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Componente de switch/toggle
  const ToggleSwitch = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // Renderizado de contenido por tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <ConfigSection 
              title="Información de la Empresa" 
              description="Datos básicos de la empresa para presupuestos"
              icon={Building}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nombre de la Empresa"
                  value={formData.general?.company_name || systemConfig.general?.company_name}
                  onChange={(value) => handleInputChange('general', 'company_name', value)}
                  placeholder="Ej: Pretensa S.A."
                />
                <InputField
                  label="CUIT"
                  value={formData.general?.company_cuit || systemConfig.general?.company_cuit}
                  onChange={(value) => handleInputChange('general', 'company_cuit', value)}
                  placeholder="Ej: 30-12345678-9"
                />
                <InputField
                  label="Dirección"
                  value={formData.general?.company_address || systemConfig.general?.company_address}
                  onChange={(value) => handleInputChange('general', 'company_address', value)}
                  placeholder="Dirección de la empresa"
                />
                <InputField
                  label="Teléfono"
                  value={formData.general?.company_phone || systemConfig.general?.company_phone}
                  onChange={(value) => handleInputChange('general', 'company_phone', value)}
                  placeholder="Ej: +54 11 4444-5555"
                />
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Configuración Regional" 
              description="Configuración de moneda, idioma y zona horaria"
              icon={Globe}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    value={formData.general?.currency || systemConfig.general?.currency || 'ARS'}
                    onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={formData.general?.language || systemConfig.general?.language || 'es'}
                    onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={formData.general?.timezone || systemConfig.general?.timezone || 'America/Argentina/Buenos_Aires'}
                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                    <option value="America/Sao_Paulo">São Paulo</option>
                    <option value="America/New_York">New York</option>
                    <option value="Europe/Madrid">Madrid</option>
                  </select>
                </div>
              </div>
            </ConfigSection>
          </div>
        );

      case 'presupuestacion':
        return (
          <div>
            <ConfigSection 
              title="Parámetros de Cálculo" 
              description="Configuración para el cálculo automático de presupuestos"
              icon={Calculator}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Margen de Ganancia Base"
                  type="number"
                  suffix="%"
                  value={formData.quotation?.base_profit_margin || systemConfig.quotation?.base_profit_margin}
                  onChange={(value) => handleInputChange('quotation', 'base_profit_margin', value)}
                  placeholder="15"
                  min="0"
                  max="100"
                />
                <InputField
                  label="Gastos Generales"
                  type="number"
                  suffix="%"
                  value={formData.quotation?.general_expenses || systemConfig.quotation?.general_expenses}
                  onChange={(value) => handleInputChange('quotation', 'general_expenses', value)}
                  placeholder="10"
                  min="0"
                  max="50"
                />
                <InputField
                  label="IVA"
                  type="number"
                  suffix="%"
                  value={formData.quotation?.tax_rate || systemConfig.quotation?.tax_rate}
                  onChange={(value) => handleInputChange('quotation', 'tax_rate', value)}
                  placeholder="21"
                  min="0"
                  max="30"
                />
                <InputField
                  label="Validez de Presupuesto"
                  type="number"
                  suffix="días"
                  value={formData.quotation?.validity_days || systemConfig.quotation?.validity_days}
                  onChange={(value) => handleInputChange('quotation', 'validity_days', value)}
                  placeholder="30"
                  min="1"
                  max="365"
                />
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Configuración de Montaje" 
              description="Parámetros para cálculo de costos de montaje"
              icon={Building}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Costo por Hora de Montaje"
                  type="number"
                  value={formData.quotation?.mounting_hour_cost || systemConfig.quotation?.mounting_hour_cost}
                  onChange={(value) => handleInputChange('quotation', 'mounting_hour_cost', value)}
                  placeholder="2500"
                  min="0"
                />
                <InputField
                  label="Horas Promedio por m²"
                  type="number"
                  step="0.1"
                  value={formData.quotation?.hours_per_sqm || systemConfig.quotation?.hours_per_sqm}
                  onChange={(value) => handleInputChange('quotation', 'hours_per_sqm', value)}
                  placeholder="0.5"
                  min="0"
                />
              </div>
            </ConfigSection>
          </div>
        );

      case 'precios':
        return (
          <div>
            <ConfigSection 
              title="Ajustes de Precios Automáticos" 
              description="Configuración para ajustes automáticos de precios"
              icon={Percent}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  label="Ajuste Automático por Inflación"
                  value={formData.pricing?.auto_inflation_adjustment || systemConfig.pricing?.auto_inflation_adjustment}
                  onChange={(value) => handleInputChange('pricing', 'auto_inflation_adjustment', value)}
                  description="Ajustar precios automáticamente según índices de inflación"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Porcentaje de Ajuste Mensual"
                    type="number"
                    suffix="%"
                    value={formData.pricing?.monthly_adjustment || systemConfig.pricing?.monthly_adjustment}
                    onChange={(value) => handleInputChange('pricing', 'monthly_adjustment', value)}
                    placeholder="2.5"
                    min="0"
                    max="20"
                  />
                  <InputField
                    label="Fecha del Último Ajuste"
                    type="date"
                    value={formData.pricing?.last_adjustment_date || systemConfig.pricing?.last_adjustment_date}
                    onChange={(value) => handleInputChange('pricing', 'last_adjustment_date', value)}
                  />
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Márgenes por Tipo de Cliente" 
              description="Configurar márgenes específicos según el tipo de cliente"
              icon={DollarSign}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Cliente Mayorista"
                  type="number"
                  suffix="%"
                  value={formData.pricing?.wholesale_margin || systemConfig.pricing?.wholesale_margin}
                  onChange={(value) => handleInputChange('pricing', 'wholesale_margin', value)}
                  placeholder="10"
                  min="0"
                  max="50"
                />
                <InputField
                  label="Cliente Retail"
                  type="number"
                  suffix="%"
                  value={formData.pricing?.retail_margin || systemConfig.pricing?.retail_margin}
                  onChange={(value) => handleInputChange('pricing', 'retail_margin', value)}
                  placeholder="20"
                  min="0"
                  max="50"
                />
                <InputField
                  label="Cliente Premium"
                  type="number"
                  suffix="%"
                  value={formData.pricing?.premium_margin || systemConfig.pricing?.premium_margin}
                  onChange={(value) => handleInputChange('pricing', 'premium_margin', value)}
                  placeholder="25"
                  min="0"
                  max="50"
                />
              </div>
            </ConfigSection>
          </div>
        );

      case 'zonas':
        return (
          <div>
            <ConfigSection 
              title="Configuración de Distancias" 
              description="Parámetros para cálculo de costos por distancia"
              icon={MapPin}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Costo por Kilómetro"
                  type="number"
                  value={formData.zones?.cost_per_km || systemConfig.zones?.cost_per_km}
                  onChange={(value) => handleInputChange('zones', 'cost_per_km', value)}
                  placeholder="50"
                  min="0"
                />
                <InputField
                  label="Distancia Mínima Gratuita"
                  type="number"
                  suffix="km"
                  value={formData.zones?.free_distance_km || systemConfig.zones?.free_distance_km}
                  onChange={(value) => handleInputChange('zones', 'free_distance_km', value)}
                  placeholder="10"
                  min="0"
                />
              </div>
              <ToggleSwitch
                label="Usar Cálculo de Distancia Automático"
                value={formData.zones?.auto_distance_calculation || systemConfig.zones?.auto_distance_calculation}
                onChange={(value) => handleInputChange('zones', 'auto_distance_calculation', value)}
                description="Calcular distancias automáticamente usando coordenadas GPS"
              />
            </ConfigSection>

            <ConfigSection 
              title="Configuración de Zonas de Producción" 
              description="Parámetros específicos para cada zona"
              icon={Building}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  label="Zona Automática por Distancia"
                  value={formData.zones?.auto_zone_assignment || systemConfig.zones?.auto_zone_assignment}
                  onChange={(value) => handleInputChange('zones', 'auto_zone_assignment', value)}
                  description="Asignar automáticamente la zona más cercana al cliente"
                />
                <InputField
                  label="Radio Máximo de Atención"
                  type="number"
                  suffix="km"
                  value={formData.zones?.max_service_radius || systemConfig.zones?.max_service_radius}
                  onChange={(value) => handleInputChange('zones', 'max_service_radius', value)}
                  placeholder="500"
                  min="0"
                />
              </div>
            </ConfigSection>
          </div>
        );

      case 'notificaciones':
        return (
          <div>
            <ConfigSection 
              title="Notificaciones por Email" 
              description="Configurar cuándo y cómo enviar notificaciones"
              icon={Mail}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  label="Notificar Nuevo Presupuesto"
                  value={formData.notifications?.new_quotation || systemConfig.notifications?.new_quotation}
                  onChange={(value) => handleInputChange('notifications', 'new_quotation', value)}
                  description="Enviar notificación cuando se crea un nuevo presupuesto"
                />
                <ToggleSwitch
                  label="Notificar Presupuesto Aprobado"
                  value={formData.notifications?.quotation_approved || systemConfig.notifications?.quotation_approved}
                  onChange={(value) => handleInputChange('notifications', 'quotation_approved', value)}
                  description="Enviar notificación cuando un presupuesto es aprobado"
                />
                <ToggleSwitch
                  label="Recordatorio de Vencimiento"
                  value={formData.notifications?.expiration_reminder || systemConfig.notifications?.expiration_reminder}
                  onChange={(value) => handleInputChange('notifications', 'expiration_reminder', value)}
                  description="Recordar cuando un presupuesto está por vencer"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Días antes del Vencimiento"
                    type="number"
                    value={formData.notifications?.reminder_days || systemConfig.notifications?.reminder_days}
                    onChange={(value) => handleInputChange('notifications', 'reminder_days', value)}
                    placeholder="3"
                    min="1"
                    max="30"
                  />
                  <InputField
                    label="Email del Administrador"
                    type="email"
                    value={formData.notifications?.admin_email || systemConfig.notifications?.admin_email}
                    onChange={(value) => handleInputChange('notifications', 'admin_email', value)}
                    placeholder="admin@empresa.com"
                  />
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Notificaciones del Sistema" 
              description="Alertas importantes del sistema"
              icon={Bell}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  label="Alertas de Seguridad"
                  value={formData.notifications?.security_alerts || systemConfig.notifications?.security_alerts}
                  onChange={(value) => handleInputChange('notifications', 'security_alerts', value)}
                  description="Notificar sobre eventos de seguridad"
                />
                <ToggleSwitch
                  label="Reportes de Sistema"
                  value={formData.notifications?.system_reports || systemConfig.notifications?.system_reports}
                  onChange={(value) => handleInputChange('notifications', 'system_reports', value)}
                  description="Enviar reportes periódicos del sistema"
                />
              </div>
            </ConfigSection>
          </div>
        );

      case 'sistema':
        return (
          <div>
            <ConfigSection 
              title="Configuración de Base de Datos" 
              description="Parámetros técnicos del sistema"
              icon={Database}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  label="Backup Automático"
                  value={formData.system?.auto_backup || systemConfig.system?.auto_backup}
                  onChange={(value) => handleInputChange('system', 'auto_backup', value)}
                  description="Realizar copias de seguridad automáticas"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia de Backup
                    </label>
                    <select
                      value={formData.system?.backup_frequency || systemConfig.system?.backup_frequency || 'daily'}
                      onChange={(e) => handleInputChange('system', 'backup_frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="hourly">Cada hora</option>
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                  <InputField
                    label="Retener Backups"
                    type="number"
                    suffix="días"
                    value={formData.system?.backup_retention_days || systemConfig.system?.backup_retention_days}
                    onChange={(value) => handleInputChange('system', 'backup_retention_days', value)}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Configuración de Seguridad" 
              description="Parámetros de seguridad del sistema"
              icon={Shield}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Tiempo de Sesión"
                    type="number"
                    suffix="minutos"
                    value={formData.system?.session_timeout || systemConfig.system?.session_timeout}
                    onChange={(value) => handleInputChange('system', 'session_timeout', value)}
                    placeholder="60"
                    min="5"
                    max="480"
                  />
                  <InputField
                    label="Intentos de Login"
                    type="number"
                    value={formData.system?.max_login_attempts || systemConfig.system?.max_login_attempts}
                    onChange={(value) => handleInputChange('system', 'max_login_attempts', value)}
                    placeholder="5"
                    min="3"
                    max="10"
                  />
                </div>
                <ToggleSwitch
                  label="Autenticación de Dos Factores"
                  value={formData.system?.two_factor_auth || systemConfig.system?.two_factor_auth}
                  onChange={(value) => handleInputChange('system', 'two_factor_auth', value)}
                  description="Requerir 2FA para usuarios administradores"
                />
              </div>
            </ConfigSection>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sección en Desarrollo
            </h3>
            <p className="text-gray-600">
              Esta sección de configuración estará disponible próximamente.
            </p>
          </div>
        );
    }
  };

  // Estados de carga
  if (configLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="flex space-x-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Principal */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="mt-2 text-gray-600">
              Configura los parámetros del sistema de presupuestación
            </p>
          </div>
          
          {/* Indicador de cambios pendientes */}
          {hasChanges && (
            <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              Cambios pendientes
            </div>
          )}
        </div>
      </div>

      {/* Navegación de Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {configTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Descripción del tab activo */}
        <div className="px-6 py-3 bg-gray-50">
          <p className="text-sm text-gray-600">{currentTab?.description}</p>
        </div>
      </div>

      {/* Contenido del Tab */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Botones de Acción */}
      {hasChanges && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Info className="h-4 w-4 mr-2" />
              Tienes cambios sin guardar en la configuración
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetChanges}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2 inline" />
                Descartar
              </button>
              
              <button
                onClick={handleSaveChanges}
                disabled={updateConfigMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                {updateConfigMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;
