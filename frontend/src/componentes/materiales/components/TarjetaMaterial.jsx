/**
 * Componente de tarjeta para mostrar información de material
 * 
 * Muestra información resumida de un material con:
 * - Información básica (nombre, código, categoría)
 * - Estados de stock y precios
 * - Acciones rápidas (ver, editar, eliminar)
 * - Indicadores visuales de estado
 */

import React from 'react';
import { 
  Package, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Factory,
  Archive
} from 'lucide-react';

const MaterialCard = ({ 
  material, 
  onView, 
  onEdit, 
  onDelete, 
  onManageStock, 
  onViewPriceHistory 
}) => {
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

  const getPriceStatusColor = (status) => {
    switch (status) {
      case 'updated': return 'text-green-600';
      case 'outdated': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const StockIcon = getStockStatusIcon(material.stockStatus);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getStockStatusColor(material.stockStatus)}`}>
            <StockIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {material.name}
            </h3>
            <p className="text-sm text-gray-500">
              {material.code}
            </p>
          </div>
        </div>
        
        {/* Menú de acciones */}
        <div className="relative group">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[15]">
            <div className="py-1">
              <button
                onClick={() => onView(material)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Ver detalles
              </button>
              <button
                onClick={() => onEdit(material)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => onManageStock(material)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Package className="h-4 w-4" />
                Gestionar stock
              </button>
              <button
                onClick={() => onViewPriceHistory(material)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <DollarSign className="h-4 w-4" />
                Historial precios
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => onDelete(material)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Categoría:</span>
          <span className="text-sm font-medium text-gray-900">
            {material.category || 'Sin categoría'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Unidad:</span>
          <span className="text-sm font-medium text-gray-900">
            {material.unit || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Proveedor:</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {material.defaultSupplier || 'Sin proveedor'}
          </span>
        </div>
      </div>

      {/* Estados y métricas */}
      <div className="space-y-2 mb-4">
        {/* Stock status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado stock:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStockStatusColor(material.stockStatus)}`}>
            {material.stockStatus === 'available' && 'Disponible'}
            {material.stockStatus === 'low' && 'Stock bajo'}
            {material.stockStatus === 'out' && 'Sin stock'}
            {!material.stockStatus && 'Sin definir'}
          </span>
        </div>

        {/* Price status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Precios:</span>
          <div className="flex items-center gap-1">
            <Clock className={`h-3 w-3 ${getPriceStatusColor(material.priceStatus)}`} />
            <span className={`text-xs font-medium ${getPriceStatusColor(material.priceStatus)}`}>
              {material.priceStatus === 'updated' && 'Actualizados'}
              {material.priceStatus === 'outdated' && 'Desactualizados'}
              {!material.priceStatus && 'Sin definir'}
            </span>
          </div>
        </div>

        {/* Plantas disponibles */}
        {material.availablePlants && material.availablePlants.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plantas:</span>
            <div className="flex items-center gap-1">
              <Factory className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-900">
                {material.availablePlants.length} planta{material.availablePlants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Precio promedio si está disponible */}
      {material.averagePrice && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Precio promedio:</span>
            <span className="text-lg font-bold text-blue-600">
              ${material.averagePrice.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Por {material.unit || 'unidad'}
          </p>
        </div>
      )}

      {/* Última actualización */}
      {material.updatedAt && (
        <div className="pt-2 border-t border-gray-100 mt-3">
          <p className="text-xs text-gray-500">
            Actualizado: {new Date(material.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default MaterialCard;
