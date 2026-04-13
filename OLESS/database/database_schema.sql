-- ============================================
-- OLESS - Online Examination Security System
-- Database Schema
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS oless_db;
USE oless_db;

-- ============================================
-- TABLE: Users
-- Stores all system users (Admin, Student, Operator)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'operator') NOT NULL DEFAULT 'student',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    enrollment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_user_id (user_id)
);

-- ============================================
-- TABLE: Subjects
-- Stores all subjects available for exams
-- ============================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    description TEXT,
    credit_hours INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject_code (subject_code)
);

-- ============================================
-- TABLE: Topics
-- Stores topics within each subject
-- ============================================
CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    topic_code VARCHAR(20),
    description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    weightage INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_subject_id (subject_id)
);

-- ============================================
-- TABLE: Questions
-- Stores question bank (MCQ and True/False)
-- ============================================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_code VARCHAR(20) UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'true_false') NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert', 'guru') DEFAULT 'beginner',
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(1) NOT NULL,
    explanation TEXT,
    marks INT DEFAULT 1,
    negative_marks DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    approved_by INT,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject_id (subject_id),
    INDEX idx_topic_id (topic_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (question_type),
    INDEX idx_active (is_active)
);

-- ============================================
-- TABLE: Exams
-- Stores exam configurations
-- ============================================
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_code VARCHAR(20) UNIQUE NOT NULL,
    exam_name VARCHAR(200) NOT NULL,
    subject_id INT NOT NULL,
    description TEXT,
    exam_level ENUM('beginner', 'advanced', 'expert', 'guru') DEFAULT 'beginner',
    duration_minutes INT NOT NULL DEFAULT 60,
    total_questions INT NOT NULL DEFAULT 20,
    total_marks INT NOT NULL DEFAULT 100,
    passing_marks INT DEFAULT 40,
    difficulty_distribution JSON,
    randomize_questions BOOLEAN DEFAULT TRUE,
    randomize_options BOOLEAN DEFAULT TRUE,
    show_results_immediately BOOLEAN DEFAULT TRUE,
    allow_review BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATETIME,
    end_date DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject_id (subject_id),
    INDEX idx_active (is_active),
    INDEX idx_exam_code (exam_code)
);

-- ============================================
-- TABLE: Exam Sessions
-- Tracks individual exam attempts
-- ============================================
CREATE TABLE exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    time_remaining INT,
    status ENUM('in_progress', 'completed', 'expired', 'terminated') DEFAULT 'in_progress',
    ip_address VARCHAR(45),
    user_agent TEXT,
    score INT,
    total_marks INT,
    percentage DECIMAL(5,2),
    result_status ENUM('pass', 'fail', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- ============================================
-- TABLE: Student Answers
-- Stores student's answers for each exam
-- ============================================
CREATE TABLE student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer VARCHAR(5),
    is_correct BOOLEAN,
    marks_obtained DECIMAL(5,2),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds INT DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_question_id (question_id),
    UNIQUE KEY unique_session_question (session_id, question_id)
);

-- ============================================
-- TABLE: Results
-- Stores final exam results
-- ============================================
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    result_code VARCHAR(30) UNIQUE NOT NULL,
    session_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    total_score INT NOT NULL,
    total_marks INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    unattempted INT NOT NULL,
    time_taken_seconds INT,
    result_status ENUM('pass', 'fail') NOT NULL,
    topic_analysis JSON,
    strength_weakness JSON,
    rank INT,
    percentile DECIMAL(5,2),
    certificate_url VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_exam_id (exam_id),
    INDEX idx_result_code (result_code)
);

-- ============================================
-- TABLE: Student Subjects
-- Maps students to their enrolled subjects
-- ============================================
CREATE TABLE student_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    enrolled_date DATE NOT NULL,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, subject_id),
    INDEX idx_user_id (user_id),
    INDEX idx_subject_id (subject_id)
);

-- ============================================
-- TABLE: Exam Policies
-- System-wide exam configuration
-- ============================================
CREATE TABLE exam_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_key VARCHAR(50) UNIQUE NOT NULL,
    policy_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE: Activity Logs
-- Security audit trail
-- ============================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- TABLE: Backup Records
-- Database backup tracking
-- ============================================
CREATE TABLE backup_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_code VARCHAR(30) UNIQUE NOT NULL,
    backup_type ENUM('full', 'partial', 'automatic') NOT NULL,
    backup_path VARCHAR(255),
    file_size_bytes BIGINT,
    tables_included TEXT,
    status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    created_by INT,
    completed_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE: Notifications
-- System notifications for users
-- ============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_type ENUM('exam', 'result', 'system', 'reminder') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link_url VARCHAR(255),
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- TRIGGER: Update last login
-- ============================================
DELIMITER //
CREATE TRIGGER after_user_login
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.last_login IS DISTINCT FROM NEW.last_login THEN
        INSERT INTO activity_logs (user_id, action, module, description)
        VALUES (NEW.id, 'LOGIN', 'Authentication', CONCAT(NEW.username, ' logged in successfully'));
    END IF;
END //
DELIMITER ;

-- ============================================
-- STORED PROCEDURE: Generate student ID
-- ============================================
DELIMITER //
CREATE PROCEDURE generate_student_id(INOUT student_id VARCHAR(20))
BEGIN
    DECLARE year_code VARCHAR(2);
    DECLARE max_seq INT;
    DECLARE new_seq INT;
    
    SET year_code = DATE_FORMAT(CURDATE(), '%y');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(user_id, 4) AS UNSIGNED)), 0) + 1
    INTO max_seq
    FROM users
    WHERE user_id LIKE CONCAT('STU', year_code, '%');
    
    SET new_seq = max_seq;
    SET student_id = CONCAT('STU', year_code, LPAD(new_seq, 6, '0'));
END //
DELIMITER ;

-- ============================================
-- STORED PROCEDURE: Calculate exam results
-- ============================================
DELIMITER //
CREATE PROCEDURE calculate_exam_results(IN p_session_id INT)
BEGIN
    DECLARE v_exam_id INT;
    DECLARE v_user_id INT;
    DECLARE v_total_score INT DEFAULT 0;
    DECLARE v_total_marks INT;
    DECLARE v_correct INT DEFAULT 0;
    DECLARE v_wrong INT DEFAULT 0;
    DECLARE v_unattempted INT DEFAULT 0;
    DECLARE v_percentage DECIMAL(5,2);
    DECLARE v_result_status ENUM('pass', 'fail');
    DECLARE v_passing_marks INT;
    
    SELECT exam_id, user_id, total_marks INTO v_exam_id, v_user_id, v_total_marks
    FROM exam_sessions WHERE id = p_session_id;
    
    SELECT passing_marks INTO v_passing_marks FROM exams WHERE id = v_exam_id;
    
    SELECT 
        COALESCE(SUM(CASE WHEN is_correct = 1 THEN marks_obtained ELSE 0 END), 0),
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN is_correct = 0 AND selected_answer IS NOT NULL THEN 1 ELSE 0 END),
        SUM(CASE WHEN selected_answer IS NULL THEN 1 ELSE 0 END)
    INTO v_total_score, v_correct, v_wrong, v_unattempted
    FROM student_answers WHERE session_id = p_session_id;
    
    SET v_percentage = (v_total_score / v_total_marks) * 100;
    SET v_result_status = IF(v_percentage >= v_passing_marks, 'pass', 'fail');
    
    INSERT INTO results (
        result_code, session_id, user_id, exam_id, total_score, total_marks,
        percentage, correct_answers, wrong_answers, unattempted, result_status
    )
    VALUES (
        CONCAT('RES', DATE_FORMAT(NOW(), '%y%m%d'), LPAD(p_session_id, 6, '0')),
        p_session_id, v_user_id, v_exam_id, v_total_score, v_total_marks,
        v_percentage, v_correct, v_wrong, v_unattempted, v_result_status
    )
    ON DUPLICATE KEY UPDATE
        total_score = v_total_score,
        percentage = v_percentage,
        correct_answers = v_correct,
        wrong_answers = v_wrong,
        unattempted = v_unattempted,
        result_status = v_result_status;
        
    UPDATE exam_sessions SET
        score = v_total_score,
        percentage = v_percentage,
        result_status = v_result_status,
        status = 'completed'
    WHERE id = p_session_id;
END //
DELIMITER ;

-- ============================================
-- SEED DATA: Default admin user
-- Password: Admin@123 (hashed with bcrypt)
-- ============================================
INSERT INTO users (user_id, username, email, password_hash, role, first_name, last_name, is_active)
VALUES ('ADM001', 'admin', 'admin@oless.com', 
        '$2a$10$8K1p/a0dL1LXMIgou5tDf.JHq9sT3ZTFQiF5tXq9zKqN3Y5x3zXi', 
        'admin', 'System', 'Administrator', TRUE);

-- ============================================
-- SEED DATA: Exam policies
-- ============================================
INSERT INTO exam_policies (policy_name, policy_key, policy_value, description)
VALUES 
    ('Default Exam Duration', 'default_duration', '60', 'Default exam duration in minutes'),
    ('Default Question Count', 'default_questions', '20', 'Default number of questions per exam'),
    ('Passing Percentage', 'passing_percentage', '40', 'Minimum passing percentage'),
    ('Max Login Attempts', 'max_login_attempts', '5', 'Maximum failed login attempts'),
    ('Session Timeout', 'session_timeout', '30', 'Session timeout in minutes'),
    ('Enable Copy-Paste Prevention', 'prevent_copy_paste', 'true', 'Prevent copy-paste during exam'),
    ('Enable Tab Switch Detection', 'detect_tab_switch', 'true', 'Detect tab switching during exam'),
    ('Auto Backup Frequency', 'backup_frequency', 'daily', 'Database backup frequency'),
    ('Enable Dark Mode', 'enable_dark_mode', 'true', 'Allow dark mode UI');
