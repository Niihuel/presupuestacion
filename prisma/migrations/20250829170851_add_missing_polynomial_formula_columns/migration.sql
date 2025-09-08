BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000),
    [tax_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Company_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Role_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] NVARCHAR(1000) NOT NULL,
    [resource] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_resource_action_key] UNIQUE NONCLUSTERED ([resource],[action])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [roleId] NVARCHAR(1000) NOT NULL,
    [permissionId] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [assigned_at] DATETIME2 NOT NULL CONSTRAINT [RolePermission_assigned_at_df] DEFAULT CURRENT_TIMESTAMP,
    [assigned_by] NVARCHAR(1000),
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([roleId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [first_name] NVARCHAR(1000),
    [last_name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [emailVerified] DATETIME2,
    [image] NVARCHAR(1000),
    [password_hash] NVARCHAR(1000),
    [is_super_admin] BIT NOT NULL CONSTRAINT [User_is_super_admin_df] DEFAULT 0,
    [active] BIT NOT NULL CONSTRAINT [User_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [User_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [is_approved] BIT NOT NULL CONSTRAINT [User_is_approved_df] DEFAULT 0,
    [approved_at] DATETIME2,
    [approved_by] NVARCHAR(1000),
    [rejected_at] DATETIME2,
    [rejection_reason] NVARCHAR(1000),
    [registration_token] NVARCHAR(1000),
    [provider] NVARCHAR(1000),
    [provider_id] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [department] NVARCHAR(1000),
    [position] NVARCHAR(1000),
    [roleId] NVARCHAR(1000),
    [companyId] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(max),
    [access_token] NVARCHAR(max),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] NVARCHAR(max),
    [session_state] NVARCHAR(1000),
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Session_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [last_activity] DATETIME2 NOT NULL CONSTRAINT [Session_last_activity_df] DEFAULT CURRENT_TIMESTAMP,
    [ip_address] NVARCHAR(1000),
    [user_agent] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [Session_is_active_df] DEFAULT 1,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [VerificationToken_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[LoginHistory] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [ip_address] NVARCHAR(1000),
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [LoginHistory_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [success] BIT NOT NULL,
    CONSTRAINT [LoginHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Customer] (
    [id] NVARCHAR(1000) NOT NULL,
    [display_name] NVARCHAR(1000),
    [company_name] NVARCHAR(1000) NOT NULL,
    [tax_id] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [province] NVARCHAR(1000),
    [postal_code] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [contact_person] NVARCHAR(1000),
    [activity_type] NVARCHAR(1000),
    [customer_type] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Customer_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [companyId] NVARCHAR(1000),
    CONSTRAINT [Customer_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] NVARCHAR(1000) NOT NULL,
    [customerId] NVARCHAR(1000) NOT NULL,
    [designer_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [province] NVARCHAR(1000),
    [postal_code] NVARCHAR(1000),
    [google_maps_url] NVARCHAR(1000),
    [distance_from_cordoba] INT,
    [distance_from_buenos_aires] INT,
    [distance_from_villa_maria] INT,
    [status] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Project_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Designer] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Designer_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Designer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Designer_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectFile] (
    [id] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [file_name] NVARCHAR(1000) NOT NULL,
    [file_url] NVARCHAR(1000) NOT NULL,
    [file_type] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000),
    [size] INT,
    [uploaded_at] DATETIME2 NOT NULL CONSTRAINT [ProjectFile_uploaded_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectFile_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectModel3D] (
    [id] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [model_url] NVARCHAR(1000) NOT NULL,
    [thumbnail_url] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ProjectModel3D_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectModel3D_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Plant] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [google_maps_url] NVARCHAR(1000),
    [active] BIT NOT NULL CONSTRAINT [Plant_active_df] DEFAULT 1,
    [companyId] NVARCHAR(1000),
    CONSTRAINT [Plant_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PieceFamily] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [category] NVARCHAR(1000),
    [requires_mold] BIT NOT NULL CONSTRAINT [PieceFamily_requires_mold_df] DEFAULT 0,
    [requires_cables] BIT NOT NULL CONSTRAINT [PieceFamily_requires_cables_df] DEFAULT 0,
    [requires_vapor_cycle] BIT NOT NULL CONSTRAINT [PieceFamily_requires_vapor_cycle_df] DEFAULT 0,
    [max_cables] INT,
    [default_concrete_type] NVARCHAR(1000),
    CONSTRAINT [PieceFamily_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PieceFamily_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Piece] (
    [id] NVARCHAR(1000) NOT NULL,
    [family_id] NVARCHAR(1000) NOT NULL,
    [plant_id] NVARCHAR(1000),
    [mold_id] NVARCHAR(1000),
    [description] NVARCHAR(1000) NOT NULL,
    [weight] FLOAT(53),
    [width] FLOAT(53),
    [length] FLOAT(53),
    [thickness] FLOAT(53),
    [height] FLOAT(53),
    [section] NVARCHAR(1000),
    [volume] FLOAT(53),
    [unit_measure] NVARCHAR(1000),
    [price_cordoba] FLOAT(53),
    [price_buenos_aires] FLOAT(53),
    [price_villa_maria] FLOAT(53),
    [allows_optional] BIT NOT NULL CONSTRAINT [Piece_allows_optional_df] DEFAULT 0,
    [individual_transport] BIT NOT NULL CONSTRAINT [Piece_individual_transport_df] DEFAULT 0,
    [pieces_per_truck] INT,
    [production_time] INT,
    [concrete_type] NVARCHAR(1000),
    [steel_quantity] FLOAT(53),
    [requires_escort] BIT NOT NULL CONSTRAINT [Piece_requires_escort_df] DEFAULT 0,
    [max_stackable] INT,
    [special_handling] NVARCHAR(1000),
    [cable_count] INT,
    [mesh_layers] INT,
    [has_antiseismic] BIT NOT NULL CONSTRAINT [Piece_has_antiseismic_df] DEFAULT 0,
    [has_insulation] BIT NOT NULL CONSTRAINT [Piece_has_insulation_df] DEFAULT 0,
    [track_length] FLOAT(53),
    [has_telgopor] BIT NOT NULL CONSTRAINT [Piece_has_telgopor_df] DEFAULT 0,
    [concrete_settlement] FLOAT(53),
    [steel_percent] FLOAT(53) NOT NULL CONSTRAINT [Piece_steel_percent_df] DEFAULT 0.4172,
    [labor_percent] FLOAT(53) NOT NULL CONSTRAINT [Piece_labor_percent_df] DEFAULT 0.30969,
    [concrete_percent] FLOAT(53) NOT NULL CONSTRAINT [Piece_concrete_percent_df] DEFAULT 0.207,
    [fuel_percent] FLOAT(53) NOT NULL CONSTRAINT [Piece_fuel_percent_df] DEFAULT 0.101,
    CONSTRAINT [Piece_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Budget] (
    [id] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL CONSTRAINT [Budget_version_df] DEFAULT 1,
    [customerId] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [seller_id] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Budget_status_df] DEFAULT 'DRAFT',
    [parent_budget_id] NVARCHAR(1000),
    [request_date] DATETIME2,
    [budget_date] DATETIME2,
    [delivery_terms] NVARCHAR(1000),
    [payment_conditions] NVARCHAR(1000),
    [validity_days] INT,
    [notes] NVARCHAR(1000),
    [total_materials] FLOAT(53),
    [total_freight] FLOAT(53),
    [total_assembly] FLOAT(53),
    [total_additionals] FLOAT(53),
    [taxes] FLOAT(53),
    [final_total] FLOAT(53),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Budget_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [is_draft] BIT NOT NULL CONSTRAINT [Budget_is_draft_df] DEFAULT 1,
    [draft_step] INT CONSTRAINT [Budget_draft_step_df] DEFAULT 1,
    [draft_data] NVARCHAR(max),
    [completed_steps] NVARCHAR(100) NOT NULL CONSTRAINT [Budget_completed_steps_df] DEFAULT '[]',
    [resume_token] NVARCHAR(1000),
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Budget_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Additional] (
    [id] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [category] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [Additional_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Additional_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(1000),
    CONSTRAINT [Additional_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stock_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [plant_id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [location] NVARCHAR(1000),
    CONSTRAINT [stock_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [stock_items_piece_id_plant_id_key] UNIQUE NONCLUSTERED ([piece_id],[plant_id])
);

-- CreateTable
CREATE TABLE [dbo].[stock_movements] (
    [id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [plant_id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [budget_id] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stock_movements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [user_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [stock_movements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [pieceId] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [truck_number] INT,
    [length] FLOAT(53),
    [unit_price] FLOAT(53),
    [adjustment] FLOAT(53),
    [origin_plant] NVARCHAR(1000),
    [optional] BIT NOT NULL CONSTRAINT [BudgetItem_optional_df] DEFAULT 0,
    [subtotal] FLOAT(53),
    CONSTRAINT [BudgetItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetAdditional] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [unit_price] FLOAT(53) NOT NULL,
    [total] FLOAT(53) NOT NULL,
    CONSTRAINT [BudgetAdditional_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Parameter] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [value] FLOAT(53) NOT NULL,
    [unit] NVARCHAR(1000),
    [effective_date] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(1000),
    CONSTRAINT [Parameter_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Parameter_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ParameterHistory] (
    [id] NVARCHAR(1000) NOT NULL,
    [parameter_id] NVARCHAR(1000) NOT NULL,
    [value] FLOAT(53) NOT NULL,
    [effective_date] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ParameterHistory_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ParameterHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MaterialPrice] (
    [id] NVARCHAR(1000) NOT NULL,
    [material_type] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [unit] NVARCHAR(1000),
    [effective_date] DATETIME2 NOT NULL,
    [adjustment_percentage] FLOAT(53),
    CONSTRAINT [MaterialPrice_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[FreightRate] (
    [id] NVARCHAR(1000) NOT NULL,
    [origin] NVARCHAR(1000) NOT NULL,
    [km_from] INT NOT NULL,
    [km_to] INT NOT NULL,
    [rate_under_12m] FLOAT(53) NOT NULL,
    [rate_over_12m] FLOAT(53) NOT NULL,
    [min_capacity] FLOAT(53) NOT NULL CONSTRAINT [FreightRate_min_capacity_df] DEFAULT 24,
    [effective_date] DATETIME2 NOT NULL,
    [expiration_date] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [FreightRate_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [FreightRate_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [FreightRate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FreightRate_origin_km_from_km_to_effective_date_key] UNIQUE NONCLUSTERED ([origin],[km_from],[km_to],[effective_date])
);

-- CreateTable
CREATE TABLE [dbo].[AssemblyRate] (
    [id] NVARCHAR(1000) NOT NULL,
    [km_from] INT NOT NULL,
    [km_to] INT NOT NULL,
    [rate_under_100t] FLOAT(53) NOT NULL,
    [rate_100_300t] FLOAT(53) NOT NULL,
    [rate_over_300t] FLOAT(53) NOT NULL,
    CONSTRAINT [AssemblyRate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PolynomialFormula] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [steel_coefficient] FLOAT(53),
    [labor_coefficient] FLOAT(53),
    [concrete_coefficient] FLOAT(53),
    [fuel_coefficient] FLOAT(53),
    [steel_weight] FLOAT(53),
    [labor_weight] FLOAT(53),
    [concrete_weight] FLOAT(53),
    [diesel_weight] FLOAT(53),
    [effective_date] DATETIME2 NOT NULL,
    [expiration_date] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [PolynomialFormula_is_active_df] DEFAULT 0,
    [notes] NVARCHAR(1000),
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [PolynomialFormula_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [PolynomialFormula_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Truck] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000),
    [plate] NVARCHAR(1000) NOT NULL,
    [brand] NVARCHAR(1000),
    [model] NVARCHAR(1000),
    [capacity_tons] FLOAT(53),
    [max_length] FLOAT(53),
    [max_pieces] INT,
    [is_company_owned] BIT NOT NULL CONSTRAINT [Truck_is_company_owned_df] DEFAULT 0,
    [active] BIT NOT NULL CONSTRAINT [Truck_active_df] DEFAULT 1,
    [truck_type] NVARCHAR(1000) NOT NULL CONSTRAINT [Truck_truck_type_df] DEFAULT 'STANDARD',
    [min_billable_tons] FLOAT(53) CONSTRAINT [Truck_min_billable_tons_df] DEFAULT 21.0,
    [description] NVARCHAR(1000),
    CONSTRAINT [Truck_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Truck_plate_key] UNIQUE NONCLUSTERED ([plate])
);

-- CreateTable
CREATE TABLE [dbo].[FreightCalculation] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [origin_plant] NVARCHAR(1000) NOT NULL,
    [destination] NVARCHAR(1000) NOT NULL,
    [distance_km] INT NOT NULL,
    [truck_loads] INT NOT NULL,
    [false_tonnage] FLOAT(53),
    [total_cost] FLOAT(53) NOT NULL,
    CONSTRAINT [FreightCalculation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetFreight] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [truck_number] INT NOT NULL,
    [real_weight] FLOAT(53) NOT NULL,
    [false_weight] FLOAT(53) NOT NULL,
    [max_capacity] FLOAT(53) NOT NULL,
    [piece_count] INT NOT NULL,
    [over12m] BIT NOT NULL CONSTRAINT [BudgetFreight_over12m_df] DEFAULT 0,
    [requires_escort] BIT NOT NULL CONSTRAINT [BudgetFreight_requires_escort_df] DEFAULT 0,
    [cost] FLOAT(53) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BudgetFreight_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BudgetFreight_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[budget_freight_pieces] (
    [id] NVARCHAR(1000) NOT NULL,
    [budget_freight_id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [budget_freight_pieces_quantity_df] DEFAULT 1,
    CONSTRAINT [budget_freight_pieces_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_freight_pieces_budget_freight_id_piece_id_key] UNIQUE NONCLUSTERED ([budget_freight_id],[piece_id])
);

-- CreateTable
CREATE TABLE [dbo].[budget_pieces] (
    [id] NVARCHAR(1000) NOT NULL,
    [budget_id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [unit_price] FLOAT(53) NOT NULL,
    [total_price] FLOAT(53) NOT NULL,
    [transport_km] INT,
    [special_requirements] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [budget_pieces_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [budget_pieces_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_pieces_budget_id_piece_id_key] UNIQUE NONCLUSTERED ([budget_id],[piece_id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetTracking] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [comments] NVARCHAR(1000),
    [changed_by] NVARCHAR(1000) NOT NULL,
    [changed_at] DATETIME2 NOT NULL CONSTRAINT [BudgetTracking_changed_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BudgetTracking_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetObservation] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [observation] NVARCHAR(1000) NOT NULL,
    [next_contact_date] DATETIME2,
    [alert_enabled] BIT NOT NULL CONSTRAINT [BudgetObservation_alert_enabled_df] DEFAULT 0,
    [created_by] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [BudgetObservation_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BudgetObservation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetDraftHistory] (
    [id] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000) NOT NULL,
    [step] INT NOT NULL,
    [data] NVARCHAR(max) NOT NULL,
    [saved_at] DATETIME2 NOT NULL CONSTRAINT [BudgetDraftHistory_saved_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BudgetDraftHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectTracking] (
    [id] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [budgetId] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [scheduledDate] DATETIME2 NOT NULL,
    [completedDate] DATETIME2,
    [notes] NVARCHAR(1000),
    [reminderDays] NVARCHAR(1000) NOT NULL CONSTRAINT [ProjectTracking_reminderDays_df] DEFAULT '[7,3,1]',
    [lastReminder] DATETIME2,
    CONSTRAINT [ProjectTracking_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TrackingNotification] (
    [id] NVARCHAR(1000) NOT NULL,
    [trackingId] NVARCHAR(1000) NOT NULL,
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [TrackingNotification_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    [type] NVARCHAR(1000) NOT NULL,
    [recipient] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TrackingNotification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SystemAlert] (
    [id] NVARCHAR(1000) NOT NULL,
    [level] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [SystemAlert_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [read] BIT NOT NULL CONSTRAINT [SystemAlert_read_df] DEFAULT 0,
    CONSTRAINT [SystemAlert_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Mold] (
    [id] NVARCHAR(1000) NOT NULL,
    [family_id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [plant_id] NVARCHAR(1000),
    [active] BIT NOT NULL CONSTRAINT [Mold_active_df] DEFAULT 1,
    CONSTRAINT [Mold_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Mold_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Material] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    [current_price] FLOAT(53) NOT NULL,
    [last_price_update] DATETIME2 NOT NULL,
    [supplier] NVARCHAR(1000),
    [minimum_stock] FLOAT(53),
    [active] BIT NOT NULL CONSTRAINT [Material_active_df] DEFAULT 1,
    CONSTRAINT [Material_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Material_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[MaterialPriceHistory] (
    [id] NVARCHAR(1000) NOT NULL,
    [material_id] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [change_reason] NVARCHAR(1000),
    [change_percent] FLOAT(53),
    [effective_date] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [MaterialPriceHistory_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MaterialPriceHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PieceRecipe] (
    [id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [family_id] NVARCHAR(1000) NOT NULL,
    [mold_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL CONSTRAINT [PieceRecipe_version_df] DEFAULT 1,
    [active] BIT NOT NULL CONSTRAINT [PieceRecipe_active_df] DEFAULT 1,
    [labor_hours] FLOAT(53),
    [equipment_hours] FLOAT(53),
    [vapor_cycle_hours] FLOAT(53),
    [vapor_temperature] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [PieceRecipe_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PieceRecipe_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PieceRecipeDetail] (
    [id] NVARCHAR(1000) NOT NULL,
    [recipe_id] NVARCHAR(1000) NOT NULL,
    [material_id] NVARCHAR(1000) NOT NULL,
    [quantity] FLOAT(53) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    [is_optional] BIT NOT NULL CONSTRAINT [PieceRecipeDetail_is_optional_df] DEFAULT 0,
    [notes] NVARCHAR(1000),
    CONSTRAINT [PieceRecipeDetail_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PieceRecipeDetail_recipe_id_material_id_key] UNIQUE NONCLUSTERED ([recipe_id],[material_id])
);

-- CreateTable
CREATE TABLE [dbo].[CalendarEvent] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [date] DATETIME2 NOT NULL,
    [start_time] NVARCHAR(1000),
    [end_time] NVARCHAR(1000),
    [category] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000) CONSTRAINT [CalendarEvent_priority_df] DEFAULT 'media',
    [status] NVARCHAR(1000) CONSTRAINT [CalendarEvent_status_df] DEFAULT 'pendiente',
    [budget_id] NVARCHAR(1000),
    [project_id] NVARCHAR(1000),
    [client_id] NVARCHAR(1000),
    [days_until_expiry] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [CalendarEvent_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [CalendarEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PieceMaterial] (
    [id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [material_id] NVARCHAR(1000) NOT NULL,
    [quantity] FLOAT(53) NOT NULL,
    [scrap_percent] FLOAT(53) NOT NULL CONSTRAINT [PieceMaterial_scrap_percent_df] DEFAULT 0,
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [PieceMaterial_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [PieceMaterial_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PieceMaterial_piece_id_material_id_key] UNIQUE NONCLUSTERED ([piece_id],[material_id])
);

-- CreateTable
CREATE TABLE [dbo].[piece_formulas] (
    [id] NVARCHAR(1000) NOT NULL,
    [piece_id] NVARCHAR(1000) NOT NULL,
    [material_id] NVARCHAR(1000) NOT NULL,
    [quantity] FLOAT(53) NOT NULL,
    [scrap] FLOAT(53) NOT NULL CONSTRAINT [piece_formulas_scrap_df] DEFAULT 0,
    [unit] NVARCHAR(1000) NOT NULL,
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [piece_formulas_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [piece_formulas_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [piece_formulas_piece_id_material_id_key] UNIQUE NONCLUSTERED ([piece_id],[material_id])
);

-- CreateTable
CREATE TABLE [dbo].[AdjustmentScale] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL,
    [description] NVARCHAR(1000),
    [general_discount] FLOAT(53) NOT NULL CONSTRAINT [AdjustmentScale_general_discount_df] DEFAULT -15.0,
    [general_adjustment] FLOAT(53) NOT NULL CONSTRAINT [AdjustmentScale_general_adjustment_df] DEFAULT 311.365,
    [special_adjustment] FLOAT(53) CONSTRAINT [AdjustmentScale_special_adjustment_df] DEFAULT -20.0,
    [special_categories] NVARCHAR(1000) NOT NULL CONSTRAINT [AdjustmentScale_special_categories_df] DEFAULT 'TT,PLACAS_PLANAS',
    [effective_date] DATETIME2 NOT NULL,
    [expiration_date] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [AdjustmentScale_is_active_df] DEFAULT 0,
    [scales] NVARCHAR(max) NOT NULL,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [AdjustmentScale_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [AdjustmentScale_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdjustmentScale_effective_date_key] UNIQUE NONCLUSTERED ([effective_date]),
    CONSTRAINT [AdjustmentScale_name_version_key] UNIQUE NONCLUSTERED ([name],[version])
);

-- CreateTable
CREATE TABLE [dbo].[CostParameter] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    [value] FLOAT(53) NOT NULL,
    [description] NVARCHAR(1000),
    [effective_date] DATETIME2 NOT NULL,
    [expiration_date] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [CostParameter_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [CostParameter_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [CostParameter_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CostParameter_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[DollarExchangeRate] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [official_rate] FLOAT(53) NOT NULL,
    [blue_rate] FLOAT(53),
    [mep_rate] FLOAT(53),
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [DollarExchangeRate_source_df] DEFAULT 'BCRA',
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DollarExchangeRate_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DollarExchangeRate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DollarExchangeRate_date_key] UNIQUE NONCLUSTERED ([date])
);

-- CreateTable
CREATE TABLE [dbo].[MonthlyIndex] (
    [id] NVARCHAR(1000) NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [steel_index] FLOAT(53) NOT NULL,
    [labor_index] FLOAT(53) NOT NULL,
    [concrete_index] FLOAT(53) NOT NULL,
    [fuel_index] FLOAT(53) NOT NULL,
    [dollar] FLOAT(53) NOT NULL,
    [general_index] FLOAT(53),
    [dollar_rate] FLOAT(53) NOT NULL,
    [steel_variation] FLOAT(53),
    [dollar_variation] FLOAT(53),
    [source] NVARCHAR(1000) CONSTRAINT [MonthlyIndex_source_df] DEFAULT 'MANUAL',
    [notes] NVARCHAR(1000),
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [MonthlyIndex_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [MonthlyIndex_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MonthlyIndex_month_year_key] UNIQUE NONCLUSTERED ([month],[year])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [action] NVARCHAR(1000) NOT NULL,
    [resource] NVARCHAR(1000) NOT NULL,
    [resourceId] NVARCHAR(1000),
    [detail] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [AuditLog_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Session_expires_idx] ON [dbo].[Session]([expires]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Session_is_active_last_activity_idx] ON [dbo].[Session]([is_active], [last_activity]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Additional_is_active_idx] ON [dbo].[Additional]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_items_piece_id_idx] ON [dbo].[stock_items]([piece_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_items_plant_id_idx] ON [dbo].[stock_items]([plant_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_piece_id_idx] ON [dbo].[stock_movements]([piece_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_plant_id_idx] ON [dbo].[stock_movements]([plant_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_created_at_idx] ON [dbo].[stock_movements]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ParameterHistory_parameter_id_idx] ON [dbo].[ParameterHistory]([parameter_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ParameterHistory_effective_date_idx] ON [dbo].[ParameterHistory]([effective_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FreightRate_origin_is_active_idx] ON [dbo].[FreightRate]([origin], [is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FreightRate_effective_date_expiration_date_idx] ON [dbo].[FreightRate]([effective_date], [expiration_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PolynomialFormula_name_idx] ON [dbo].[PolynomialFormula]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_pieces_budget_id_idx] ON [dbo].[budget_pieces]([budget_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_pieces_piece_id_idx] ON [dbo].[budget_pieces]([piece_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BudgetDraftHistory_budgetId_step_idx] ON [dbo].[BudgetDraftHistory]([budgetId], [step]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProjectTracking_scheduledDate_status_idx] ON [dbo].[ProjectTracking]([scheduledDate], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SystemAlert_created_at_idx] ON [dbo].[SystemAlert]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalendarEvent_date_idx] ON [dbo].[CalendarEvent]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalendarEvent_category_idx] ON [dbo].[CalendarEvent]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalendarEvent_status_idx] ON [dbo].[CalendarEvent]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PieceMaterial_piece_id_idx] ON [dbo].[PieceMaterial]([piece_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PieceMaterial_material_id_idx] ON [dbo].[PieceMaterial]([material_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [piece_formulas_piece_id_idx] ON [dbo].[piece_formulas]([piece_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [piece_formulas_material_id_idx] ON [dbo].[piece_formulas]([material_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AdjustmentScale_is_active_effective_date_idx] ON [dbo].[AdjustmentScale]([is_active], [effective_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CostParameter_category_is_active_idx] ON [dbo].[CostParameter]([category], [is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CostParameter_effective_date_expiration_date_idx] ON [dbo].[CostParameter]([effective_date], [expiration_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DollarExchangeRate_date_idx] ON [dbo].[DollarExchangeRate]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MonthlyIndex_year_month_idx] ON [dbo].[MonthlyIndex]([year], [month]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MonthlyIndex_dollar_rate_idx] ON [dbo].[MonthlyIndex]([dollar_rate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_created_at_idx] ON [dbo].[AuditLog]([created_at]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
