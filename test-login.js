async function testLogin() {
    try {
        const response1 = await fetch('http://localhost:3005/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const data1 = await response1.json();
        console.log('Admin login response:', data1);

        const response2 = await fetch('http://localhost:3005/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'ADMIN001', password: 'admin123' })
        });
        const data2 = await response2.json();
        console.log('EMP001 login response:', data2);
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testLogin();
