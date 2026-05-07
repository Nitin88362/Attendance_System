const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get salary settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM system_settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Get salary settings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update salary settings
router.post('/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { work_start_time, work_end_time, overtime_rate_multiplier } = req.body;
        
        const queries = [
            ['UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [work_start_time, 'work_start_time']],
            ['UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [work_end_time, 'work_end_time']],
            ['UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [overtime_rate_multiplier, 'overtime_rate_multiplier']]
        ];

        for (const [sql, params] of queries) {
            await pool.execute(sql, params);
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update salary settings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Calculate and get salaries for a month
router.get('/calculate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year are required' });
        }

        // Get settings
        const [settingsRows] = await pool.execute('SELECT * FROM system_settings');
        const settings = {};
        settingsRows.forEach(row => settings[row.setting_key] = row.setting_value);

        const workStartTime = settings['work_start_time'];
        const workEndTime = settings['work_end_time'];
        const otMultiplier = parseFloat(settings['overtime_rate_multiplier']);

        // Standard working hours per day
        const stdStartTime = moment(workStartTime, 'HH:mm:ss');
        const stdEndTime = moment(workEndTime, 'HH:mm:ss');
        const stdWorkHours = stdEndTime.diff(stdStartTime, 'hours', true);

        // Get all active employees
        const [employees] = await pool.execute('SELECT employee_id, first_name, last_name, base_salary, hourly_rate FROM employees WHERE status = "active"');

        const salaries = [];

        for (const emp of employees) {
            // Get attendance for the month
            const [attendance] = await pool.execute(`
                SELECT working_hours 
                FROM attendance 
                WHERE employee_id = ? AND MONTH(date) = ? AND YEAR(date) = ? AND status = "present"
            `, [emp.employee_id, month, year]);

            let totalWorkingHours = 0;
            let totalOTHours = 0;

            attendance.forEach(record => {
                const hours = parseFloat(record.working_hours) || 0;
                totalWorkingHours += hours;
                if (hours > stdWorkHours) {
                    totalOTHours += (hours - stdWorkHours);
                }
            });

            const hourlyRate = parseFloat(emp.hourly_rate) || 0;
            const baseSalary = parseFloat(emp.base_salary) || 0;
            const overtimePay = totalOTHours * hourlyRate * otMultiplier;
            const totalSalary = baseSalary + overtimePay;

            salaries.push({
                employee_id: emp.employee_id,
                name: `${emp.first_name} ${emp.last_name}`,
                base_salary: baseSalary,
                total_hours: totalWorkingHours.toFixed(2),
                overtime_hours: totalOTHours.toFixed(2),
                overtime_pay: overtimePay.toFixed(2),
                total_salary: totalSalary.toFixed(2),
                status: 'pending' // For now
            });
        }

        res.json({ success: true, salaries });

    } catch (error) {
        console.error('Calculate salary error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
