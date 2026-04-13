const db = require('../config/database');

class Result {
    static async create(resultData) {
        const {
            sessionId, userId, examId, totalScore, totalMarks, percentage,
            correctAnswers, wrongAnswers, unattempted, topicAnalysis, strengthWeakness
        } = resultData;

        const resultCode = this.generateResultCode();
        const resultStatus = percentage >= 40 ? 'pass' : 'fail';

        const sql = `
            INSERT INTO results (
                result_code, session_id, user_id, exam_id, total_score, total_marks,
                percentage, correct_answers, wrong_answers, unattempted,
                time_taken_seconds, result_status, topic_analysis, strength_weakness
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [
            resultCode, sessionId, userId, examId, totalScore, totalMarks,
            percentage, correctAnswers, wrongAnswers, unattempted,
            resultData.timeTakenSeconds || 0, resultStatus,
            JSON.stringify(topicAnalysis || {}), JSON.stringify(strengthWeakness || {})
        ]);
        
        return { id: result.insertId, resultCode };
    }

    static generateResultCode() {
        const prefix = 'RES';
        const date = new Date();
        const datePart = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
        const random = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
        return `${prefix}${datePart}${random}`;
    }

    static async findById(id) {
        const sql = `
            SELECT r.*, e.exam_name, e.exam_code, s.subject_name,
                   u.username, u.first_name, u.last_name, u.email
            FROM results r
            LEFT JOIN exams e ON r.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findByCode(code) {
        const sql = `
            SELECT r.*, e.exam_name, e.exam_code, s.subject_name,
                   u.username, u.first_name, u.last_name, u.email
            FROM results r
            LEFT JOIN exams e ON r.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.result_code = ?
        `;
        const results = await db.query(sql, [code]);
        return results[0];
    }

    static async findByUser(userId, filters = {}) {
        let sql = `
            SELECT r.*, e.exam_name, e.exam_code, e.exam_level, s.subject_name
            FROM results r
            LEFT JOIN exams e ON r.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE r.user_id = ?
        `;
        const params = [userId];

        if (filters.examId) {
            sql += ' AND r.exam_id = ?';
            params.push(filters.examId);
        }
        if (filters.resultStatus) {
            sql += ' AND r.result_status = ?';
            params.push(filters.resultStatus);
        }

        sql += ' ORDER BY r.generated_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await db.query(sql, params);
    }

    static async findBySession(sessionId) {
        const sql = `
            SELECT r.*, e.exam_name, e.exam_code, e.exam_level, s.subject_name,
                   u.username, u.first_name, u.last_name, u.email
            FROM results r
            LEFT JOIN exams e ON r.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.session_id = ?
        `;
        const results = await db.query(sql, [sessionId]);
        return results[0];
    }

    static async getAll(filters = {}) {
        let sql = `
            SELECT r.*, e.exam_name, e.exam_code, s.subject_name,
                   u.username, u.first_name, u.last_name, u.email
            FROM results r
            LEFT JOIN exams e ON r.exam_id = e.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.examId) {
            sql += ' AND r.exam_id = ?';
            params.push(filters.examId);
        }
        if (filters.resultStatus) {
            sql += ' AND r.result_status = ?';
            params.push(filters.resultStatus);
        }
        if (filters.search) {
            sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR r.result_code LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY r.generated_at DESC';

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

    static async getStatistics(examId) {
        const sql = `
            SELECT 
                COUNT(*) as total_attempts,
                AVG(percentage) as avg_percentage,
                MAX(percentage) as highest_percentage,
                MIN(percentage) as lowest_percentage,
                SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN result_status = 'fail' THEN 1 ELSE 0 END) as failed,
                ROUND(SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pass_percentage
            FROM results
            WHERE exam_id = ?
        `;
        const results = await db.query(sql, [examId]);
        return results[0];
    }

    static async getUserStatistics(userId) {
        const sql = `
            SELECT 
                COUNT(*) as total_exams,
                AVG(percentage) as avg_percentage,
                SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN result_status = 'fail' THEN 1 ELSE 0 END) as failed,
                MAX(percentage) as highest_score,
                MIN(percentage) as lowest_score
            FROM results
            WHERE user_id = ?
        `;
        const results = await db.query(sql, [userId]);
        return results[0];
    }

    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM results WHERE 1=1';
        const params = [];

        if (filters.examId) {
            sql += ' AND exam_id = ?';
            params.push(filters.examId);
        }
        if (filters.resultStatus) {
            sql += ' AND result_status = ?';
            params.push(filters.resultStatus);
        }

        const results = await db.query(sql, params);
        return results[0].total;
    }
}

module.exports = Result;
