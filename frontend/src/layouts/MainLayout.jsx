/**
 * Layout Principal de la Aplicación (Sin Sidebar)
 * 
 * Estructura base para todas las páginas protegidas de la aplicación.
 * Incluye:
 * - Header superior con navegación y información del usuario
 * - Área de contenido principal responsive
 * - Outlet para renderizar componentes hijos según la ruta actual
 * 
 * Este layout solo se muestra para usuarios autenticados.
 */

import { Outlet } from 'react-router-dom';
import { EncabezadoNavegacion } from '@compartido/componentes';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-pretensa-gradient">
      {/* Header de navegación superior */}
      <EncabezadoNavegacion />
      
      {/* Área de contenido principal */}
      <main className="pt-16"> {/* pt-16 para compensar el header fijo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Outlet para renderizar componentes de rutas hijas */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;