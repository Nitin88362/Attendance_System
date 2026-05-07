# NIITN - Employee Attendance System | Complete Setup Guide

## 📋 System Overview

This is a complete employee attendance management system with real-time QR code scanning. The system has three main components:

1. **Admin Panel** - Manage employees, view attendance, generate QR codes
2. **Employee Scanner** - Employees scan QR codes to mark attendance
3. **Real-time Dashboard** - Live updates of attendance records

---

## ✅ What's Fixed in This Update

### 1. **QR Code Generation System**
- ✅ New QR code generated **automatically every 60 seconds**
- ✅ Unique token for each QR code
- ✅ Admin can download QR code for display
- ✅ QR codes are **strictly time-locked** (only current code works)

### 2. **Employee Scanner (NEW)**
- ✅ **Real camera access** for scanning QR codes
- ✅ **Web-based camera** - no app installation needed
- ✅ **Automatic QR detection** using jsQR library
- ✅ **Real-time status updates**
- ✅ Shows check-in and check-out times

### 3. **Admin QR Scanner Panel (UPDATED)**
- ✅ Live QR code display with auto-refresh
- ✅ **Real-time attendance records** (updates every 10 seconds)
- ✅ Statistics dashboard showing:
  - Total scans today
  - Employees checked in
  - Employees checked out
  - QR refresh timer
- ✅ Download functionality for QR codes

### 4. **Employee Registration (FIXED)**
- ✅ Employees now properly display in admin panel
- ✅ Employee statistics showing active/inactive counts
- ✅ Department filtering
- ✅ Search functionality working

---

## 🚀 Quick Start Guide

### For Admins:

1. **Login** at `http://localhost:PORT`
   - Default: Admin login page

2. **Go to QR Scanner** → Click "QR Scanner" in sidebar
   - You'll see the **live QR code** that changes every minute
   - Share this QR code with employees via:
     - Download and print
     - Display on a screen
     - Email to employees
     - Projected on a wall

3. **Monitor Attendance** in real-time:
   - See who's checking in/out
   - View today's attendance records
   - Export data if needed

---

### For Employees:

1. **Login** at `http://localhost:PORT/employee-login`
   - Use your credentials

2. **Click "Scan Attendance"** in sidebar
   - OR click **"Scan QR Code"** button on dashboard

3. **Allow Camera Access**
   - Browser will ask permission
   - Click "Allow" to enable camera

4. **Scan the QR Code**
   - Point camera at QR code
   - Camera will automatically detect and scan
   - Attendance will be recorded instantly

5. **See Your Status**
   - Check-in time appears
   - Later, scan again for check-out
   - Working hours calculated automatically

---

## 📝 API Endpoints Reference

### QR Code Endpoints

```
GET /api/qr/current
- Returns current active QR code
- Auth: Required (Admin)

POST /api/qr/verify
- Verify QR code and mark attendance
- Body: { qrToken, employeeId }
- Auth: Required (Employee)

GET /api/qr/stats
- Get attendance statistics for today
- Auth: Required (Admin)

GET /api/qr/today-scans
- Get all scans for today
- Auth: Required (Admin)
```

---

## 🗄️ Database Schema

### attendance table
```sql
- id (PRIMARY KEY)
- employee_id (FOREIGN KEY)
- date
- check_in (TIME)
- check_out (TIME)
- working_hours (DECIMAL)
- status (varchar: present, absent, on_leave)
```

---

## 🔧 Configuration

### Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_system
JWT_SECRET=your_secret_key
PORT=5000
```

### QR Code Settings
- **Refresh Interval**: 60 seconds (configurable in `/routes/qr-scanner.js`)
- **Auto-refresh Dashboard**: Every 10 seconds (configurable in `/public/qr-admin.html`)

---

## 🎯 Features Breakdown

### Real-time Updates
- Admin dashboard refreshes every 10 seconds automatically
- Employee attendance updates instantly after scanning
- QR code timer shows remaining validity
- Live employee list with filters

### Security
- JWT token-based authentication
- QR codes are time-locked
- Invalid/expired QR codes rejected
- Employee data is secure

### User Experience
- Mobile-responsive design
- No app installation needed
- Instant feedback on scan
- Easy navigation

---

## 🐛 Troubleshooting

### "Camera Permission Denied"
**Solution:**
1. Check browser camera permissions
2. Go to browser settings → Privacy → Camera
3. Ensure site is allowed to use camera
4. Try in incognito mode
5. Try different browser (Chrome recommended)

### "Invalid QR Code Error"
**Solution:**
1. Make sure you're scanning the **current** QR code (updated every 60 seconds)
2. Clear browser cache and reload page
3. Check system time is correct
4. Ensure good lighting for camera

### "Employee Not Found"
**Solution:**
1. Admin must first register employee in "Add Employee" page
2. Employee ID must be exact match (case-sensitive)
3. Employee status must be "Active"

### "Employees Not Showing in Admin Panel"
**Solution:**
1. Refresh page (Ctrl+F5)
2. Check database connection
3. Verify employees are created with status = 'active'
4. Check browser console for errors

### "QR Code Not Refreshing"
**Solution:**
1. Refresh the admin QR page
2. Check backend is running
3. Check console for errors
4. Verify QR API endpoint is working

---

## 📊 How It Works (Technical Flow)

### Employee Check-in Process:

1. **Employee scans QR code**
   - Browser camera activates
   - jsQR library detects QR pattern
   
2. **QR Token Extracted**
   - QR contains: `ATTENDANCE-<token>`
   - Token sent to backend

3. **Backend Verification**
   - Token compared with current active token
   - If valid, continue; if expired, reject
   
4. **Attendance Record Created**
   - Check-in time recorded
   - Or check-out time recorded
   - Working hours calculated

5. **Real-time Update**
   - Employee sees success message
   - Admin dashboard updates automatically
   - All other employees see updated list

---

## 🎓 Admin Panel Features

### Dashboard
- Employee statistics
- Attendance overview
- Department management
- Reports

### QR Scanner (NEW)
- Live QR code display
- Auto-refresh every 60 seconds
- Real-time attendance records
- Download QR code
- Instructions for employees

### Employees
- Add new employees
- Edit employee details
- View employee profiles
- Search and filter
- Bulk import (optional)

### Attendance
- View attendance records
- Filter by date, department
- Export to Excel
- Attendance reports

---

## 💡 Tips & Best Practices

### For Admins:
1. **Display QR Code**: Project on screen or print and post
2. **Refresh Regularly**: QR changes every minute
3. **Monitor Dashboard**: Watch for scanning issues
4. **Backup Employee Data**: Regularly export reports
5. **Set Expectations**: Tell employees to check email for links

### For Employees:
1. **Bookmark the Scanner**: Save `/employee-scanner` in bookmarks
2. **Check Phone Battery**: Camera uses battery
3. **Ensure Good Lighting**: QR needs clear visibility
4. **Position Code Properly**: Center QR in camera frame
5. **Wait for Confirmation**: Don't close until "Success" message

---

## 📱 Supported Devices

- ✅ Windows/Mac/Linux (Chrome, Firefox, Edge)
- ✅ iOS (Safari on iPhone/iPad)
- ✅ Android (Chrome, Firefox)
- ✅ Tablets
- ✅ Mobile phones

---

## 🔐 Security Considerations

1. **QR Code Expiry**: Codes expire every 60 seconds
2. **JWT Tokens**: All API requests authenticated
3. **Database Encryption**: Use SSL for production
4. **HTTPS Only**: Use HTTPS in production
5. **Password Hashing**: Passwords bcrypted with salt

---

## 📞 Support & Issues

### Common Issues Resolved in This Update:

1. ✅ **"Scanner opens but nothing happens"**
   - Fixed: Proper camera integration with jsQR
   - Fixed: Error handling and permission requests

2. ✅ **"Employees not showing in admin panel"**
   - Fixed: Added `/api/employees/stats/overview` endpoint
   - Fixed: Added `/api/employees/departments/all` endpoint
   - Fixed: Fixed JavaScript data binding

3. ✅ **"QR code doesn't change"**
   - Fixed: Implemented 60-second auto-refresh
   - Fixed: QR generation API working correctly

4. ✅ **"Real-time updates not working"**
   - Fixed: Added auto-refresh to admin dashboard
   - Fixed: API endpoints returning live data

---

## 📈 Future Enhancements

- [ ] Biometric fingerprint scanning
- [ ] Face recognition for attendance
- [ ] Mobile app (React Native)
- [ ] SMS/Email notifications
- [ ] Geolocation verification
- [ ] Attendance analytics
- [ ] Integration with payroll

---

## 📝 Files Modified/Created

### New Files:
- `/routes/qr-scanner.js` - QR code API endpoints
- `/public/employee-scanner.html` - Employee QR scanner
- `/public/qr-admin.html` - Admin QR dashboard

### Modified Files:
- `/server.js` - Added new routes
- `/routes/employees.js` - Added stats endpoints
- `/public/employee-dashboard.html` - Updated links
- `/public/employees.html` - Fixed data binding

---

## ✨ Version History

### v2.0 (Current)
- ✅ Real-time QR code generation (60-second refresh)
- ✅ Web camera-based scanning
- ✅ Real-time admin dashboard
- ✅ Fixed employee registration display
- ✅ Auto-refresh functionality

### v1.0 (Previous)
- Basic attendance system
- Static QR codes
- Manual refresh required

---

**Last Updated**: April 28, 2026
**System Status**: ✅ Fully Operational
