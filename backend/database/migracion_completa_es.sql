-- =====================================================
-- MIGRACIÓN LÓGICA A ESPAÑOL (SQL Server)
-- Modo seguro: crea SINÓNIMOS y VISTAS con nombres en español
-- (no rompe el código existente que usa nombres en inglés)
-- 
-- Modo opcional (comentado abajo): renombrado físico de tablas/columnas
-- y eliminación de campos candidatos no usados (revisar antes de habilitar)
-- =====================================================

USE [presupuestacion];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
	BEGIN TRAN;

	-- =====================================================
	-- PASO 1: LIMPIEZA DE SINÓNIMOS/VISTAS PREVIOS (si existen)
	-- =====================================================
	-- Eliminar vistas existentes
	IF OBJECT_ID('dbo.vw_piezas', 'V') IS NOT NULL DROP VIEW dbo.vw_piezas;
	IF OBJECT_ID('dbo.vw_materiales', 'V') IS NOT NULL DROP VIEW dbo.vw_materiales;
	IF OBJECT_ID('dbo.vw_zonas', 'V') IS NOT NULL DROP VIEW dbo.vw_zonas;
	IF OBJECT_ID('dbo.vw_precios_piezas', 'V') IS NOT NULL DROP VIEW dbo.vw_precios_piezas;
	IF OBJECT_ID('dbo.vw_precios_materiales_planta', 'V') IS NOT NULL DROP VIEW dbo.vw_precios_materiales_planta;
	IF OBJECT_ID('dbo.vw_stock_material_planta', 'V') IS NOT NULL DROP VIEW dbo.vw_stock_material_planta;
	IF OBJECT_ID('dbo.vw_cotizaciones', 'V') IS NOT NULL DROP VIEW dbo.vw_cotizaciones;
	IF OBJECT_ID('dbo.vw_items_cotizacion', 'V') IS NOT NULL DROP VIEW dbo.vw_items_cotizacion;
	IF OBJECT_ID('dbo.vw_usuarios', 'V') IS NOT NULL DROP VIEW dbo.vw_usuarios;

	-- Eliminar sinónimos existentes (si los creaste previamente)
	DECLARE @syns TABLE(name sysname);
	INSERT INTO @syns(name)
	VALUES
		('piezas'),
		('materiales'),
		('zonas'),
		('precios_piezas'),
		('precios_materiales_planta'),
		('stock_material_planta'),
		('usuarios'),
		('roles'),
		('permisos'),
		('roles_usuario'),
		('permisos_usuario'),
		('sesiones_usuario'),
		('proyectos'),
		('cotizaciones'),
		('items_cotizacion'),
		('familias_piezas'),
		('unidades_medida'),
		('parametros_proceso');

	DECLARE @name sysname, @sql NVARCHAR(MAX);
	WHILE EXISTS(SELECT 1 FROM @syns)
	BEGIN
		SELECT TOP 1 @name = name FROM @syns;
		IF OBJECT_ID(QUOTENAME('dbo') + '.' + QUOTENAME(@name), 'SN') IS NOT NULL
		BEGIN
			SET @sql = N'DROP SYNONYM dbo.' + QUOTENAME(@name) + N';';
			EXEC sp_executesql @sql;
		END;
		DELETE FROM @syns WHERE name = @name;
	END;

	-- =====================================================
	-- PASO 2: CREAR SINÓNIMOS (alias de tablas con nombre en español)
	-- =====================================================
	-- Núcleo
	CREATE SYNONYM dbo.piezas FOR dbo.pieces;
	CREATE SYNONYM dbo.materiales FOR dbo.materials;
	CREATE SYNONYM dbo.zonas FOR dbo.zones;
	CREATE SYNONYM dbo.usuarios FOR dbo.users;
	CREATE SYNONYM dbo.familias_piezas FOR dbo.piece_families;
	CREATE SYNONYM dbo.unidades_medida FOR dbo.units_of_measure;

	-- Cotizaciones/Proyectos
	CREATE SYNONYM dbo.proyectos FOR dbo.projects;
	CREATE SYNONYM dbo.cotizaciones FOR dbo.quotations;
	CREATE SYNONYM dbo.items_cotizacion FOR dbo.quotation_items;

	-- Seguridad
	CREATE SYNONYM dbo.roles FOR dbo.roles;
	CREATE SYNONYM dbo.permisos FOR dbo.permissions;
	CREATE SYNONYM dbo.roles_usuario FOR dbo.user_roles;
	CREATE SYNONYM dbo.permisos_usuario FOR dbo.user_permissions;
	CREATE SYNONYM dbo.sesiones_usuario FOR dbo.user_sessions;

	-- Materiales (planta)
	CREATE SYNONYM dbo.precios_materiales_planta FOR dbo.material_plant_prices;
	CREATE SYNONYM dbo.stock_material_planta FOR dbo.material_plant_stock;

	-- Piezas / Precios
	CREATE SYNONYM dbo.precios_piezas FOR dbo.piece_prices;

	-- Parámetros/Proceso
	CREATE SYNONYM dbo.parametros_proceso FOR dbo.process_parameters;

	-- =====================================================
	-- PASO 3: CREAR VISTAS CON COLUMNAS EN ESPAÑOL (lectura)
	-- =====================================================
	-- Nota: estas vistas exponen nombres de columnas en español sin alterar la estructura base

	CREATE VIEW dbo.vw_piezas AS
	SELECT 
		p.id,
		p.code            AS codigo,
		p.name            AS nombre,
		p.description     AS descripcion,
		p.family_id       AS familia_id,
		p.unit_id         AS unidad_id,
		p.length          AS largo,
		p.width           AS ancho,
		p.height          AS alto,
		p.weight          AS peso,
		p.volume          AS volumen,
		p.is_active       AS activo,
		p.created_at      AS creado_en,
		p.updated_at      AS actualizado_en,
		p.deleted_at      AS eliminado_en
	FROM dbo.pieces p;

	CREATE VIEW dbo.vw_materiales AS
	SELECT 
		m.id,
		m.code           AS codigo,
		m.name           AS nombre,
		m.description    AS descripcion,
		m.category       AS categoria,
		m.subcategory    AS subcategoria,
		m.unit           AS unidad,
		m.density        AS densidad,
		m.minimum_stock  AS stock_minimo,
		m.maximum_stock  AS stock_maximo,
		m.reorder_point  AS punto_reorden,
		m.lead_time_days AS dias_plazo,
		m.is_active      AS activo,
		m.created_at     AS creado_en,
		m.updated_at     AS actualizado_en
	FROM dbo.materials m;

	CREATE VIEW dbo.vw_zonas AS
	SELECT 
		z.id,
		z.code         AS codigo,
		z.name         AS nombre,
		z.description  AS descripcion,
		z.is_active    AS activo,
		z.display_order AS orden_visualizacion,
		z.address      AS direccion,
		z.city         AS ciudad,
		z.state        AS estado,
		z.latitude     AS latitud,
		z.longitude    AS longitud,
		z.contact_name  AS contacto_nombre,
		z.contact_phone AS contacto_telefono,
		z.contact_email AS contacto_correo,
		z.zone_type     AS tipo_zona,
		z.created_at   AS creado_en,
		z.updated_at   AS actualizado_en
	FROM dbo.zones z;

	CREATE VIEW dbo.vw_precios_piezas AS
	SELECT 
		pp.id,
		pp.piece_id      AS pieza_id,
		pp.zone_id       AS zona_id,
		pp.base_price    AS precio_base,
		pp.adjustment    AS ajuste,
		pp.final_price   AS precio_final,
		pp.effective_date AS fecha_efectiva,
		pp.expiry_date    AS fecha_expiracion,
		pp.created_by     AS creado_por,
		pp.created_at     AS creado_en,
		pp.updated_at     AS actualizado_en
	FROM dbo.piece_prices pp;

	CREATE VIEW dbo.vw_precios_materiales_planta AS
	SELECT 
		mpp.id,
		mpp.material_id  AS material_id,
		mpp.zone_id      AS zona_id,
		mpp.price        AS precio,
		mpp.currency     AS moneda,
		mpp.valid_from   AS valido_desde,
		mpp.valid_until  AS valido_hasta,
		mpp.is_active    AS activo,
		mpp.created_at   AS creado_en,
		mpp.updated_at   AS actualizado_en
	FROM dbo.material_plant_prices mpp;

	CREATE VIEW dbo.vw_stock_material_planta AS
	SELECT 
		mps.id,
		mps.material_id    AS material_id,
		mps.zone_id        AS zona_id,
		mps.current_stock  AS stock_actual,
		mps.reserved_stock AS stock_reservado,
		mps.available_stock AS stock_disponible,
		mps.minimum_stock  AS stock_minimo,
		mps.maximum_stock  AS stock_maximo,
		mps.reorder_point  AS punto_reorden,
		mps.location       AS ubicacion,
		mps.updated_at     AS actualizado_en,
		mps.updated_by     AS actualizado_por
	FROM dbo.material_plant_stock mps;

	CREATE VIEW dbo.vw_cotizaciones AS
	SELECT 
		q.id,
		q.project_id   AS proyecto_id,
		q.version      AS version,
		q.date         AS fecha,
		q.valid_until  AS valido_hasta,
		q.status       AS estado,
		q.notes        AS notas,
		q.created_by   AS creado_por,
		q.created_at   AS creado_en,
		q.updated_at   AS actualizado_en
	FROM dbo.quotations q;

	CREATE VIEW dbo.vw_items_cotizacion AS
	SELECT 
		qi.id,
		qi.quotation_id AS cotizacion_id,
		qi.piece_id     AS pieza_id,
		qi.quantity     AS cantidad,
		qi.unit_price   AS precio_unitario,
		qi.created_at   AS creado_en,
		qi.updated_at   AS actualizado_en
	FROM dbo.quotation_items qi;

	CREATE VIEW dbo.vw_usuarios AS
	SELECT 
		u.id,
		u.username       AS nombre_usuario,
		u.email          AS correo,
		u.first_name     AS nombre,
		u.last_name      AS apellido,
		u.is_active      AS activo,
		u.created_at     AS creado_en,
		u.updated_at     AS actualizado_en
	FROM dbo.users u;

	COMMIT TRAN;
END TRY
BEGIN CATCH
	IF @@TRANCOUNT > 0 ROLLBACK TRAN;
	THROW;
END CATCH;
GO

-- =====================================================
-- OPCIONAL: RENOMBRADO FÍSICO DE TABLAS Y COLUMNAS
-- (Habilitar sólo si vas a actualizar el código para usar los nuevos nombres)
-- =====================================================
/*
BEGIN TRY
	BEGIN TRAN;

	-- Ejemplos de renombrado de tablas (usa según corresponda)
	EXEC sp_rename 'dbo.pieces', 'piezas';
	EXEC sp_rename 'dbo.materials', 'materiales';
	EXEC sp_rename 'dbo.zones', 'zonas';
	EXEC sp_rename 'dbo.piece_prices', 'precios_piezas';
	EXEC sp_rename 'dbo.material_plant_prices', 'precios_materiales_planta';
	EXEC sp_rename 'dbo.material_plant_stock', 'stock_material_planta';
	EXEC sp_rename 'dbo.users', 'usuarios';
	EXEC sp_rename 'dbo.units_of_measure', 'unidades_medida';
	EXEC sp_rename 'dbo.piece_material_formulas', 'formulas_material_pieza';
	EXEC sp_rename 'dbo.process_parameters', 'parametros_proceso';
	EXEC sp_rename 'dbo.quotations', 'cotizaciones';
	EXEC sp_rename 'dbo.quotation_items', 'items_cotizacion';
	EXEC sp_rename 'dbo.piece_families', 'familias_piezas';

	-- Ejemplos de renombrado de columnas (verifica existencia previamente)
	IF COL_LENGTH('dbo.piezas','name') IS NOT NULL EXEC sp_rename 'dbo.piezas.name', 'nombre', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','code') IS NOT NULL EXEC sp_rename 'dbo.piezas.code', 'codigo', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','description') IS NOT NULL EXEC sp_rename 'dbo.piezas.description', 'descripcion', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','family_id') IS NOT NULL EXEC sp_rename 'dbo.piezas.family_id', 'familia_id', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','unit_id') IS NOT NULL EXEC sp_rename 'dbo.piezas.unit_id', 'unidad_id', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','is_active') IS NOT NULL EXEC sp_rename 'dbo.piezas.is_active', 'activo', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','created_at') IS NOT NULL EXEC sp_rename 'dbo.piezas.created_at', 'creado_en', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','updated_at') IS NOT NULL EXEC sp_rename 'dbo.piezas.updated_at', 'actualizado_en', 'COLUMN';
	IF COL_LENGTH('dbo.piezas','deleted_at') IS NOT NULL EXEC sp_rename 'dbo.piezas.deleted_at', 'eliminado_en', 'COLUMN';

	IF COL_LENGTH('dbo.materiales','name') IS NOT NULL EXEC sp_rename 'dbo.materiales.name', 'nombre', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','code') IS NOT NULL EXEC sp_rename 'dbo.materiales.code', 'codigo', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','description') IS NOT NULL EXEC sp_rename 'dbo.materiales.description', 'descripcion', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','unit') IS NOT NULL EXEC sp_rename 'dbo.materiales.unit', 'unidad', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','is_active') IS NOT NULL EXEC sp_rename 'dbo.materiales.is_active', 'activo', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','created_at') IS NOT NULL EXEC sp_rename 'dbo.materiales.created_at', 'creado_en', 'COLUMN';
	IF COL_LENGTH('dbo.materiales','updated_at') IS NOT NULL EXEC sp_rename 'dbo.materiales.updated_at', 'actualizado_en', 'COLUMN';

	IF COL_LENGTH('dbo.zonas','name') IS NOT NULL EXEC sp_rename 'dbo.zonas.name', 'nombre', 'COLUMN';
	IF COL_LENGTH('dbo.zonas','code') IS NOT NULL EXEC sp_rename 'dbo.zonas.code', 'codigo', 'COLUMN';
	IF COL_LENGTH('dbo.zonas','description') IS NOT NULL EXEC sp_rename 'dbo.zonas.description', 'descripcion', 'COLUMN';
	IF COL_LENGTH('dbo.zonas','is_active') IS NOT NULL EXEC sp_rename 'dbo.zonas.is_active', 'activo', 'COLUMN';
	IF COL_LENGTH('dbo.zonas','created_at') IS NOT NULL EXEC sp_rename 'dbo.zonas.created_at', 'creado_en', 'COLUMN';
	IF COL_LENGTH('dbo.zonas','updated_at') IS NOT NULL EXEC sp_rename 'dbo.zonas.updated_at', 'actualizado_en', 'COLUMN';

	IF COL_LENGTH('dbo.precios_piezas','piece_id') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.piece_id', 'pieza_id', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','zone_id') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.zone_id', 'zona_id', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','base_price') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.base_price', 'precio_base', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','final_price') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.final_price', 'precio_final', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','adjustment') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.adjustment', 'ajuste', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','effective_date') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.effective_date', 'fecha_efectiva', 'COLUMN';
	IF COL_LENGTH('dbo.precios_piezas','expiry_date') IS NOT NULL EXEC sp_rename 'dbo.precios_piezas.expiry_date', 'fecha_expiracion', 'COLUMN';

	-- (Agrega aquí más renombrados por tabla según tu esquema)

	-- OPCIONAL: ELIMINACIÓN DE COLUMNAS CANDIDATAS (revísalas antes)
	-- ALTER TABLE dbo.piezas DROP COLUMN seismic_zone;
	-- ALTER TABLE dbo.piezas DROP COLUMN wind_pressure;
	-- ALTER TABLE dbo.piezas DROP COLUMN is_roof_surface, is_floor_surface, is_prestressed, is_enclosure;
	-- ALTER TABLE dbo.piezas DROP COLUMN allows_optional, is_individual, is_surface, requires_index_sheet;
	-- ALTER TABLE dbo.piezas DROP COLUMN thickness, diameter, length_from, length_to, units_per_truck, section;

	COMMIT TRAN;
END TRY
BEGIN CATCH
	IF @@TRANCOUNT > 0 ROLLBACK TRAN;
	THROW;
END CATCH;
*/

-- =====================================================
-- ELIMINACIÓN SEGURA DE CAMPOS NO USADOS (PIEZAS)
-- Ejecuta esta sección si ya actualizaste el código para no depender de ellos
-- =====================================================
BEGIN TRY
	BEGIN TRAN;
	IF COL_LENGTH('dbo.pieces','section') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN section;
	IF COL_LENGTH('dbo.pieces','seismic_zone') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN seismic_zone;
	IF COL_LENGTH('dbo.pieces','concrete_code') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN concrete_code;
	IF COL_LENGTH('dbo.pieces','wind_pressure') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN wind_pressure;
	IF COL_LENGTH('dbo.pieces','length_from') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN length_from;
	IF COL_LENGTH('dbo.pieces','length_to') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN length_to;
	IF COL_LENGTH('dbo.pieces','units_per_truck') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN units_per_truck;
	IF COL_LENGTH('dbo.pieces','is_roof_surface') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_roof_surface;
	IF COL_LENGTH('dbo.pieces','is_floor_surface') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_floor_surface;
	IF COL_LENGTH('dbo.pieces','is_prestressed') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_prestressed;
	IF COL_LENGTH('dbo.pieces','is_enclosure') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_enclosure;
	IF COL_LENGTH('dbo.pieces','allows_optional') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN allows_optional;
	IF COL_LENGTH('dbo.pieces','is_individual') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_individual;
	IF COL_LENGTH('dbo.pieces','is_surface') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN is_surface;
	IF COL_LENGTH('dbo.pieces','requires_index_sheet') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN requires_index_sheet;
	IF COL_LENGTH('dbo.pieces','drawing_name') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN drawing_name;
	IF COL_LENGTH('dbo.pieces','can_quote') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN can_quote;
	IF COL_LENGTH('dbo.pieces','formula_coefficient') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN formula_coefficient;
	IF COL_LENGTH('dbo.pieces','global_coefficient') IS NOT NULL ALTER TABLE dbo.pieces DROP COLUMN global_coefficient;
	COMMIT TRAN;
END TRY
BEGIN CATCH
	IF @@TRANCOUNT > 0 ROLLBACK TRAN;
	THROW;
END CATCH;
GO