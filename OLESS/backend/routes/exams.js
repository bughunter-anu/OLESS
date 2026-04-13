const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, examValidations } = require('../middleware/validate');

router.get('/', authenticate, examController.getAllExams);
router.get('/my-sessions', authenticate, examController.getMyExamSessions);
router.get('/session/:sessionId', authenticate, examController.getExamSession);
router.get('/:id', authenticate, examController.getExam);

router.post('/', authenticate, authorize('admin', 'operator'),
    validate(examValidations.create), examController.createExam);
router.post('/start', authenticate, validate(examValidations.start), examController.startExam);
router.post('/session/:sessionId/answer/:questionId/:answer', authenticate, examController.saveAnswer);
router.post('/session/:sessionId/submit', authenticate, examController.submitExam);

router.put('/:id', authenticate, authorize('admin', 'operator'), examController.updateExam);
router.delete('/:id', authenticate, authorize('admin'), examController.deleteExam);

module.exports = router;
