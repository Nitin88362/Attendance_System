const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const weekStart = moment().subtract(7, 'days').format('YYYY-MM-DD');

        console.log('📊 Loading dashboard stats for:', today);

        // Get today's attendance summary
        const [todayStats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_today,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_today,
                COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_today
            FROM attendance a 
            WHERE a.date = ?
        `, [today]);

        console.log('✅ Today stats:', todayStats[0]);

        // Get total employees
        const [totalEmployees] = await pool.execute(
            'SELECT COUNT(*) as total FROM employees WHERE status = "active"'
        );

        console.log('✅ Total employees:', totalEmployees[0]);

        // Get leave requests summary
        const [leaveStats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_leaves,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_leaves,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_leaves
            FROM leaves
        `);

        console.log('✅ Leave stats:', leaveStats[0]);

        // Get weekly attendance trends
        const [weeklyTrends] = await pool.execute(`
            SELECT 
                a.date,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
            FROM attendance a
            WHERE a.date >= ? AND a.date <= ?
            GROUP BY a.date
            ORDER BY a.date ASC
        `, [weekStart, today]);

        console.log('✅ Weekly trends:', weeklyTrends.length, 'days');

        // Get recent attendance
        const [recentAttendance] = await pool.execute(`
            SELECT 
                a.employee_id,
                e.first_name,
                e.last_name,
                d.name as department_name,
                a.date,
                a.check_in,
                a.check_out,
                a.status
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE a.date = ?
            ORDER BY a.check_in DESC
            LIMIT 5
        `, [today]);

        // Get upcoming leaves
        const [upcomingLeaves] = await pool.execute(`
            SELECT 
                l.id,
                l.employee_id,
                e.first_name,
                e.last_name,
                l.leave_type,
                l.from_date,
                l.to_date,
                l.days
            FROM leaves l
            JOIN employees e ON l.employee_id = e.employee_id
            WHERE l.status = 'approved' AND l.from_date > ?
            ORDER BY l.from_date ASC
            LIMIT 5
        `, [today]);

        // Get leave type summary for chart
        const [leaveTypeSummary] = await pool.execute(`
            SELECT 
                leave_type,
                COUNT(*) as count
            FROM leaves 
            WHERE status = 'approved'
            GROUP BY leave_type
        `);

        const stats = {
            attendance: {
                present_today: todayStats[0].present_today || 0,
                absent_today: todayStats[0].absent_today || 0,
                leave_today: todayStats[0].leave_today || 0,
                total_employees: totalEmployees[0].total || 0,
                present_percentage: totalEmployees[0].total > 0 ? 
                    ((todayStats[0].present_today / totalEmployees[0].total) * 100).toFixed(2) : 0,
                absent_percentage: totalEmployees[0].total > 0 ? 
                    ((todayStats[0].absent_today / totalEmployees[0].total) * 100).toFixed(2) : 0,
                leave_percentage: totalEmployees[0].total > 0 ? 
                    ((todayStats[0].leave_today / totalEmployees[0].total) * 100).toFixed(2) : 0
            },
            leaves: {
                pending: leaveStats[0].pending_leaves || 0,
                approved: leaveStats[0].approved_leaves || 0,
                rejected: leaveStats[0].rejected_leaves || 0
            },
            weekly_trends: weeklyTrends,
            recent_attendance: recentAttendance,
            upcoming_leaves: upcomingLeaves,
            leave_type_summary: leaveTypeSummary
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Get dashboard stats error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

// Get employee dashboard stats (for employee view)
router.get('/employee-stats', authenticateToken, async (req, res) => {
    try {
        const employee_id = req.user.employee_id;
        const currentMonth = moment().format('YYYY-MM');
        const today = moment().format('YYYY-MM-DD');

        // Get current month attendance
        const [monthAttendance] = await pool.execute(`
            SELECT 
                COUNT(*) as total_days,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
                COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days,
                SUM(working_hours) as total_hours
            FROM attendance 
            WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
        `, [employee_id, currentMonth]);

        // Get today's attendance
        const [todayAttendance] = await pool.execute(`
            SELECT * FROM attendance 
            WHERE employee_id = ? AND date = ?
        `, [employee_id, today]);

        // Get leave balance (simplified - in real app, you'd have leave policies)
        const [leaveBalance] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as used_leaves
            FROM leaves 
            WHERE employee_id = ? AND YEAR(from_date) = ?
        `, [employee_id, moment().year()]);

        // Get recent leave requests
        const [recentLeaves] = await pool.execute(`
            SELECT * FROM leaves 
            WHERE employee_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [employee_id]);

        const stats = {
            monthly_attendance: monthAttendance[0] || {
                total_days: 0,
                present_days: 0,
                absent_days: 0,
                leave_days: 0,
                total_hours: 0
            },
            today_attendance: todayAttendance[0] || null,
            leave_balance: {
                total_allowed: 24, // Example: 24 days per year
                used: leaveBalance[0].used_leaves || 0,
                remaining: 24 - (leaveBalance[0].used_leaves || 0)
            },
            recent_leaves: recentLeaves
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get employee dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get attendance chart data
router.get('/attendance-chart', authenticateToken, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        let dateCondition = '';
        let dateFormat = '';

        switch (period) {
            case 'week':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                dateFormat = '%Y-%m-%d';
                break;
            case 'month':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                dateFormat = '%Y-%m-%d';
                break;
            case 'year':
                dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
                dateFormat = '%Y-%m';
                break;
        }

        const [chartData] = await pool.execute(`
            SELECT 
                DATE_FORMAT(date, ?) as period,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave
            FROM attendance 
            WHERE 1=1 ${dateCondition}
            GROUP BY DATE_FORMAT(date, ?)
            ORDER BY period ASC
        `, [dateFormat, dateFormat]);

        res.json({
            success: true,
            chart_data: chartData
        });

    } catch (error) {
        console.error('Get attendance chart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get department-wise statistics
router.get('/department-stats', authenticateToken, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const [deptStats] = await pool.execute(`
            SELECT 
                d.name as department,
                COUNT(e.id) as total_employees,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_today,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_today,
                COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_today
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
            LEFT JOIN attendance a ON e.employee_id = a.employee_id AND a.date = ?
            GROUP BY d.id, d.name
            ORDER BY d.name
        `, [today]);

        res.json({
            success: true,
            department_stats: deptStats
        });

    } catch (error) {
        console.error('Get department stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get recent activities
router.get('/recent-activities', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get recent check-ins
        const [recentCheckins] = await pool.execute(`
            SELECT 
                'checkin' as activity_type,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.employee_id,
                a.check_in as time,
                a.date,
                d.name as department
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE a.check_in IS NOT NULL
            ORDER BY a.date DESC, a.check_in DESC
            LIMIT ?
        `, [parseInt(limit)]);

        // Get recent leave requests
        const [recentLeaves] = await pool.execute(`
            SELECT 
                'leave' as activity_type,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.employee_id,
                l.created_at as time,
                l.from_date as date,
                l.leave_type,
                l.status,
                d.name as department
            FROM leaves l
            JOIN employees e ON l.employee_id = e.employee_id
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY l.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);

        // Combine and sort activities
        const activities = [...recentCheckins, ...recentLeaves]
            .sort((a, b) => {
                const dateA = moment(`${a.date} ${a.time || '00:00:00'}`);
                const dateB = moment(`${b.date} ${b.time || '00:00:00'}`);
                return dateB.diff(dateA);
            })
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            activities
        });

    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
