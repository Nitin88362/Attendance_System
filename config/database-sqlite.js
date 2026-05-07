const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database connection
const dbPath = path.join(__dirname, '..', 'data', 'attendance_system.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ SQLite connection failed:', err.message);
    } else {
        console.log('✅ SQLite connected successfully');
        initializeTables();
    }
});

// Initialize database tables
function initializeTables() {
    // Create departments table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create employees table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR(20) NOT NULL UNIQUE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        department_id INTEGER,
        position VARCHAR(100),
        hire_date DATE,
        salary DECIMAL(10,2),
        status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    )`);

    // Create attendance table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        break_duration INTEGER DEFAULT 0,
        total_hours DECIMAL(4,2),
        status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
        UNIQUE(employee_id, date)
    )`);

    // Create leaves table
    db.run(`CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR(20) NOT NULL,
        leave_type ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days INTEGER NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by VARCHAR(20),
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    )`);

    // Create holidays table
    db.run(`CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL UNIQUE,
        type ENUM('national', 'religious', 'company') DEFAULT 'national',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample data
    insertSampleData();
}

function insertSampleData() {
    // Insert sample departments
    db.run(`INSERT OR IGNORE INTO departments (name, description) VALUES 
        ('IT', 'Information Technology Department'),
        ('HR', 'Human Resources Department'),
        ('Finance', 'Finance and Accounting Department'),
        ('Sales', 'Sales and Marketing Department')
    `);

    // Insert sample admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(`INSERT OR IGNORE INTO employees 
        (employee_id, first_name, last_name, email, department_id, position, status, password) 
        VALUES ('ADMIN', 'System', 'Administrator', 'admin@company.com', 2, 'Administrator', 'active', ?)`, 
        [hashedPassword]);

    // Insert sample employees
    db.run(`INSERT OR IGNORE INTO employees 
        (employee_id, first_name, last_name, email, department_id, position, status, password) 
        VALUES 
        ('EMP001', 'John', 'Doe', 'john@company.com', 1, 'Software Developer', 'active', ?),
        ('EMP002', 'Jane', 'Smith', 'jane@company.com', 2, 'HR Manager', 'active', ?)`, 
        [hashedPassword, hashedPassword]);

    console.log('✅ Sample data inserted successfully');
}

module.exports = db;
