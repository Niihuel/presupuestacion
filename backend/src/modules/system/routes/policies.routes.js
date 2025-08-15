const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('@compartido/middleware/auth.middleware');
const { catchAsync, AppError } = require('@utilidades');
const ApiResponse = require('@utilidades/ApiResponse');
const SystemConfig = require('@modelos/SystemConfig.model');

const DEFAULT_POLICIES = {
	USE_SERVER_PRICE: true,
	ENABLE_PACKING: true,
	ENABLE_MOUNTING: true,
	ENABLE_TRANSPORT: true,
	REQUIRE_APPROVAL: false,
	AUTO_PUBLISH_PRICES: false,
	DEFAULT_GG_PERCENT: 10,
	DEFAULT_PROFIT_PERCENT: 0,
	DEFAULT_ENGINEERING_PERCENT: 0,
	DEFAULT_TAX_PERCENT: 21,
	MONEY_DECIMALS: 2,
	WEIGHT_DECIMALS: 3,
	TRIPS_ROUNDING: 'CEILING',
	MAX_DISCOUNT_PERCENT: 20,
	MAX_PIECES_PER_QUOTE: 100,
	MAX_TRANSPORT_DISTANCE: 500,
	REQUIRE_BOM_FOR_PUBLISH: true,
	REQUIRE_TECHNICAL_DATA: true,
	ALLOW_ZERO_PRICE: false,
};

async function getOrCreateConfig(userId) {
	let cfg = await SystemConfig.findOne();
	if (!cfg) {
		cfg = await SystemConfig.create({
			config: { policies: DEFAULT_POLICIES },
			version: '1.0.0',
			createdBy: userId || null,
			updatedBy: userId || null
		});
	}
	return cfg;
}

router.use(authenticate);

// GET /api/v1/policies
router.get('/', catchAsync(async (req, res) => {
	const cfg = await getOrCreateConfig(req.user?.id);
	const policies = { ...DEFAULT_POLICIES, ...(cfg.config?.policies || {}) };
	res.json(ApiResponse.success(policies, 'Políticas obtenidas exitosamente'));
}));

// PUT /api/v1/policies
router.put('/', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const input = req.body || {};
	const cfg = await getOrCreateConfig(req.user?.id);
	const current = cfg.config || {};
	const merged = { ...DEFAULT_POLICIES, ...(current.policies || {}), ...input };
	cfg.setConfigValue('policies', merged);
	cfg.updatedBy = req.user?.id || cfg.updatedBy;
	await cfg.save();
	res.json(ApiResponse.success(merged, 'Políticas actualizadas'));
}));

module.exports = router;
