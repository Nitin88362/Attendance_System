const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    });
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.employee_id !== 'ADMIN001') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Employee role middleware
const requireEmployee = (req, res, next) => {
    if (req.user.role !== 'employee' && req.user.employee_id === 'ADMIN001') {
        return res.status(403).json({
            success: false,
            message: 'Employee access required'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireEmployee
};
