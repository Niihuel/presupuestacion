// Services Exports
export { default as api } from './api.js';
export { default as authService } from './servicioAuth.js';
export { default as dashboardService } from './servicioTablero.js';

// New API Services (mapeo a archivos en español)
export { default as customerService } from './servicioCliente.js';
export { default as quotationService } from './servicioCotizacion.js';
export { default as projectService } from './servicioProyecto.js';
export { default as pieceService } from './servicioPieza.js';
export { default as zoneService } from './servicioZona.js';
export { default as systemConfigService } from './servicioConfigSistema.js';
export { default as materialService } from './servicioMaterial.js';

// Utils (re-export desde utilidades)
export * from '../utilidades/calculoPresupuesto';
export * from '../utilidades/precioBasePorUM';
export * from '../utilidades/empaque';
