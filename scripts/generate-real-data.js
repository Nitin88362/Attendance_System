const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Real employees data
const employees = [
    {
        employee_id: 'EMP001',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul.sharma@company.com',
        phone: '+91 9876543210',
        department_id: 1, // Development
        designation: 'Software Developer',
        date_of_joining: '2023-01-15',
        status: 'active'
    },
    {
        employee_id: 'EMP002',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya.patel@company.com',
        phone: '+91 9876543211',
        department_id: 2, // HR
        designation: 'HR Manager',
        date_of_joining: '2022-06-20',
        status: 'active'
    },
    {
        employee_id: 'EMP003',
        first_name: 'Amit',
        last_name: 'Kumar',
        email: 'amit.kumar@company.com',
        phone: '+91 9876543212',
        department_id: 4, // Marketing
        designation: 'Marketing Executive',
        date_of_joining: '2023-03-10',
        status: 'active'
    },
    {
        employee_id: 'EMP004',
        first_name: 'Neha',
        last_name: 'Singh',
        email: 'neha.singh@company.com',
        phone: '+91 9876543213',
        department_id: 3, // Finance
        designation: 'Accountant',
        date_of_joining: '2022-11-05',
        status: 'active'
    },
    {
        employee_id: 'EMP005',
        first_name: 'Vikram',
        last_name: 'Malhotra',
        email: 'vikram.malhotra@company.com',
        phone: '+91 9876543214',
        department_id: 1, // Development
        designation: 'Senior Developer',
        date_of_joining: '2021-09-15',
        status: 'active'
    },
    {
        employee_id: 'EMP006',
        first_name: 'Anjali',
        last_name: 'Gupta',
        email: 'anjali.gupta@company.com',
        phone: '+91 9876543215',
        department_id: 5, // Design
        designation: 'UI/UX Designer',
        date_of_joining: '2022-08-22',
        status: 'active'
    },
    {
        employee_id: 'EMP007',
        first_name: 'Rohit',
        last_name: 'Verma',
        email: 'rohit.verma@company.com',
        phone: '+91 9876543216',
        department_id: 6, // Operations
        designation: 'Operations Manager',
        date_of_joining: '2021-12-10',
        status: 'active'
    },
    {
        employee_id: 'EMP008',
        first_name: 'Kavita',
        last_name: 'Reddy',
        email: 'kavita.reddy@company.com',
        phone: '+91 9876543217',
        department_id: 8, // IT Support
        designation: 'IT Support Specialist',
        date_of_joining: '2023-05-18',
        status: 'active'
    },
    {
        employee_id: 'EMP009',
        first_name: 'Suresh',
        last_name: 'Iyer',
        email: 'suresh.iyer@company.com',
        phone: '+91 9876543218',
        department_id: 4, // Marketing
        designation: 'Digital Marketing Lead',
        date_of_joining: '2022-04-12',
        status: 'active'
    },
    {
        employee_id: 'EMP10',
        first_name: 'Meena',
        last_name: 'Nair',
        email: 'meena.nair@company.com',
        phone: '+91 9876543219',
        department_id: 2, // HR
        designation: 'HR Executive',
        date_of_joining: '2023-07-25',
        status: 'active'
    }
];

async function generateData() {
    const pool = mysql.createPool(connectionConfig);
    const connection = await pool.getConnection();
    
    try {
        console.log('🔄 Cleaning up existing data...');
        await connection.execute('DELETE FROM attendance');
        await connection.execute('DELETE FROM leaves');
        await connection.execute('DELETE FROM employees WHERE employee_id != "ADMIN001"');
        
        console.log('👥 Adding 10 real employees...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        for (const emp of employees) {
            await connection.execute(`
                INSERT INTO employees (
                    employee_id, first_name, last_name, email, phone, 
                    password, department_id, designation, date_of_joining, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                emp.employee_id, emp.first_name, emp.last_name, emp.email, 
                emp.phone, hashedPassword, emp.department_id, emp.designation, 
                emp.date_of_joining, emp.status
            ]);
            console.log(`✅ Added: ${emp.first_name} ${emp.last_name} (${emp.employee_id})`);
        }

        console.log('📊 Generating 30 days of attendance data...');
        const today = new Date();
        
        for (const emp of employees) {
            console.log(`Processing attendance for ${emp.employee_id}...`);
            for (let i = 30; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayOfWeek = date.getDay();
                
                // Skip Sundays (0)
                if (dayOfWeek === 0) continue;
                
                const random = Math.random();
                let status, checkIn, checkOut, workingHours;
                
                if (random < 0.90) { // 90% Present
                    status = 'present';
                    const checkInHour = 9;
                    const checkInMin = Math.floor(Math.random() * 15); // 9:00 - 9:15
                    const checkOutHour = 18;
                    const checkOutMin = Math.floor(Math.random() * 30); // 18:00 - 18:30
                    
                    checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
                    checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}:00`;
                    
                    // Calculate working hours
                    const checkInTime = new Date(`${dateStr}T${checkIn}`);
                    const checkOutTime = new Date(`${dateStr}T${checkOut}`);
                    workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                } else if (random < 0.95) { // 5% Leave
                    status = 'leave';
                    checkIn = null;
                    checkOut = null;
                    workingHours = 0;
                } else { // 5% Absent
                    status = 'absent';
                    checkIn = null;
                    checkOut = null;
                    workingHours = 0;
                }
                
                await connection.execute(`
                    INSERT INTO attendance (
                        employee_id, date, check_in, check_out, working_hours, status
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    emp.employee_id, dateStr, checkIn, checkOut, workingHours, status
                ]);
            }
        }

        console.log('📅 Generating leave requests...');
        for (const emp of employees) {
            // Generate 1 leave request per employee
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + Math.floor(Math.random() * 10) + 1);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            
            await connection.execute(`
                INSERT INTO leaves (
                    employee_id, leave_type, from_date, to_date, days, reason, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                emp.employee_id, 'casual', startDate.toISOString().split('T')[0], 
                endDate.toISOString().split('T')[0], 2, 'Personal work', 'pending'
            ]);
        }

        console.log('🎉 Data generation complete!');

    } catch (error) {
        console.error('❌ Error generating data:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

generateData();
