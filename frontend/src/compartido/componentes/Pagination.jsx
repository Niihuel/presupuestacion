/**
 * Componente de paginación
 * 
 * Paginación moderna con navegación rápida y responsive
 */

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Paginacion = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Ajustar si estamos al final
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const PageButton = ({ page, isCurrent = false, disabled = false, children }) => (
    <button
      onClick={() => !disabled && !isCurrent && onPageChange(page)}
      disabled={disabled || isCurrent}
      className={`
        relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
        ${isCurrent 
          ? 'bg-blue-600 text-white' 
          : disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      {children || page}
    </button>
  );

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
      {/* Info */}
      <div className="flex-1 flex justify-between sm:hidden">
        <PageButton 
          page={currentPage - 1} 
          disabled={currentPage === 1}
        >
          Anterior
        </PageButton>
        <PageButton 
          page={currentPage + 1} 
          disabled={currentPage === totalPages}
        >
          Siguiente
        </PageButton>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {/* Previous */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* First page */}
            {showFirstLast && visiblePages[0] !== 1 && (
              <>
                <PageButton page={1} isCurrent={currentPage === 1} />
                {showStartEllipsis && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                )}
              </>
            )}

            {/* Visible pages */}
            {visiblePages.map((page) => (
              <PageButton 
                key={page} 
                page={page} 
                isCurrent={currentPage === page} 
              />
            ))}

            {/* Last page */}
            {showFirstLast && visiblePages[visiblePages.length - 1] !== totalPages && (
              <>
                {showEndEllipsis && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                )}
                <PageButton page={totalPages} isCurrent={currentPage === totalPages} />
              </>
            )}

            {/* Next */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Paginacion;
