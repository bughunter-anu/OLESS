const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/policies', adminController.getExamPolicies);
router.put('/policies', adminController.updateExamPolicy);

module.exports = router;
