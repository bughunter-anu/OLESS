const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const subjectRoutes = require('./routes/subjects');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const resultRoutes = require('./routes/results');

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'OLESS API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = config.PORT;

const startServer = async () => {
    try {
        await db.query('SELECT 1');
        console.log('Database connected successfully');
        
        app.listen(PORT, () => {
            console.log(`OLESS Server running on port ${PORT}`);
            console.log(`API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        console.log('Starting server without database connection...');
        
        app.listen(PORT, () => {
            console.log(`OLESS Server running on port ${PORT} (without DB)`);
        });
    }
};

startServer();

module.exports = app;
