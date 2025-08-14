/**
 * Modal para ver detalles de un material
 * 
 * Muestra información completa del material de solo lectura:
 * - Información básica
 * - Proveedores
 * - Stock y precios por planta
 * - Historial reciente
 */

import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Package, 
  Factory,
  DollarSign,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Archive
} from 'lucide-react';

const MaterialViewModal = ({ material, onClose, onEdit, onDelete }) => {
  const getStockStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'out': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'low': return AlertTriangle;
      case 'out': return Archive;
      default: return Package;
    }
  };

  const StockIcon = getStockStatusIcon(material.stockStatus);

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStockStatusColor(material.stockStatus)}`}>
              <StockIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{material.name}</h2>
              <p className="text-sm text-gray-600">Código: {material.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
          {/* Información básica */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Categoría</label>
                <p className="text-gray-900 font-medium">{material.category || 'Sin categoría'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Unidad</label>
                <p className="text-gray-900 font-medium">{material.unit || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Stock Mínimo</label>
                <p className="text-gray-900 font-medium">{material.minStock || 0} {material.unit}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Estado de Stock</label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStockStatusColor(material.stockStatus)}`}>
                    {material.stockStatus === 'available' && 'Disponible'}
                    {material.stockStatus === 'low' && 'Stock bajo'}
                    {material.stockStatus === 'out' && 'Sin stock'}
                    {!material.stockStatus && 'Sin definir'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Creado</label>
                <p className="text-gray-900 font-medium">
                  {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Última actualización</label>
                <p className="text-gray-900 font-medium">
                  {material.updatedAt ? new Date(material.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {material.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Descripción</label>
                <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {material.description}
                </p>
              </div>
            )}
          </div>

          {/* Proveedores */}
          {material.suppliers && material.suppliers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proveedores</h3>
              
              <div className="space-y-3">
                {material.suppliers.map((supplier, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                          {supplier.contactInfo && (
                            <p className="text-sm text-gray-600">{supplier.contactInfo}</p>
                          )}
                        </div>
                      </div>
                      
                      {supplier.isDefault && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock y precios por planta */}
          {(material.plantStocks || material.plantPrices) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stock y Precios por Planta</h3>
              
              <div className="space-y-4">
                {material.availablePlants?.map(plant => (
                  <div key={plant.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Factory className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{plant.name}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Stock Actual</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {material.plantStocks?.[plant.id] || 0} {material.unit}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Precio</label>
                        <p className="text-lg font-semibold text-green-600">
                          ${material.plantPrices?.[plant.id]?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Última actualización</label>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {plant.lastUpdated ? new Date(plant.lastUpdated).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Factory className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p>No hay información de plantas disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas adicionales */}
          {material.stats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Precio Promedio</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    ${material.stats.averagePrice?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Stock Total</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {material.stats.totalStock || 0} {material.unit}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Factory className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Plantas</span>
                  </div>
                  <p className="text-xl font-bold text-purple-600">
                    {material.stats.plantsCount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialViewModal;
