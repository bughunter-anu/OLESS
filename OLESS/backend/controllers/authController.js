const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const db = require('../config/database');

const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            role: user.role,
            username: user.username 
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone, department, role } = req.body;

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

        const userData = {
            username,
            email,
            password,
            role: role || 'student',
            firstName,
            lastName,
            phone,
            department
        };

        const user = await User.create(userData);

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [user.id, 'REGISTER', 'Authentication', `New user registered: ${username}`]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                userId: user.userId,
                username,
                email,
                role: role || 'student'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findByUsername(username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Contact administrator.'
            });
        }

        await User.updateLastLogin(user.id);

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    userId: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    lastLogin: user.last_login
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                department: user.department,
                enrollmentDate: user.enrollment_date,
                lastLogin: user.last_login,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, department } = req.body;
        
        const updated = await User.update(req.user.id, {
            firstName,
            lastName,
            phone,
            department
        });

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'No changes made'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        
        const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        await User.updatePassword(req.user.id, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'LOGOUT', 'Authentication', `User logged out: ${req.user.username}`]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};
