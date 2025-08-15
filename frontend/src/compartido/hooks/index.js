// Índice de Hooks Compartidos (unificado)

export * from './useAutenticacion.js';
export { default as useNotificaciones } from './useNotificaciones.js';
export * from './usePiezas.js';
export * from './useZonas.js';
// Reexportes selectivos desde useMateriales (evitar conflicto con usePieceMaterialFormula)
export {
	useMaterials,
	useMaterial,
	useMaterialsStats,
	useMaterialPriceHistory,
	useMaterialStockByPlant,
	useCreateMaterial,
	useUpdateMaterial,
	useDeleteMaterial,
	useUpdateMaterialStock,
	useUpdateMaterialPrice,
	useImportMaterials,
	useExportMaterials,
	useMaterialsForPiece,
	useUpdatePieceMaterialFormula
} from './useMateriales.js';
export {
	useCustomers,
	useCustomer,
	useCreateCustomer,
	useUpdateCustomer,
	useDeleteCustomer,
	useSearchCustomers,
	useCustomersStats
} from './useClientes.js';
export {
	useProjects,
	useProject,
	useCreateProject,
	useUpdateProject,
	useDeleteProject,
	useProjectsStats
} from './useProyectos.js';
export {
	useDashboard,
	useDashboardStats,
	useDashboardHasData
} from './useTablero.js';
export { default as useAdminHook } from './useAdminHook.js';
export * from './useCotizaciones.js';
export * from './useFormulaMaterialPieza.js';
export { default as useWizardPresupuestacion } from './useWizardPresupuestacion.js';
export { default as usePlantasHook } from './usePlantasHook.js';
export { default as useCalculistasHook } from './useCalculistasHook.js';
export { default as useDesignersHook } from './useDesignersHook.js';
export { default as useBuscarPieza } from './useBuscarPieza.js';
export { default as useConfigSistema } from './useConfigSistema.js';
