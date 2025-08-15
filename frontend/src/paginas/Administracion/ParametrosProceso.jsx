import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Copy, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useZones } from '@compartido/hooks/useZonesHook';

const ProcessParams = () => {
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [params, setParams] = useState({
    energia_curado_tn: 0,
    gg_fabrica_tn: 0,
    gg_empresa_tn: 0,
    utilidad_tn: 0,
    ingenieria_tn: 0,
    precio_hora: 0,
    horas_por_tn_acero: 0,
    horas_por_m3_hormigon: 0
  });
  const [prevParams, setPrevParams] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { data: zonesData } = useZones();
  const zones = zonesData?.zones || [];

  // Cargar parámetros cuando cambia zona o mes
  useEffect(() => {
    if (selectedZone && selectedMonth) {
      loadParameters();
    }
  }, [selectedZone, selectedMonth]);

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/process-parameters?zone_id=${selectedZone}&month_date=${selectedMonth}-01`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setParams({
          energia_curado_tn: data.data.energia_curado_tn || 0,
          gg_fabrica_tn: data.data.gg_fabrica_tn || 0,
          gg_empresa_tn: data.data.gg_empresa_tn || 0,
          utilidad_tn: data.data.utilidad_tn || 0,
          ingenieria_tn: data.data.ingenieria_tn || 0,
          precio_hora: data.data.precio_hora || 0,
          horas_por_tn_acero: data.data.horas_por_tn_acero || 0,
          horas_por_m3_hormigon: data.data.horas_por_m3_hormigon || 0
        });
        
        if (data.fallback) {
          setMessage({ 
            type: 'warning', 
            text: 'No hay parámetros para este mes. Mostrando mes anterior.' 
          });
        }
      } else {
        // Limpiar formulario si no hay datos
        setParams({
          energia_curado_tn: 0,
          gg_fabrica_tn: 0,
          gg_empresa_tn: 0,
          utilidad_tn: 0,
          ingenieria_tn: 0,
          precio_hora: 0,
          horas_por_tn_acero: 0,
          horas_por_m3_hormigon: 0
        });
      }

      // Cargar parámetros del mes anterior para comparación
      const prevMonth = new Date(selectedMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().slice(0, 7);
      
      const prevResponse = await fetch(`/api/process-parameters?zone_id=${selectedZone}&month_date=${prevMonthStr}-01`);
      const prevData = await prevResponse.json();
      
      if (prevData.success && prevData.data) {
        setPrevParams(prevData.data);
      } else {
        setPrevParams(null);
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
      setMessage({ type: 'error', text: 'Error al cargar parámetros' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedZone || !selectedMonth) {
      setMessage({ type: 'error', text: 'Seleccione zona y mes' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/process-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: selectedZone,
          month_date: `${selectedMonth}-01`,
          ...params
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Parámetros guardados exitosamente' });
        loadParameters(); // Recargar para actualizar comparación
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving parameters:', error);
      setMessage({ type: 'error', text: 'Error al guardar parámetros' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyFromPreviousMonth = async () => {
    if (!selectedZone || !selectedMonth) {
      setMessage({ type: 'error', text: 'Seleccione zona y mes' });
      return;
    }

    if (!prevParams) {
      setMessage({ type: 'error', text: 'No hay parámetros del mes anterior para copiar' });
      return;
    }

    setParams({
      energia_curado_tn: prevParams.energia_curado_tn || 0,
      gg_fabrica_tn: prevParams.gg_fabrica_tn || 0,
      gg_empresa_tn: prevParams.gg_empresa_tn || 0,
      utilidad_tn: prevParams.utilidad_tn || 0,
      ingenieria_tn: prevParams.ingenieria_tn || 0,
      precio_hora: prevParams.precio_hora || 0,
      horas_por_tn_acero: prevParams.horas_por_tn_acero || 0,
      horas_por_m3_hormigon: prevParams.horas_por_m3_hormigon || 0
    });

    setMessage({ type: 'info', text: 'Parámetros copiados del mes anterior' });
  };

  const handleInputChange = (field, value) => {
    setParams(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateDelta = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous * 100).toFixed(2);
  };

  const getDeltaColor = (delta) => {
    if (!delta) return 'text-gray-500';
    return parseFloat(delta) > 0 ? 'text-red-500' : 'text-green-500';
  };

  const getDeltaIcon = (delta) => {
    if (!delta) return null;
    return parseFloat(delta) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const parameterFields = [
    { key: 'energia_curado_tn', label: 'Energía Curado ($/tn)', unit: '$' },
    { key: 'gg_fabrica_tn', label: 'GG Fábrica ($/tn)', unit: '$' },
    { key: 'gg_empresa_tn', label: 'GG Empresa ($/tn)', unit: '$' },
    { key: 'utilidad_tn', label: 'Utilidad ($/tn)', unit: '$' },
    { key: 'ingenieria_tn', label: 'Ingeniería ($/tn)', unit: '$' },
    { key: 'precio_hora', label: 'Precio Hora', unit: '$/h' },
    { key: 'horas_por_tn_acero', label: 'Horas por Tn Acero', unit: 'h/tn' },
    { key: 'horas_por_m3_hormigon', label: 'Horas por m³ Hormigón', unit: 'h/m³' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Parámetros de Proceso</h2>
        </div>
        <div className="flex items-center gap-2">
          {showComparison && prevParams && (
            <span className="text-sm text-gray-500">
              Comparando con {new Date(new Date(selectedMonth).setMonth(new Date(selectedMonth).getMonth() - 1)).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </span>
          )}
          <button
            onClick={() => setShowComparison(!showComparison)}
            disabled={!prevParams}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {showComparison ? 'Ocultar' : 'Mostrar'} Comparación
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Zona
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar zona</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Mes
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={copyFromPreviousMonth}
              disabled={!prevParams || isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Mes Anterior
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> :
           message.type === 'error' ? <X className="h-4 w-4" /> :
           <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Parameters Grid */}
      {selectedZone && selectedMonth && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Parámetros del Mes</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Cargando parámetros...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parameterFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={params[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {field.unit}
                      </span>
                    </div>
                    
                    {showComparison && prevParams && (
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="text-sm text-gray-500">
                          {prevParams[field.key]?.toFixed(2)}
                        </span>
                        {calculateDelta(params[field.key], prevParams[field.key]) && (
                          <span className={`flex items-center gap-1 text-sm font-medium ${getDeltaColor(calculateDelta(params[field.key], prevParams[field.key]))}`}>
                            {getDeltaIcon(calculateDelta(params[field.key], prevParams[field.key]))}
                            {calculateDelta(params[field.key], prevParams[field.key])}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {!isLoading && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Costo Total por Tn</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(params.energia_curado_tn + params.gg_fabrica_tn + params.gg_empresa_tn + params.utilidad_tn + params.ingenieria_tn).toFixed(2)}
                  </p>
                  {showComparison && prevParams && (
                    <p className={`text-sm ${getDeltaColor(calculateDelta(
                      params.energia_curado_tn + params.gg_fabrica_tn + params.gg_empresa_tn + params.utilidad_tn + params.ingenieria_tn,
                      (prevParams.energia_curado_tn || 0) + (prevParams.gg_fabrica_tn || 0) + (prevParams.gg_empresa_tn || 0) + (prevParams.utilidad_tn || 0) + (prevParams.ingenieria_tn || 0)
                    ))}`}>
                      {calculateDelta(
                        params.energia_curado_tn + params.gg_fabrica_tn + params.gg_empresa_tn + params.utilidad_tn + params.ingenieria_tn,
                        (prevParams.energia_curado_tn || 0) + (prevParams.gg_fabrica_tn || 0) + (prevParams.gg_empresa_tn || 0) + (prevParams.utilidad_tn || 0) + (prevParams.ingenieria_tn || 0)
                      )}% vs mes anterior
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Precio Hora</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${params.precio_hora.toFixed(2)}
                  </p>
                  {showComparison && prevParams && prevParams.precio_hora && (
                    <p className={`text-sm ${getDeltaColor(calculateDelta(params.precio_hora, prevParams.precio_hora))}`}>
                      {calculateDelta(params.precio_hora, prevParams.precio_hora)}% vs mes anterior
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Horas/Tn Acero</p>
                  <p className="text-xl font-bold text-gray-900">
                    {params.horas_por_tn_acero.toFixed(2)}h
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Horas/m³ Hormigón</p>
                  <p className="text-xl font-bold text-gray-900">
                    {params.horas_por_m3_hormigon.toFixed(2)}h
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={loadParameters}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !selectedZone || !selectedMonth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Parámetros'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessParams;

