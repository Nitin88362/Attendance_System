const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Real employees data
const employees = [
    {
        employee_id: 'EMP001',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul.sharma@company.com',
        phone: '+91 9876543210',
        department: 'IT',
        position: 'Software Developer',
        joining_date: '2022-01-15',
        salary: 25000
    },
    {
        employee_id: 'EMP002',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya.patel@company.com',
        phone: '+91 9876543211',
        department: 'HR',
        position: 'HR Manager',
        joining_date: '2021-06-20',
        salary: 35000
    },
    {
        employee_id: 'EMP003',
        first_name: 'Amit',
        last_name: 'Kumar',
        email: 'amit.kumar@company.com',
        phone: '+91 9876543212',
        department: 'Sales',
        position: 'Sales Executive',
        joining_date: '2022-03-10',
        salary: 22000
    },
    {
        employee_id: 'EMP004',
        first_name: 'Neha',
        last_name: 'Singh',
        email: 'neha.singh@company.com',
        phone: '+91 9876543213',
        department: 'Finance',
        position: 'Accountant',
        joining_date: '2021-11-05',
        salary: 28000
    },
    {
        employee_id: 'EMP005',
        first_name: 'Vikram',
        last_name: 'Malhotra',
        email: 'vikram.malhotra@company.com',
        phone: '+91 9876543214',
        department: 'IT',
        position: 'Senior Developer',
        joining_date: '2020-09-15',
        salary: 35000
    },
    {
        employee_id: 'EMP006',
        first_name: 'Anjali',
        last_name: 'Gupta',
        email: 'anjali.gupta@company.com',
        phone: '+91 9876543215',
        department: 'Marketing',
        position: 'Marketing Manager',
        joining_date: '2021-08-22',
        salary: 32000
    },
    {
        employee_id: 'EMP007',
        first_name: 'Rohit',
        last_name: 'Verma',
        email: 'rohit.verma@company.com',
        phone: '+91 9876543216',
        department: 'Operations',
        position: 'Operations Manager',
        joining_date: '2020-12-10',
        salary: 30000
    },
    {
        employee_id: 'EMP008',
        first_name: 'Kavita',
        last_name: 'Reddy',
        email: 'kavita.reddy@company.com',
        phone: '+91 9876543217',
        department: 'IT',
        position: 'QA Engineer',
        joining_date: '2022-05-18',
        salary: 24000
    },
    {
        employee_id: 'EMP009',
        first_name: 'Suresh',
        last_name: 'Iyer',
        email: 'suresh.iyer@company.com',
        phone: '+91 9876543218',
        department: 'Sales',
        position: 'Sales Manager',
        joining_date: '2021-04-12',
        salary: 33000
    },
    {
        employee_id: 'EMP010',
        first_name: 'Meena',
        last_name: 'Nair',
        email: 'meena.nair@company.com',
        phone: '+91 9876543219',
        department: 'HR',
        position: 'HR Executive',
        joining_date: '2022-07-25',
        salary: 20000
    },
    {
        employee_id: 'EMP011',
        first_name: 'Arjun',
        last_name: 'Pillai',
        email: 'arjun.pillai@company.com',
        phone: '+91 9876543220',
        department: 'Finance',
        position: 'Financial Analyst',
        joining_date: '2022-09-08',
        salary: 26000
    },
    {
        employee_id: 'EMP012',
        first_name: 'Divya',
        last_name: 'Choudhary',
        email: 'divya.choudhary@company.com',
        phone: '+91 9876543221',
        department: 'Marketing',
        position: 'Marketing Executive',
        joining_date: '2023-01-20',
        salary: 18000
    },
    {
        employee_id: 'EMP013',
        first_name: 'Manoj',
        last_name: 'Bhatia',
        email: 'manoj.bhatia@company.com',
        phone: '+91 9876543222',
        department: 'Operations',
        position: 'Operations Executive',
        joining_date: '2022-11-15',
        salary: 21000
    },
    {
        employee_id: 'EMP014',
        first_name: 'Swati',
        last_name: 'Joshi',
        email: 'swati.joshi@company.com',
        phone: '+91 9876543223',
        department: 'IT',
        position: 'UI/UX Designer',
        joining_date: '2023-02-28',
        salary: 23000
    },
    {
        employee_id: 'EMP015',
        first_name: 'Deepak',
        last_name: 'Agarwal',
        email: 'deepak.agarwal@company.com',
        phone: '+91 9876543224',
        department: 'Sales',
        position: 'Sales Executive',
        joining_date: '2023-04-10',
        salary: 19000
    },
    {
        employee_id: 'EMP016',
        first_name: 'Pooja',
        last_name: 'Mishra',
        email: 'pooja.mishra@company.com',
        phone: '+91 9876543225',
        department: 'Finance',
        position: 'Junior Accountant',
        joining_date: '2023-06-01',
        salary: 17000
    },
    {
        employee_id: 'EMP017',
        first_name: 'Karan',
        last_name: 'Desai',
        email: 'karan.desai@company.com',
        phone: '+91 9876543226',
        department: 'IT',
        position: 'DevOps Engineer',
        joining_date: '2022-10-15',
        salary: 29000
    },
    {
        employee_id: 'EMP018',
        first_name: 'Rashmi',
        last_name: 'Kapoor',
        email: 'rashmi.kapoor@company.com',
        phone: '+91 9876543227',
        department: 'Marketing',
        position: 'Content Writer',
        joining_date: '2023-03-22',
        salary: 16000
    },
    {
        employee_id: 'EMP019',
        first_name: 'Vivek',
        last_name: 'Chopra',
        email: 'vivek.chopra@company.com',
        phone: '+91 9876543228',
        department: 'Operations',
        position: 'Logistics Coordinator',
        joining_date: '2023-05-08',
        salary: 18000
    },
    {
        employee_id: 'EMP020',
        first_name: 'Anita',
        last_name: 'Sharma',
        email: 'anita.sharma@company.com',
        phone: '+91 9876543229',
        department: 'HR',
        position: 'Recruiter',
        joining_date: '2023-07-12',
        salary: 19000
    }
];

async function addEmployees() {
    try {
        console.log('Starting to add 20 real employees...');
        
        // Clear existing employees first
        await connection.execute('DELETE FROM attendance');
        await connection.execute('DELETE FROM leaves');
        await connection.execute('DELETE FROM employees');
        console.log('Cleared existing data');
        
        // Add employees
        for (const employee of employees) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await connection.execute(`
                INSERT INTO employees (
                    employee_id, firstName, lastName, email, phone, 
                    position, created_at, password, department
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
            `, [
                employee.employee_id,
                employee.first_name,
                employee.last_name,
                employee.email,
                employee.phone,
                employee.position,
                hashedPassword,
                employee.department
            ]);
            
            console.log(`Added employee: ${employee.first_name} ${employee.last_name} (${employee.employee_id})`);
        }
        
        console.log('Successfully added 20 employees!');
        
        // Generate attendance data for the last 30 days
        await generateAttendanceData();
        
        // Generate leave data
        await generateLeaveData();
        
        console.log('All real data generated successfully!');
        
    } catch (error) {
        console.error('Error adding employees:', error);
    } finally {
        await connection.end();
    }
}

async function generateAttendanceData() {
    console.log('Generating attendance data for last 30 days...');
    
    // Get all employees from database to get their actual IDs
    const [rows] = await connection.execute('SELECT id, employee_id FROM employees');
    const employeeMap = {};
    rows.forEach(row => {
        employeeMap[row.employee_id] = row.id;
    });
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (const employee of employees) {
        for (let date = new Date(thirtyDaysAgo); date <= today; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            
            // Skip weekends (Saturday = 6, Sunday = 0)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Random attendance logic (85% present, 10% late, 5% absent)
            const random = Math.random();
            let status, checkIn, checkOut, workingHours;
            
            if (random < 0.85) {
                // Present
                status = 'present';
                const checkInHour = 8 + Math.floor(Math.random() * 2);
                const checkInMin = Math.floor(Math.random() * 60).toString().padStart(2, '0');
                const checkOutHour = 17 + Math.floor(Math.random() * 2);
                const checkOutMin = Math.floor(Math.random() * 60).toString().padStart(2, '0');
                checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin}:00`;
                checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin}:00`;
                workingHours = 8 + Math.random() * 2;
            } else if (random < 0.95) {
                // Late
                status = 'late';
                const checkInHour = 9 + Math.floor(Math.random() * 2);
                const checkInMin = Math.floor(Math.random() * 60).toString().padStart(2, '0');
                const checkOutHour = 17 + Math.floor(Math.random() * 2);
                const checkOutMin = Math.floor(Math.random() * 60).toString().padStart(2, '0');
                checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin}:00`;
                checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin}:00`;
                workingHours = 7 + Math.random() * 2;
            } else {
                // Absent
                status = 'absent';
                checkIn = null;
                checkOut = null;
                workingHours = 0;
            }
            
            const employeeDbId = employeeMap[employee.employee_id];
            if (employeeDbId) {
                await connection.execute(`
                    INSERT INTO attendance (
                        employee_id, scan_date, check_in_time, check_out_time
                    ) VALUES (?, ?, ?, ?)
                `, [
                    employeeDbId,
                    dateStr,
                    checkIn ? `${dateStr} ${checkIn}` : null,
                    checkOut ? `${dateStr} ${checkOut}` : null
                ]);
            }
        }
    }
    
    console.log('Attendance data generated successfully!');
}

async function generateLeaveData() {
    console.log('Generating leave data...');
    
    const leaveTypes = ['sick', 'casual', 'annual'];
    const leaveStatuses = ['pending', 'approved', 'rejected'];
    
    for (const employee of employees) {
        // Generate 1-3 leave requests per employee
        const numLeaves = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numLeaves; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3));
            
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            await connection.execute(`
                INSERT INTO leaves (
                    employee_id, leave_type, from_date, to_date, 
                    days, reason, status, approved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employee.employee_id,
                leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                days,
                `Leave request for ${days} day(s)`,
                leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)],
                Math.random() > 0.5 ? new Date().toISOString().split('T')[0] : null
            ]);
        }
    }
    
    console.log('Leave data generated successfully!');
}

// Run the script
addEmployees();
