/**
 * Componente principal de la aplicación
 * 
 * Define las rutas principales y la estructura de la aplicación
 * 
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { PrivateRoute } from '@compartido/componentes';
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword, 
  OAuthCallback, 
  ChangePassword, 
  UserApproval,
  Dashboard,
  Presupuestos,
  PresupuestacionWizard,
  KanbanPresupuestos,
  AdminPanel,
  Configuracion,
  Zonas,
  Calculistas,
  Proyectos,
  Piezas,
  Materiales,
  Clientes
} from '@paginas';

function App() {
  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/admin/approve-user" element={<UserApproval />} />
        
        {/* Ruta de cambiar contraseña (protegida pero fuera del layout principal) */}
        <Route element={<PrivateRoute />}>
          <Route path="/auth/change-password" element={<ChangePassword />} />
        </Route>
        
        {/* Rutas protegidas con layout principal */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="presupuestos" element={<Presupuestos />} />
            <Route path="presupuestos/wizard" element={<PresupuestacionWizard />} />
            <Route path="presupuestos/wizard/:id" element={<PresupuestacionWizard />} />
            <Route path="presupuestos/kanban" element={<KanbanPresupuestos />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="piezas" element={<Piezas />} />
            <Route path="materiales" element={<Materiales />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="zonas" element={<Zonas />} />
            <Route path="calculistas" element={<Calculistas />} />
            <Route path="admin" element={<AdminPanel />} />
            {/* TODO: Agregar más rutas para Configuración */}
          </Route>
        </Route>
        
        {/* Ruta catch-all para manejar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
