# Complete Installation Guide - Speak Capture Review System

This guide will help you set up the entire Speak Capture Review System on a new computer from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (v16 or higher) - [Download from nodejs.org](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download from postgresql.org](https://www.postgresql.org/download/)
3. **Git** - [Download from git-scm.com](https://git-scm.com/downloads)

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/gmallikarjunreddy/speak-capture-review-system.git

# Navigate to the project directory
cd speak-capture-review-system
```

## Step 2: Set Up PostgreSQL Database

### 2.1 Create Database and User

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
-- Create database
CREATE DATABASE voice_capture;

-- Create user (optional, you can use existing postgres user)
CREATE USER voice_capture_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE voice_capture TO voice_capture_user;

-- Connect to the database
\c voice_capture;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO voice_capture_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voice_capture_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voice_capture_user;
```

### 2.2 Run Database Migrations

Execute the SQL migrations in order:

```bash
# Navigate to supabase migrations folder
cd supabase/migrations

# Execute migrations in PostgreSQL (replace with your connection details)
psql -h localhost -U postgres -d voice_capture -f "20250614085926-5fdfa3ed-f9f7-426b-ac9c-c6ea71a8bd09.sql"
psql -h localhost -U postgres -d voice_capture -f "20250614090916-5aeac45f-97db-48a7-98e0-44dbde8ef3e8.sql"
psql -h localhost -U postgres -d voice_capture -f "20250614091500-admin-policies.sql"
psql -h localhost -U postgres -d voice_capture -f "20250615164500-e5813eb4-0ceb-4413-b65b-5b4459d028de.sql"
psql -h localhost -U postgres -d voice_capture -f "20250615174108-ed21e6da-3101-4174-99ae-be04dd23474f.sql"
psql -h localhost -U postgres -d voice_capture -f "20250615174632-131bc8e9-9cb2-46ee-86b9-1f3f7e6b2c74.sql"
psql -h localhost -U postgres -d voice_capture -f "20250615175712-6419fdd1-d886-4bad-8e96-e1e500d17e94.sql"
psql -h localhost -U postgres -d voice_capture -f "20250615183134-ebdfb1be-f40a-4e09-a0e8-70c9a90b569b.sql"
psql -h localhost -U postgres -d voice_capture -f "20250704132244-4dc3641b-73af-4c52-99b2-c7357ade655f.sql"
psql -h localhost -U postgres -d voice_capture -f "20250705020127-b970689e-4f09-4f7e-a460-0e34fbdf0b0b.sql"
```

## Step 3: Backend Setup

### 3.1 Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 3.2 Configure Backend Environment

Create a `.env` file in the backend directory:

```bash
# Create .env file
touch .env
```

Add the following content to the `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice_capture
DB_USER=postgres
DB_PASSWORD=your_database_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
```

**Important**: Replace `your_database_password` with your actual PostgreSQL password and `JWT_SECRET` with a strong secret key.

### 3.3 Set Up Admin User

```bash
# Run admin setup script
node scripts/setup-admin.js
```

This will create an admin user with:
- Username: `admin`
- Password: `admin123`

**Security Note**: Change the admin password after first login.

### 3.4 Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

The backend will run on `http://localhost:3001`

## Step 4: Frontend Setup

### 4.1 Install Frontend Dependencies

```bash
# Navigate back to project root
cd ..

# Install frontend dependencies
npm install
```

### 4.2 Configure Frontend Environment (if needed)

Check if there's a frontend `.env` file needed. If API endpoints need configuration, create `.env` in root:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4.3 Start Frontend Development Server

```bash
# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Step 5: Verify Installation

### 5.1 Test Backend API

```bash
# Test backend health (in new terminal)
curl http://localhost:3001/api/sentences
```

### 5.2 Test Admin Login

1. Open your browser and go to `http://localhost:5173`
2. Navigate to admin section
3. Login with:
   - Username: `admin`
   - Password: `admin123`

### 5.3 Test User Registration

1. Try registering a new user
2. Complete profile setup
3. Test voice recording functionality

## Step 6: Production Deployment (Optional)

### 6.1 Build Frontend for Production

```bash
# Build frontend
npm run build
```

### 6.2 Serve Production Build

You can serve the built files using a web server like Nginx or serve them with Express.

## Complete Command Summary

Here's the complete sequence of commands to run on a fresh computer:

```bash
# 1. Clone repository
git clone https://github.com/gmallikarjunreddy/speak-capture-review-system.git
cd speak-capture-review-system

# 2. Set up database (run SQL commands in PostgreSQL)
# See Step 2 above for SQL commands

# 3. Backend setup
cd backend
npm install
# Create .env file with database credentials
node scripts/setup-admin.js
npm run dev

# 4. Frontend setup (in new terminal)
cd ..
npm install
npm run dev
```

## Environment Variables Summary

### Backend (.env file in backend/ directory):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice_capture
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-jwt-secret
PORT=3001
```

### Frontend (.env file in root directory - if needed):
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Default Credentials

### Admin Access:
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### Common Issues:

1. **Database Connection Error**: 
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**:
   - Change PORT in backend `.env` file
   - Kill existing processes on ports 3001 or 5173

3. **Permission Errors**:
   - Ensure proper database permissions
   - Check file system permissions for uploads folder

4. **Module Not Found**:
   - Delete `node_modules` and run `npm install` again
   - Check Node.js version compatibility

## Support

If you encounter issues:
1. Check the console logs for errors
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that PostgreSQL service is running

## Security Notes

- Change default admin password immediately
- Use strong JWT secrets in production
- Set up proper database user with limited privileges
- Configure firewall rules for production deployment
- Use HTTPS in production
- Regular backup of database

## File Structure

```
speak-capture-review-system/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication middleware
│   ├── routes/            # API routes
│   ├── scripts/           # Setup scripts
│   ├── uploads/           # Audio file uploads
│   └── .env               # Backend environment variables
├── src/                   # Frontend React application
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
├── public/               # Static frontend assets
└── .env                  # Frontend environment variables (if needed)
```

This installation guide should help you set up the complete system on any new computer.