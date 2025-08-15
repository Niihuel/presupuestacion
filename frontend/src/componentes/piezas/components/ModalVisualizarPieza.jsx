/**
 * Modal para visualizar detalles de una pieza
 * 
 * Modal de solo lectura que muestra toda la información
 * de una pieza siguiendo los estilos corporativos
 * 
 * @author Sistema de Presupuestación
 * @version 1.0.0 - Corporate Design Implementation
 */

import { useState } from 'react';
import { 
  X, 
  Package, 
  DollarSign, 
  MapPin, 
  Ruler,
  Weight,
  Hash,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';

import { usePiecePrices } from '@compartido/hooks';

const PieceViewModal = ({ isOpen, onClose, piece = null, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');

  // Obtener precios de la pieza
  const { data: prices = [] } = usePiecePrices(piece?.id);

  // Tabs del modal
  const viewTabs = [
    { id: 'details', label: 'Detalles', icon: Package },
    { id: 'dimensions', label: 'Dimensiones', icon: Ruler },
    { id: 'technical', label: 'Técnico', icon: FileText },
    { id: 'pricing', label: 'Precios', icon: DollarSign }
  ];

  // Unidades
  const getUnitSymbol = (unitId) => {
    const units = {
      1: 'un',
      2: 'm',
      3: 'm²',
      4: 'm³',
      5: 'kg',
      6: 't'
    };
    return units[unitId] || 'un';
  };

  // Familias
  const getFamilyName = (familyId) => {
    const families = {
      1: 'Vigas',
      2: 'Columnas',
      3: 'Losas',
      4: 'Placas',
      5: 'Escalones',
      6: 'Muros'
    };
    return families[familyId] || 'Sin definir';
  };

  // Formatear precio
  const formatPrice = (price) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  // No renderizar si no está abierto o no hay pieza
  if (!isOpen || !piece) return null;

  // Componente de campo de información
  const InfoField = ({ label, value, icon: Icon }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {label}
      </label>
      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
        {value || 'No especificado'}
      </p>
    </div>
  );

  // Componente de campo booleano
  const BooleanField = ({ label, value }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center">
        {value ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )}
        <span className={`ml-2 text-sm ${value ? 'text-green-600' : 'text-gray-500'}`}>
          {value ? 'Sí' : 'No'}
        </span>
      </div>
    </div>
  );

  // Renderizar contenido del tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Código" value={piece.code} icon={Hash} />
            <InfoField label="Nombre" value={piece.name} icon={Package} />
            <InfoField label="Familia" value={getFamilyName(piece.family_id)} />
            <InfoField label="Unidad" value={getUnitSymbol(piece.unit_id)} />
            <div className="md:col-span-2">
              <InfoField label="Descripción" value={piece.description} icon={FileText} />
            </div>
          </div>
        );

      case 'dimensions':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoField 
              label="Largo" 
              value={piece.length ? `${piece.length} m` : null} 
              icon={Ruler} 
            />
            <InfoField 
              label="Ancho" 
              value={piece.width ? `${piece.width} m` : null} 
              icon={Ruler} 
            />
            <InfoField 
              label="Alto" 
              value={piece.height ? `${piece.height} m` : null} 
              icon={Ruler} 
            />
            <InfoField 
              label="Espesor" 
              value={piece.thickness ? `${piece.thickness} cm` : null} 
            />
            <InfoField 
              label="Diámetro" 
              value={piece.diameter ? `${piece.diameter} cm` : null} 
            />
            <InfoField 
              label="Peso" 
              value={piece.weight ? `${piece.weight} kg` : null} 
              icon={Weight} 
            />
            <InfoField 
              label="Volumen" 
              value={piece.volume ? `${piece.volume} m³` : null} 
            />
            <InfoField 
              label="Unidades por Camión" 
              value={piece.units_per_truck || null} 
            />
            <InfoField 
              label="Sección" 
              value={piece.section} 
            />
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Zona Sísmica" value={piece.seismic_zone} />
              <InfoField label="Código de Hormigón" value={piece.concrete_code} />
              <InfoField 
                label="Presión de Viento" 
                value={piece.wind_pressure ? `${piece.wind_pressure} kN/m²` : null} 
              />
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <InfoField 
                  label="Longitud Desde" 
                  value={piece.length_from ? `${piece.length_from} m` : null} 
                />
                <InfoField 
                  label="Longitud Hasta" 
                  value={piece.length_to && piece.length_to !== 999999 ? `${piece.length_to} m` : 'Sin límite'} 
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Características</h4>
              <div className="space-y-3">
                <BooleanField
                  label="Es Pretensado"
                  value={piece.is_prestressed}
                />
                <BooleanField
                  label="Es Cerramiento"
                  value={piece.is_enclosure}
                />
                <BooleanField
                  label="Es Superficie de Techo"
                  value={piece.is_roof_surface}
                />
                <BooleanField
                  label="Es Superficie de Piso"
                  value={piece.is_floor_surface}
                />
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            {prices.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Precios por Zona</h4>
                <div className="grid grid-cols-1 gap-4">
                  {prices.map((price, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Zona</label>
                          <p className="text-gray-900 font-semibold">
                            {price.zone?.name || 'Zona General'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Precio Base</label>
                          <p className="text-gray-900 font-semibold">
                            {formatPrice(price.base_price)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Precio Final</label>
                          <p className="text-green-600 font-semibold">
                            {formatPrice(price.final_price)}
                          </p>
                        </div>
                      </div>
                      {price.adjustment_percentage && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <span className="text-sm text-gray-600">
                            Ajuste: {price.adjustment_percentage > 0 ? '+' : ''}
                            {price.adjustment_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Sin Precios Configurados</h4>
                <p className="text-gray-600">
                  Esta pieza no tiene precios configurados por zona
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{piece.name}</h2>
              <p className="text-gray-600">
                {piece.code ? `Código: ${piece.code}` : 'Detalles de la pieza'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(piece)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar pieza"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(piece)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar pieza"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navegación de Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {viewTabs.map((tab) => {
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

        {/* Contenido del Modal */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PieceViewModal;
