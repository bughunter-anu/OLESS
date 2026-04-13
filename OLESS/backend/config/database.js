const mysql = require('mysql2/promise');
const config = require('./config');

let pool = null;

const createPool = () => {
    if (!pool) {
        pool = mysql.createPool(config.DB_CONFIG);
    }
    return pool;
};

const query = async (sql, params = []) => {
    const connection = await createPool().getConnection();
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } finally {
        connection.release();
    }
};

const transaction = async (callback) => {
    const connection = await createPool().getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getConnection = async () => {
    return await createPool().getConnection();
};

module.exports = {
    query,
    transaction,
    getConnection,
    createPool
};
