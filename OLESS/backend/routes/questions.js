const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, questionValidations } = require('../middleware/validate');

router.get('/', authenticate, questionController.getAllQuestions);
router.get('/stats', authenticate, authorize('admin', 'operator'), questionController.getQuestionStats);
router.get('/:id', authenticate, questionController.getQuestion);

router.post('/', authenticate, authorize('admin', 'operator'),
    validate(questionValidations.create), questionController.createQuestion);
router.post('/bulk', authenticate, authorize('admin', 'operator'),
    validate(questionValidations.bulkCreate), questionController.bulkCreateQuestions);
router.put('/:id', authenticate, authorize('admin', 'operator'), questionController.updateQuestion);
router.patch('/:id/approve', authenticate, authorize('admin'), questionController.approveQuestion);
router.delete('/:id', authenticate, authorize('admin'), questionController.deleteQuestion);

module.exports = router;
