/**
 * Tarjeta de pieza
 * 
 * Componente para mostrar información de una pieza individual
 * con diseño moderno, precios por zona y acciones rápidas.
 */

import { 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  DollarSign, 
  MapPin,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const PieceCard = ({ 
  piece, 
  viewMode = 'grid', 
  onEdit, 
  onDelete, 
  onView
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO');
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { color: 'red', text: 'Sin stock', icon: AlertCircle };
    if (stock <= 10) return { color: 'orange', text: 'Stock bajo', icon: AlertCircle };
    return { color: 'green', text: 'En stock', icon: CheckCircle };
  };

  const stockStatus = getStockStatus(piece.stock || 0);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Icono/Imagen */}
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {piece.name}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  #{piece.code || piece.id}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate mb-2">
                {piece.description || 'Sin descripción'}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {piece.PiecePrices && piece.PiecePrices.length > 0
                      ? formatCurrency(piece.PiecePrices[0].price)
                      : 'Sin precio'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <stockStatus.icon className={`h-4 w-4 text-${stockStatus.color}-500`} />
                  <span className={`text-${stockStatus.color}-600`}>
                    {piece.stock || 0} unidades
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(piece.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2">
            {onView && (
              <button
                onClick={() => onView(piece)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(piece)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(piece)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista en grid (cards)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Package className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <button
              onClick={() => onView(piece)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(piece)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(piece)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-3">
        {/* Título y código */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {piece.name}
          </h3>
          <div className="flex items-center space-x-2">
            <Hash className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-500">{piece.code || piece.id}</span>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {piece.description || 'Sin descripción disponible'}
        </p>

        {/* Precio principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-lg font-bold text-gray-900">
              {piece.PiecePrices && piece.PiecePrices.length > 0
                ? formatCurrency(piece.PiecePrices[0].price)
                : 'Sin precio'
              }
            </span>
          </div>
          
          {/* Estado del stock */}
          <div className={`flex items-center space-x-1 text-${stockStatus.color}-600`}>
            <stockStatus.icon className={`h-4 w-4 text-${stockStatus.color}-500`} />
            <span className="text-sm font-medium">
              {piece.stock || 0}
            </span>
          </div>
        </div>

        {/* Precios por zona (si existen múltiples) */}
        {piece.PiecePrices && piece.PiecePrices.length > 1 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-1 mb-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Precios por zona
              </span>
            </div>
            <div className="space-y-1">
              {piece.PiecePrices.slice(0, 3).map((priceEntry, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {priceEntry.Zone?.name || `Zona ${priceEntry.zoneId}`}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(priceEntry.price)}
                  </span>
                </div>
              ))}
              {piece.PiecePrices.length > 3 && (
                <div className="text-xs text-blue-600 font-medium">
                  +{piece.PiecePrices.length - 3} más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Actualizado</span>
          <span>{formatDate(piece.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default PieceCard;
