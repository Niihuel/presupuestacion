# 🎯 PLAN DE MIGRACIÓN: SISTEMA ÚNICO DE MODALES

## ✅ ESTADO ACTUAL (Ya está bien organizado)

### SISTEMA BASE (Funcionando correctamente)
```
BaseModal.jsx          - ✅ Modal principal (fundación)
├── FormModal.jsx      - ✅ Para formularios 
├── ConfirmModal.jsx   - ✅ Para confirmaciones
├── ViewModal.jsx      - ✅ Para solo lectura
└── DeleteConfirmModal.jsx - ✅ Para eliminaciones (wrapper)
```

### ARCHIVO DE EXPORTACIÓN
```
modals.js - ✅ Índice centralizado
```

## 🚨 MODALES QUE NECESITAN MIGRACIÓN

### MODALES CON ESTRUCTURA MANUAL (Inconsistentes)
```
❌ PieceModal.jsx - Estructura manual (debe usar FormModal)
❌ PieceViewModal.jsx - Estructura manual (debe usar ViewModal)
❌ ProjectModal.jsx - Estructura manual (debe usar FormModal)
❌ UserModal.jsx - Estructura manual (debe usar FormModal)
❌ ZoneModal.jsx - Estructura manual (debe usar FormModal)
❌ PriceCopyModal.jsx - Estructura manual (debe usar FormModal)
❌ PriceAdjustmentModal.jsx - Estructura manual (debe usar FormModal)
```

### MODALES YA CORRECTOS
```
✅ CustomerModal.jsx - Usa BaseModal (correcto)
✅ CalculistaModal.jsx - Verificar si usa BaseModal
```

## 🔧 PROCESO DE MIGRACIÓN RECOMENDADO

### PASO 1: Modales Simples (Empezar aquí)
1. **ConfirmExitModal** → usar `ConfirmModal`
2. **ProjectDeleteModal** → usar `DeleteConfirmModal`

### PASO 2: Modales de Formulario
1. **ZoneModal** → usar `FormModal`
2. **UserModal** → usar `FormModal`
3. **PriceCopyModal** → usar `FormModal`
4. **PriceAdjustmentModal** → usar `FormModal`

### PASO 3: Modales Complejos (Al final)
1. **PieceModal** → usar `FormModal`
2. **ProjectModal** → usar `FormModal`
3. **PieceViewModal** → usar `ViewModal`

## 📝 EJEMPLO DE MIGRACIÓN

### ANTES (Estructura manual)
```jsx
const MiModal = ({ isOpen, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header manual */}
        <div className="flex items-center justify-between p-6">
          {/* Contenido */}
        </div>
        {/* Footer manual */}
      </div>
    </div>
  );
};
```

### DESPUÉS (Usando sistema unificado)
```jsx
import { FormModal } from '../shared/components/modals';

const MiModal = ({ isOpen, onClose, onSubmit }) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Mi Modal"
      subtitle="Descripción"
      icon={MiIcono}
      size="lg"
    >
      {/* Solo el contenido del formulario */}
    </FormModal>
  );
};
```

## 🎯 VENTAJAS DE LA MIGRACIÓN

✅ **Consistencia visual** - Todos los modales se ven igual
✅ **Mantenimiento fácil** - Un solo lugar para cambios globales
✅ **Menos código duplicado** - Reutilización máxima
✅ **Comportamiento predecible** - ESC, backdrop click, etc.
✅ **Accesibilidad** - Focus trap, ARIA labels automáticos

## 📋 CHECKLIST DE MIGRACIÓN

- [ ] Limpiar archivos de ejemplo duplicados
- [ ] Migrar modales simples (confirmación)
- [ ] Migrar modales de formulario
- [ ] Migrar modales de vista
- [ ] Verificar que todos usan imports desde `modals.js`
- [ ] Eliminar código manual duplicado
- [ ] Testing completo

## 🚀 PRÓXIMO PASO RECOMENDADO

**Empezar con el modal más simple**: `ConfirmExitModal`
- Es pequeño y fácil de migrar
- Sirve como ejemplo para los demás
- Riesgo mínimo de errores
