const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all employees
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', department = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (search) {
            whereClause += ' AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (department) {
            whereClause += ' AND d.name = ?';
            params.push(department);
        }

        if (status) {
            whereClause += ' AND e.status = ?';
            params.push(status);
        }

        // Get total count
        const [countResult] = await pool.execute(`
            SELECT COUNT(*) as total 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            ${whereClause}
        `, params);

        // Get employees
        const limitNum = parseInt(limit) || 10;
        const offsetNum = parseInt(offset) || 0;
        
        const [employees] = await pool.execute(`
            SELECT e.*, d.name as department_name 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            ${whereClause}
            ORDER BY e.created_at DESC 
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offsetNum]);

        // Remove passwords from response
        const employeesWithoutPasswords = employees.map(emp => {
            const { password, ...employee } = emp;
            return employee;
        });

        res.json({
            success: true,
            employees: employeesWithoutPasswords,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is admin or requesting their own profile
        if (req.user.role !== 'admin' && req.user.employee_id !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const [rows] = await pool.execute(`
            SELECT e.*, d.name as department_name 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            WHERE e.employee_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const { password, ...employee } = rows[0];

        res.json({
            success: true,
            employee
        });

    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Add new employee
router.post('/', authenticateToken, requireAdmin, [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department_id').isInt().withMessage('Valid department is required'),
    body('designation').notEmpty().withMessage('Designation is required'),
    body('date_of_joining').isDate().withMessage('Valid date of joining is required')
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

        const {
            employee_id, first_name, last_name, email, phone, password,
            department_id, designation, date_of_birth, date_of_joining,
            employee_type, reporting_manager, work_location, address_line1,
            address_line2, city, state, postal_code, country, status
        } = req.body;

        // Check if employee ID or email already exists
        const [existing] = await pool.execute(
            'SELECT employee_id, email FROM employees WHERE employee_id = ? OR email = ?',
            [employee_id, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID or email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ensure no field is undefined for MySQL
        const safeValues = [
            employee_id, first_name, last_name, email, phone, hashedPassword,
            department_id, designation, date_of_birth, date_of_joining,
            employee_type || 'permanent', reporting_manager, work_location, address_line1,
            address_line2, city, state, postal_code, country, status || 'active'
        ].map(v => v === undefined ? null : v);

        // Insert employee
        const [result] = await pool.execute(`
            INSERT INTO employees (
                employee_id, first_name, last_name, email, phone, password,
                department_id, designation, date_of_birth, date_of_joining,
                employee_type, reporting_manager, work_location, address_line1,
                address_line2, city, state, postal_code, country, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, safeValues);

        res.status(201).json({
            success: true,
            message: 'Employee added successfully',
            employee_id: employee_id
        });

    } catch (error) {
        console.error('Add employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update employee (Admin only)
router.put('/:id', authenticateToken, requireAdmin, [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required')
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

        const { id } = req.params;
        const updateData = req.body;

        // Check if employee exists
        const [existing] = await pool.execute(
            'SELECT employee_id FROM employees WHERE employee_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Hash password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        const [result] = await pool.execute(`
            UPDATE employees 
            SET ${updateFields.join(', ')} 
            WHERE employee_id = ?
        `, updateValues);

        res.json({
            success: true,
            message: 'Employee updated successfully'
        });

    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update own profile (For Employees)
router.put('/profile/update', authenticateToken, [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required')
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

        const employee_id = req.user.employee_id;
        const { first_name, last_name, email, phone, profile_image } = req.body;

        const [result] = await pool.execute(`
            UPDATE employees 
            SET first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                profile_image = COALESCE(?, profile_image)
            WHERE employee_id = ?
        `, [first_name, last_name, email, phone, profile_image, employee_id]);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete employee
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if employee exists
        const [existing] = await pool.execute(
            'SELECT employee_id FROM employees WHERE employee_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Delete employee (cascading will handle related records)
        const [result] = await pool.execute(
            'DELETE FROM employees WHERE employee_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get departments
router.get('/departments/all', authenticateToken, async (req, res) => {
    try {
        const [departments] = await pool.execute(
            'SELECT * FROM departments ORDER BY name'
        );

        res.json({
            success: true,
            departments
        });

    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get employee statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        // Total employees
        const [totalResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM employees'
        );

        // Active employees
        const [activeResult] = await pool.execute(
            'SELECT COUNT(*) as active FROM employees WHERE status = "active"'
        );

        // Inactive employees
        const [inactiveResult] = await pool.execute(
            'SELECT COUNT(*) as inactive FROM employees WHERE status = "inactive"'
        );

        // Departments count
        const [deptResult] = await pool.execute(
            'SELECT COUNT(*) as departments FROM departments'
        );

        res.json({
            success: true,
            stats: {
                total_employees: totalResult[0].total,
                active_employees: activeResult[0].active,
                inactive_employees: inactiveResult[0].inactive,
                total_departments: deptResult[0].departments
            }
        });

    } catch (error) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get employee stats overview
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        // Total employees
        const [totalResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM employees'
        );

        // Active employees
        const [activeResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM employees WHERE status = "active"'
        );

        // Inactive employees
        const [inactiveResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM employees WHERE status = "inactive"'
        );

        // Total departments
        const [deptResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM departments'
        );

        res.json({
            success: true,
            stats: {
                total_employees: totalResult[0].total,
                active_employees: activeResult[0].count,
                inactive_employees: inactiveResult[0].count,
                total_departments: deptResult[0].count
            }
        });
    } catch (error) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all departments
router.get('/departments/all', authenticateToken, async (req, res) => {
    try {
        const [departments] = await pool.execute(
            'SELECT id, name FROM departments ORDER BY name'
        );

        res.json({
            success: true,
            departments: departments
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
