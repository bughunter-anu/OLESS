-- =====================================================
-- OLESS - Online Examination Security System
-- Database Creation Script for Microsoft SQL Server
-- =====================================================

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'OLESS')
BEGIN
    CREATE DATABASE OLESS;
END
GO

USE OLESS;
GO

-- =====================================================
-- DROP EXISTING TABLES (for clean setup)
-- =====================================================
IF OBJECT_ID('Results', 'U') IS NOT NULL DROP TABLE Results;
IF OBJECT_ID('ExamRecords', 'U') IS NOT NULL DROP TABLE ExamRecords;
IF OBJECT_ID('ExamQuestions', 'U') IS NOT NULL DROP TABLE ExamQuestions;
IF OBJECT_ID('QuestionBank', 'U') IS NOT NULL DROP TABLE QuestionBank;
IF OBJECT_ID('Topics', 'U') IS NOT NULL DROP TABLE Topics;
IF OBJECT_ID('Subjects', 'U') IS NOT NULL DROP TABLE Subjects;
IF OBJECT_ID('Examinee', 'U') IS NOT NULL DROP TABLE Examinee;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Student', 'Operator', 'Controller')),
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    LoginAttempts INT DEFAULT 0,
    LockedUntil DATETIME NULL
);
GO

-- =====================================================
-- EXAMINEE TABLE (Student Details)
-- =====================================================
CREATE TABLE Examinee (
    ExamineeID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    EnrollmentNo VARCHAR(20) NOT NULL UNIQUE,
    DateOfBirth DATE NOT NULL,
    Gender VARCHAR(10),
    Phone VARCHAR(20),
    Address VARCHAR(255),
    Department VARCHAR(100),
    Semester INT,
    ProfileImage VARCHAR(255),
    IsRegistered BIT DEFAULT 1,
    RegistrationDate DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================
CREATE TABLE Subjects (
    SubjectID INT IDENTITY(1,1) PRIMARY KEY,
    SubjectCode VARCHAR(20) NOT NULL UNIQUE,
    SubjectName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    Credits INT DEFAULT 3,
    IsActive BIT DEFAULT 1,
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- TOPICS TABLE
-- =====================================================
CREATE TABLE Topics (
    TopicID INT IDENTITY(1,1) PRIMARY KEY,
    SubjectID INT NOT NULL FOREIGN KEY REFERENCES Subjects(SubjectID),
    TopicName VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    Weightage INT DEFAULT 10,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- QUESTION BANK TABLE
-- =====================================================
CREATE TABLE QuestionBank (
    QuestionID INT IDENTITY(1,1) PRIMARY KEY,
    SubjectID INT NOT NULL FOREIGN KEY REFERENCES Subjects(SubjectID),
    TopicID INT FOREIGN KEY REFERENCES Topics(TopicID),
    QuestionType VARCHAR(20) NOT NULL CHECK (QuestionType IN ('MCQ', 'True/False')),
    QuestionText TEXT NOT NULL,
    OptionA VARCHAR(255),
    OptionB VARCHAR(255),
    OptionC VARCHAR(255),
    OptionD VARCHAR(255),
    CorrectAnswer VARCHAR(10) NOT NULL,
    DifficultyLevel VARCHAR(20) NOT NULL CHECK (DifficultyLevel IN ('Beginner', 'Expert', 'Guru')),
    Marks INT DEFAULT 1,
    Explanation TEXT,
    IsActive BIT DEFAULT 1,
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ModifiedAt DATETIME NULL
);
GO

-- =====================================================
-- EXAM RECORDS TABLE
-- =====================================================
CREATE TABLE ExamRecords (
    ExamID INT IDENTITY(1,1) PRIMARY KEY,
    ExamineeID INT NOT NULL FOREIGN KEY REFERENCES Examinee(ExamineeID),
    SubjectID INT NOT NULL FOREIGN KEY REFERENCES Subjects(SubjectID),
    ExamDate DATETIME NOT NULL,
    StartTime DATETIME,
    EndTime DATETIME,
    TotalQuestions INT NOT NULL,
    AnsweredQuestions INT DEFAULT 0,
    ExamStatus VARCHAR(20) DEFAULT 'Scheduled' CHECK (ExamStatus IN ('Scheduled', 'InProgress', 'Completed', 'Expired')),
    DifficultyLevel VARCHAR(20) NOT NULL CHECK (DifficultyLevel IN ('Beginner', 'Expert', 'Guru')),
    TimeLimit INT NOT NULL,
    BrowserHash VARCHAR(64),
    IPAddress VARCHAR(45),
    IsRandomized BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- EXAM QUESTIONS TABLE (Generated for each exam)
-- =====================================================
CREATE TABLE ExamQuestions (
    ExamQuestionID INT IDENTITY(1,1) PRIMARY KEY,
    ExamID INT NOT NULL FOREIGN KEY REFERENCES ExamRecords(ExamID),
    QuestionID INT NOT NULL FOREIGN KEY REFERENCES QuestionBank(QuestionID),
    QuestionOrder INT NOT NULL,
    IsAnswered BIT DEFAULT 0
);
GO

-- =====================================================
-- RESULTS TABLE
-- =====================================================
CREATE TABLE Results (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    ExamID INT NOT NULL FOREIGN KEY REFERENCES ExamRecords(ExamID),
    ExamineeID INT NOT NULL FOREIGN KEY REFERENCES Examinee(ExamineeID),
    SubjectID INT NOT NULL FOREIGN KEY REFERENCES Subjects(SubjectID),
    TotalQuestions INT NOT NULL,
    CorrectAnswers INT NOT NULL,
    WrongAnswers INT NOT NULL,
    Unanswered INT NOT NULL,
    Score DECIMAL(5,2) NOT NULL,
    Percentage DECIMAL(5,2) NOT NULL,
    Grade VARCHAR(5),
    PassStatus VARCHAR(10) CHECK (PassStatus IN ('Pass', 'Fail')),
    TimeTaken INT,
    Strengths VARCHAR(500),
    Weaknesses VARCHAR(500),
    Rank INT,
    Percentile DECIMAL(5,2),
    EvaluatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- SP: User Authentication
CREATE OR ALTER PROCEDURE sp_AuthenticateUser
    @Username VARCHAR(50),
    @Password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserID INT, @Role VARCHAR(20), @IsActive BIT, @LockedUntil DATETIME;
    
    SELECT @UserID = UserID, @Role = Role, @IsActive = IsActive, @LockedUntil = LockedUntil
    FROM Users WHERE Username = @Username;
    
    IF @UserID IS NULL
    BEGIN
        SELECT -1 AS Status, 'User not found' AS Message;
        RETURN;
    END
    
    IF @LockedUntil IS NOT NULL AND @LockedUntil > GETDATE()
    BEGIN
        SELECT -2 AS Status, 'Account is locked. Try again later.' AS Message;
        RETURN;
    END
    
    IF @IsActive = 0
    BEGIN
        SELECT -3 AS Status, 'Account is deactivated' AS Message;
        RETURN;
    END
    
    IF EXISTS (SELECT 1 FROM Users WHERE Username = @Username AND PasswordHash = @Password)
    BEGIN
        UPDATE Users SET LastLogin = GETDATE(), LoginAttempts = 0 WHERE UserID = @UserID;
        SELECT 1 AS Status, 'Login successful' AS Message, @UserID AS UserID, @Role AS Role;
    END
    ELSE
    BEGIN
        UPDATE Users SET LoginAttempts = LoginAttempts + 1 WHERE UserID = @UserID;
        IF (SELECT LoginAttempts FROM Users WHERE UserID = @UserID) >= 5
        BEGIN
            UPDATE Users SET LockedUntil = DATEADD(MINUTE, 30, GETDATE()) WHERE UserID = @UserID;
            SELECT -4 AS Status, 'Too many attempts. Account locked for 30 minutes.' AS Message;
        END
        ELSE
        BEGIN
            SELECT -5 AS Status, 'Invalid password' AS Message;
        END
    END
END
GO

-- SP: Get Random Questions for Exam
CREATE OR ALTER PROCEDURE sp_GetRandomQuestions
    @SubjectID INT,
    @DifficultyLevel VARCHAR(20),
    @NumberOfQuestions INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@NumberOfQuestions) QuestionID, QuestionType, QuestionText, OptionA, OptionB, OptionC, OptionD
    FROM QuestionBank
    WHERE SubjectID = @SubjectID 
        AND DifficultyLevel = @DifficultyLevel 
        AND IsActive = 1
    ORDER BY NEWID();
END
GO

-- SP: Evaluate Exam
CREATE OR ALTER PROCEDURE sp_EvaluateExam
    @ExamID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ExamineeID INT, @SubjectID INT, @TotalQuestions INT, @CorrectAnswers INT, @WrongAnswers INT, @Unanswered INT;
    DECLARE @Score DECIMAL(5,2), @Percentage DECIMAL(5,2), @Grade VARCHAR(5), @PassStatus VARCHAR(10);
    
    SELECT @ExamineeID = ExamineeID, @SubjectID = SubjectID, @TotalQuestions = TotalQuestions FROM ExamRecords WHERE ExamID = @ExamID;
    
    SELECT @CorrectAnswers = COUNT(*) FROM ExamQuestions eq
    INNER JOIN QuestionBank qb ON eq.QuestionID = qb.QuestionID
    INNER JOIN ExamRecords er ON eq.ExamID = er.ExamID
    WHERE er.ExamID = @ExamID AND eq.IsAnswered = 1;
    
    SET @WrongAnswers = @TotalQuestions - @CorrectAnswers;
    SET @Unanswered = @TotalQuestions - @CorrectAnswers;
    SET @Percentage = (@CorrectAnswers * 100.0) / @TotalQuestions;
    SET @Score = @CorrectAnswers;
    
    IF @Percentage >= 90 SET @Grade = 'A+';
    ELSE IF @Percentage >= 80 SET @Grade = 'A';
    ELSE IF @Percentage >= 70 SET @Grade = 'B';
    ELSE IF @Percentage >= 60 SET @Grade = 'C';
    ELSE IF @Percentage >= 50 SET @Grade = 'D';
    ELSE SET @Grade = 'F';
    
    SET @PassStatus = CASE WHEN @Percentage >= 50 THEN 'Pass' ELSE 'Fail' END;
    
    INSERT INTO Results (ExamID, ExamineeID, SubjectID, TotalQuestions, CorrectAnswers, WrongAnswers, Unanswered, Score, Percentage, Grade, PassStatus)
    VALUES (@ExamID, @ExamineeID, @SubjectID, @TotalQuestions, @CorrectAnswers, @WrongAnswers, @Unanswered, @Score, @Percentage, @Grade, @PassStatus);
    
    SELECT @Score AS Score, @Percentage AS Percentage, @Grade AS Grade, @PassStatus AS PassStatus;
END
GO

-- SP: Generate Subject-wise Report
CREATE OR ALTER PROCEDURE sp_GetSubjectReport
    @SubjectID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.SubjectName,
        COUNT(DISTINCT r.ExamineeID) AS TotalStudents,
        AVG(r.Percentage) AS AveragePercentage,
        MAX(r.Percentage) AS HighestScore,
        MIN(r.Percentage) AS LowestScore,
        SUM(CASE WHEN r.PassStatus = 'Pass' THEN 1 ELSE 0 END) AS Passed,
        SUM(CASE WHEN r.PassStatus = 'Fail' THEN 1 ELSE 0 END) AS Failed
    FROM Results r
    INNER JOIN Subjects s ON r.SubjectID = s.SubjectID
    WHERE r.SubjectID = @SubjectID
    GROUP BY s.SubjectName;
END
GO

-- =====================================================
-- INSERT DEFAULT ADMIN USER (Password: Admin@123)
-- =====================================================
INSERT INTO Users (Username, PasswordHash, Email, Role, FirstName, LastName)
VALUES ('admin', 'Admin@123', 'admin@oless.edu', 'Admin', 'System', 'Administrator');
GO

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Sample Subjects
INSERT INTO Subjects (SubjectCode, SubjectName, Description, CreatedBy)
VALUES 
('CS101', 'Introduction to Programming', 'Basic programming concepts using C#', 1),
('CS201', 'Data Structures', 'Arrays, Linked Lists, Trees, Graphs', 1),
('CS301', 'Database Systems', 'SQL, Normalization, Transactions', 1);
GO

-- Sample Topics
INSERT INTO Topics (SubjectID, TopicName, Description, Weightage)
VALUES 
(1, 'Variables and Data Types', 'Understanding variables and data types', 20),
(1, 'Control Structures', 'If-else, loops, switch', 30),
(1, 'Functions', 'Methods, parameters, return types', 25),
(2, 'Arrays', 'One-dimensional and multi-dimensional arrays', 25),
(2, 'Linked Lists', 'Singly and doubly linked lists', 25),
(3, 'SQL Basics', 'SELECT, INSERT, UPDATE, DELETE', 30);
GO

-- Sample Questions
INSERT INTO QuestionBank (SubjectID, TopicID, QuestionType, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, DifficultyLevel, Marks)
VALUES 
(1, 1, 'MCQ', 'Which of the following is a valid integer data type in C#?', 'int', 'string', 'char', 'bool', 'A', 'Beginner', 1),
(1, 1, 'MCQ', 'What is the default value of an int variable in C#?', '0', 'null', 'undefined', '-1', 'A', 'Beginner', 1),
(1, 1, 'True/False', 'C# is a strongly typed language.', 'True', 'False', NULL, NULL, 'A', 'Beginner', 1),
(1, 2, 'MCQ', 'Which loop executes at least once?', 'for', 'while', 'do-while', 'foreach', 'C', 'Expert', 1),
(1, 2, 'MCQ', 'What keyword is used to skip an iteration in a loop?', 'break', 'continue', 'skip', 'pass', 'B', 'Expert', 1),
(1, 2, 'True/False', 'The switch statement in C# requires a break statement for each case.', 'True', 'False', NULL, NULL, 'A', 'Expert', 1),
(1, 3, 'MCQ', 'Which keyword is used to return a value from a method?', 'return', 'output', 'give', 'send', 'A', 'Beginner', 1),
(1, 3, 'MCQ', 'What is the purpose of parameters in a function?', 'To store data', 'To pass data into the function', 'To return data', 'To terminate function', 'B', 'Beginner', 1),
(1, 3, 'True/False', 'A method can have multiple return statements.', 'True', 'False', NULL, NULL, 'A', 'Expert', 1),
(1, NULL, 'MCQ', 'C# was developed by _____.', 'Google', 'Microsoft', 'Apple', 'Oracle', 'B', 'Guru', 1),
(1, NULL, 'True/False', 'C# is an object-oriented programming language.', 'True', 'False', NULL, NULL, 'A', 'Beginner', 1),
(2, 4, 'MCQ', 'What is the index of the first element in an array?', '0', '1', '-1', 'First', 'A', 'Beginner', 1),
(2, 4, 'MCQ', 'Which statement correctly declares an array in C#?', 'int[] arr', 'int arr[]', 'array int arr', 'int(arr)', 'A', 'Beginner', 1),
(2, 4, 'True/False', 'Arrays in C# have fixed size.', 'True', 'False', NULL, NULL, 'A', 'Beginner', 1),
(2, 5, 'MCQ', 'A linked list is a ____ data structure.', 'linear', 'non-linear', 'hierarchical', 'graph', 'A', 'Expert', 1),
(2, 5, 'True/False', 'Linked lists allow random access to elements.', 'True', 'False', NULL, NULL, 'B', 'Expert', 1),
(3, 6, 'MCQ', 'Which SQL keyword is used to retrieve data?', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'A', 'Beginner', 1),
(3, 6, 'MCQ', 'Which clause is used to filter grouped data?', 'WHERE', 'FILTER', 'HAVING', 'GROUP BY', 'C', 'Expert', 1),
(3, 6, 'True/False', 'JOIN is used to combine rows from two or more tables.', 'True', 'False', NULL, NULL, 'A', 'Beginner', 1);
GO

PRINT 'Database setup completed successfully!';
