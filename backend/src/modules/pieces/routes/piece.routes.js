// modules/pieces/routes/piece.routes.js
const router = require('express').Router();
const pieceController = require('../controllers/piece.controller');
const { authenticate } = require('@compartido/middleware/auth.middleware');

// Rutas públicas (si las hay)

// Todas las rutas siguientes requieren autenticación
router.use(authenticate);

// Generación de código
router.get('/generate-code', pieceController.generatePieceCode);

// CRUD básico
router.get('/', pieceController.getPieces);
router.get('/:id', pieceController.getPieceById);
router.post('/', pieceController.createPiece);
router.put('/:id', pieceController.updatePiece);
router.delete('/:id', pieceController.deletePiece);

// Precios
router.get('/:id/prices', pieceController.getPiecePrices);
router.put('/:id/prices', pieceController.updatePiecePrice);
router.get('/:id/calculate-price', pieceController.calculatePiecePrice);
router.post('/:id/publish-price', pieceController.publishPiecePrice);
router.get('/:id/history', pieceController.getPieceHistory);

// Por zona
router.get('/zone/:zoneId', pieceController.getPiecesByZone);

module.exports = router;
