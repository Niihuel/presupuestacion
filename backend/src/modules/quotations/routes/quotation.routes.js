const router = require('express').Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');
const { validateQuotation } = require('../../../shared/validators/quotation.validator');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los presupuestos
router.get('/', quotationController.getAllQuotations);

// Obtener un presupuesto específico
router.get('/:id', quotationController.getQuotationById);

// Crear nuevo presupuesto
router.post('/', validateQuotation, quotationController.createQuotation);

// Actualizar presupuesto
router.put('/:id', quotationController.updateQuotation);

// Duplicar presupuesto
router.post('/:id/duplicate', quotationController.duplicateQuotation);

// Aprobar presupuesto
router.patch('/:id/approve', quotationController.approveQuotation);

// Generar PDF
router.get('/:id/pdf', quotationController.generateQuotationPDF);

// Cálculo completo estilo Excel
router.get('/:id/calculate', quotationController.calculateTotalsExcel);

module.exports = router;