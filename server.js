const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database connection failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const dashboardRoutes = require('./routes/dashboard');
const qrScannerRoutes = require('./routes/qr-scanner');
const salaryRoutes = require('./routes/salary');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/qr', qrScannerRoutes);
app.use('/api/salary', salaryRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/employee-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/employees', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employees.html'));
});

app.get('/add-employee', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-employee.html'));
});

app.get('/attendance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

app.get('/leaves', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaves.html'));
});

// Add missing routes for navigation
app.get('/holidays', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'holidays.html'));
});

app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qr-admin.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/department', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'department.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/salary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'salary.html'));
});

// Employee dashboard route
app.get('/employee-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
});

// Employee pages routes
app.get('/employee-attendance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-attendance.html'));
});

app.get('/employee-leaves', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-leaves.html'));
});

app.get('/employee-profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-profile.html'));
});

// Employee QR Scanner route
app.get('/employee-scanner', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employee-scanner.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API Route not found' 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`👤 Admin Login: http://localhost:${PORT}/`);
    console.log(`👥 Employee Login: http://localhost:${PORT}/employee-login`);
});

module.exports = app;
