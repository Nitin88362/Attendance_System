# NIITN - System Architecture & Workflow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │   ADMIN PANEL    │        │ EMPLOYEE PORTAL  │               │
│  ├──────────────────┤        ├──────────────────┤               │
│  │ - Dashboard      │        │ - Dashboard      │               │
│  │ - QR Generator   │────────│ - Scanner (NEW)  │               │
│  │ - Employees      │  HTTP  │ - Attendance     │               │
│  │ - Attendance     │        │ - Profile        │               │
│  │ - Reports        │        └──────────────────┘               │
│  └──────────────────┘                                            │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ HTTPS/JSON
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    API ROUTES                           │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ GET    /api/qr/current      ◄── NEW QR GENERATOR      │    │
│  │ POST   /api/qr/verify       ◄── VERIFY & MARK ATTENDANCE│  │
│  │ GET    /api/qr/stats        ◄── TODAY'S STATS         │    │
│  │ GET    /api/qr/today-scans  ◄── LIVE RECORDS          │    │
│  │                                                         │    │
│  │ GET    /api/employees                                  │    │
│  │ POST   /api/employees (Admin only)                     │    │
│  │ GET    /api/employees/stats/overview    ◄── NEW       │    │
│  │ GET    /api/employees/departments/all   ◄── NEW       │    │
│  │                                                         │    │
│  │ GET/POST /api/attendance                               │    │
│  │ GET/POST /api/auth                                     │    │
│  │ GET/POST /api/leaves                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MYSQL DATABASE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   employees  │  │  attendance  │  │ departments  │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ emp_id (PK)  │  │ id (PK)      │  │ id (PK)      │          │
│  │ first_name   │  │ emp_id (FK)  │  │ name         │          │
│  │ last_name    │  │ date         │  │ description  │          │
│  │ email        │  │ check_in     │  └──────────────┘          │
│  │ password     │  │ check_out    │                             │
│  │ dept_id (FK) │  │ status       │                             │
│  │ status       │  │ working_hrs  │                             │
│  │ ...          │  └──────────────┘                             │
│  └──────────────┘                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 QR Code Scanning Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE (GENERATE)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Open QR Scanner Page (/qr)                                  │
│     ▼                                                             │
│  2. Every 60 seconds:                                           │
│     - Generate new random token                                 │
│     - Create QR code with token                                 │
│     - Send to frontend                                          │
│     ▼                                                             │
│  3. Display on Screen                                           │
│     - Show generated QR code                                    │
│     - Show timer (60s countdown)                                │
│     - Can download for printing                                 │
│     ▼                                                             │
│  4. Real-time Dashboard                                         │
│     - Auto-update every 10 seconds                              │
│     - Show attendance records                                   │
│     - Show employee stats                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

                            QR TOKEN
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          ┌──────────────────┐    ┌──────────────────┐
          │  ADMIN DISPLAYS  │    │  EMPLOYEE SCANS  │
          │  ON SCREEN/PRINT │    │  WITH CAMERA     │
          └──────────────────┘    └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  BROWSER CAMERA  │
                                  │  Opens camera    │
                                  │  Detects QR code │
                                  └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  jsQR LIBRARY    │
                                  │  Extracts token  │
                                  │  from QR image   │
                                  └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  SEND TO BACKEND │
                                  │  POST /qr/verify │
                                  │  { qrToken,      │
                                  │    employeeId }  │
                                  └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ VERIFY TOKEN     │
                                  │ Compare with     │
                                  │ current QR token │
                                  └──────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
          ▼ (Valid)                                      ▼ (Invalid)
  ┌────────────────┐                         ┌──────────────────┐
  │ MARK ATTENDANCE│                         │ REJECT SCAN      │
  ├────────────────┤                         ├──────────────────┤
  │ - Record in DB │                         │ Show error:      │
  │ - Check-in OR  │                         │ "QR code expired"│
  │ - Check-out    │                         │ "Try new QR"     │
  │ - Calculate    │                         └──────────────────┘
  │   working hrs  │
  └────────────────┘
           │
           ▼
  ┌────────────────────┐
  │ SHOW SUCCESS MSG   │
  │ & ATTENDANCE TIME  │
  └────────────────────┘
           │
           ▼
  ┌────────────────────┐
  │ DASHBOARD UPDATES  │
  │ (10 sec auto)      │
  │ Shows new record   │
  └────────────────────┘
```

---

## 📊 Data Flow Diagram

```
                           ┌─ EVERY 60 SECONDS ─┐
                           │                      │
                    ┌──────┴──────────┐           │
                    │                 ▼           │
               TOKEN GEN ──► QR CODE GEN ────────┐
                    │                 │          │
                    └─────────────────┼──────────┤
                                      │          │
                    ┌─────────────────┴──────┐   │
                    │   SEND TO FRONTEND    │   │
                    │   (Socket.io or API)  │   │
                    └─────────────────┬──────┘   │
                                      │          │
                    ┌─────────────────┴──────┐   │
                    │  DISPLAY ON SCREEN     │   │
                    │  - Show QR Code        │   │
                    │  - Start Timer         │   │
                    │  - Update Stats        │   │
                    └────────────┬───────────┘   │
                                 │               │
        ┌────────────────────────┴────────────────┴─────────┐
        │                                                    │
        ▼                                                    ▼
   EMPLOYEE SCANS                             QR EXPIRES (Start new)
   ┌──────────────┐
   │ Open Camera  │
   │ Point at QR  │
   │ Wait for     │
   │ detection    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ QR Detected  │
   │ Token extracted
   │ Send to API  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Verify Token     │
   │ with current QR  │
   └──────┬───────────┘
          │
    ┌─────┴─────┐
    │            │
 VALID      EXPIRED
    │            │
    ▼            ▼
 MARK        REJECT
ATTENDANCE   SCAN
    │            │
    ├────┬───────┘
    │    │
    ▼    ▼
  UPDATE DASHBOARD
  - Insert record
  - Refresh stats
  - Notify admin
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADMIN LOGIN                          EMPLOYEE LOGIN        │
│  ┌────────────────┐                   ┌────────────────┐    │
│  │ Email + Passwd │                   │ ID + Password  │    │
│  └────────┬───────┘                   └────────┬───────┘    │
│           │                                     │            │
│           ▼                                     ▼            │
│  ┌────────────────┐                   ┌────────────────┐    │
│  │ Check in DB    │                   │ Check in DB    │    │
│  │ Verify password│                   │ Verify password│    │
│  │ (bcrypt)       │                   │ (bcrypt)       │    │
│  └────────┬───────┘                   └────────┬───────┘    │
│           │                                     │            │
│           ▼                                     ▼            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Generate JWT Token (expires in 24h)               │    │
│  │ Store in localStorage/sessionStorage              │    │
│  └────────┬──────────────────────────────────────────┘    │
│           │                                                 │
│           ▼                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ALL API REQUESTS MUST INCLUDE:                    │    │
│  │ Authorization: Bearer <JWT_TOKEN>                 │    │
│  └────────┬──────────────────────────────────────────┘    │
│           │                                                 │
│           ▼                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ BACKEND VERIFIES:                                 │    │
│  │ - Token exists                                    │    │
│  │ - Token not expired                               │    │
│  │ - Token signature valid                           │    │
│  │ - User has permission                             │    │
│  └────────┬──────────────────────────────────────────┘    │
│           │                                                 │
│        ┌──┴──┐                                              │
│        │     │                                              │
│     ALLOW DENY                                              │
│        │     │                                              │
│        ▼     ▼                                              │
│      API    403                                             │
│    WORKS  FORBIDDEN                                         │
│           or 401                                            │
│           UNAUTHORIZED                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Check-in/Check-out Logic

```
┌──────────────────────────────────────────────────────────┐
│           EMPLOYEE SCANS QR CODE                         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. QR Token Verified ✓                                 │
│     ▼                                                     │
│  2. Check Database                                      │
│     ┌─────────────────────────────────────┐             │
│     │ SELECT * FROM attendance            │             │
│     │ WHERE employee_id = ?               │             │
│     │ AND date = TODAY                    │             │
│     └────────────┬────────────────────────┘             │
│                  │                                       │
│    ┌─────────────┴─────────────┐                         │
│    │                           │                         │
│ FOUND                      NOT FOUND                     │
│    │                           │                         │
│    ▼                           ▼                         │
│ ┌─────────────────┐  ┌──────────────────────┐           │
│ │ Check-in exists?│  │ Create NEW record    │           │
│ └────────┬────────┘  │ - employee_id        │           │
│          │           │ - date = TODAY       │           │
│    ┌─────┴─────┐     │ - check_in = NOW     │           │
│    │           │     │ - status = present   │           │
│   YES        NO      └──────┬───────────────┘           │
│    │           │            │                           │
│    ▼           ▼            ▼                           │
│ ┌─────┐   ┌─────┐   ┌──────────────┐                   │
│ │ CHECKOUT CHECK-IN  │ RECORD SAVED │                   │
│ │ UPDATE check_out   │ (First scan) │                   │
│ │ Calculate work hrs │ DONE ✓       │                   │
│ └──────┬──────┘   │              └──────────┬───┘           │
│        │           └──────────────┬──────────┘                │
│        │                          │                          │
│        └──────────┬───────────────┘                          │
│                   │                                          │
│                   ▼                                          │
│        ┌──────────────────────┐                             │
│        │ RETURN SUCCESS       │                             │
│        │ - Type (check-in)    │                             │
│        │ - Time               │                             │
│        │ - Employee Name      │                             │
│        │ - Message            │                             │
│        └──────────┬───────────┘                             │
│                   │                                          │
│                   ▼                                          │
│        ┌──────────────────────┐                             │
│        │ UPDATE DASHBOARD     │                             │
│        │ - Show new record    │                             │
│        │ - Update stats       │                             │
│        │ - Refresh list       │                             │
│        └──────────────────────┘                             │
│                                                              │
└──────────────────────────────────────────────────────────┘
```

---

## 📱 Technology Stack

```
┌─────────────────────────────────────────┐
│            FRONTEND (Client)            │
├─────────────────────────────────────────┤
│ - HTML5 / CSS3 / JavaScript             │
│ - No Framework (Vanilla JS)             │
│ - jsQR (QR Detection Library)           │
│ - QRCode.js (QR Generation)             │
│ - Font Awesome (Icons)                  │
│ - Google Fonts (Typography)             │
└─────────────────────────────────────────┘
           │
           │ HTTP/HTTPS
           ▼
┌─────────────────────────────────────────┐
│         BACKEND (Server)                │
├─────────────────────────────────────────┤
│ - Node.js / Express.js                  │
│ - JWT (Authentication)                  │
│ - bcryptjs (Password Hashing)           │
│ - express-validator (Validation)        │
│ - CORS (Cross-Origin)                   │
│ - Helmet (Security)                     │
│ - Morgan (Logging)                      │
│ - Multer (File Upload)                  │
│ - Moment.js (Date/Time)                 │
│ - crypto (Token Generation)             │
└─────────────────────────────────────────┘
           │
           │ SQL
           ▼
┌─────────────────────────────────────────┐
│          DATABASE                       │
├─────────────────────────────────────────┤
│ - MySQL 5.7+                            │
│ - mysql2/promise (Driver)               │
│ - Connection Pooling                    │
│ - SSL Support                           │
└─────────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

- [x] QR code generation every 60 seconds
- [x] Employee scanner with camera support
- [x] Real-time admin dashboard updates
- [x] Employee registration display fixed
- [x] API endpoints created
- [x] Database integration tested
- [x] Security measures in place
- [x] Error handling implemented
- [x] Documentation completed
- [x] Ready for production

---

**Status:** ✅ All Systems Operational
**Version:** 2.0
**Date:** April 28, 2026
