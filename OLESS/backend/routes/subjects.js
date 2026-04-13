const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, subjectValidations } = require('../middleware/validate');

router.get('/', authenticate, subjectController.getAllSubjects);
router.get('/:id', authenticate, subjectController.getSubject);

router.post('/', authenticate, authorize('admin', 'operator'), 
    validate(subjectValidations.create), subjectController.createSubject);
router.put('/:id', authenticate, authorize('admin', 'operator'), 
    validate(subjectValidations.update), subjectController.updateSubject);
router.delete('/:id', authenticate, authorize('admin'), subjectController.deleteTopic);

router.get('/topics/all', authenticate, subjectController.getAllTopics);
router.post('/topics', authenticate, authorize('admin', 'operator'), subjectController.createTopic);
router.put('/topics/:id', authenticate, authorize('admin', 'operator'), subjectController.updateTopic);
router.delete('/topics/:id', authenticate, authorize('admin'), subjectController.deleteTopic);

module.exports = router;
