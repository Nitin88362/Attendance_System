const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin Login
router.post('/admin/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Check if it's the default admin or database admin
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { 
                    username: username, 
                    role: 'admin',
                    employee_id: 'ADMIN001'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            return res.json({
                success: true,
                message: 'Admin login successful',
                token,
                user: {
                    username: username,
                    role: 'admin',
                    employee_id: 'ADMIN001'
                }
            });
        }

        // Check database admin
        const result = await pool.execute(
            'SELECT * FROM employees WHERE employee_id = ? AND (employee_id = "ADMIN001" OR designation LIKE "%Admin%")',
            [username]
        );
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { 
                employee_id: user.employee_id,
                email: user.email,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                employee_id: user.employee_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Employee Login
router.post('/employee/login', [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { employee_id, password } = req.body;

        const result = await pool.execute(
            'SELECT * FROM employees WHERE employee_id = ?',
            [employee_id]
        );
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Employee ID or password'
            });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Employee ID or password'
            });
        }

        const token = jwt.sign(
            { 
                employee_id: user.employee_id,
                email: user.email,
                role: 'employee'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Employee login successful',
            token,
            user: {
                employee_id: user.employee_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                department_id: user.department_id,
                designation: user.designation,
                profile_image: user.profile_image,
                role: 'employee'
            }
        });

    } catch (error) {
        console.error('Employee login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const employee_id = req.user.employee_id;

        const result = await pool.execute(`
            SELECT e.*, d.name as department_name 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            WHERE e.employee_id = ?
        `, [employee_id]);
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = rows[0];
        delete user.password; // Remove password from response

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update password
router.put('/change-password', authenticateToken, [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { current_password, new_password } = req.body;
        const employee_id = req.user.employee_id;

        const result = await pool.execute(
            'SELECT password FROM employees WHERE employee_id = ?',
            [employee_id]
        );
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isValidPassword = await bcrypt.compare(current_password, rows[0].password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        await pool.execute(
            'UPDATE employees SET password = ? WHERE employee_id = ?',
            [hashedNewPassword, employee_id]
        );

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
