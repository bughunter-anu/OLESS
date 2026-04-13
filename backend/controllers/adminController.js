const User = require('../models/User');
const { Subject, Topic } = require('../models/Subject');
const Question = require('../models/Question');
const { Exam } = require('../models/Exam');
const Result = require('../models/Result');
const db = require('../config/database');

exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalOperators,
            totalSubjects,
            totalQuestions,
            totalExams,
            recentResults
        ] = await Promise.all([
            User.count(),
            User.count({ role: 'student' }),
            User.count({ role: 'operator' }),
            Subject.count(),
            Question.count(),
            Exam.count(),
            Result.findAll({ limit: 10 })
        ]);

        const examStats = totalExams > 0 ? await Promise.all(
            (await Exam.findAll({ limit: totalExams })).map(async exam => {
                const stats = await Result.getStatistics(exam.id);
                return { examId: exam.id, examName: exam.exam_name, ...stats };
            })
        ) : [];

        res.json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalOperators,
                totalSubjects,
                totalQuestions,
                totalExams,
                recentResults,
                examStats
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard stats'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const users = await User.findAll({
            role,
            search,
            limit: parseInt(limit),
            offset
        });

        const total = await User.count({ role });

        res.json({
            success: true,
            data: {
                users: users.map(u => ({
                    id: u.id,
                    userId: u.user_id,
                    username: u.username,
                    email: u.email,
                    role: u.role,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    phone: u.phone,
                    department: u.department,
                    isActive: u.is_active,
                    lastLogin: u.last_login,
                    createdAt: u.created_at
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName, phone, department } = req.body;

        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const user = await User.create({
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            phone,
            department
        });

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'CREATE_USER', 'User Management', `Created user: ${username} with role: ${role}`]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { userId: user.userId, username, email, role }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, department, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify admin user'
            });
        }

        await User.update(id, { firstName, lastName, phone, department, isActive });

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPDATE_USER', 'User Management', `Updated user: ${user.username}`]
        );

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await User.delete(id);

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DELETE_USER', 'User Management', `Deleted user: ${user.username}`]
        );

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logs = await db.query(`
            SELECT al.*, u.username 
            FROM activity_logs al 
            LEFT JOIN users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC 
            LIMIT ? OFFSET ?
        `, [parseInt(limit), offset]);

        const [{ total }] = await db.query('SELECT COUNT(*) as total FROM activity_logs');

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity logs'
        });
    }
};

exports.getExamPolicies = async (req, res) => {
    try {
        const policies = await db.query('SELECT * FROM exam_policies WHERE is_active = 1');
        
        const policyMap = {};
        policies.forEach(p => {
            policyMap[p.policy_key] = p.policy_value;
        });

        res.json({
            success: true,
            data: policyMap
        });
    } catch (error) {
        console.error('Get policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get policies'
        });
    }
};

exports.updateExamPolicy = async (req, res) => {
    try {
        const { policyKey, policyValue, policyName, description } = req.body;

        const [existing] = await db.query('SELECT * FROM exam_policies WHERE policy_key = ?', [policyKey]);

        if (existing) {
            await db.query(
                'UPDATE exam_policies SET policy_value = ?, updated_by = ? WHERE policy_key = ?',
                [policyValue, req.user.id, policyKey]
            );
        } else {
            await db.query(
                'INSERT INTO exam_policies (policy_name, policy_key, policy_value, description, updated_by) VALUES (?, ?, ?, ?, ?)',
                [policyName, policyKey, policyValue, description, req.user.id]
            );
        }

        res.json({
            success: true,
            message: 'Policy updated successfully'
        });
    } catch (error) {
        console.error('Update policy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update policy'
        });
    }
};
