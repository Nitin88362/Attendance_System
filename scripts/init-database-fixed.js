const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
    let connection;
    
    try {
        // Connect to MySQL without specifying database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // Enable multiple statements
        });

        console.log('🔄 Creating database...');

        // Create database if not exists
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'attendance_system'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        
        console.log('✅ Database created successfully');
        
        // Close and reconnect to the new database
        await connection.end();
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'attendance_system',
            multipleStatements: true
        });

        console.log('📊 Creating tables...');

        // Create all tables in one go
        const createTablesSQL = `
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(20) NOT NULL UNIQUE,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                department_id INT,
                designation VARCHAR(100),
                date_of_birth DATE,
                date_of_joining DATE,
                employee_type ENUM('permanent', 'contract', 'intern') DEFAULT 'permanent',
                reporting_manager VARCHAR(100),
                work_location VARCHAR(100),
                address_line1 TEXT,
                address_line2 TEXT,
                city VARCHAR(50),
                state VARCHAR(50),
                postal_code VARCHAR(20),
                country VARCHAR(50),
                status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(20) NOT NULL,
                date DATE NOT NULL,
                check_in TIME,
                check_out TIME,
                working_hours DECIMAL(5,2),
                status ENUM('present', 'absent', 'leave', 'half_day') DEFAULT 'present',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_employee_date (employee_id, date)
            );

            CREATE TABLE IF NOT EXISTS leaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(20) NOT NULL,
                leave_type ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'other') NOT NULL,
                from_date DATE NOT NULL,
                to_date DATE NOT NULL,
                days INT NOT NULL,
                reason TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by VARCHAR(20),
                approved_at TIMESTAMP NULL,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                date DATE NOT NULL UNIQUE,
                type ENUM('national', 'state', 'company') DEFAULT 'national',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        await connection.execute(createTablesSQL);
        console.log('✅ Tables created successfully');

        console.log('📝 Inserting default data...');

        // Insert default departments
        await connection.execute(`
            INSERT IGNORE INTO departments (id, name, description) VALUES
            (1, 'Development', 'Software Development Team'),
            (2, 'HR', 'Human Resources Department'),
            (3, 'Finance', 'Finance and Accounting'),
            (4, 'Marketing', 'Marketing and Sales'),
            (5, 'Design', 'UI/UX Design Team'),
            (6, 'Operations', 'Operations Management'),
            (7, 'Administration', 'Administrative Services'),
            (8, 'IT Support', 'IT and Technical Support')
        `);

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

        await connection.execute(`
            INSERT IGNORE INTO employees (
                employee_id, first_name, last_name, email, password, 
                department_id, designation, date_of_joining, status
            ) VALUES (
                'ADMIN001', 'System', 'Administrator', 'admin@attendance.com', ?,
                2, 'System Administrator', CURDATE(), 'active'
            )
        `, [hashedPassword]);

        // Insert sample employees
        const sampleEmployees = [
            ['EMP001', 'John', 'Doe', 'john.doe@example.com', hashedPassword, 1, 'Software Engineer', '2023-01-15', 'active'],
            ['EMP002', 'Jane', 'Smith', 'jane.smith@example.com', hashedPassword, 2, 'HR Manager', '2023-02-01', 'active'],
            ['EMP003', 'Michael', 'Brown', 'michael.brown@example.com', hashedPassword, 4, 'Marketing Executive', '2023-03-10', 'active'],
            ['EMP004', 'Emily', 'Davis', 'emily.davis@example.com', hashedPassword, 3, 'Accountant', '2023-04-05', 'on_leave'],
            ['EMP005', 'David', 'Wilson', 'david.wilson@example.com', hashedPassword, 5, 'UI/UX Designer', '2023-05-20', 'active'],
            ['EMP006', 'Sophia', 'Martinez', 'sophia.martinez@example.com', hashedPassword, 5, 'Senior Designer', '2023-06-15', 'inactive']
        ];

        for (const emp of sampleEmployees) {
            await connection.execute(`
                INSERT IGNORE INTO employees (
                    employee_id, first_name, last_name, email, password,
                    department_id, designation, date_of_joining, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, emp);
        }

        // Insert sample attendance records
        const today = new Date().toISOString().split('T')[0];
        const attendanceRecords = [
            ['EMP001', today, '09:15:00', '18:10:00', 8.92, 'present'],
            ['EMP002', today, '09:05:00', '18:00:00', 8.92, 'present'],
            ['EMP003', today, '09:20:00', '18:15:00', 8.92, 'present'],
            ['EMP004', today, null, null, 0, 'absent'],
            ['EMP005', today, '09:00:00', '17:30:00', 8.5, 'present']
        ];

        for (const record of attendanceRecords) {
            await connection.execute(`
                INSERT IGNORE INTO attendance (
                    employee_id, date, check_in, check_out, working_hours, status
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, record);
        }

        // Insert sample leave requests
        await connection.execute(`
            INSERT IGNORE INTO leaves (
                employee_id, leave_type, from_date, to_date, days, reason, status
            ) VALUES
            ('EMP001', 'casual', '2024-05-20', '2024-05-21', 2, 'Personal work', 'approved'),
            ('EMP002', 'sick', '2024-05-22', '2024-05-24', 3, 'Medical emergency', 'pending'),
            ('EMP003', 'annual', '2024-06-01', '2024-06-06', 6, 'Vacation', 'approved'),
            ('EMP004', 'sick', '2024-05-25', '2024-05-25', 1, 'Doctor appointment', 'pending')
        `);

        // Insert sample holidays
        await connection.execute(`
            INSERT IGNORE INTO holidays (name, date, type, description) VALUES
            ('New Year', '2024-01-01', 'national', 'New Year Day'),
            ('Republic Day', '2024-01-26', 'national', 'Republic Day of India'),
            ('Independence Day', '2024-08-15', 'national', 'Independence Day'),
            ('Gandhi Jayanti', '2024-10-02', 'national', 'Gandhi Jayanti'),
            ('Diwali', '2024-11-01', 'national', 'Diwali Festival')
        `);

        console.log('✅ Database initialized successfully!');
        console.log('\n📊 Default Login Credentials:');
        console.log('   Admin Username: admin');
        console.log('   Admin Password: admin123');
        console.log('\n👥 Sample Employee Credentials:');
        console.log('   Employee ID: EMP001');
        console.log('   Password: admin123');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('\n🔧 Troubleshooting Tips:');
        console.error('1. Make sure MySQL server is running');
        console.error('2. Check MySQL credentials in .env file');
        console.error('3. Ensure MySQL user has CREATE DATABASE permission');
        console.error('4. Try running MySQL as administrator');
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    initDatabase().catch(console.error);
}

module.exports = initDatabase;
