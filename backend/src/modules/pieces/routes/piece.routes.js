// modules/pieces/routes/piece.routes.js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../../../shared/database/database');
const {
  getPieces,
  getPieceById,
  createPiece,
  updatePiece,
  deletePiece,
  getPiecesByZone,
  getPiecePrices,
  updatePiecePrice,
  generatePieceCode,
} = require('../controllers/piece.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas de piezas
router.get('/', getPieces);
router.get('/generate-code', generatePieceCode);
router.get('/zone/:zoneId', getPiecesByZone);
router.get('/:id', getPieceById);
router.get('/:pieceId/prices', getPiecePrices);
router.post('/', createPiece);
router.put('/:id', updatePiece);
router.put('/:pieceId/prices', updatePiecePrice);
router.delete('/:id', deletePiece);

// Precio por pieza (TVF v1) y publicación
router.get('/:pieceId/price', async (req, res) => {
  try {
    const pieceId = parseInt(req.params.pieceId);
    const zoneId = parseInt(req.query.zone_id);
    const asOf = req.query.as_of || null;
    if (!pieceId || !zoneId) return res.status(400).json({ success: false, message: 'pieceId y zone_id requeridos' });
    const sql = 'SELECT * FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @as_of_date)';
    const result = await executeQuery(sql, { piece_id: pieceId, zone_id: zoneId, as_of_date: asOf });
    res.json({ success: true, data: result?.recordset?.[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:pieceId/publish-price', async (req, res) => {
  try {
    const pieceId = parseInt(req.params.pieceId);
    const { zone_id, as_of, effective_date } = req.body || {};
    if (!pieceId || !zone_id) return res.status(400).json({ success: false, message: 'pieceId y zone_id requeridos' });
    // Calcular base_price desde TVF v1
    const calcSql = 'SELECT * FROM dbo.TVF_piece_cost_breakdown(@piece_id, @zone_id, @as_of_date)';
    const calc = await executeQuery(calcSql, { piece_id: pieceId, zone_id, as_of_date: as_of || null });
    const base = calc?.recordset?.[0]?.total || 0;
    // Publicar en piece_prices (ajuste=0, final=base)
    const pubSql = `
      INSERT INTO dbo.piece_prices(piece_id, zone_id, base_price, adjustment, final_price, effective_date)
      VALUES (@piece_id, @zone_id, @base_price, 0, @base_price, COALESCE(@effective_date, CAST(GETDATE() AS DATE)));
      SELECT SCOPE_IDENTITY() AS id;`;
    const ins = await executeQuery(pubSql, { piece_id: pieceId, zone_id, base_price: base, effective_date });
    res.status(201).json({ success: true, id: ins?.recordset?.[0]?.id, base_price: base });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
