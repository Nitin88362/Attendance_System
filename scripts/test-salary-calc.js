const mysql = require('mysql2/promise');
require('dotenv').config();

async function prepareAndCalculate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🔄 Preparing employee salary data...');
        // Update all employees with sample base salary and hourly rate if they are 0
        await conn.execute(`
            UPDATE employees 
            SET base_salary = 25000.00, hourly_rate = 150.00 
            WHERE (base_salary = 0 OR base_salary IS NULL) 
            AND employee_id != "ADMIN001"
        `);
        console.log('✅ Base salaries and hourly rates updated.');

        // Get Month and Year (current or last month)
        const now = new Date();
        const month = now.getMonth() + 1; // Current month
        const year = now.getFullYear();

        console.log(`📊 Calculating salaries for Month: ${month}, Year: ${year}...`);

        // Perform calculation for a sample employee (EMP001)
        const [empRows] = await conn.execute('SELECT employee_id, first_name, base_salary, hourly_rate FROM employees WHERE employee_id = "EMP001"');
        
        if (empRows.length > 0) {
            const emp = empRows[0];
            const [attRows] = await conn.execute(`
                SELECT working_hours FROM attendance 
                WHERE employee_id = ? AND MONTH(date) = ? AND YEAR(date) = ? AND status = "present"
            `, [emp.employee_id, month, year]);

            const stdWorkHours = 8.5; // 9:00 to 17:30
            const otMultiplier = 1.5;
            
            let totalWorkingHours = 0;
            let totalOTHours = 0;

            attRows.forEach(row => {
                const hours = parseFloat(row.working_hours) || 0;
                totalWorkingHours += hours;
                if (hours > stdWorkHours) {
                    totalOTHours += (hours - stdWorkHours);
                }
            });

            const overtimePay = totalOTHours * emp.hourly_rate * otMultiplier;
            const netSalary = parseFloat(emp.base_salary) + overtimePay;

            console.log('\n--- SAMPLE CALCULATION (EMP001) ---');
            console.log(`Name: ${emp.first_name}`);
            console.log(`Base Salary: ₹${emp.base_salary}`);
            console.log(`Total Hours Worked: ${totalWorkingHours.toFixed(2)}h`);
            console.log(`Overtime Hours: ${totalOTHours.toFixed(2)}h`);
            console.log(`Overtime Pay (₹150/hr x 1.5): ₹${overtimePay.toFixed(2)}`);
            console.log(`TOTAL NET SALARY: ₹${netSalary.toFixed(2)}`);
            console.log('-----------------------------------\n');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await conn.end();
    }
}

prepareAndCalculate();
