# OLESS - Online Examination Security System

A modern, secure, and user-friendly web-based platform for conducting online examinations.

## Features

### Student Module
- Register with personal details
- Secure login authentication
- Select subjects and exam level (Beginner, Expert, Guru)
- Attempt online exam with timer
- Navigate between questions
- View results instantly after submission

### Admin Module
- Manage users (students, operators, controllers)
- Add/edit/delete subjects and topics
- Manage question bank (MCQ & True/False)
- Set exam policies (time, number of questions, levels)
- Monitor exams and results
- Generate comprehensive reports

### Security Features
- Role-based access control (Admin, Student, Operator, Controller)
- SQL Injection prevention using stored procedures
- Password hashing
- Session management
- Random question generation to prevent paper leakage

## Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Responsive Design), JavaScript
- **Backend**: ASP.NET Core 8.0 (C#)
- **Database**: Microsoft SQL Server
- **Architecture**: 3-Tier Architecture (Presentation, Business Logic, Data)

## Project Structure

```
OLESS/
├── Controllers/          # Business Logic Layer
│   ├── HomeController.cs
│   ├── AccountController.cs
│   ├── StudentController.cs
│   ├── AdminController.cs
│   └── OperatorController.cs
├── Models/               # Data Access Layer
│   ├── DatabaseContext.cs
│   ├── User.cs
│   ├── Examinee.cs
│   ├── Subject.cs
│   ├── Question.cs
│   ├── ExamRecord.cs
│   └── Result.cs
├── Views/                # Presentation Layer
│   ├── Shared/
│   ├── Home/
│   ├── Account/
│   ├── Student/
│   ├── Admin/
│   └── Operator/
├── Content/
│   └── css/
│       └── style.css     # Modern responsive styles
├── Scripts/
│   └── main.js           # Client-side JavaScript
├── Data/
│   └── OLESS_Database.sql # Database scripts
└── appsettings.json       # Configuration
```

## Setup Instructions

### Prerequisites
- Visual Studio 2022 or later
- .NET 8.0 SDK
- SQL Server 2019 or later
- SQL Server Management Studio (optional)

### Database Setup

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Open the file: `OLESS/Data/OLESS_Database.sql`
4. Execute the entire script to create the database and tables

```sql
-- The script will:
-- 1. Create the OLESS database
-- 2. Create all necessary tables
-- 3. Create stored procedures for security
-- 4. Insert sample data (admin user and sample questions)
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin@123`

### Application Setup

1. Open the solution file `OLESS.sln` in Visual Studio
2. Update the connection string in `appsettings.json` if needed:

```json
"ConnectionStrings": {
    "OLESSConnection": "Server=localhost;Database=OLESS;Integrated Security=True;TrustServerCertificate=True;"
}
```

3. Build the solution (Ctrl+Shift+B)
4. Run the application (F5)

## Usage

### Logging In
1. Navigate to the login page
2. Use admin credentials or register a new student account

### Admin Operations
1. **Manage Users**: Add, edit, or deactivate users
2. **Manage Subjects**: Add subjects with codes and descriptions
3. **Manage Topics**: Organize topics under subjects
4. **Manage Questions**: Add MCQ and True/False questions
5. **View Results**: Monitor student performance

### Student Operations
1. **Select Exam**: Choose subject and difficulty level
2. **Take Exam**: Answer questions within time limit
3. **View Results**: See scores and performance

## Database Tables

| Table | Description |
|-------|-------------|
| Users | User accounts with roles |
| Examinee | Student profile details |
| Subjects | Available subjects |
| Topics | Topics within subjects |
| QuestionBank | Questions with options |
| ExamRecords | Exam session data |
| ExamQuestions | Questions for each exam |
| Results | Exam evaluation results |

## Security Measures

1. **Authentication**: Secure login with password hashing
2. **Authorization**: Role-based access control
3. **SQL Injection Prevention**: Parameterized queries and stored procedures
4. **Session Management**: Secure session handling
5. **Input Validation**: Both client and server-side validation

## Sample Data

The database script includes:
- 1 Admin user
- 3 Subjects (Programming, Data Structures, Databases)
- 6 Topics
- 19 Sample questions
- Various difficulty levels

## Future Enhancements

- AI-based proctoring
- Mobile application version
- Multimedia questions (images/videos)
- Real-time analytics dashboard
- Email notifications
- Integration with learning management systems

## License

This project is for educational purposes.

## Support

For support, please contact: support@oless.edu
