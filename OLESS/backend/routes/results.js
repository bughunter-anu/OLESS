const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my-results', authenticate, resultController.getMyResults);
router.get('/my-results/:id', authenticate, resultController.getResult);
router.get('/code/:code', authenticate, resultController.getResultByCode);
router.get('/:id/certificate', authenticate, resultController.generateCertificate);

router.get('/', authenticate, authorize('admin', 'operator'), resultController.getAllResults);
router.get('/statistics/exam/:examId', authenticate, authorize('admin', 'operator'), resultController.getExamStatistics);
router.get('/statistics/user/:userId', authenticate, authorize('admin'), resultController.getUserStatistics);

module.exports = router;
