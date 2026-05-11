# Employee Attendance System

A complete Employee Attendance Management System built with Node.js, Express, and MySQL. This system provides comprehensive attendance tracking, leave management, and employee administration features.

## Features

### 🔐 Authentication System
- Admin and Employee login
- JWT-based authentication
- Secure password handling with bcrypt
- Session management

### 👥 Employee Management
- Add, edit, and delete employees
- Employee profile management
- Department-based organization
- Employee status tracking

### ⏰ Attendance Management
- Check-in/Check-out functionality
- Daily attendance tracking
- Working hours calculation
- Attendance reports and statistics
- QR code integration for check-in

### 📅 Leave Management
- Leave request submission
- Leave approval/rejection workflow
- Leave type categorization (Casual, Sick, Annual, etc.)
- Leave balance tracking
- Upcoming leaves dashboard

### 📊 Dashboard & Analytics
- Real-time attendance statistics
- Visual charts and graphs
- Department-wise analytics
- Recent activity tracking
- Quick stats overview

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Security**: Helmet, CORS, Bcrypt

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env` file and update the configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=attendance_system

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # Admin Credentials (Default)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```
   This will create the database schema and insert sample data.

5. **Start the Server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## Default Login Credentials

### Admin Login
- **Username**: `admin`
- **Password**: `admin123`

### Sample Employee Logins
- **Employee ID**: `EMP001`
- **Password**: `admin123`

- **Employee ID**: `EMP002`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/employee/login` - Employee login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/departments/all` - Get all departments
- `GET /api/employees/stats/overview` - Get employee statistics

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Mark check-in
- `PUT /api/attendance/checkout` - Mark check-out
- `GET /api/attendance/employee/:employee_id` - Get employee attendance
- `GET /api/attendance/today/summary` - Today's attendance summary
- `POST /api/attendance/manual` - Manual attendance entry

### Leaves
- `GET /api/leaves` - Get all leave requests
- `GET /api/leaves/:id` - Get leave by ID
- `POST /api/leaves/apply` - Apply for leave
- `PUT /api/leaves/:id/status` - Approve/reject leave
- `GET /api/leaves/employee/:employee_id` - Get employee leave history
- `GET /api/leaves/upcoming/list` - Get upcoming leaves

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/attendance-chart` - Get attendance chart data
- `GET /api/dashboard/department-stats` - Get department statistics

## Database Schema

### Tables
1. **departments** - Department information
2. **employees** - Employee details and credentials
3. **attendance** - Daily attendance records
4. **leaves** - Leave requests and approvals
5. **holidays** - Company holidays

## Project Structure

```
employee-attendance-system/
├── config/
│   └── database.js          # Database connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── employees.js         # Employee management routes
│   ├── attendance.js        # Attendance routes
│   ├── leaves.js            # Leave management routes
│   └── dashboard.js         # Dashboard routes
├── scripts/
│   └── init-database.js    # Database initialization script
├── public/
│   ├── admin-login.html     # Admin login page
│   ├── employee-login.html  # Employee login page
│   ├── dashboard.html       # Admin dashboard
│   ├── employees.html       # Employee management
│   ├── add-employee.html    # Add employee form
│   ├── attendance.html      # Attendance management
│   └── leaves.html          # Leave management
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── server.js               # Main server file
└── README.md               # This file
```

## Features in Detail

### Dashboard
- Real-time attendance overview
- Employee statistics
- Recent attendance records
- Leave summary charts
- Upcoming leaves list
- QR code for attendance

### Employee Management
- Comprehensive employee profiles
- Department-based organization
- Status tracking (Active, Inactive, On Leave)
- Search and filter functionality
- Bulk operations support

### Attendance Tracking
- Automated check-in/check-out
- Working hours calculation
- Late arrival detection
- Daily attendance reports
- Export functionality

### Leave Management
- Multiple leave types
- Approval workflow
- Leave balance tracking
- Calendar integration
- Email notifications (configurable)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention

## Customization

### Adding New Leave Types
Update the `leave_type` enum in the database schema and update the frontend accordingly.

### Custom Departments
Add departments through the database or via the admin interface.

### Email Notifications
Configure email settings for leave approvals and attendance notifications.

## Development

### Adding New Features
1. Create API endpoints in appropriate route files
2. Update frontend HTML/JavaScript
3. Test thoroughly
4. Update documentation

### Database Changes
1. Modify `scripts/init-database.js`
2. Run `npm run init-db` to reset database
3. Update API endpoints if needed

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure database with proper credentials
4. Set up HTTPS with SSL certificates
5. Configure reverse proxy (nginx/Apache)

### Database Optimization
- Add indexes for frequently queried columns
- Set up database backups
- Monitor performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## License

This project is licensed under the MIT License.

---

**Note**: This is a comprehensive attendance management system suitable for small to medium-sized organizations. For enterprise deployments, consider additional security measures and scalability improvements.
#   A t t e n d a n c e _ S y s t e m -  
 