module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'oless_secret_key_2024_secure',
    JWT_EXPIRES_IN: '24h',
    BCRYPT_ROUNDS: 10,
    DB_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'oless_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    SESSION_TIMEOUT: 30 * 60 * 1000,
    MAX_LOGIN_ATTEMPTS: 5,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000,
    RATE_LIMIT_MAX: 100,
    BACKUP_PATH: './backups',
    UPLOAD_PATH: './uploads',
    EXAM_CONFIG: {
        defaultDuration: 60,
        defaultQuestions: 20,
        passingPercentage: 40
    }
};
