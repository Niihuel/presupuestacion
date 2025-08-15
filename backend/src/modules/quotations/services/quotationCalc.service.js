const { Op } = require('sequelize');
const { Quotation, QuotationItem, Zone } = require('@modelos');
const FreightRate = require('@modelos/FreightRate.model');
const MountingRate = require('@modelos/MountingRate.model');

async function getFreightRateForLength(distanceKm, maxLengthMeters) {
  const rateRow = await FreightRate.findOne({
    where: {
      km_from: { [Op.lte]: distanceKm },
      km_to: { [Op.gte]: distanceKm }
    },
    order: [['effective_date', 'DESC']]
  });
  if (!rateRow) return 0;
  const over = parseFloat(rateRow.rate_over_12m || 0);
  const under = parseFloat(rateRow.rate_under_12m || 0);
  if (maxLengthMeters > 12) return over || under || 0;
  return under || over || 0;
}

async function calculateTransportForQuotation(quotationId, distanceKm) {
  const items = await QuotationItem.findAll({ where: { quotation_id: quotationId } });
  if (items.length === 0) return { base: 0, gg: 0, total: 0 };

  const totalWeightKg = items.reduce((sum, it) => sum + parseFloat(it.weight || 0), 0);
  const totalWeightTn = totalWeightKg / 1000;
  const maxLength = items.reduce((mx, it) => Math.max(mx, parseFloat(it.length || 0)), 0);
  const rate = await getFreightRateForLength(distanceKm, maxLength);
  const base = totalWeightTn * rate;
  const gg = base * 0.10;
  return { base, gg, total: base + gg };
}

async function calculateMountingForQuotation(quotationId, distanceKm) {
  const items = await QuotationItem.findAll({ where: { quotation_id: quotationId } });
  if (items.length === 0) return { standard: 0, craneTransfer: 0, gg: 0, total: 0 };

  const totalWeightKg = items.reduce((sum, it) => sum + parseFloat(it.weight || 0), 0);
  const totalWeightTn = totalWeightKg / 1000;

  const MONTAJE_ESTANDAR_POR_TN = 85381; // Excel value
  const COSTO_KM_GRUA = 2625; // Excel value

  const standard = totalWeightTn * MONTAJE_ESTANDAR_POR_TN;
  const craneTransfer = distanceKm * 2 * COSTO_KM_GRUA;
  const subtotal = standard + craneTransfer;
  const gg = subtotal * 0.10;
  return { standard, craneTransfer, gg, total: subtotal + gg };
}

async function calculateQuotationTotals(quotationId, opts = {}) {
  const quotation = await Quotation.findByPk(quotationId);
  if (!quotation) throw new Error('Quotation not found');

  const zone = await Zone.findByPk(quotation.production_zone_id);
  const distanceKm = parseFloat(opts.distanceKm ?? quotation.distance_from_cba ?? 0) || 0;

  const items = await QuotationItem.findAll({ where: { quotation_id: quotationId } });
  const subtotalPieces = items.reduce((sum, it) => sum + parseFloat(it.total_price || 0), 0);
  const ggPieces = subtotalPieces * 0.10;

  const transport = await calculateTransportForQuotation(quotationId, distanceKm);
  const mounting = await calculateMountingForQuotation(quotationId, distanceKm);

  const totalPretensa = subtotalPieces + ggPieces + transport.total + mounting.total + parseFloat(quotation.additionals_total || 0);

  return {
    zone: zone ? { id: zone.id, name: zone.name } : null,
    distanceKm,
    subtotalPieces,
    ggPieces,
    transport,
    mounting,
    totalPretensa
  };
}

function summarizePieces(pieces = []) {
  const totalWeightKg = pieces.reduce((sum, it) => sum + parseFloat(it.peso_total || it.weight || 0) * (it.peso_total ? 1 : (it.quantity || 1)), 0);
  const maxLength = pieces.reduce((mx, it) => Math.max(mx, parseFloat(it.length || 0)), 0);
  return { totalWeightKg, maxLength };
}

async function calculateFromPieces(pieces, distanceKm) {
  const { totalWeightKg, maxLength } = summarizePieces(pieces);
  const totalWeightTn = totalWeightKg / 1000;
  const rate = await getFreightRateForLength(distanceKm, maxLength);
  const transport_base = totalWeightTn * rate;
  const transport_gg = transport_base * 0.10;
  const transport_total = transport_base + transport_gg;

  const MONTAJE_ESTANDAR_POR_TN = 85381;
  const COSTO_KM_GRUA = 2625;
  const mounting_standard = totalWeightTn * MONTAJE_ESTANDAR_POR_TN;
  const mounting_crane_transfer = distanceKm * 2 * COSTO_KM_GRUA;
  const mounting_sub = mounting_standard + mounting_crane_transfer;
  const mounting_gg = mounting_sub * 0.10;
  const mounting_total = mounting_sub + mounting_gg;

  const subtotalPieces = pieces.reduce((sum, p) => sum + parseFloat(p.total_final ?? (p.quantity || 0) * (p.unit_price || 0)), 0);
  const ggPieces = subtotalPieces * 0.10;

  return {
    distanceKm,
    subtotalPieces,
    ggPieces,
    transport: { base: transport_base, gg: transport_gg, total: transport_total },
    mounting: { standard: mounting_standard, craneTransfer: mounting_crane_transfer, gg: mounting_gg, total: mounting_total },
    totalPretensa: subtotalPieces + ggPieces + transport_total + mounting_total
  };
}

module.exports = {
  calculateQuotationTotals,
  calculateTransportForQuotation,
  calculateMountingForQuotation,
  calculateFromPieces
};


