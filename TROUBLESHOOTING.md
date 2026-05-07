# 🚨 TROUBLESHOOTING & FAQ

## ❌ Camera & Scanner Issues

### Issue: "Camera Permission Denied" or "Camera Not Working"

**Symptoms:**
- Camera permission denied dialog appears
- Camera icon shows red X
- "Permission denied" error message

**Solutions:**

1. **Browser Settings:**
   ```
   Chrome: Settings → Privacy & Security → Site Settings → Camera
   Firefox: Preferences → Privacy → Permissions → Camera
   Edge: Settings → Privacy → Site permissions → Camera
   ```
   - Ensure the site is allowed to use camera
   - Remove site from blocked list if present

2. **Clear Browser Data:**
   - Clear cookies and site data
   - Refresh the page
   - Grant permission again

3. **Try Different Browser:**
   - Chrome (Recommended)
   - Firefox
   - Edge
   - Safari (iOS)

4. **Check Device:**
   - Ensure device has camera
   - Check if camera is working in other apps
   - Restart browser
   - Restart computer

### Issue: "QR Code Won't Scan"

**Symptoms:**
- Camera opens but QR detection not working
- Timeout waiting for scan

**Solutions:**

1. **Lighting:**
   - Ensure good lighting
   - Avoid bright glare on QR code
   - Don't scan in dark room

2. **QR Code Quality:**
   - Make sure QR code is not blurry
   - Try downloading and printing a fresh QR code
   - Ensure QR code is not damaged or faded

3. **Camera Focus:**
   - Hold phone still
   - Move closer/farther to help focus
   - Try other apps with QR scanning to test camera

4. **QR Code Freshness:**
   - Check the QR code is current (refreshed within last 60 seconds)
   - If stuck on old QR, refresh admin page
   - New QR generated every minute automatically

---

## 👥 Employee & Admin Panel Issues

### Issue: "Employees Not Showing in Admin Panel"

**Symptoms:**
- Employee list is empty
- Says "0 employees"
- Added employees don't appear

**Solutions:**

1. **Check Database Connection:**
   ```bash
   npm start
   ```
   Look for message: "✅ Database connected successfully"

2. **Verify Employees in Database:**
   ```sql
   SELECT COUNT(*) FROM employees;
   SELECT * FROM employees LIMIT 5;
   ```

3. **Clear Browser Cache:**
   - Ctrl+Shift+Delete
   - Clear all data
   - Refresh page

4. **Check Employee Status:**
   - Employee status must be 'active'
   - Edit employee to change status
   - Refresh dashboard

5. **Reload the Page:**
   - Ctrl+F5 (hard refresh)
   - Wait for data to load
   - Check developer console for errors

### Issue: "Can't Add New Employee"

**Symptoms:**
- Add button not working
- Form submission fails
- Error message appears

**Solutions:**

1. **Check All Fields Are Filled:**
   - Employee ID (required)
   - First Name (required)
   - Last Name (required)
   - Email (required, must be valid)
   - Password (required, min 6 chars)
   - Department (required)
   - Designation (required)
   - Date of Joining (required)

2. **Check for Duplicates:**
   - Employee ID must be unique
   - Email must be unique
   - Try with different ID/email

3. **Check Browser Console:**
   - Press F12 to open Developer Tools
   - Check Console tab for errors
   - Look for API error messages

4. **Verify API Endpoint:**
   - Check network requests in DevTools
   - POST to `/api/employees` should return 201
   - If error, server might not be running

---

## 🔐 Login & Authentication Issues

### Issue: "Login Fails / Can't Access System"

**Symptoms:**
- Login page appears but credentials don't work
- Redirected back to login
- "Invalid credentials" error

**Solutions:**

1. **Check Username/Password:**
   - Admin default credentials (check with system admin)
   - Employee ID and password from registration
   - Passwords are case-sensitive

2. **Clear Sessions:**
   - Logout completely
   - Clear browser cookies
   - Close all browser tabs
   - Login again

3. **Browser Compatibility:**
   - Use Chrome/Firefox/Edge
   - Clear browser cache
   - Disable extensions
   - Try incognito mode

4. **JWT Token Issues:**
   - Token expires after some time
   - Logout and login again
   - Check server time is correct

### Issue: "Session Expires Quickly"

**Symptoms:**
- Logged in but redirected to login after few minutes
- "Session expired" message

**Solutions:**

1. **Check System Time:**
   - Windows: Right-click clock → Adjust date/time
   - Ensure correct timezone
   - Sync time with server

2. **Clear Browser Data:**
   - Cookies might be corrupted
   - Clear and retry login

3. **Check Server Logs:**
   - Look for JWT errors
   - Check token expiration settings

---

## ⚠️ QR Code & Attendance Issues

### Issue: "QR Code Error: Invalid or Expired"

**Symptoms:**
- Scanned QR code says invalid
- Get "QR_CODE_INVALID" error
- Works sometimes, fails other times

**Solutions:**

1. **QR Code is Time-Locked:**
   - QR code is valid for exactly 60 seconds
   - After 60 seconds, it expires
   - Check timer on admin QR panel
   - Get latest QR code from admin

2. **System Time Mismatch:**
   - Server time and client time must match
   - Check system clock
   - Sync time: Right-click clock → Set time
   - Consider using NTP server

3. **Refresh QR Page:**
   - Admin should refresh QR page if old
   - Shows timer when QR will refresh
   - New QR generated every minute

### Issue: "Attendance Marked Multiple Times"

**Symptoms:**
- Same person appears multiple times
- Duplicate check-in records

**Solutions:**

1. **It's Check-In and Check-Out:**
   - First scan = Check-in
   - Second scan = Check-out
   - Multiple scans on same person are normal

2. **Check Data:**
   - View in attendance records
   - Should show check_in and check_out time
   - Working hours calculated

3. **Prevent Accidental Duplicates:**
   - Tell employees to scan only once at entry/exit
   - Once scanned, status changes
   - Can't check-in twice without check-out

---

## 🔧 Server & Database Issues

### Issue: "Cannot Connect to Database"

**Symptoms:**
- Server starts but says database error
- "Connection refused" error
- "Unknown database" error

**Solutions:**

1. **Check MySQL is Running:**
   ```bash
   # Windows
   Services → MySQL → Start
   
   # Or via Command Line
   mysql -u root -p
   ```

2. **Check .env Configuration:**
   ```
   DB_HOST=localhost (or IP address)
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=attendance_system
   ```

3. **Create Database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS attendance_system;
   USE attendance_system;
   ```

4. **Check Database Tables:**
   ```sql
   SHOW TABLES;
   DESCRIBE employees;
   DESCRIBE attendance;
   ```

### Issue: "Port Already in Use"

**Symptoms:**
- Server fails to start
- "Port 5000 already in use" error
- Can't access localhost:5000

**Solutions:**

1. **Find Process Using Port:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

2. **Kill Process:**
   ```bash
   # Windows
   taskkill /PID <PID> /F
   
   # Mac/Linux
   kill -9 <PID>
   ```

3. **Change Port in .env:**
   ```
   PORT=5001
   ```

4. **Close Old Browser Tabs:**
   - Sometimes holding connection
   - Close all tabs and restart

---

## 📊 Data & Reporting Issues

### Issue: "Attendance Records Missing"

**Symptoms:**
- Can't find attendance records
- Empty attendance list
- Employee scanned but not recorded

**Solutions:**

1. **Check Date Filter:**
   - Maybe filtered to wrong date
   - Set date to today
   - Clear filters and retry

2. **Check Employee Status:**
   - Employee must be "active"
   - Inactive employees won't show in records
   - Edit employee to activate

3. **Check Database:**
   ```sql
   SELECT * FROM attendance WHERE DATE(date) = CURDATE();
   ```

4. **Wait for Updates:**
   - Dashboard updates every 10 seconds
   - Might take a moment to appear
   - Refresh page if needed

---

## 🐌 Performance Issues

### Issue: "System is Slow / Laggy"

**Symptoms:**
- Dashboard loads slowly
- Database queries are slow
- High CPU usage

**Solutions:**

1. **Check Record Count:**
   - Old records slow down queries
   - Archive old attendance data
   - Index database tables

2. **Clear Browser Cache:**
   - Ctrl+Shift+Delete
   - Clear all data
   - Refresh page

3. **Restart Server:**
   ```bash
   npm start
   ```

4. **Close Unnecessary Tabs:**
   - Each open page uses resources
   - Close other tabs
   - Reduces browser load

5. **Use Modern Browser:**
   - Chrome (Recommended)
   - Firefox
   - Edge
   - Safari

---

## 🔍 Developer Debugging

### Enable Debug Logs:

1. **Check Server Logs:**
   - Look for error messages when starting
   - Check console for API errors

2. **Browser Developer Tools:**
   - Press F12
   - Console tab → look for red errors
   - Network tab → check failed requests

3. **Check API Response:**
   ```
   Console > Network tab
   Click API request
   Look at Response tab
   Check for error messages
   ```

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot GET /api/qr/current" | Route not found | Server needs restart |
| "Unauthorized" | No token or expired | Need to login |
| "Token invalid" | Bad JWT token | Logout and login again |
| "Employee not found" | Wrong employee ID | Check ID is correct |
| "Database error" | Connection failed | Check MySQL running |

---

## 💡 Tips for Best Performance

### For Admins:
1. Keep browser updated
2. Restart server daily if possible
3. Archive old attendance monthly
4. Don't keep too many browser tabs open
5. Clear cache weekly

### For Employees:
1. Use Chrome for best camera support
2. Close other apps to save phone battery
3. Ensure good lighting for scanning
4. Position QR code in center of camera
5. Keep phone still while scanning

### For System Admin:
1. Monitor database size monthly
2. Backup database weekly
3. Update Node.js regularly
4. Check server logs for errors
5. Ensure sufficient disk space

---

## 📞 Need More Help?

If issues persist:

1. **Check System Requirements:**
   - Node.js v14 or higher
   - MySQL 5.7 or higher
   - 2GB RAM minimum
   - Modern web browser

2. **Review Setup Guide:**
   - See SETUP_GUIDE.md
   - Check configuration section

3. **Check Logs:**
   - Server console output
   - Browser console (F12)
   - MySQL error logs

4. **Try Fresh Start:**
   - Restart server
   - Clear browser cache
   - Refresh page
   - Try again

---

**Last Updated:** April 28, 2026
**System Version:** 2.0
