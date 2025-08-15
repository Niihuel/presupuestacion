// Exportaciones de Servicios (unificado en español)
export { default as api } from './api.js';

// Servicios principales (español)
export { default as authService } from './servicioAuth.js';
export { default as dashboardService } from './servicioTablero.js';
export { default as customerService } from './servicioCliente.js';
export { default as quotationService } from './servicioCotizacion.js';
export { default as projectService } from './servicioProyecto.js';
export { default as pieceService } from './servicioPieza.js';
export { default as zoneService } from './servicioZona.js';
export { default as systemConfigService } from './servicioConfigSistema.js';
export { default as materialService } from './servicioMaterial.js';

// Utils (TypeScript modules)
export * from '../utilidades/calculoPresupuesto.ts'
export * from '../utilidades/precioBasePorUM.ts'
export * from '../utilidades/empaque.ts'
