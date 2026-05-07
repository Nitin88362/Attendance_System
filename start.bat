@echo off
REM NIITN Attendance System - Windows Startup Script

echo ==================================
echo NIITN Attendance System
echo Installation ^& Startup (Windows)
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Check if .env file exists
echo ⚙️ Configuration Check...
echo.

if not exist .env (
    echo ⚠️ .env file not found. Creating with defaults...
    (
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=attendance_system
        echo JWT_SECRET=niitn_secret_key_2026
        echo PORT=5000
    ) > .env
    echo ✅ .env file created. Please update database credentials if needed.
) else (
    echo ✅ .env file found
)

echo.
echo 🗄️ Database Setup...
echo.
echo Make sure your MySQL database is running and configured:
echo   - Host: localhost
echo   - Port: 3306
echo   - Database: attendance_system
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ node_modules not found. Please run 'npm install'
    pause
    exit /b 1
)

echo ✅ All checks passed!
echo.
echo ==================================
echo Starting the server...
echo ==================================
echo.
echo The system will start on: http://localhost:5000
echo Admin Login: http://localhost:5000
echo Employee Login: http://localhost:5000/employee-login
echo.
echo Press Ctrl+C to stop the server
echo.
echo 💡 TIP: Open http://localhost:5000 in your browser
echo.

REM Start the server
call npm start

pause
