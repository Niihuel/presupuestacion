-- Migration: TVF v2 and Piece Technical Data
-- Date: 2025-01-14
-- Purpose: Extend TVF_piece_cost_breakdown to include Process and Labor costs
--          Add technical data columns to pieces table for UM-based calculations

-- ============================================
-- 1. Add technical data columns to pieces table
-- ============================================

-- Check if columns don't exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pieces') AND name = 'production_zone_id')
BEGIN
    ALTER TABLE dbo.pieces ADD production_zone_id INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pieces') AND name = 'categoria_ajuste')
BEGIN
    ALTER TABLE dbo.pieces ADD categoria_ajuste NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pieces') AND name = 'kg_acero_por_um')
BEGIN
    ALTER TABLE dbo.pieces ADD kg_acero_por_um DECIMAL(18, 4) NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pieces') AND name = 'volumen_m3_por_um')
BEGIN
    ALTER TABLE dbo.pieces ADD volumen_m3_por_um DECIMAL(18, 4) NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pieces') AND name = 'peso_tn_por_um')
BEGIN
    ALTER TABLE dbo.pieces ADD peso_tn_por_um DECIMAL(18, 4) NULL;
END
GO

-- Add foreign key for production_zone_id if not exists
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_pieces_production_zone')
BEGIN
    ALTER TABLE dbo.pieces WITH CHECK 
    ADD CONSTRAINT FK_pieces_production_zone 
    FOREIGN KEY (production_zone_id) REFERENCES dbo.zones(id);
END
GO

-- ============================================
-- 2. Drop existing TVF v1 if exists
-- ============================================
IF OBJECT_ID('dbo.TVF_piece_cost_breakdown', 'IF') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.TVF_piece_cost_breakdown;
END
GO

-- ============================================
-- 3. Create TVF v2 with Process and Labor costs
-- ============================================
CREATE FUNCTION dbo.TVF_piece_cost_breakdown (
    @piece_id INT,
    @zone_id INT,
    @as_of_date DATE = NULL
)
RETURNS TABLE
AS
RETURN
(
    WITH dt AS (
        SELECT CAST(COALESCE(@as_of_date, CAST(GETDATE() AS DATE)) AS DATE) AS as_of_date
    ),
    -- Get piece technical data
    piece_data AS (
        SELECT 
            p.id,
            p.kg_acero_por_um,
            p.volumen_m3_por_um,
            ISNULL(p.peso_tn_por_um, 
                CASE 
                    WHEN u.code = 'UND' THEN ISNULL(p.weight, 0) / 1000.0
                    ELSE 0
                END
            ) AS peso_tn_por_um,
            p.production_zone_id
        FROM dbo.pieces p
        INNER JOIN dbo.units_of_measure u ON p.unit_id = u.id
        WHERE p.id = @piece_id
    ),
    -- Get process parameters for the zone and month
    process_params AS (
        SELECT TOP 1
            pp.energia_curado_tn,
            pp.gg_fabrica_tn,
            pp.gg_empresa_tn,
            pp.utilidad_tn,
            pp.ingenieria_tn,
            pp.precio_hora,
            pp.horas_por_tn_acero,
            pp.horas_por_m3_hormigon
        FROM dbo.process_parameters pp
        CROSS JOIN dt
        WHERE (pp.zone_id = @zone_id OR pp.zone_id IS NULL)  -- Zone-specific or global
            AND pp.month_date <= dt.as_of_date
        ORDER BY 
            CASE WHEN pp.zone_id = @zone_id THEN 0 ELSE 1 END,  -- Prefer zone-specific
            pp.month_date DESC  -- Most recent
    ),
    -- Calculate materials cost
    materials_cost AS (
        SELECT
            ISNULL(SUM(
                (f.quantity_per_unit * (1 + ISNULL(f.waste_factor, 0))) * ISNULL(p.price, 0)
            ), 0) AS total_materials
        FROM dbo.piece_material_formulas f
        CROSS JOIN dt
        OUTER APPLY (
            SELECT TOP 1 mpp.price
            FROM dbo.material_plant_prices mpp
            WHERE mpp.zone_id = @zone_id
                AND mpp.is_active = 1
                AND mpp.valid_from <= dt.as_of_date
                AND (mpp.valid_until IS NULL OR mpp.valid_until >= dt.as_of_date)
                AND mpp.material_id = f.material_id
            ORDER BY mpp.valid_from DESC
        ) p
        WHERE f.piece_id = @piece_id
    )
    -- Final calculation with all components
    SELECT
        -- Materials cost (preserving v1 compatibility)
        CAST(ISNULL(mc.total_materials, 0) AS DECIMAL(18,2)) AS materiales,
        
        -- Process cost per ton
        CAST(
            CASE 
                WHEN pd.peso_tn_por_um > 0 AND pp.energia_curado_tn IS NOT NULL THEN
                    (ISNULL(pp.energia_curado_tn, 0) + 
                     ISNULL(pp.gg_fabrica_tn, 0) + 
                     ISNULL(pp.gg_empresa_tn, 0) + 
                     ISNULL(pp.utilidad_tn, 0) + 
                     ISNULL(pp.ingenieria_tn, 0)) * pd.peso_tn_por_um
                ELSE 0
            END AS DECIMAL(18,2)
        ) AS proceso_por_tn,
        
        -- Concrete labor cost
        CAST(
            CASE 
                WHEN pd.volumen_m3_por_um > 0 AND pp.horas_por_m3_hormigon IS NOT NULL THEN
                    ISNULL(pp.horas_por_m3_hormigon, 0) * ISNULL(pp.precio_hora, 0) * pd.volumen_m3_por_um
                ELSE 0
            END AS DECIMAL(18,2)
        ) AS mano_obra_hormigon,
        
        -- Steel labor cost
        CAST(
            CASE 
                WHEN pd.kg_acero_por_um > 0 AND pp.horas_por_tn_acero IS NOT NULL THEN
                    ISNULL(pp.horas_por_tn_acero, 0) * ISNULL(pp.precio_hora, 0) * (pd.kg_acero_por_um / 1000.0)
                ELSE 0
            END AS DECIMAL(18,2)
        ) AS mano_obra_acero,
        
        -- Total cost
        CAST(
            ISNULL(mc.total_materials, 0) +
            CASE 
                WHEN pd.peso_tn_por_um > 0 AND pp.energia_curado_tn IS NOT NULL THEN
                    (ISNULL(pp.energia_curado_tn, 0) + 
                     ISNULL(pp.gg_fabrica_tn, 0) + 
                     ISNULL(pp.gg_empresa_tn, 0) + 
                     ISNULL(pp.utilidad_tn, 0) + 
                     ISNULL(pp.ingenieria_tn, 0)) * pd.peso_tn_por_um
                ELSE 0
            END +
            CASE 
                WHEN pd.volumen_m3_por_um > 0 AND pp.horas_por_m3_hormigon IS NOT NULL THEN
                    ISNULL(pp.horas_por_m3_hormigon, 0) * ISNULL(pp.precio_hora, 0) * pd.volumen_m3_por_um
                ELSE 0
            END +
            CASE 
                WHEN pd.kg_acero_por_um > 0 AND pp.horas_por_tn_acero IS NOT NULL THEN
                    ISNULL(pp.horas_por_tn_acero, 0) * ISNULL(pp.precio_hora, 0) * (pd.kg_acero_por_um / 1000.0)
                ELSE 0
            END AS DECIMAL(18,2)
        ) AS total,
        
        -- Missing data flags
        CASE 
            WHEN pd.peso_tn_por_um IS NULL OR pd.peso_tn_por_um = 0 THEN 1
            WHEN pd.volumen_m3_por_um IS NULL OR pd.volumen_m3_por_um = 0 THEN 1
            WHEN pd.kg_acero_por_um IS NULL OR pd.kg_acero_por_um = 0 THEN 1
            ELSE 0
        END AS missing_geom,
        
        CASE 
            WHEN pp.energia_curado_tn IS NULL THEN 1
            ELSE 0
        END AS missing_process_params
        
    FROM piece_data pd
    CROSS JOIN materials_cost mc
    LEFT JOIN process_params pp ON 1=1
);
GO

-- ============================================
-- 4. Create helper function to get previous month price
-- ============================================
IF OBJECT_ID('dbo.FN_get_piece_price_previous_month', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.FN_get_piece_price_previous_month;
END
GO

CREATE FUNCTION dbo.FN_get_piece_price_previous_month (
    @piece_id INT,
    @zone_id INT,
    @current_date DATE
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @previous_month DATE = DATEADD(MONTH, -1, @current_date);
    DECLARE @price DECIMAL(18,2);
    
    SELECT TOP 1 @price = price_per_unit
    FROM dbo.piece_prices
    WHERE piece_id = @piece_id
        AND zone_id = @zone_id
        AND effective_date <= @previous_month
        AND is_active = 1
    ORDER BY effective_date DESC;
    
    RETURN ISNULL(@price, 0);
END;
GO

-- ============================================
-- 5. Create stored procedure for price publishing
-- ============================================
IF OBJECT_ID('dbo.SP_publish_piece_price', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.SP_publish_piece_price;
END
GO

CREATE PROCEDURE dbo.SP_publish_piece_price
    @piece_id INT,
    @zone_id INT,
    @effective_date DATE,
    @price_per_unit DECIMAL(18,2) = NULL,  -- If NULL, calculate using TVF
    @created_by INT,
    @price_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- If price not provided, calculate it
    IF @price_per_unit IS NULL
    BEGIN
        SELECT @price_per_unit = total
        FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @effective_date);
    END
    
    -- Check if price already exists for this piece/zone/date
    SELECT @price_id = id
    FROM dbo.piece_prices
    WHERE piece_id = @piece_id
        AND zone_id = @zone_id
        AND effective_date = @effective_date;
    
    IF @price_id IS NOT NULL
    BEGIN
        -- Update existing price
        UPDATE dbo.piece_prices
        SET price_per_unit = @price_per_unit,
            updated_at = GETDATE(),
            updated_by = @created_by
        WHERE id = @price_id;
    END
    ELSE
    BEGIN
        -- Insert new price
        INSERT INTO dbo.piece_prices (
            piece_id, zone_id, effective_date, price_per_unit, 
            is_active, created_at, created_by
        )
        VALUES (
            @piece_id, @zone_id, @effective_date, @price_per_unit,
            1, GETDATE(), @created_by
        );
        
        SET @price_id = SCOPE_IDENTITY();
    END
    
    -- Return the price details
    SELECT 
        pp.id,
        pp.piece_id,
        pp.zone_id,
        pp.effective_date,
        pp.price_per_unit,
        pp.is_active,
        pp.created_at,
        pp.updated_at
    FROM dbo.piece_prices pp
    WHERE pp.id = @price_id;
END;
GO

-- ============================================
-- 6. Grant permissions
-- ============================================
GRANT SELECT ON dbo.TVF_piece_cost_breakdown TO [public];
GRANT EXECUTE ON dbo.FN_get_piece_price_previous_month TO [public];
GRANT EXECUTE ON dbo.SP_publish_piece_price TO [public];
GO

PRINT 'Migration completed successfully: TVF v2 and Piece Technical Data';
GO