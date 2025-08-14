# Sistema de Presupuestación - Flujo de Materiales → Piezas → Plantas

## 🎯 Descripción del Flujo Implementado

Este sistema implementa una solución completa para la presupuestación de piezas prefabricadas, integrando materiales, fórmulas de producción y plantas de fabricación.

### 🔄 Flujo Principal

```
1. SELECCIÓN DE PLANTA
   ↓
2. SELECCIÓN DE PIEZAS
   ↓  
3. CÁLCULO AUTOMÁTICO DE MATERIALES
   ↓
4. VERIFICACIÓN DE STOCK
   ↓
5. CÁLCULO DE COSTOS TOTALES
```

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Express)

#### Módulos Principales

- **Materials Module** (`/backend/src/modules/materials/`)
  - Controllers: `material.controller.js`, `pieceMaterialFormula.controller.js`
  - Services: `material.service.js`, `pieceMaterialFormula.service.js`
  - Routes: `material.routes.js`

- **Pieces Module** (`/backend/src/modules/pieces/`)
  - Controllers: `piece.controller.js`
  - Services: `piece.service.js`
  - Routes: `piece.routes.js`

- **Zones Module** (`/backend/src/modules/zones/`)
  - Controllers: `zone.controller.js`
  - Services: `zone.service.js`
  - Routes: `zone.routes.js`

#### Base de Datos

**Tablas Principales:**

1. **materials** - Catálogo de materiales
2. **material_plant_prices** - Precios por planta
3. **material_plant_stock** - Stock por planta
4. **piece_material_formulas** - Fórmulas de materiales por pieza
5. **material_stock_movements** - Movimientos de stock
6. **material_price_history** - Historial de precios

### Frontend (React + Vite)

#### Componentes Principales

- **EtapaPiezasCantidadesAvanzada** - Componente principal del flujo
- **PieceMaterialFormulaManager** - Gestión de fórmulas de materiales
- **MaterialModal** - CRUD de materiales
- **MaterialViewModal** - Vista detallada de materiales

#### Hooks Personalizados

- `usePieceMaterialFormula` - Gestión de fórmulas
- `useMaterials` - CRUD de materiales
- `useZones` - Gestión de plantas/zonas

## 🚀 Funcionalidades Implementadas

### 1. Gestión de Materiales

- ✅ CRUD completo de materiales
- ✅ Categorización (Hormigón, Acero, Insertos, etc.)
- ✅ Unidades de medida (kg, m³, litros, etc.)
- ✅ Stock mínimo configurable
- ✅ Múltiples proveedores por material

### 2. Precios por Planta

- ✅ Precios diferenciados por planta
- ✅ Vigencia de precios (desde/hasta)
- ✅ Historial automático de cambios
- ✅ Múltiples monedas (configurable)

### 3. Stock por Planta

- ✅ Stock independiente por planta
- ✅ Movimientos de stock automáticos
- ✅ Alertas de stock bajo/agotado
- ✅ Inventarios por fecha

### 4. Fórmulas de Materiales

- ✅ Definición de materiales por pieza
- ✅ Cantidades exactas por unidad
- ✅ Factor de desperdicio configurable
- ✅ Materiales opcionales
- ✅ Validación automática de fórmulas

### 5. Cálculo Automático de Costos

- ✅ Cálculo en tiempo real según planta
- ✅ Verificación de disponibilidad
- ✅ Alertas de stock insuficiente
- ✅ Resumen consolidado de materiales

### 6. Flujo de Presupuestación

- ✅ Selección de planta obligatoria
- ✅ Catálogo filtrable de piezas
- ✅ Cálculo automático al agregar piezas
- ✅ Resumen de costos por material
- ✅ Warnings de stock en tiempo real

## 📦 Instalación y Configuración

### 1. Prerequisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

### 2. Configuración de Base de Datos

```bash
# Ejecutar scripts en orden:
mysql -u root -p presupuestacion < backend/database/scriptbd.sql
mysql -u root -p presupuestacion < backend/database/materials_schema.sql
mysql -u root -p presupuestacion < backend/database/materials_schema_fix.sql

# O usar el script automatizado:
chmod +x setup_database.sh
./setup_database.sh
```

### 3. Configuración del Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de BD

npm run dev
```

### 4. Configuración del Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔧 APIs Principales

### Materiales

```
GET    /api/materials                    # Lista con filtros
POST   /api/materials                    # Crear material
GET    /api/materials/:id                # Obtener material
PUT    /api/materials/:id                # Actualizar material
DELETE /api/materials/:id                # Eliminar material
GET    /api/materials/stats              # Estadísticas
```

### Fórmulas de Materiales

```
GET    /api/pieces/:id/materials-formula          # Obtener fórmula
PUT    /api/pieces/:id/materials-formula          # Actualizar fórmula
POST   /api/pieces/:id/materials-formula/material # Agregar material
DELETE /api/pieces/:id/materials-formula/material/:materialId # Remover
POST   /api/pieces/:id/materials-formula/validate # Validar
```

### Cálculos

```
POST   /api/pieces/:id/calculate-material-cost    # Calcular costo
POST   /api/pieces/:id/check-material-availability # Verificar stock
```

## 📋 Flujo de Uso

### 1. Configuración Inicial

1. **Configurar Plantas/Zonas**
   - Córdoba, Buenos Aires, Villa María, etc.

2. **Crear Catálogo de Materiales**
   - Hormigón H30, Acero ADN 420, etc.
   - Definir precios por planta
   - Configurar stock inicial

3. **Definir Fórmulas de Piezas**
   - Para cada pieza definir materiales necesarios
   - Cantidades exactas y factores de desperdicio

### 2. Creación de Presupuestos

1. **Seleccionar Planta de Fabricación**
   - Afecta precios y disponibilidad

2. **Agregar Piezas al Presupuesto**
   - El sistema calcula materiales automáticamente
   - Muestra alertas de stock

3. **Revisar Costos y Stock**
   - Resumen consolidado por material
   - Verificar disponibilidad total

4. **Generar Presupuesto Final**
   - Incluye costos de materiales
   - Considera logística por planta

## 🎨 Ejemplos de Uso

### Ejemplo 1: Viga I 80

**Fórmula de materiales:**
- Hormigón H30: 0.85 m³ (factor 1.05)
- Acero ADN 420: 65 kg (factor 1.02)
- Insertos tipo A: 4 unidades (factor 1.10)

**Para 10 vigas desde Córdoba:**
- Hormigón necesario: 8.93 m³
- Acero necesario: 663 kg
- Costo total de materiales: $XXX.XXX

### Ejemplo 2: Panel TT 30

**Fórmula de materiales:**
- Hormigón H30: 1.20 m³ (factor 1.05)
- Acero pretensado: 45 kg (factor 1.02)
- Malla Q188: 8.5 m² (factor 1.00)

## 🔍 Características Técnicas

### Performance

- **Caching** de consultas frecuentes (10-15 min)
- **Paginación** en listados grandes
- **Búsqueda optimizada** con índices
- **Cálculos en tiempo real** sin bloquear UI

### Seguridad

- **Autenticación** requerida para todas las operaciones
- **Validación** de datos en frontend y backend
- **Auditoría** de cambios de precios y stock
- **Soft delete** para preservar historial

### Escalabilidad

- **Modular** - fácil agregar nuevas plantas
- **Configurable** - precios y fórmulas dinámicas
- **Extensible** - nuevos tipos de materiales
- **API REST** - integrable con otros sistemas

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de referencia de tablas**
   - Ejecutar `materials_schema_fix.sql`
   - Verificar que existe tabla `zones` (no `zonas`)

2. **Cálculos incorrectos**
   - Verificar fórmulas de materiales
   - Comprobar precios vigentes por planta

3. **Stock insuficiente**
   - Revisar movimientos de stock
   - Actualizar inventarios

### Logs Útiles

```bash
# Backend logs
tail -f backend/logs/combined.log

# Errores de BD
tail -f backend/logs/error.log
```

## 🔮 Próximas Mejoras

- [ ] **Dashboard** de métricas de materiales
- [ ] **Reportes** de consumo por proyecto
- [ ] **Integración** con ERP externo
- [ ] **App móvil** para control de stock
- [ ] **IA** para predicción de demanda
- [ ] **Códigos QR** para seguimiento

## 📞 Soporte

Para soporte técnico o consultas sobre implementación, contactar al equipo de desarrollo.

---

**Sistema de Presupuestación v3.0** - Flujo Completo de Materiales  
Desarrollado con ❤️ para optimizar la gestión de piezas prefabricadas
