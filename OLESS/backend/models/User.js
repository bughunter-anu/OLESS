const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static async create(userData) {
        const { username, email, password, role, firstName, lastName, phone, department } = userData;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userId = await this.generateUserId(role);
        
        const sql = `
            INSERT INTO users (user_id, username, email, password_hash, role, first_name, last_name, phone, department, enrollment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        
        const result = await db.query(sql, [userId, username, email, passwordHash, role, firstName, lastName, phone, department]);
        return { id: result.insertId, userId };
    }

    static async generateUserId(role) {
        const prefix = role === 'admin' ? 'ADM' : role === 'operator' ? 'OPR' : 'STU';
        const year = new Date().getFullYear().toString().slice(-2);
        const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
        return `${prefix}${year}${seq}`;
    }

    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
        const results = await db.query(sql, [username]);
        return results[0];
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        return results[0];
    }

    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM users WHERE 1=1';
        const params = [];

        if (filters.role) {
            sql += ' AND role = ?';
            params.push(filters.role);
        }
        if (filters.isActive !== undefined) {
            sql += ' AND is_active = ?';
            params.push(filters.isActive);
        }
        if (filters.search) {
            sql += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY created_at DESC';

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

    static async update(id, userData) {
        const fields = [];
        const params = [];

        const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'department', 'is_active'];
        
        for (const [key, value] of Object.entries(userData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                fields.push(`${dbKey} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        params.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        const result = await db.query(sql, params);
        return result.affectedRows > 0;
    }

    static async updatePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
        const result = await db.query(sql, [passwordHash, id]);
        return result.affectedRows > 0;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await db.query(sql, [id]);
    }

    static async delete(id) {
        const sql = 'UPDATE users SET is_active = 0 WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }

    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];

        if (filters.role) {
            sql += ' AND role = ?';
            params.push(filters.role);
        }
        if (filters.isActive !== undefined) {
            sql += ' AND is_active = ?';
            params.push(filters.isActive);
        }

        const results = await db.query(sql, params);
        return results[0].total;
    }
}

module.exports = User;
