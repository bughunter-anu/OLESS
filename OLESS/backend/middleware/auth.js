const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token required' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            if (!user.is_active) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Account is deactivated' 
                });
            }

            req.user = {
                id: user.id,
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            };

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Token expired' 
                });
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication error' 
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    userId: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name
                };
            }
        } catch (jwtError) {
            // Token invalid, but continue without user
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = { authenticate, authorize, optionalAuth };
