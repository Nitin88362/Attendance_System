const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const moment = require('moment');
const crypto = require('crypto');

const router = express.Router();

// Store current QR code in memory (will refresh every minute)
let currentQRCode = {
    token: generateToken(),
    timestamp: moment(),
    refreshAt: moment().add(1, 'minute')
};

// Generate unique token for QR code
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

// Refresh QR code every minute
setInterval(() => {
    currentQRCode = {
        token: generateToken(),
        timestamp: moment(),
        refreshAt: moment().add(1, 'minute')
    };
    console.log('✅ New QR code generated:', currentQRCode.token);
}, 60000); // 60000ms = 1 minute

// Get current QR code (Admin)
router.get('/current', authenticateToken, (req, res) => {
    try {
        const now = moment();
        const timeRemaining = currentQRCode.refreshAt.diff(now, 'seconds');
        
        res.json({
            success: true,
            qrCode: {
                token: currentQRCode.token,
                data: `ATTENDANCE-${currentQRCode.token}`,
                timestamp: currentQRCode.timestamp.format('YYYY-MM-DD HH:mm:ss'),
                refreshAt: currentQRCode.refreshAt.format('YYYY-MM-DD HH:mm:ss'),
                secondsRemaining: Math.max(0, timeRemaining),
                isActive: timeRemaining > 0
            }
        });
    } catch (error) {
        console.error('Get QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Verify QR code and mark attendance (Employee)
router.post('/verify', authenticateToken, [
    body('qrToken').notEmpty().withMessage('QR token is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required')
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

        const { qrToken, employeeId } = req.body;
        const today = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm:ss');

        // Verify QR code is valid
        if (qrToken !== currentQRCode.token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired QR code. Please scan the current QR code.',
                error: 'QR_CODE_INVALID'
            });
        }

        // Check if employee exists
        const [employee] = await pool.execute(
            'SELECT * FROM employees WHERE employee_id = ?',
            [employeeId]
        );

        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const emp = employee[0];

        // Check if attendance already marked today
        const [existingAttendance] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
            [employeeId, today]
        );

        let attendanceRecord;
        if (existingAttendance.length > 0) {
            // Update checkout if already checked in
            const att = existingAttendance[0];
            if (att.check_out) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already checked out today'
                });
            }

            // Calculate working hours
            const checkIn = moment(`${today} ${att.check_in}`);
            const checkOut = moment(`${today} ${currentTime}`);
            const workingHours = checkOut.diff(checkIn, 'hours', true);

            await pool.execute(
                'UPDATE attendance SET check_out = ?, working_hours = ?, status = ? WHERE employee_id = ? AND date = ?',
                [currentTime, workingHours.toFixed(2), 'present', employeeId, today]
            );

            attendanceRecord = {
                type: 'checkout',
                time: currentTime,
                workingHours: workingHours.toFixed(2)
            };
        } else {
            // New check-in
            await pool.execute(
                'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
                [employeeId, today, currentTime, 'present']
            );

            attendanceRecord = {
                type: 'checkin',
                time: currentTime
            };
        }

        // Get all recent scans for the day for admin dashboard
        const [todayScans] = await pool.execute(`
            SELECT a.*, e.first_name, e.last_name 
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.employee_id 
            WHERE DATE(a.date) = ? 
            ORDER BY a.check_in DESC 
            LIMIT 50
        `, [today]);

        res.json({
            success: true,
            message: `${attendanceRecord.type === 'checkin' ? 'Check-in' : 'Check-out'} successful`,
            attendance: {
                employeeId: employeeId,
                employeeName: `${emp.first_name} ${emp.last_name}`,
                ...attendanceRecord,
                date: today
            },
            todayScans: todayScans.map(scan => ({
                employeeId: scan.employee_id,
                employeeName: `${scan.first_name} ${scan.last_name}`,
                checkIn: scan.check_in,
                checkOut: scan.check_out,
                status: scan.status,
                workingHours: scan.working_hours
            }))
        });

    } catch (error) {
        console.error('QR verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get QR stats for the day (Admin)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const [totalScans] = await pool.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND check_in IS NOT NULL',
            [today]
        );

        const [checkInOnly] = await pool.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND check_in IS NOT NULL AND check_out IS NULL',
            [today]
        );

        const [checkOutDone] = await pool.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND check_in IS NOT NULL AND check_out IS NOT NULL',
            [today]
        );

        res.json({
            success: true,
            stats: {
                totalPresent: totalScans[0].count,
                checkedIn: checkInOnly[0].count,
                checkedOut: checkOutDone[0].count,
                date: today
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all scans for today (Admin - for real-time dashboard)
router.get('/today-scans', authenticateToken, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const [scans] = await pool.execute(`
            SELECT a.*, e.first_name, e.last_name, e.designation, e.department_id 
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.employee_id 
            WHERE DATE(a.date) = ? 
            ORDER BY a.check_in DESC
        `, [today]);

        res.json({
            success: true,
            scans: scans.map(scan => ({
                employeeId: scan.employee_id,
                employeeName: `${scan.first_name} ${scan.last_name}`,
                designation: scan.designation,
                checkIn: scan.check_in,
                checkOut: scan.check_out,
                workingHours: scan.working_hours,
                status: scan.status,
                avatar: `https://ui-avatars.com/api/?name=${scan.first_name}+${scan.last_name}&background=random`
            })),
            total: scans.length
        });

    } catch (error) {
        console.error('Get today scans error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
