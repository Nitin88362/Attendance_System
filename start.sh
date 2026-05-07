#!/bin/bash

# NIITN Attendance System - Installation & Startup Script
# This script sets up and starts the system

echo "=================================="
echo "NIITN Attendance System"
echo "Installation & Startup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "⚙️ Configuration Check..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating with defaults..."
    cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_system
JWT_SECRET=niitn_secret_key_2026
PORT=5000
EOF
    echo "✅ .env file created. Please update database credentials if needed."
else
    echo "✅ .env file found"
fi

echo ""
echo "🗄️ Database Setup..."
echo ""
echo "Make sure your MySQL database is running and configured:"
echo "  - Host: localhost"
echo "  - Port: 3306"
echo "  - Database: attendance_system"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Please run 'npm install'"
    exit 1
fi

echo "✅ All checks passed!"
echo ""
echo "=================================="
echo "Starting the server..."
echo "=================================="
echo ""
echo "The system will start on: http://localhost:5000"
echo "Admin Login: http://localhost:5000"
echo "Employee Login: http://localhost:5000/employee-login"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
