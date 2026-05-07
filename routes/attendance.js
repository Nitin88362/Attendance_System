const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get attendance records
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            date = '', 
            fromDate = '',
            toDate = '',
            department = '', 
            status = '',
            search = '',
            employee_id = ''
        } = req.query;
        
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (employee_id) {
            whereClause += ' AND a.employee_id = ?';
            params.push(employee_id);
        }

        if (date) {
            whereClause += ' AND a.date = ?';
            params.push(date);
        } else {
            if (fromDate) {
                whereClause += ' AND a.date >= ?';
                params.push(fromDate);
            }
            if (toDate) {
                whereClause += ' AND a.date <= ?';
                params.push(toDate);
            }
        }

        if (department) {
            whereClause += ' AND d.name = ?';
            params.push(department);
        }

        if (status) {
            whereClause += ' AND a.status = ?';
            params.push(status);
        }

        if (search) {
            whereClause += ' AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Get total count
        const [countResult] = await pool.execute(`
            SELECT COUNT(*) as total 
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id 
            ${whereClause}
        `, params);

        // Get attendance records
        const [attendance] = await pool.execute(`
            SELECT 
                a.*, 
                e.first_name, 
                e.last_name, 
                e.email,
                d.name as department_name,
                e.designation
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.employee_id 
            LEFT JOIN departments d ON e.department_id = d.id 
            ${whereClause}
            ORDER BY a.date DESC, e.first_name ASC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            attendance,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Mark attendance (Check In)
router.post('/checkin', authenticateToken, [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('date').isDate().withMessage('Valid date is required')
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

        const { employee_id, date } = req.body;
        const currentTime = moment().format('HH:mm:ss');

        // Check if attendance already exists for today
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND DATE(check_in) = ?',
            [employee_id, date]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for today'
            });
        }

        // Insert check-in record
        const [result] = await pool.execute(`
            INSERT INTO attendance (employee_id, check_in, status)
            VALUES (?, ?, 'present')
        `, [employee_id, `${date} ${currentTime}:00`]);

        res.status(201).json({
            success: true,
            message: 'Check-in successful',
            check_in_time: currentTime
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Mark attendance (Check Out)
router.put('/checkout', authenticateToken, [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('date').isDate().withMessage('Valid date is required')
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

        const { employee_id, date } = req.body;
        const currentTime = moment().format('HH:mm:ss');

        // Check if check-in exists
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND DATE(check_in) = ? AND check_in IS NOT NULL',
            [employee_id, date]
        );

        if (existing.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No check-in record found for today'
            });
        }

        const attendance = existing[0];
        if (attendance.check_out) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out for today'
            });
        }

        // Calculate working hours
        const checkIn = moment(`${date} ${attendance.check_in}`);
        const checkOut = moment(`${date} ${currentTime}`);
        const workingHours = checkOut.diff(checkIn, 'hours', true);

        // Update check-out record
        const [result] = await pool.execute(`
            UPDATE attendance 
            SET check_out = ?, working_hours = ?
            WHERE employee_id = ? AND DATE(check_in) = ?
        `, [`${date} ${currentTime}:00`, workingHours, employee_id, date]);

        res.json({
            success: true,
            message: 'Check-out successful',
            check_out_time: currentTime,
            working_hours: workingHours.toFixed(2)
        });

    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get attendance for specific employee
router.get('/employee/:employee_id', authenticateToken, async (req, res) => {
    try {
        const { employee_id } = req.params;
        const { month, year } = req.query;

        let whereClause = 'WHERE a.employee_id = ?';
        let params = [employee_id];

        if (month && year) {
            whereClause += ' AND MONTH(a.date) = ? AND YEAR(a.date) = ?';
            params.push(month, year);
        }

        const [attendance] = await pool.execute(`
            SELECT a.*, e.first_name, e.last_name, d.name as department_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.id
            ${whereClause}
            ORDER BY a.date DESC
        `, params);

        res.json({
            success: true,
            attendance
        });

    } catch (error) {
        console.error('Get employee attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get today's attendance summary
router.get('/today/summary', async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        // Present today
        const [presentResult] = await pool.execute(
            'SELECT COUNT(*) as present FROM attendance WHERE DATE(check_in) = ? AND status = "present"',
            [today]
        );

        // Absent today
        const [absentResult] = await pool.execute(
            'SELECT COUNT(*) as absent FROM attendance WHERE DATE(check_in) = ? AND status = "absent"',
            [today]
        );

        // On leave today
        const [leaveResult] = await pool.execute(
            'SELECT COUNT(*) as on_leave FROM attendance WHERE DATE(check_in) = ? AND status = "leave"',
            [today]
        );

        // Total employees
        const [totalResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM employees WHERE status = "active"'
        );

        const totalEmployees = totalResult[0].total;
        const present = presentResult[0].present;
        const absent = absentResult[0].absent;
        const onLeave = leaveResult[0].on_leave;

        res.json({
            success: true,
            summary: {
                present_today: present,
                absent_today: absent,
                on_leave_today: onLeave,
                total_employees: totalEmployees,
                present_percentage: totalEmployees > 0 ? ((present / totalEmployees) * 100).toFixed(2) : 0,
                absent_percentage: totalEmployees > 0 ? ((absent / totalEmployees) * 100).toFixed(2) : 0,
                leave_percentage: totalEmployees > 0 ? ((onLeave / totalEmployees) * 100).toFixed(2) : 0
            }
        });

    } catch (error) {
        console.error('Get today summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get attendance statistics for dashboard
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        let dateCondition = '';

        switch (period) {
            case 'week':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            case 'year':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
                break;
        }

        // Get attendance trends
        const [trends] = await pool.execute(`
            SELECT 
                DATE as date,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
            FROM attendance 
            WHERE 1=1 ${dateCondition}
            GROUP BY DATE
            ORDER BY DATE ASC
        `);

        res.json({
            success: true,
            trends
        });

    } catch (error) {
        console.error('Get attendance stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Manual attendance entry (Admin only)
router.post('/manual', authenticateToken, [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('status').isIn(['present', 'absent', 'leave', 'half_day']).withMessage('Valid status is required')
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

        const { employee_id, date, status, check_in, check_out, notes } = req.body;

        // Check if record already exists
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND DATE(check_in) = ?',
            [employee_id, date]
        );

        let workingHours = 0;
        if (check_in && check_out) {
            const checkInTime = moment(`${date} ${check_in}`);
            const checkOutTime = moment(`${date} ${check_out}`);
            workingHours = checkOutTime.diff(checkInTime, 'hours', true);
        }

        if (existing.length > 0) {
            // Update existing record
            await pool.execute(`
                UPDATE attendance 
                SET status = ?, check_in = ?, check_out = ?, working_hours = ?, notes = ?
                WHERE employee_id = ? AND DATE(check_in) = ?
            `, [status, check_in ? `${date} ${check_in}:00` : null, check_out ? `${date} ${check_out}:00` : null, workingHours, notes, employee_id, date]);
        } else {
            // Insert new record
            await pool.execute(`
                INSERT INTO attendance (employee_id, status, check_in, check_out, working_hours, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [employee_id, status, check_in ? `${date} ${check_in}:00` : null, check_out ? `${date} ${check_out}:00` : null, workingHours, notes]);
        }

        res.json({
            success: true,
            message: 'Attendance recorded successfully'
        });

    } catch (error) {
        console.error('Manual attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Generate daily QR code (Admin only)
router.post('/qr/generate', authenticateToken, async (req, res) => {
    try {
        const qrCode = require('qrcode');
        const today = moment().format('YYYY-MM-DD');
        const qrData = `${process.env.APP_URL || 'http://localhost:3000'}/api/attendance/qr/scan?date=${today}&token=${req.user.employee_id}`;
        
        const qrCodeImage = await qrCode.toDataURL(qrData);
        
        res.json({
            success: true,
            message: 'QR code generated',
            date: today,
            qrCode: qrCodeImage
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code'
        });
    }
});

// Scan QR code and mark attendance (Employee)
router.post('/qr/scan', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const employee_id = req.user.employee_id;
        const today = moment().format('YYYY-MM-DD');
        const now = moment();
        
        // Validate QR code date (must be today)
        if (date !== today) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code. QR code is expired or from another day.'
            });
        }

        // Check if already marked today
        const [existingAttendance] = await pool.execute(
            'SELECT * FROM employees WHERE employee_id = ? LIMIT 1',
            [employee_id]
        );
        
        if (existingAttendance.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const employee = existingAttendance[0];

        // Check if attendance already exists for today
        const [checkAttendance] = await pool.execute(
            'SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND DATE(check_in) = ?',
            [employee.id, today]
        );

        if (checkAttendance.length > 0) {
            const attendance = checkAttendance[0];
            
            // If check-in exists but no check-out, mark check-out
            if (attendance.check_in && !attendance.check_out) {
                await pool.execute(
                    'UPDATE attendance SET check_out = ? WHERE id = ?',
                    [now.format('YYYY-MM-DD HH:mm:ss'), attendance.id]
                );
                
                return res.json({
                    success: true,
                    message: 'Check-out marked successfully',
                    status: 'check-out',
                    time: now.format('HH:mm:ss')
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance already marked for today'
                });
            }
        }

        // Create new attendance record with check-in
        const checkInTime = now.format('YYYY-MM-DD HH:mm:ss');
        
        await pool.execute(
            'INSERT INTO attendance (employee_id, check_in, status) VALUES (?, ?, ?)',
            [employee.id, checkInTime, 'present']
        );

        res.json({
            success: true,
            message: 'Check-in marked successfully',
            status: 'check-in',
            time: now.format('HH:mm:ss'),
            employee_name: `${employee.firstName} ${employee.lastName}`
        });

    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process QR code'
        });
    }
});

module.exports = router;
