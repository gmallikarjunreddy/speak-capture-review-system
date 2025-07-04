
# Voice Capture Backend

This is the backend API for the Voice Capture application using Express.js and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example` and configure your database settings:
```bash
cp .env.example .env
```

3. Set up your PostgreSQL database and run the SQL schema provided in the main project.

4. Set up the admin user:
```bash
node scripts/setup-admin.js
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Sentences
- `GET /api/sentences` - Get all active sentences
- `POST /api/sentences` - Add new sentence
- `PUT /api/sentences/:id` - Update sentence
- `DELETE /api/sentences/:id` - Delete sentence

### Recordings
- `POST /api/recordings` - Upload recording
- `GET /api/recordings/user/:userId` - Get user recordings

### Recording Sessions
- `POST /api/recording-sessions` - Create recording session
- `PUT /api/recording-sessions/:id` - Update recording session

### Admin
- `POST /api/admin/auth` - Admin login
- `GET /api/admin/sentences` - Get all sentences (admin)
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/recordings` - Get all recordings (admin)

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

**Note**: Change the admin password after initial setup for security.
