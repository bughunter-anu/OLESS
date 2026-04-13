const db = require('../config/database');

class Question {
    static async create(questionData) {
        const {
            questionText, questionType, subjectId, topicId, difficultyLevel,
            optionA, optionB, optionC, optionD, correctAnswer, explanation,
            marks, negativeMarks, createdBy
        } = questionData;

        const questionCode = this.generateQuestionCode();
        
        const sql = `
            INSERT INTO questions (
                question_code, question_text, question_type, subject_id, topic_id,
                difficulty_level, option_a, option_b, option_c, option_d,
                correct_answer, explanation, marks, negative_marks, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [
            questionCode, questionText, questionType, subjectId, topicId || null,
            difficultyLevel || 'beginner', optionA, optionB, optionC, optionD,
            correctAnswer, explanation, marks || 1, negativeMarks || 0, createdBy
        ]);
        
        return { id: result.insertId, questionCode };
    }

    static generateQuestionCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'Q';
        for (let i = 0; i < 7; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    static async findById(id) {
        const sql = `
            SELECT q.*, s.subject_name, t.topic_name
            FROM questions q
            LEFT JOIN subjects s ON q.subject_id = s.id
            LEFT JOIN topics t ON q.topic_id = t.id
            WHERE q.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findByCode(code) {
        const sql = 'SELECT * FROM questions WHERE question_code = ?';
        const results = await db.query(sql, [code]);
        return results[0];
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT q.*, s.subject_name, t.topic_name, u.username as created_by_name
            FROM questions q
            LEFT JOIN subjects s ON q.subject_id = s.id
            LEFT JOIN topics t ON q.topic_id = t.id
            LEFT JOIN users u ON q.created_by = u.id
            WHERE q.is_active = 1
        `;
        const params = [];

        if (filters.subjectId) {
            sql += ' AND q.subject_id = ?';
            params.push(filters.subjectId);
        }
        if (filters.topicId) {
            sql += ' AND q.topic_id = ?';
            params.push(filters.topicId);
        }
        if (filters.questionType) {
            sql += ' AND q.question_type = ?';
            params.push(filters.questionType);
        }
        if (filters.difficultyLevel) {
            sql += ' AND q.difficulty_level = ?';
            params.push(filters.difficultyLevel);
        }
        if (filters.approvalStatus) {
            sql += ' AND q.approval_status = ?';
            params.push(filters.approvalStatus);
        }
        if (filters.search) {
            sql += ' AND (q.question_text LIKE ? OR q.question_code LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY q.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        if (filters.offset) {
            sql += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }

        return await db.query(sql, params);
    }

    static async getRandomQuestions(examId, userId) {
        const sql = `
            SELECT q.*, s.subject_name
            FROM questions q
            LEFT JOIN subjects s ON q.subject_id = s.id
            WHERE q.subject_id = (
                SELECT subject_id FROM exams WHERE id = ?
            )
            AND q.is_active = 1
            AND q.approval_status = 'approved'
            ORDER BY RAND()
        `;
        
        return await db.query(sql, [examId]);
    }

    static async update(id, questionData) {
        const fields = [];
        const params = [];

        const allowedFields = [
            'question_text', 'question_type', 'subject_id', 'topic_id',
            'difficulty_level', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation', 'marks', 'negative_marks',
            'is_active', 'approval_status', 'approved_by'
        ];
        
        for (const [key, value] of Object.entries(questionData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                fields.push(`${dbKey} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        params.push(id);
        const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
        
        const result = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'UPDATE questions SET is_active = 0 WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }

    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM questions WHERE is_active = 1';
        const params = [];

        if (filters.subjectId) {
            sql += ' AND subject_id = ?';
            params.push(filters.subjectId);
        }
        if (filters.difficultyLevel) {
            sql += ' AND difficulty_level = ?';
            params.push(filters.difficultyLevel);
        }
        if (filters.questionType) {
            sql += ' AND question_type = ?';
            params.push(filters.questionType);
        }

        const results = await db.query(sql, params);
        return results[0].total;
    }

    static async getTopicWiseAnalysis(userId, examId) {
        const sql = `
            SELECT 
                t.topic_name,
                COUNT(sa.id) as total_questions,
                SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                SUM(CASE WHEN sa.is_correct = 0 AND sa.selected_answer IS NOT NULL THEN 1 ELSE 0 END) as wrong,
                SUM(CASE WHEN sa.selected_answer IS NULL THEN 1 ELSE 0 END) as unattempted,
                ROUND(SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(sa.id), 2) as accuracy
            FROM student_answers sa
            JOIN questions q ON sa.question_id = q.id
            JOIN exam_sessions es ON sa.session_id = es.id
            LEFT JOIN topics t ON q.topic_id = t.id
            WHERE es.user_id = ? AND es.exam_id = ?
            GROUP BY t.topic_name
            ORDER BY accuracy DESC
        `;
        
        return await db.query(sql, [userId, examId]);
    }
}

module.exports = Question;
