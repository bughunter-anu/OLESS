const db = require('../config/database');

class Subject {
    static async create(subjectData) {
        const { subjectCode, subjectName, description, creditHours, createdBy } = subjectData;
        
        const sql = `
            INSERT INTO subjects (subject_code, subject_name, description, credit_hours, created_by)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [subjectCode, subjectName, description, creditHours || 3, createdBy]);
        return { id: result.insertId, subjectCode };
    }

    static async findById(id) {
        const sql = 'SELECT * FROM subjects WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findByCode(code) {
        const sql = 'SELECT * FROM subjects WHERE subject_code = ?';
        const results = await db.query(sql, [code]);
        return results[0];
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT s.*, u.username as created_by_name FROM subjects s LEFT JOIN users u ON s.created_by = u.id WHERE s.is_active = 1';
        const params = [];

        if (filters.search) {
            sql += ' AND (s.subject_name LIKE ? OR s.subject_code LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY s.created_at DESC';

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

    static async update(id, subjectData) {
        const fields = [];
        const params = [];

        const allowedFields = ['subject_name', 'description', 'credit_hours', 'is_active'];
        
        for (const [key, value] of Object.entries(subjectData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                fields.push(`${dbKey} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        params.push(id);
        const sql = `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`;
        
        const result = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'UPDATE subjects SET is_active = 0 WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const sql = 'SELECT COUNT(*) as total FROM subjects WHERE is_active = 1';
        const results = await db.query(sql);
        return results[0].total;
    }
}

class Topic {
    static async create(topicData) {
        const { subjectId, topicName, topicCode, description, difficultyLevel, weightage } = topicData;
        
        const sql = `
            INSERT INTO topics (subject_id, topic_name, topic_code, description, difficulty_level, weightage)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [subjectId, topicName, topicCode, description, difficultyLevel || 'beginner', weightage || 1]);
        return { id: result.insertId };
    }

    static async findById(id) {
        const sql = `
            SELECT t.*, s.subject_name 
            FROM topics t 
            LEFT JOIN subjects s ON t.subject_id = s.id 
            WHERE t.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findBySubject(subjectId) {
        const sql = `
            SELECT t.*, s.subject_name 
            FROM topics t 
            LEFT JOIN subjects s ON t.subject_id = s.id 
            WHERE t.subject_id = ? AND t.is_active = 1
            ORDER BY t.topic_name
        `;
        return await db.query(sql, [subjectId]);
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT t.*, s.subject_name, s.subject_code
            FROM topics t 
            LEFT JOIN subjects s ON t.subject_id = s.id 
            WHERE t.is_active = 1
        `;
        const params = [];

        if (filters.subjectId) {
            sql += ' AND t.subject_id = ?';
            params.push(filters.subjectId);
        }
        if (filters.difficultyLevel) {
            sql += ' AND t.difficulty_level = ?';
            params.push(filters.difficultyLevel);
        }
        if (filters.search) {
            sql += ' AND (t.topic_name LIKE ? OR t.topic_code LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY t.topic_name';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await db.query(sql, params);
    }

    static async update(id, topicData) {
        const fields = [];
        const params = [];

        const allowedFields = ['topic_name', 'topic_code', 'description', 'difficulty_level', 'weightage', 'is_active'];
        
        for (const [key, value] of Object.entries(topicData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                fields.push(`${dbKey} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        params.push(id);
        const sql = `UPDATE topics SET ${fields.join(', ')} WHERE id = ?`;
        
        const result = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'UPDATE topics SET is_active = 0 WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = { Subject, Topic };
