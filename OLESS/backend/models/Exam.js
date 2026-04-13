const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Exam {
    static async create(examData) {
        const {
            examName, subjectId, description, examLevel, durationMinutes,
            totalQuestions, totalMarks, passingMarks, difficultyDistribution,
            randomizeQuestions, randomizeOptions, showResultsImmediately,
            allowReview, startDate, endDate, createdBy
        } = examData;

        const examCode = this.generateExamCode();
        
        const sql = `
            INSERT INTO exams (
                exam_code, exam_name, subject_id, description, exam_level,
                duration_minutes, total_questions, total_marks, passing_marks,
                difficulty_distribution, randomize_questions, randomize_options,
                show_results_immediately, allow_review, start_date, end_date, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [
            examCode, examName, subjectId, description, examLevel || 'beginner',
            durationMinutes || 60, totalQuestions || 20, totalMarks || 100,
            passingMarks || 40, JSON.stringify(difficultyDistribution || {}),
            randomizeQuestions !== false, randomizeOptions !== false,
            showResultsImmediately !== false, allowReview !== false,
            startDate || null, endDate || null, createdBy
        ]);
        
        return { id: result.insertId, examCode };
    }

    static generateExamCode() {
        const prefix = 'EX';
        const date = new Date();
        const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        return `${prefix}${datePart}${random}`;
    }

    static async findById(id) {
        const sql = `
            SELECT e.*, s.subject_name, u.username as created_by_name
            FROM exams e
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findByCode(code) {
        const sql = 'SELECT * FROM exams WHERE exam_code = ?';
        const results = await db.query(sql, [code]);
        return results[0];
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT e.*, s.subject_name, u.username as created_by_name,
            (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id) as total_attempts
            FROM exams e
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.is_active = 1
        `;
        const params = [];

        if (filters.subjectId) {
            sql += ' AND e.subject_id = ?';
            params.push(filters.subjectId);
        }
        if (filters.examLevel) {
            sql += ' AND e.exam_level = ?';
            params.push(filters.examLevel);
        }
        if (filters.search) {
            sql += ' AND (e.exam_name LIKE ? OR e.exam_code LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY e.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await db.query(sql, params);
    }

    static async update(id, examData) {
        const fields = [];
        const params = [];

        const allowedFields = [
            'exam_name', 'description', 'exam_level', 'duration_minutes',
            'total_questions', 'total_marks', 'passing_marks', 'difficulty_distribution',
            'randomize_questions', 'randomize_options', 'show_results_immediately',
            'allow_review', 'is_active', 'start_date', 'end_date'
        ];
        
        for (const [key, value] of Object.entries(examData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                if (dbKey === 'difficulty_distribution' && typeof value === 'object') {
                    fields.push(`${dbKey} = ?`);
                    params.push(JSON.stringify(value));
                } else {
                    fields.push(`${dbKey} = ?`);
                    params.push(value);
                }
            }
        }

        if (fields.length === 0) return false;

        params.push(id);
        const sql = `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`;
        
        const result = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'UPDATE exams SET is_active = 0 WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }

    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM exams WHERE is_active = 1';
        const params = [];

        if (filters.subjectId) {
            sql += ' AND subject_id = ?';
            params.push(filters.subjectId);
        }

        const results = await db.query(sql, params);
        return results[0].total;
    }
}

class ExamSession {
    static async create(sessionData) {
        const { examId, userId, ipAddress, userAgent } = sessionData;
        const sessionId = uuidv4();

        const sql = `
            INSERT INTO exam_sessions (session_id, exam_id, user_id, start_time, ip_address, user_agent, time_remaining)
            VALUES (?, ?, ?, NOW(), ?, ?, (
                SELECT duration_minutes * 60 FROM exams WHERE id = ?
            ))
        `;
        
        const result = await db.query(sql, [sessionId, examId, userId, ipAddress, userAgent, examId]);
        return { id: result.insertId, sessionId };
    }

    static async findBySessionId(sessionId) {
        const sql = `
            SELECT es.*, e.exam_name, e.exam_code, e.duration_minutes, s.subject_name
            FROM exam_sessions es
            LEFT JOIN exams e ON es.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE es.session_id = ?
        `;
        const results = await db.query(sql, [sessionId]);
        return results[0];
    }

    static async findById(id) {
        const sql = `
            SELECT es.*, e.exam_name, e.exam_code, e.duration_minutes, s.subject_name
            FROM exam_sessions es
            LEFT JOIN exams e ON es.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE es.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findByUser(userId, filters = {}) {
        let sql = `
            SELECT es.*, e.exam_name, e.exam_code, e.duration_minutes, s.subject_name
            FROM exam_sessions es
            LEFT JOIN exams e ON es.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE es.user_id = ?
        `;
        const params = [userId];

        if (filters.status) {
            sql += ' AND es.status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY es.start_time DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await db.query(sql, params);
    }

    static async updateTimeRemaining(sessionId, timeRemaining) {
        const sql = 'UPDATE exam_sessions SET time_remaining = ? WHERE session_id = ?';
        await db.query(sql, [timeRemaining, sessionId]);
    }

    static async complete(sessionId) {
        const sql = `
            UPDATE exam_sessions 
            SET status = 'completed', end_time = NOW() 
            WHERE session_id = ?
        `;
        const result = await db.query(sql, [sessionId]);
        return result.affectedRows > 0;
    }

    static async hasActiveSession(userId, examId) {
        const sql = `
            SELECT COUNT(*) as count FROM exam_sessions 
            WHERE user_id = ? AND exam_id = ? AND status = 'in_progress'
        `;
        const results = await db.query(sql, [userId, examId]);
        return results[0].count > 0;
    }

    static async checkExistingAttempt(userId, examId) {
        const sql = `
            SELECT * FROM exam_sessions 
            WHERE user_id = ? AND exam_id = ? AND status = 'completed'
        `;
        const results = await db.query(sql, [userId, examId]);
        return results[0];
    }
}

class StudentAnswer {
    static async save(answerData) {
        const { sessionId, questionId, selectedAnswer, isCorrect, marksObtained } = answerData;

        const sql = `
            INSERT INTO student_answers (session_id, question_id, selected_answer, is_correct, marks_obtained)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                selected_answer = VALUES(selected_answer),
                is_correct = VALUES(is_correct),
                marks_obtained = VALUES(marks_obtained),
                answered_at = NOW()
        `;
        
        await db.query(sql, [sessionId, questionId, selectedAnswer, isCorrect, marksObtained]);
        return true;
    }

    static async getBySession(sessionId) {
        const sql = `
            SELECT sa.*, q.question_text, q.question_type, q.option_a, q.option_b, 
                   q.option_c, q.option_d, q.correct_answer, q.marks
            FROM student_answers sa
            LEFT JOIN questions q ON sa.question_id = q.id
            WHERE sa.session_id = ?
        `;
        return await db.query(sql, [sessionId]);
    }

    static async getUnanswered(sessionId) {
        const sql = `
            SELECT COUNT(*) as count FROM questions q
            WHERE q.subject_id = (
                SELECT e.subject_id FROM exams e
                JOIN exam_sessions es ON e.id = es.exam_id
                WHERE es.id = ?
            )
            AND q.is_active = 1
            AND q.id NOT IN (
                SELECT question_id FROM student_answers WHERE session_id = ?
            )
        `;
        const results = await db.query(sql, [sessionId, sessionId]);
        return results[0].count;
    }
}

module.exports = { Exam, ExamSession, StudentAnswer };
