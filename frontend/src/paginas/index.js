/**
 * Índice centralizado de todas las páginas
 * 
 * Nueva estructura organizacional por páginas
 */

// Páginas principales
export { default as Piezas } from './Piezas/Piezas.jsx';
export { default as Materiales } from './Materiales.jsx';
export { default as Calculistas } from './Calculistas/Calculistas.jsx';
export { default as Presupuestos } from './Presupuestos/Presupuestos.jsx';
export { default as PresupuestacionWizard } from './Presupuestos/PresupuestacionWizard.jsx';
export { default as KanbanPresupuestos } from './Kanban/KanbanPresupuestos.jsx';
export { default as Zonas } from './Zonas/Zonas.jsx';
export { default as Proyectos } from './Proyectos/Proyectos.jsx';
export { default as Dashboard } from './Dashboard/Dashboard.jsx';
export { default as Clientes } from '@componentes/customers/Clientes.jsx';

// Páginas de autenticación
export { default as Login } from './Auth/Login.jsx';
export { default as Register } from './Auth/Register.jsx';
export { default as ForgotPassword } from './Auth/ForgotPassword.jsx';
export { default as ResetPassword } from './Auth/ResetPassword.jsx';
export { default as OAuthCallback } from './Auth/OAuthCallback.jsx';
export { default as ChangePassword } from './Auth/ChangePassword.jsx';
export { default as UserApproval } from './Auth/UserApproval.jsx';

// Páginas de administración
export { default as AdminPanel } from './Admin/AdminPanel.jsx';

// Otras páginas
export { default as Configuracion } from './Admin/Configuracion.jsx';
