-- =====================================================
-- SCRIPT DE MIGRACIÓN DE BASE DE DATOS A ESPAÑOL
-- =====================================================
-- IMPORTANTE: Hacer backup completo antes de ejecutar
-- =====================================================

USE presupuestacion;
GO

-- =====================================================
-- PASO 1: ELIMINAR CONSTRAINTS Y FOREIGN KEYS TEMPORALMENTE
-- =====================================================

-- Guardar constraints para recrearlas después
DECLARE @DropConstraints NVARCHAR(MAX) = '';
SELECT @DropConstraints = @DropConstraints + 
    'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + 
    QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;

-- Ejecutar drop de constraints
EXEC sp_executesql @DropConstraints;
GO

-- =====================================================
-- PASO 2: RENOMBRAR TABLAS PRINCIPALES
-- =====================================================

-- Tablas Core
EXEC sp_rename 'pieces', 'piezas';
EXEC sp_rename 'materials', 'materiales';
EXEC sp_rename 'zones', 'zonas';
EXEC sp_rename 'users', 'usuarios';
EXEC sp_rename 'projects', 'proyectos';
EXEC sp_rename 'quotations', 'cotizaciones';

-- Tablas de Relación
EXEC sp_rename 'piece_prices', 'precios_piezas';
EXEC sp_rename 'material_prices', 'precios_materiales';
EXEC sp_rename 'piece_material_formulas', 'formulas_material_pieza';
EXEC sp_rename 'piece_technical_data', 'datos_tecnicos_pieza';
EXEC sp_rename 'process_parameters', 'parametros_proceso';
EXEC sp_rename 'quotation_pieces', 'piezas_cotizacion';
EXEC sp_rename 'quotation_history', 'historial_cotizaciones';

-- Tablas de Configuración
EXEC sp_rename 'truck_types', 'tipos_camiones';
EXEC sp_rename 'family_packing_rules', 'reglas_empaque_familia';
EXEC sp_rename 'transport_tariffs', 'tarifas_transporte';
EXEC sp_rename 'mounting_tariffs', 'tarifas_montaje';
EXEC sp_rename 'system_policies', 'politicas_sistema';
EXEC sp_rename 'piece_families', 'familias_piezas';

-- Tablas de Seguridad
EXEC sp_rename 'roles', 'roles';  -- mantener
EXEC sp_rename 'permissions', 'permisos';
EXEC sp_rename 'role_permissions', 'permisos_rol';
EXEC sp_rename 'user_roles', 'roles_usuario';

GO

-- =====================================================
-- PASO 3: RENOMBRAR COLUMNAS - TABLA PIEZAS
-- =====================================================

EXEC sp_rename 'piezas.name', 'nombre', 'COLUMN';
EXEC sp_rename 'piezas.code', 'codigo', 'COLUMN';
EXEC sp_rename 'piezas.description', 'descripcion', 'COLUMN';
EXEC sp_rename 'piezas.unit', 'unidad', 'COLUMN';
EXEC sp_rename 'piezas.family_id', 'familia_id', 'COLUMN';
EXEC sp_rename 'piezas.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'piezas.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'piezas.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'piezas.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'piezas.updated_by', 'actualizado_por', 'COLUMN';

-- Eliminar columnas no usadas
ALTER TABLE piezas DROP COLUMN IF EXISTS base_price;
ALTER TABLE piezas DROP COLUMN IF EXISTS last_calculated_price;

GO

-- =====================================================
-- PASO 4: RENOMBRAR COLUMNAS - TABLA MATERIALES
-- =====================================================

EXEC sp_rename 'materiales.name', 'nombre', 'COLUMN';
EXEC sp_rename 'materiales.category', 'categoria', 'COLUMN';
EXEC sp_rename 'materiales.unit', 'unidad', 'COLUMN';
EXEC sp_rename 'materiales.supplier', 'proveedor', 'COLUMN';
EXEC sp_rename 'materiales.min_stock', 'stock_minimo', 'COLUMN';
EXEC sp_rename 'materiales.max_stock', 'stock_maximo', 'COLUMN';
EXEC sp_rename 'materiales.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'materiales.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'materiales.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'materiales.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'materiales.updated_by', 'actualizado_por', 'COLUMN';

-- Eliminar columnas no usadas
ALTER TABLE materiales DROP COLUMN IF EXISTS current_price;

GO

-- =====================================================
-- PASO 5: RENOMBRAR COLUMNAS - TABLA ZONAS
-- =====================================================

EXEC sp_rename 'zonas.name', 'nombre', 'COLUMN';
EXEC sp_rename 'zonas.code', 'codigo', 'COLUMN';
EXEC sp_rename 'zonas.description', 'descripcion', 'COLUMN';
EXEC sp_rename 'zonas.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'zonas.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'zonas.updated_at', 'actualizado_en', 'COLUMN';

GO

-- =====================================================
-- PASO 6: RENOMBRAR COLUMNAS - TABLA USUARIOS
-- =====================================================

EXEC sp_rename 'usuarios.username', 'nombre_usuario', 'COLUMN';
EXEC sp_rename 'usuarios.email', 'correo', 'COLUMN';
EXEC sp_rename 'usuarios.first_name', 'nombre', 'COLUMN';
EXEC sp_rename 'usuarios.last_name', 'apellido', 'COLUMN';
EXEC sp_rename 'usuarios.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'usuarios.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'usuarios.updated_at', 'actualizado_en', 'COLUMN';

GO

-- =====================================================
-- PASO 7: RENOMBRAR COLUMNAS - TABLA PROYECTOS
-- =====================================================

EXEC sp_rename 'proyectos.name', 'nombre', 'COLUMN';
EXEC sp_rename 'proyectos.code', 'codigo', 'COLUMN';
EXEC sp_rename 'proyectos.description', 'descripcion', 'COLUMN';
EXEC sp_rename 'proyectos.client_name', 'nombre_cliente', 'COLUMN';
EXEC sp_rename 'proyectos.client_contact', 'contacto_cliente', 'COLUMN';
EXEC sp_rename 'proyectos.start_date', 'fecha_inicio', 'COLUMN';
EXEC sp_rename 'proyectos.end_date', 'fecha_fin', 'COLUMN';
EXEC sp_rename 'proyectos.status', 'estado', 'COLUMN';
EXEC sp_rename 'proyectos.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'proyectos.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'proyectos.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'proyectos.updated_by', 'actualizado_por', 'COLUMN';

GO

-- =====================================================
-- PASO 8: RENOMBRAR COLUMNAS - TABLA COTIZACIONES
-- =====================================================

EXEC sp_rename 'cotizaciones.project_id', 'proyecto_id', 'COLUMN';
EXEC sp_rename 'cotizaciones.quotation_number', 'numero_cotizacion', 'COLUMN';
EXEC sp_rename 'cotizaciones.version', 'version', 'COLUMN';
EXEC sp_rename 'cotizaciones.date', 'fecha', 'COLUMN';
EXEC sp_rename 'cotizaciones.valid_until', 'valido_hasta', 'COLUMN';
EXEC sp_rename 'cotizaciones.status', 'estado', 'COLUMN';
EXEC sp_rename 'cotizaciones.notes', 'notas', 'COLUMN';
EXEC sp_rename 'cotizaciones.discount_percentage', 'porcentaje_descuento', 'COLUMN';
EXEC sp_rename 'cotizaciones.tax_percentage', 'porcentaje_impuesto', 'COLUMN';
EXEC sp_rename 'cotizaciones.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'cotizaciones.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'cotizaciones.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'cotizaciones.updated_by', 'actualizado_por', 'COLUMN';

-- Eliminar columnas no usadas
ALTER TABLE cotizaciones DROP COLUMN IF EXISTS total_cached;

GO

-- =====================================================
-- PASO 9: RENOMBRAR COLUMNAS - TABLA PRECIOS_PIEZAS
-- =====================================================

EXEC sp_rename 'precios_piezas.piece_id', 'pieza_id', 'COLUMN';
EXEC sp_rename 'precios_piezas.zone_id', 'zona_id', 'COLUMN';
EXEC sp_rename 'precios_piezas.price', 'precio', 'COLUMN';
EXEC sp_rename 'precios_piezas.effective_date', 'fecha_efectiva', 'COLUMN';
EXEC sp_rename 'precios_piezas.published_by', 'publicado_por', 'COLUMN';
EXEC sp_rename 'precios_piezas.published_at', 'publicado_en', 'COLUMN';
EXEC sp_rename 'precios_piezas.is_active', 'activo', 'COLUMN';

GO

-- =====================================================
-- PASO 10: RENOMBRAR COLUMNAS - TABLA PRECIOS_MATERIALES
-- =====================================================

EXEC sp_rename 'precios_materiales.material_id', 'material_id', 'COLUMN';
EXEC sp_rename 'precios_materiales.zone_id', 'zona_id', 'COLUMN';
EXEC sp_rename 'precios_materiales.price', 'precio', 'COLUMN';
EXEC sp_rename 'precios_materiales.valid_from', 'valido_desde', 'COLUMN';
EXEC sp_rename 'precios_materiales.valid_to', 'valido_hasta', 'COLUMN';
EXEC sp_rename 'precios_materiales.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'precios_materiales.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'precios_materiales.created_by', 'creado_por', 'COLUMN';

GO

-- =====================================================
-- PASO 11: RENOMBRAR COLUMNAS - TABLA FORMULAS_MATERIAL_PIEZA
-- =====================================================

EXEC sp_rename 'formulas_material_pieza.piece_id', 'pieza_id', 'COLUMN';
EXEC sp_rename 'formulas_material_pieza.material_id', 'material_id', 'COLUMN';
EXEC sp_rename 'formulas_material_pieza.quantity_per_unit', 'cantidad_por_unidad', 'COLUMN';
EXEC sp_rename 'formulas_material_pieza.waste_factor', 'factor_desperdicio', 'COLUMN';
EXEC sp_rename 'formulas_material_pieza.scrap_percent', 'porcentaje_scrap', 'COLUMN';
EXEC sp_rename 'formulas_material_pieza.notes', 'notas', 'COLUMN';

GO

-- =====================================================
-- PASO 12: RENOMBRAR COLUMNAS - TABLA DATOS_TECNICOS_PIEZA
-- =====================================================

EXEC sp_rename 'datos_tecnicos_pieza.piece_id', 'pieza_id', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.weight_kg', 'peso_kg', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.peso_tn_por_um', 'peso_tn_por_um', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.kg_acero_por_um', 'kg_acero_por_um', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.volumen_m3_por_um', 'volumen_m3_por_um', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.length_m', 'largo_m', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.width_m', 'ancho_m', 'COLUMN';
EXEC sp_rename 'datos_tecnicos_pieza.height_m', 'alto_m', 'COLUMN';

GO

-- =====================================================
-- PASO 13: RENOMBRAR COLUMNAS - TABLA PARAMETROS_PROCESO
-- =====================================================

EXEC sp_rename 'parametros_proceso.zone_id', 'zona_id', 'COLUMN';
EXEC sp_rename 'parametros_proceso.month_year', 'mes_año', 'COLUMN';
EXEC sp_rename 'parametros_proceso.energia_curado_tn', 'energia_curado_tn', 'COLUMN';
EXEC sp_rename 'parametros_proceso.gg_fabrica_tn', 'gg_fabrica_tn', 'COLUMN';
EXEC sp_rename 'parametros_proceso.gg_empresa_tn', 'gg_empresa_tn', 'COLUMN';
EXEC sp_rename 'parametros_proceso.utilidad_tn', 'utilidad_tn', 'COLUMN';
EXEC sp_rename 'parametros_proceso.ingenieria_tn', 'ingenieria_tn', 'COLUMN';
EXEC sp_rename 'parametros_proceso.precio_hora', 'precio_hora', 'COLUMN';
EXEC sp_rename 'parametros_proceso.horas_por_tn_acero', 'horas_por_tn_acero', 'COLUMN';
EXEC sp_rename 'parametros_proceso.horas_por_m3_hormigon', 'horas_por_m3_hormigon', 'COLUMN';
EXEC sp_rename 'parametros_proceso.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'parametros_proceso.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'parametros_proceso.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'parametros_proceso.updated_by', 'actualizado_por', 'COLUMN';

GO

-- =====================================================
-- PASO 14: RENOMBRAR COLUMNAS - TABLA PIEZAS_COTIZACION
-- =====================================================

EXEC sp_rename 'piezas_cotizacion.quotation_id', 'cotizacion_id', 'COLUMN';
EXEC sp_rename 'piezas_cotizacion.piece_id', 'pieza_id', 'COLUMN';
EXEC sp_rename 'piezas_cotizacion.quantity', 'cantidad', 'COLUMN';
EXEC sp_rename 'piezas_cotizacion.unit_price', 'precio_unitario', 'COLUMN';
EXEC sp_rename 'piezas_cotizacion.discount_percentage', 'porcentaje_descuento', 'COLUMN';
EXEC sp_rename 'piezas_cotizacion.notes', 'notas', 'COLUMN';

GO

-- =====================================================
-- PASO 15: RENOMBRAR COLUMNAS - TABLA TIPOS_CAMIONES
-- =====================================================

EXEC sp_rename 'tipos_camiones.name', 'nombre', 'COLUMN';
EXEC sp_rename 'tipos_camiones.code', 'codigo', 'COLUMN';
EXEC sp_rename 'tipos_camiones.capacity_tons', 'capacidad_tn', 'COLUMN';
EXEC sp_rename 'tipos_camiones.useful_volume_m3', 'volumen_util_m3', 'COLUMN';
EXEC sp_rename 'tipos_camiones.max_length_m', 'largo_max_m', 'COLUMN';
EXEC sp_rename 'tipos_camiones.max_width_m', 'ancho_max_m', 'COLUMN';
EXEC sp_rename 'tipos_camiones.max_height_m', 'alto_max_m', 'COLUMN';
EXEC sp_rename 'tipos_camiones.cost_per_trip', 'costo_por_viaje', 'COLUMN';
EXEC sp_rename 'tipos_camiones.is_active', 'activo', 'COLUMN';
EXEC sp_rename 'tipos_camiones.created_at', 'creado_en', 'COLUMN';
EXEC sp_rename 'tipos_camiones.created_by', 'creado_por', 'COLUMN';
EXEC sp_rename 'tipos_camiones.updated_at', 'actualizado_en', 'COLUMN';
EXEC sp_rename 'tipos_camiones.updated_by', 'actualizado_por', 'COLUMN';

GO

-- =====================================================
-- PASO 16: RENOMBRAR COLUMNAS - TABLA REGLAS_EMPAQUE_FAMILIA
-- =====================================================

EXEC sp_rename 'reglas_empaque_familia.family_id', 'familia_id', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.truck_type_id', 'tipo_camion_id', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.pieces_per_truck', 'piezas_por_camion', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.max_layers', 'capas_maximas', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.orientation', 'orientacion', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.stacking_allowed', 'apilamiento_permitido', 'COLUMN';
EXEC sp_rename 'reglas_empaque_familia.notes', 'notas', 'COLUMN';

GO

-- =====================================================
-- PASO 17: RENOMBRAR COLUMNAS - TABLA FAMILIAS_PIEZAS
-- =====================================================

EXEC sp_rename 'familias_piezas.name', 'nombre', 'COLUMN';
EXEC sp_rename 'familias_piezas.code', 'codigo', 'COLUMN';
EXEC sp_rename 'familias_piezas.description', 'descripcion', 'COLUMN';
EXEC sp_rename 'familias_piezas.is_active', 'activo', 'COLUMN';

GO

-- =====================================================
-- PASO 18: ELIMINAR TABLAS NO UTILIZADAS
-- =====================================================

DROP TABLE IF EXISTS piece_price_history;
DROP TABLE IF EXISTS material_stock;
DROP TABLE IF EXISTS quotation_approvals;
DROP TABLE IF EXISTS piece_categories;
DROP TABLE IF EXISTS temporary_calculations;
DROP TABLE IF EXISTS import_logs;

GO

-- =====================================================
-- PASO 19: ACTUALIZAR FUNCIONES Y PROCEDIMIENTOS
-- =====================================================

-- Actualizar función de cálculo de precio
IF OBJECT_ID('FN_calculate_piece_material_cost', 'FN') IS NOT NULL
    DROP FUNCTION FN_calculate_piece_material_cost;
GO

IF OBJECT_ID('FN_calcular_costo_material_pieza', 'FN') IS NOT NULL
    DROP FUNCTION FN_calcular_costo_material_pieza;
GO

CREATE FUNCTION FN_calcular_costo_material_pieza
(
    @pieza_id INT,
    @zona_id INT,
    @fecha_calculo DATE = NULL
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @costo_total DECIMAL(18,2) = 0;
    
    SELECT @costo_total = SUM(
        fmp.cantidad_por_unidad * 
        (1 + ISNULL(fmp.porcentaje_scrap, 0) / 100.0) *
        ISNULL(pm.precio, 0)
    )
    FROM formulas_material_pieza fmp
    INNER JOIN precios_materiales pm ON fmp.material_id = pm.material_id
    WHERE fmp.pieza_id = @pieza_id
      AND pm.zona_id = @zona_id
      AND pm.valido_desde <= ISNULL(@fecha_calculo, GETDATE())
      AND (pm.valido_hasta IS NULL OR pm.valido_hasta >= ISNULL(@fecha_calculo, GETDATE()))
      AND pm.activo = 1;
    
    RETURN ISNULL(@costo_total, 0);
END;
GO

-- Actualizar TVF de desglose de costos
IF OBJECT_ID('TVF_piece_cost_breakdown', 'IF') IS NOT NULL
    DROP FUNCTION TVF_piece_cost_breakdown;
GO

IF OBJECT_ID('TVF_desglose_costo_pieza', 'IF') IS NOT NULL
    DROP FUNCTION TVF_desglose_costo_pieza;
GO

CREATE FUNCTION TVF_desglose_costo_pieza
(
    @pieza_id INT,
    @zona_id INT,
    @fecha_calculo DATE = NULL
)
RETURNS TABLE
AS
RETURN
(
    WITH DatosTecnicos AS (
        SELECT 
            dtp.peso_tn_por_um,
            dtp.kg_acero_por_um,
            dtp.volumen_m3_por_um
        FROM datos_tecnicos_pieza dtp
        WHERE dtp.pieza_id = @pieza_id
    ),
    ParametrosProceso AS (
        SELECT TOP 1
            pp.energia_curado_tn,
            pp.gg_fabrica_tn,
            pp.gg_empresa_tn,
            pp.utilidad_tn,
            pp.ingenieria_tn,
            pp.precio_hora,
            pp.horas_por_tn_acero,
            pp.horas_por_m3_hormigon
        FROM parametros_proceso pp
        WHERE pp.zona_id = @zona_id
          AND pp.mes_año <= ISNULL(@fecha_calculo, GETDATE())
        ORDER BY pp.mes_año DESC
    ),
    CostoMateriales AS (
        SELECT dbo.FN_calcular_costo_material_pieza(@pieza_id, @zona_id, @fecha_calculo) AS costo
    )
    SELECT 
        @pieza_id AS pieza_id,
        @zona_id AS zona_id,
        @fecha_calculo AS fecha_calculo,
        
        -- Costo de materiales
        cm.costo AS costo_materiales,
        
        -- Costo de proceso
        CASE 
            WHEN dt.peso_tn_por_um IS NOT NULL THEN
                (pp.energia_curado_tn + pp.gg_fabrica_tn + pp.gg_empresa_tn + 
                 pp.utilidad_tn + pp.ingenieria_tn) * dt.peso_tn_por_um
            ELSE 0
        END AS costo_proceso,
        
        -- Mano de obra hormigón
        CASE 
            WHEN dt.volumen_m3_por_um IS NOT NULL THEN
                pp.horas_por_m3_hormigon * pp.precio_hora * dt.volumen_m3_por_um
            ELSE 0
        END AS mano_obra_hormigon,
        
        -- Mano de obra acero
        CASE 
            WHEN dt.kg_acero_por_um IS NOT NULL THEN
                pp.horas_por_tn_acero * pp.precio_hora * (dt.kg_acero_por_um / 1000.0)
            ELSE 0
        END AS mano_obra_acero,
        
        -- Total
        cm.costo + 
        ISNULL((pp.energia_curado_tn + pp.gg_fabrica_tn + pp.gg_empresa_tn + 
                pp.utilidad_tn + pp.ingenieria_tn) * dt.peso_tn_por_um, 0) +
        ISNULL(pp.horas_por_m3_hormigon * pp.precio_hora * dt.volumen_m3_por_um, 0) +
        ISNULL(pp.horas_por_tn_acero * pp.precio_hora * (dt.kg_acero_por_um / 1000.0), 0) AS costo_total,
        
        -- Flags de datos faltantes
        CASE WHEN dt.peso_tn_por_um IS NULL THEN 1 ELSE 0 END AS falta_peso,
        CASE WHEN dt.volumen_m3_por_um IS NULL AND dt.kg_acero_por_um IS NULL THEN 1 ELSE 0 END AS falta_geometria
        
    FROM CostoMateriales cm
    CROSS JOIN DatosTecnicos dt
    CROSS JOIN ParametrosProceso pp
);
GO

-- =====================================================
-- PASO 20: RECREAR FOREIGN KEYS CON NUEVOS NOMBRES
-- =====================================================

-- Foreign Keys para tabla piezas
ALTER TABLE piezas 
ADD CONSTRAINT FK_piezas_familia 
FOREIGN KEY (familia_id) REFERENCES familias_piezas(id);

ALTER TABLE piezas 
ADD CONSTRAINT FK_piezas_creado_por 
FOREIGN KEY (creado_por) REFERENCES usuarios(id);

ALTER TABLE piezas 
ADD CONSTRAINT FK_piezas_actualizado_por 
FOREIGN KEY (actualizado_por) REFERENCES usuarios(id);

-- Foreign Keys para tabla precios_piezas
ALTER TABLE precios_piezas 
ADD CONSTRAINT FK_precios_piezas_pieza 
FOREIGN KEY (pieza_id) REFERENCES piezas(id);

ALTER TABLE precios_piezas 
ADD CONSTRAINT FK_precios_piezas_zona 
FOREIGN KEY (zona_id) REFERENCES zonas(id);

ALTER TABLE precios_piezas 
ADD CONSTRAINT FK_precios_piezas_publicado_por 
FOREIGN KEY (publicado_por) REFERENCES usuarios(id);

-- Foreign Keys para tabla precios_materiales
ALTER TABLE precios_materiales 
ADD CONSTRAINT FK_precios_materiales_material 
FOREIGN KEY (material_id) REFERENCES materiales(id);

ALTER TABLE precios_materiales 
ADD CONSTRAINT FK_precios_materiales_zona 
FOREIGN KEY (zona_id) REFERENCES zonas(id);

ALTER TABLE precios_materiales 
ADD CONSTRAINT FK_precios_materiales_creado_por 
FOREIGN KEY (creado_por) REFERENCES usuarios(id);

-- Foreign Keys para tabla formulas_material_pieza
ALTER TABLE formulas_material_pieza 
ADD CONSTRAINT FK_formulas_pieza 
FOREIGN KEY (pieza_id) REFERENCES piezas(id);

ALTER TABLE formulas_material_pieza 
ADD CONSTRAINT FK_formulas_material 
FOREIGN KEY (material_id) REFERENCES materiales(id);

-- Foreign Keys para tabla datos_tecnicos_pieza
ALTER TABLE datos_tecnicos_pieza 
ADD CONSTRAINT FK_datos_tecnicos_pieza 
FOREIGN KEY (pieza_id) REFERENCES piezas(id);

-- Foreign Keys para tabla parametros_proceso
ALTER TABLE parametros_proceso 
ADD CONSTRAINT FK_parametros_zona 
FOREIGN KEY (zona_id) REFERENCES zonas(id);

ALTER TABLE parametros_proceso 
ADD CONSTRAINT FK_parametros_creado_por 
FOREIGN KEY (creado_por) REFERENCES usuarios(id);

-- Foreign Keys para tabla cotizaciones
ALTER TABLE cotizaciones 
ADD CONSTRAINT FK_cotizaciones_proyecto 
FOREIGN KEY (proyecto_id) REFERENCES proyectos(id);

ALTER TABLE cotizaciones 
ADD CONSTRAINT FK_cotizaciones_creado_por 
FOREIGN KEY (creado_por) REFERENCES usuarios(id);

-- Foreign Keys para tabla piezas_cotizacion
ALTER TABLE piezas_cotizacion 
ADD CONSTRAINT FK_piezas_cotizacion_cotizacion 
FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id);

ALTER TABLE piezas_cotizacion 
ADD CONSTRAINT FK_piezas_cotizacion_pieza 
FOREIGN KEY (pieza_id) REFERENCES piezas(id);

-- Foreign Keys para tabla reglas_empaque_familia
ALTER TABLE reglas_empaque_familia 
ADD CONSTRAINT FK_reglas_familia 
FOREIGN KEY (familia_id) REFERENCES familias_piezas(id);

ALTER TABLE reglas_empaque_familia 
ADD CONSTRAINT FK_reglas_camion 
FOREIGN KEY (tipo_camion_id) REFERENCES tipos_camiones(id);

GO

-- =====================================================
-- PASO 21: CREAR ÍNDICES CON NUEVOS NOMBRES
-- =====================================================

-- Índices para tabla piezas
CREATE INDEX IX_piezas_nombre ON piezas(nombre);
CREATE INDEX IX_piezas_codigo ON piezas(codigo);
CREATE INDEX IX_piezas_familia ON piezas(familia_id);
CREATE INDEX IX_piezas_activo ON piezas(activo);

-- Índices para tabla materiales
CREATE INDEX IX_materiales_nombre ON materiales(nombre);
CREATE INDEX IX_materiales_categoria ON materiales(categoria);
CREATE INDEX IX_materiales_activo ON materiales(activo);

-- Índices para tabla precios_piezas
CREATE INDEX IX_precios_piezas_pieza_zona_fecha 
ON precios_piezas(pieza_id, zona_id, fecha_efectiva DESC);

-- Índices para tabla precios_materiales
CREATE INDEX IX_precios_materiales_material_zona_fecha 
ON precios_materiales(material_id, zona_id, valido_desde DESC);

-- Índices para tabla cotizaciones
CREATE INDEX IX_cotizaciones_proyecto ON cotizaciones(proyecto_id);
CREATE INDEX IX_cotizaciones_numero ON cotizaciones(numero_cotizacion);
CREATE INDEX IX_cotizaciones_fecha ON cotizaciones(fecha DESC);

GO

-- =====================================================
-- PASO 22: ACTUALIZAR VISTAS SI EXISTEN
-- =====================================================

IF OBJECT_ID('v_piece_current_prices', 'V') IS NOT NULL
    DROP VIEW v_piece_current_prices;
GO

CREATE VIEW v_precios_actuales_piezas AS
SELECT 
    p.id AS pieza_id,
    p.nombre,
    p.codigo,
    z.id AS zona_id,
    z.nombre AS zona_nombre,
    pp.precio,
    pp.fecha_efectiva,
    pp.publicado_en
FROM piezas p
CROSS JOIN zonas z
OUTER APPLY (
    SELECT TOP 1 
        precio, 
        fecha_efectiva, 
        publicado_en
    FROM precios_piezas
    WHERE pieza_id = p.id 
      AND zona_id = z.id
      AND activo = 1
    ORDER BY fecha_efectiva DESC
) pp
WHERE p.activo = 1 AND z.activo = 1;
GO

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se renombraron correctamente
SELECT 
    'Tablas renombradas:' AS verificacion,
    COUNT(*) AS total
FROM sys.tables
WHERE name IN ('piezas', 'materiales', 'zonas', 'usuarios', 'proyectos', 
               'cotizaciones', 'precios_piezas', 'precios_materiales',
               'formulas_material_pieza', 'datos_tecnicos_pieza',
               'parametros_proceso', 'tipos_camiones', 'familias_piezas');

-- Verificar que las tablas viejas no existen
SELECT 
    'Tablas viejas eliminadas:' AS verificacion,
    COUNT(*) AS total
FROM sys.tables
WHERE name IN ('pieces', 'materials', 'zones', 'users', 'projects',
               'quotations', 'piece_prices', 'material_prices',
               'piece_material_formulas', 'piece_technical_data',
               'process_parameters', 'truck_types', 'piece_families');

PRINT '=====================================================';
PRINT 'MIGRACIÓN DE BASE DE DATOS COMPLETADA';
PRINT 'Por favor verificar la integridad de los datos';
PRINT '=====================================================';
GO