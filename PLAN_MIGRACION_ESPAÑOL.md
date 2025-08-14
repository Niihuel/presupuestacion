# 📋 Plan de Migración Completa a Español

## 1. FRONTEND - Estructura de Carpetas

### Estructura Actual → Nueva Estructura

```
frontend/src/
├── componentes/           → componentes/
│   ├── pieces/           → piezas/
│   ├── materials/        → materiales/
│   ├── presupuestacion/  → presupuestacion/ (mantener)
│   └── projects/         → proyectos/
│
├── paginas/              → paginas/ (mantener)
│   ├── Admin/            → Administracion/
│   ├── Dashboard/        → Tablero/
│   ├── Materiales/       → Materiales/ (mantener)
│   ├── Piezas/          → Piezas/ (mantener)
│   └── Settings/         → Configuracion/
│
├── compartido/           → compartido/ (mantener)
│   ├── components/       → componentes/
│   ├── hooks/           → hooks/ (mantener)
│   ├── services/        → servicios/
│   └── utils/           → utilidades/
│
└── features/            → funcionalidades/
    ├── materials/       → materiales/
    ├── pieces/          → piezas/
    └── quotations/      → cotizaciones/
```

## 2. COMPONENTES - Renombrado

### Componentes de Piezas
- PieceModalComplete.jsx → ModalPiezaCompleto.jsx
- PieceCard.jsx → TarjetaPieza.jsx
- PiecesList.jsx → ListaPiezas.jsx
- PieceViewModal.jsx → ModalVisualizarPieza.jsx

### Componentes de Materiales
- MaterialCard.jsx → TarjetaMaterial.jsx
- MaterialWhereUsed.jsx → MaterialDondeSeUsa.jsx
- MaterialPriceHistory.jsx → HistorialPreciosMaterial.jsx

### Componentes de Admin
- MaterialsPrices.jsx → PreciosMateriales.jsx
- ProcessParams.jsx → ParametrosProceso.jsx
- BOMEditor.jsx → EditorBOM.jsx
- Politicas.jsx → Politicas.jsx (mantener)
- TruckTypes.jsx → TiposCamiones.jsx
- TransportTariffs.jsx → TarifasTransporte.jsx
- MountingTariffs.jsx → TarifasMontaje.jsx
- PiecePrices.jsx → PreciosPiezas.jsx
- Comparativos.jsx → Comparativos.jsx (mantener)
- ReportsPanel.jsx → PanelReportes.jsx

### Componentes Compartidos
- LoadingSpinner.jsx → CargandoSpinner.jsx
- DeleteConfirmModal.jsx → ModalConfirmarEliminar.jsx
- ErrorBoundary.jsx → LimiteErrores.jsx
- Pagination.jsx → Paginacion.jsx

## 3. BASE DE DATOS - Refactorización

### Tablas Principales

#### ACTUAL → NUEVA

**Tablas Core:**
- pieces → piezas
- materials → materiales
- zones → zonas
- users → usuarios
- projects → proyectos
- quotations → cotizaciones

**Tablas de Relación:**
- piece_prices → precios_piezas
- material_prices → precios_materiales
- piece_material_formulas → formulas_material_pieza
- piece_technical_data → datos_tecnicos_pieza
- process_parameters → parametros_proceso
- quotation_pieces → piezas_cotizacion

**Tablas de Configuración:**
- truck_types → tipos_camiones
- family_packing_rules → reglas_empaque_familia
- transport_tariffs → tarifas_transporte
- mounting_tariffs → tarifas_montaje
- system_policies → politicas_sistema
- piece_families → familias_piezas

### Campos a Renombrar (Principales)

**En tabla piezas:**
- name → nombre
- code → codigo
- description → descripcion
- unit → unidad
- family_id → familia_id
- is_active → activo
- created_at → creado_en
- created_by → creado_por
- updated_at → actualizado_en
- updated_by → actualizado_por

**En tabla materiales:**
- name → nombre
- category → categoria
- unit → unidad
- supplier → proveedor
- min_stock → stock_minimo
- max_stock → stock_maximo

**En tabla precios_piezas:**
- piece_id → pieza_id
- zone_id → zona_id
- price → precio
- effective_date → fecha_efectiva
- published_by → publicado_por
- published_at → publicado_en

### Tablas/Campos a Eliminar

**Tablas no utilizadas:**
- piece_price_history (usar piece_prices con effective_date)
- material_stock (no se usa inventario)
- quotation_approvals (simplificar flujo)
- piece_categories (usar families)

**Campos redundantes:**
- pieces.base_price (usar piece_prices)
- pieces.last_calculated_price (calcular dinámicamente)
- materials.current_price (usar material_prices)
- quotations.total_cached (calcular dinámicamente)

## 4. SERVICIOS Y HOOKS

### Servicios
- piece.service.js → servicioPieza.js
- material.service.js → servicioMaterial.js
- quotation.service.js → servicioCotizacion.js
- zone.service.js → servicioZona.js
- auth.service.js → servicioAuth.js

### Hooks
- usePiecesHook.js → usePiezas.js
- useMaterialsHook.js → useMateriales.js
- useZonesHook.js → useZonas.js
- useNotifications.js → useNotificaciones.js

## 5. UTILIDADES

- calculoPresupuesto.ts → calculoPresupuesto.ts (mantener)
- precioBasePorUM.ts → precioBasePorUM.ts (mantener)
- rounding.js → redondeo.js
- dateHelpers.js → ayudantesFecha.js
- validation.js → validacion.js

## 6. RUTAS BACKEND

### Endpoints a Renombrar
- /api/pieces → /api/piezas
- /api/materials → /api/materiales
- /api/zones → /api/zonas
- /api/quotations → /api/cotizaciones
- /api/truck-types → /api/tipos-camiones
- /api/policies → /api/politicas
- /api/process-parameters → /api/parametros-proceso
- /api/transport-tariffs → /api/tarifas-transporte
- /api/mounting-tariffs → /api/tarifas-montaje

## 7. ORDEN DE MIGRACIÓN

1. **Base de Datos**
   - Crear script de migración de esquema
   - Renombrar tablas
   - Renombrar campos
   - Eliminar tablas/campos no usados
   - Actualizar funciones y stored procedures

2. **Backend**
   - Actualizar modelos
   - Actualizar rutas
   - Actualizar servicios
   - Actualizar queries SQL

3. **Frontend - Estructura**
   - Renombrar carpetas principales
   - Renombrar archivos de componentes
   - Actualizar imports

4. **Frontend - Código**
   - Actualizar referencias a servicios
   - Actualizar llamadas a API
   - Actualizar nombres de variables

5. **Testing**
   - Verificar funcionalidad
   - Corregir errores
   - Validar integridad de datos

## 8. SCRIPTS DE MIGRACIÓN

### Script SQL para Base de Datos
```sql
-- 1. Renombrar tablas
EXEC sp_rename 'pieces', 'piezas';
EXEC sp_rename 'materials', 'materiales';
-- etc...

-- 2. Renombrar columnas
EXEC sp_rename 'piezas.name', 'nombre', 'COLUMN';
EXEC sp_rename 'piezas.code', 'codigo', 'COLUMN';
-- etc...

-- 3. Eliminar tablas no usadas
DROP TABLE IF EXISTS piece_price_history;
DROP TABLE IF EXISTS material_stock;
-- etc...
```

### Script Bash para Frontend
```bash
#!/bin/bash
# Renombrar carpetas
mv frontend/src/componentes/pieces frontend/src/componentes/piezas
mv frontend/src/componentes/materials frontend/src/componentes/materiales
# etc...

# Renombrar archivos
mv frontend/src/componentes/piezas/PieceCard.jsx frontend/src/componentes/piezas/TarjetaPieza.jsx
# etc...
```

## 9. VALIDACIONES POST-MIGRACIÓN

- [ ] Todos los imports funcionan
- [ ] Las rutas API responden correctamente
- [ ] La base de datos mantiene integridad
- [ ] Los componentes renderizan correctamente
- [ ] Los cálculos funcionan igual
- [ ] No hay referencias a nombres antiguos
- [ ] Los tests pasan

## 10. ROLLBACK PLAN

En caso de problemas:
1. Backup completo de BD antes de migración
2. Commit de Git antes de cambios
3. Scripts de reversión preparados
4. Ambiente de staging para pruebas

---

**NOTA**: Esta migración debe hacerse en un ambiente de desarrollo/staging primero