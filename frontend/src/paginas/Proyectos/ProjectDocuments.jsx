/**
 * Gestión de Documentos del Proyecto
 * 
 * Componente para subir, organizar y descargar documentos
 * asociados al proyecto con vista previa y categorización
 */

import { useState, useRef } from 'react';
import { 
  Upload,
  FileText,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Folder,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const DOCUMENT_CATEGORIES = {
  PLANS: { id: 'plans', name: 'Planos', icon: FileText, color: 'bg-blue-500' },
  CONTRACTS: { id: 'contracts', name: 'Contratos', icon: File, color: 'bg-green-500' },
  PERMITS: { id: 'permits', name: 'Permisos', icon: CheckCircle, color: 'bg-orange-500' },
  PHOTOS: { id: 'photos', name: 'Fotografías', icon: Image, color: 'bg-purple-500' },
  REPORTS: { id: 'reports', name: 'Informes', icon: FileText, color: 'bg-red-500' },
  OTHER: { id: 'other', name: 'Otros', icon: Folder, color: 'bg-gray-500' }
};

const ProjectDocuments = ({ 
  project,
  documents = [],
  onUploadDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPreviewDocument,
  isLoading = false,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Agrupar documentos por categoría
  const documentsByCategory = Object.values(DOCUMENT_CATEGORIES).reduce((acc, category) => {
    acc[category.id] = documents.filter(doc => doc.category === category.id);
    return acc;
  }, {});

  // Obtener icono según tipo de archivo
  const getFileIcon = (fileName, mimeType) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return Image;
    }
    if (['pdf'].includes(extension)) {
      return FileText;
    }
    if (['doc', 'docx'].includes(extension)) {
      return FileText;
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return FileText;
    }
    return File;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Componente de tarjeta de documento
  const DocumentCard = ({ document: doc }) => {
    const FileIcon = getFileIcon(doc.name, doc.mime_type);
    const category = DOCUMENT_CATEGORIES[doc.category] || DOCUMENT_CATEGORIES.OTHER;

    if (viewMode === 'list') {
      return (
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
          <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
            <FileIcon className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {category.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(doc.created_at)}
              </span>
              <span>{formatFileSize(doc.size)}</span>
            </div>
            {doc.description && (
              <p className="text-sm text-gray-600 mt-1 truncate">{doc.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onPreviewDocument?.(doc)}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              title="Vista previa"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownloadDocument?.(doc)}
              className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteDocument?.(doc)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
            <FileIcon className="w-6 h-6 text-white" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={() => onPreviewDocument?.(doc)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Vista previa"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownloadDocument?.(doc)}
              className="p-1 text-gray-400 hover:text-green-600 rounded"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteDocument?.(doc)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
          {doc.name}
        </h4>

        {doc.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {doc.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {category.name}
          </span>
          <span>{formatFileSize(doc.size)}</span>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {formatDate(doc.created_at)}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-purple-600" />
              Documentos del Proyecto
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {documents.length} {documents.length === 1 ? 'documento' : 'documentos'} • {
                formatFileSize(documents.reduce((acc, doc) => acc + (doc.size || 0), 0))
              } total
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Subir documento
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">Todas las categorías</option>
              {Object.values(DOCUMENT_CATEGORIES).map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({documentsByCategory[category.id]?.length || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle vista */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm border-l ${
                viewMode === 'list' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm || selectedCategory !== 'all' ? (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron documentos
                </h3>
                <p className="text-gray-500 mb-4">
                  Intenta ajustar los filtros de búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin documentos
                </h3>
                <p className="text-gray-500 mb-4">
                  Sube el primer documento para comenzar a organizar la información del proyecto.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir primer documento
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredDocuments.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>

      {/* Resumen por categorías */}
      {documents.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen por categorías</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.values(DOCUMENT_CATEGORIES).map(category => {
              const count = documentsByCategory[category.id]?.length || 0;
              const CategoryIcon = category.icon;
              
              return (
                <div key={category.id} className="text-center">
                  <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <CategoryIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500">{category.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span>Procesando documentos...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;
