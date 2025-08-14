/**
 * Barrel exports para el módulo de Presupuestación
 * 
 * Exporta todos los componentes, hooks y utilidades del módulo

// Componente principal
export { default as PresupuestacionWizard } from './PresupuestacionWizard';

// Componentes de etapas
export { default as EtapaProyectoCliente } from './components/EtapaProyectoCliente';
export { default as EtapaPiezasCantidades } from './components/EtapaPiezasCantidades';
export { default as EtapaCostosAdicionales } from './components/EtapaCostosAdicionales';
export { default as EtapaCondicionesComerciales } from './components/EtapaCondicionesComerciales';
export { default as EtapaRevisionExportacion } from './components/EtapaRevisionExportacion';
export { default as EtapaSeguimiento } from './components/EtapaSeguimiento';

// Hook personalizado
export { usePresupuestacionWizard } from '@compartido/hooks/usePresupuestacionWizard';
