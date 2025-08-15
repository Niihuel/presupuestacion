const rutasAuth = require('../modules/auth/routes/auth.routes');
const rutasCotizaciones = require('../modules/quotations/routes/quotation.routes');
const rutasZonas = require('../modules/zones/routes/zone.routes');
const { customerRoutes: rutasClientes } = require('../modules/customers');
const { projectRoutes: rutasProyectos } = require('../modules/projects');
const { pieceRoutes: rutasPiezas } = require('../modules/pieces');
const { routes: rutasTablero } = require('../modules/dashboard');
const rutasSistema = require('../modules/system');
const { routes: rutasMateriales } = require('../modules/materials');
const rutasAdmin = require('../modules/admin');
const { routes: rutasLogistica } = require('../modules/logistics');
const { routes: rutasCalculistas } = require('../modules/calculistas');
const { routes: rutasPlantas } = require('../modules/plantas');
const { routes: rutasPoliticas } = require('../modules/politicas');
const { routes: rutasTiposCamion } = require('../modules/tiposCamion');

module.exports = {
	rutasAuth,
	rutasCotizaciones,
	rutasZonas,
	rutasClientes,
	rutasProyectos,
	rutasPiezas,
	rutasTablero,
	rutasSistema,
	rutasMateriales,
	rutasAdmin,
	rutasLogistica,
	rutasCalculistas,
	rutasPlantas,
	rutasPoliticas,
	rutasTiposCamion
};