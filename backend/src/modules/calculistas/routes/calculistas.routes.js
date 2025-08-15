const express = require('express');
const router = express.Router();

const calculistaController = require('../../../controllers/calculista.controller');
const { authenticate, authorize } = require('@compartido/middleware/auth.middleware');

router.use(authenticate);

router.get('/', calculistaController.getAllCalculistas);
router.get('/active', calculistaController.getActiveCalculistas);
router.get('/:id', calculistaController.getCalculistaById);
router.post('/', authorize('admin', 'superadmin'), calculistaController.createCalculista);
router.put('/:id', authorize('admin', 'superadmin'), calculistaController.updateCalculista);
router.delete('/:id', authorize('admin', 'superadmin'), calculistaController.deleteCalculista);
router.patch('/:id/toggle-status', authorize('admin', 'superadmin'), calculistaController.toggleCalculistaStatus);

module.exports = router;