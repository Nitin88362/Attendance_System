const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get all leave requests
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status = '', 
            department = '',
            from_date = '',
            to_date = '',
            search = ''
        } = req.query;
        
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (status) {
            whereClause += ' AND l.status = ?';
            params.push(status);
        }

        if (department) {
            whereClause += ' AND d.name = ?';
            params.push(department);
        }

        if (from_date && to_date) {
            whereClause += ' AND l.from_date >= ? AND l.to_date <= ?';
            params.push(from_date, to_date);
        }

        if (search) {
            whereClause += ' AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Get total count
        const [countResult] = await pool.execute(`
            SELECT COUNT(*) as total 
            FROM leaves l 
            JOIN employees e ON l.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id 
            ${whereClause}
        `, params);

        // Get leave requests
        const [leaves] = await pool.execute(`
            SELECT 
                l.*, 
                e.first_name, 
                e.last_name, 
                e.email,
                d.name as department_name,
                e.designation,
                approver.first_name as approver_first_name,
                approver.last_name as approver_last_name
            FROM leaves l 
            JOIN employees e ON l.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN employees approver ON l.approved_by = approver.employee_id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            leaves,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get leave by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.execute(`
            SELECT 
                l.*, 
                e.first_name, 
                e.last_name, 
                e.email,
                d.name as department_name,
                e.designation,
                approver.first_name as approver_first_name,
                approver.last_name as approver_last_name
            FROM leaves l 
            JOIN employees e ON l.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN employees approver ON l.approved_by = approver.employee_id
            WHERE l.id = ?
        `, [id]);
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        res.json({
            success: true,
            leave: rows[0]
        });

    } catch (error) {
        console.error('Get leave error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Apply for leave
router.post('/apply', authenticateToken, [
    body('leave_type').isIn(['casual', 'sick', 'annual', 'maternity', 'paternity', 'other']).withMessage('Valid leave type is required'),
    body('from_date').isDate().withMessage('Valid from date is required'),
    body('to_date').isDate().withMessage('Valid to date is required'),
    body('reason').notEmpty().withMessage('Reason is required')
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

        const { leave_type, from_date, to_date, reason } = req.body;
        const employee_id = req.user.employee_id;

        // Validate dates
        const fromDate = moment(from_date);
        const toDate = moment(to_date);
        const today = moment();

        if (fromDate.isBefore(today, 'day')) {
            return res.status(400).json({
                success: false,
                message: 'From date cannot be in the past'
            });
        }

        if (toDate.isBefore(fromDate)) {
            return res.status(400).json({
                success: false,
                message: 'To date must be after from date'
            });
        }

        // Calculate days
        const days = toDate.diff(fromDate, 'days') + 1;

        // Check for overlapping leave requests
        const [overlapCheck] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM leaves 
            WHERE employee_id = ? 
            AND status != 'rejected'
            AND ((from_date <= ? AND to_date >= ?) OR (from_date <= ? AND to_date >= ?))
        `, [employee_id, from_date, to_date, from_date, to_date]);

        if (overlapCheck[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Leave already exists for the selected dates'
            });
        }

        // Insert leave request
        const [result] = await pool.execute(`
            INSERT INTO leaves (employee_id, leave_type, from_date, to_date, days, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [employee_id, leave_type, from_date, to_date, days, reason]);

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            leave_id: result.insertId
        });

    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Approve/Reject leave (Admin)
router.put('/:id/status', authenticateToken, [
    body('status').isIn(['approved', 'rejected']).withMessage('Valid status is required'),
    body('rejection_reason').optional().notEmpty().withMessage('Rejection reason is required when rejecting')
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
        const { status, rejection_reason } = req.body;
        const approved_by = req.user.employee_id;

        // Check if leave exists
        const [existing] = await pool.execute(
            'SELECT * FROM leaves WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        const leave = existing[0];

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request already processed'
            });
        }

        // Update leave status
        const [result] = await pool.execute(`
            UPDATE leaves 
            SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?
            WHERE id = ?
        `, [status, approved_by, rejection_reason || null, id]);

        // If approved, mark attendance as leave
        if (status === 'approved') {
            const startDate = moment(leave.from_date);
            const endDate = moment(leave.to_date);
            
            for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'day')) {
                const dateStr = date.format('YYYY-MM-DD');
                
                // Check if attendance already exists
                const [attendanceCheck] = await pool.execute(
                    'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
                    [leave.employee_id, dateStr]
                );

                if (attendanceCheck.length === 0) {
                    // Insert leave attendance
                    await pool.execute(`
                        INSERT INTO attendance (employee_id, date, status, notes)
                        VALUES (?, ?, 'leave', ?)
                    `, [leave.employee_id, dateStr, `Leave: ${leave.leave_type}`]);
                } else {
                    // Update existing attendance
                    await pool.execute(`
                        UPDATE attendance 
                        SET status = 'leave', notes = ?
                        WHERE employee_id = ? AND date = ?
                    `, [`Leave: ${leave.leave_type}`, leave.employee_id, dateStr]);
                }
            }
        }

        res.json({
            success: true,
            message: `Leave request ${status} successfully`
        });

    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get employee's leave history
router.get('/employee/:employee_id', authenticateToken, async (req, res) => {
    try {
        const { employee_id } = req.params;
        const { year = moment().year() } = req.query;

        const [leaves] = await pool.execute(`
            SELECT l.*, e.first_name, e.last_name
            FROM leaves l
            JOIN employees e ON l.employee_id = e.employee_id
            WHERE l.employee_id = ? AND YEAR(l.from_date) = ?
            ORDER BY l.from_date DESC
        `, [employee_id, year]);

        res.json({
            success: true,
            leaves
        });

    } catch (error) {
        console.error('Get employee leaves error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get leave statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        // Total requests
        const [totalResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM leaves'
        );

        // Approved
        const [approvedResult] = await pool.execute(
            'SELECT COUNT(*) as approved FROM leaves WHERE status = "approved"'
        );

        // Pending
        const [pendingResult] = await pool.execute(
            'SELECT COUNT(*) as pending FROM leaves WHERE status = "pending"'
        );

        // Rejected
        const [rejectedResult] = await pool.execute(
            'SELECT COUNT(*) as rejected FROM leaves WHERE status = "rejected"'
        );

        // Leave type summary
        const [typeResult] = await pool.execute(`
            SELECT 
                leave_type,
                COUNT(*) as count
            FROM leaves 
            WHERE status = 'approved'
            GROUP BY leave_type
        `);

        res.json({
            success: true,
            stats: {
                total_requests: totalResult[0].total,
                approved: approvedResult[0].approved,
                pending: pendingResult[0].pending,
                rejected: rejectedResult[0].rejected,
                leave_types: typeResult
            }
        });

    } catch (error) {
        console.error('Get leave stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get upcoming leaves
router.get('/upcoming/list', authenticateToken, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const [leaves] = await pool.execute(`
            SELECT 
                l.*, 
                e.first_name, 
                e.last_name, 
                e.employee_id,
                d.name as department_name
            FROM leaves l 
            JOIN employees e ON l.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE l.status = 'approved' 
            AND l.from_date > ?
            ORDER BY l.from_date ASC
            LIMIT 10
        `, [today]);

        res.json({
            success: true,
            upcoming_leaves: leaves
        });

    } catch (error) {
        console.error('Get upcoming leaves error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
