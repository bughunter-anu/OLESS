# OLESS - Online Examination Security System

A comprehensive full-stack web application for managing online examinations securely and efficiently.

## Features

### Authentication & Authorization
- User registration and login
- Role-based access control (Admin, Student, Operator)
- JWT-based authentication
- Secure password hashing

### Admin Dashboard
- User management (create, update, delete)
- Subject and topic management
- Question bank management
- Exam configuration and management
- Results and analytics
- System policies configuration

### Student Portal
- View available exams
- Take exams with timer
- View exam history and results
- Topic-wise performance analysis
- Profile management

### Exam Module
- Random question generation
- Timer-based exams with auto-submit
- Question navigation
- Answer flagging for review
- Copy/paste prevention
- Tab switch detection

### Results & Reports
- Automatic grading
- Detailed score reports
- Topic-wise analysis
- Strength/weakness identification

## Tech Stack

### Frontend
- HTML5 & CSS3 (Modern responsive design)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts (Inter)

### Backend
- Node.js
- Express.js
- MySQL Database
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
OLESS/
├── backend/
│   ├── config/
│   │   ├── config.js       # Application configuration
│   │   └── database.js    # Database connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── examController.js
│   │   ├── questionController.js
│   │   ├── resultController.js
│   │   └── subjectController.js
│   ├── middleware/
│   │   ├── auth.js         # Authentication middleware
│   │   └── validate.js     # Request validation
│   ├── models/
│   │   ├── Exam.js
│   │   ├── Question.js
│   │   ├── Result.js
│   │   ├── Subject.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── exams.js
│   │   ├── questions.js
│   │   ├── results.js
│   │   └── subjects.js
│   ├── package.json
│   └── server.js
├── database/
│   └── database_schema.sql # Database schema
├── frontend/
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   ├── js/
│   │   ├── admin.js        # Admin dashboard logic
│   │   ├── api.js          # API client
│   │   ├── app.js          # Common utilities
│   │   ├── auth.js         # Authentication logic
│   │   ├── config.js       # Frontend configuration
│   │   └── student.js      # Student dashboard logic
│   ├── dashboard/
│   │   ├── admin.html      # Admin dashboard
│   │   ├── exam.html       # Exam interface
│   │   └── student.html    # Student dashboard
│   ├── pages/
│   │   ├── login.html
│   │   └── register.html
│   └── index.html          # Landing page
├── README.md
└── AGENTS.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup

1. Create a new MySQL database:
```sql
CREATE DATABASE oless_db;
```

2. Import the database schema:
```bash
mysql -u root -p oless_db < database/database_schema.sql
```

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend folder:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=oless_db
JWT_SECRET=your_secret_key_here
```

4. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000

### Frontend Setup

The frontend is static and can be served in multiple ways:

**Option 1: Using the backend**
The backend can serve static files. Access at http://localhost:3000

**Option 2: Using a static server**
```bash
cd frontend
npx serve .
```

**Option 3: Opening directly**
Open `frontend/index.html` in a web browser

## Default Credentials

After setup, use these credentials to login:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@123 |
| Student | (Register new) | (Your choice) |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Admin
- `GET /api/admin/dashboard-stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/policies` - Get exam policies
- `PUT /api/admin/policies` - Update policies

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/bulk` - Bulk import questions

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create exam
- `POST /api/exams/start` - Start exam
- `POST /api/exams/session/:id/submit` - Submit exam
- `GET /api/exams/my-sessions` - Get user's exam sessions

### Results
- `GET /api/results/my-results` - Get user's results
- `GET /api/results/:id` - Get result details
- `GET /api/results/statistics/exam/:id` - Get exam statistics

## Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: Request throttling
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permissions

## UI Features

- **Responsive Design**: Mobile-friendly layout
- **Dark/Light Mode**: Theme toggle
- **Modern UI**: Clean, professional interface
- **Toast Notifications**: User feedback
- **Loading States**: Visual feedback
- **Error Handling**: User-friendly messages

## License

MIT License - See LICENSE file for details.

## Support

For support, email support@oless.edu or create an issue on GitHub.

---

Built with ❤️ for educational institutions worldwide.
