# 📋 Plan de Auditoría y Limpieza - Sistema de Presupuestación

## 🔍 Paso 0: Auditoría del Repositorio

### 1. **Código Legacy Identificado**

#### Frontend - Cálculos de Precio
- ✅ **precioBasePorUM**: Función correcta del motor determinista (mantener)
- ⚠️ **PieceModal.jsx duplicado**: Existe versión antigua y nueva (PieceModalComplete)
  - `/componentes/pieces/components/PieceModal.jsx` - DEPRECATED
  - `/componentes/pieces/components/PieceModalComplete.jsx` - ACTUAL

#### Frontend - Componentes Admin
**Existentes y a mantener:**
- ✅ MaterialsPrices.jsx - Gestión de precios de materiales
- ✅ ProcessParams.jsx - Parámetros de proceso
- ✅ BOMEditor.jsx - Editor de BOM
- ✅ PiecePrices.jsx - Publicación de precios
- ✅ Comparativos.jsx - Comparaciones mes a mes
- ✅ ReportsPanel.jsx - Panel de reportes

**Faltantes (a crear):**
- ❌ Políticas.jsx - Reglas globales y feature flags
- ❌ TruckTypes.jsx - Gestión de tipos de camiones
- ❌ TransportTariffs.jsx - Tarifario de transporte
- ❌ MountingTariffs.jsx - Tarifario de montaje

### 2. **Endpoints Backend**

#### A mantener/mejorar:
- `/api/materials/prices` - Precios de materiales
- `/api/process-parameters` - Parámetros de proceso
- `/api/pieces/:id/calculate-price` - Cálculo TVF v2
- `/api/pieces/:id/publish-price` - Publicación de precios

#### A crear:
- `/api/policies` - Políticas globales
- `/api/truck-types` - Tipos de camiones
- `/api/packing-rules` - Reglas de empaque
- `/api/transport-tariffs` - Tarifas de transporte
- `/api/mounting-tariffs` - Tarifas de montaje

### 3. **Acciones de Limpieza Inmediata**

```javascript
// Marcar como deprecated en archivos a remover:
// @deprecated - Use PieceModalComplete instead
// TODO: Remove after migration to TVF v2 complete
```

### 4. **Archivos a Eliminar**

```bash
# Frontend
frontend/src/componentes/pieces/components/PieceModal.jsx
frontend/src/componentes/pieces/components/PieceModalNew.jsx (si existe)

# Verificar referencias en:
frontend/src/paginas/Piezas/Piezas.jsx
```

### 5. **Métricas de Uso Legacy**

Agregar logging para detectar uso de código legacy:

```javascript
// En funciones deprecated
console.warn('[DEPRECATED] Using legacy PieceModal - migrate to PieceModalComplete');
```

## 📐 Principios de Refactorización

### Separación de Responsabilidades:
1. **Admin**: Solo configuración y publicación (NO CRUD operativo)
2. **Módulo Piezas**: CRUD técnico (UM, pesos, dimensiones, BOM)
3. **Wizard**: Consumo de precios publicados (NO cálculo)

### Fuente de Verdad:
- **TVF v2**: Única fuente para cálculo de precios
- **Polinómica**: Solo para comparación (nunca para formar precio)

### Redondeos Obligatorios:
```javascript
// Centralizar en helpers
export const roundMoney = (val) => Math.round(val * 100) / 100; // 2 decimales
export const roundWeight = (val) => Math.round(val * 1000) / 1000; // 3 decimales
export const ceilTrips = (val) => Math.ceil(val); // Siempre ceiling
```

## 🚀 Plan de Migración

### Fase 1: Limpieza (Sprint 1)
1. Marcar código deprecated
2. Actualizar imports en Piezas.jsx
3. Remover PieceModal antiguo
4. Centralizar helpers de redondeo

### Fase 2: Nuevos Componentes Admin (Sprint 2)
1. Crear Políticas.jsx
2. Crear TruckTypes.jsx
3. Crear TransportTariffs.jsx
4. Crear MountingTariffs.jsx

### Fase 3: Backend Alignment (Sprint 3)
1. Crear endpoints faltantes
2. Agregar trazabilidad a todas las escrituras
3. Implementar vigencias por fecha

### Fase 4: Validación (Sprint 4)
1. Tests E2E del flujo completo
2. Verificar que no hay rutas legacy accesibles
3. Confirmar redondeos consistentes

## ✅ Criterios de Éxito

- [ ] No existe código de cálculo de precio fuera de TVF v2
- [ ] Admin solo tiene módulos de configuración/publicación
- [ ] Todos los redondeos son consistentes
- [ ] No hay componentes duplicados
- [ ] Trazabilidad completa en cambios de precios

## 📊 Métricas de Calidad

```javascript
// Agregar en main app
if (process.env.NODE_ENV === 'development') {
  window.__LEGACY_CALLS__ = [];
  
  // Track legacy usage
  window.trackLegacy = (component) => {
    window.__LEGACY_CALLS__.push({
      component,
      timestamp: new Date(),
      stack: new Error().stack
    });
    console.warn(`[LEGACY] ${component} called at ${new Date().toISOString()}`);
  };
}
```

---

*Documento generado para guiar la refactorización completa del sistema de presupuestación*