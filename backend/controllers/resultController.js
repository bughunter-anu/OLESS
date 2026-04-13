const Result = require('../models/Result');
const { ExamSession, StudentAnswer } = require('../models/Exam');
const Question = require('../models/Question');

exports.getMyResults = async (req, res) => {
    try {
        const { examId, resultStatus, page = 1, limit = 20 } = req.query;

        const results = await Result.findByUser(req.user.id, {
            examId: examId ? parseInt(examId) : undefined,
            resultStatus,
            limit: parseInt(limit)
        });

        const stats = await Result.getUserStatistics(req.user.id);

        res.json({
            success: true,
            data: {
                results,
                statistics: stats
            }
        });
    } catch (error) {
        console.error('Get my results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get results'
        });
    }
};

exports.getResult = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Result.findById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        if (result.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const session = await ExamSession.findById(result.session_id);
        const answers = await StudentAnswer.getBySession(result.session_id);

        const topicAnalysis = result.topic_analysis ? 
            (typeof result.topic_analysis === 'string' ? JSON.parse(result.topic_analysis) : result.topic_analysis) : [];
        const strengthWeakness = result.strength_weakness ?
            (typeof result.strength_weakness === 'string' ? JSON.parse(result.strength_weakness) : result.strength_weakness) : {};

        res.json({
            success: true,
            data: {
                ...result,
                session: {
                    startTime: session.start_time,
                    endTime: session.end_time,
                    status: session.status
                },
                answers: answers.map(a => ({
                    questionId: a.question_id,
                    questionText: a.question_text,
                    questionType: a.question_type,
                    selectedAnswer: a.selected_answer,
                    correctAnswer: a.correct_answer,
                    isCorrect: a.is_correct,
                    marksObtained: a.marks_obtained
                })),
                topicAnalysis,
                strengthWeakness
            }
        });
    } catch (error) {
        console.error('Get result error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get result'
        });
    }
};

exports.getResultByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const result = await Result.findByCode(code);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        if (result.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get result by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get result'
        });
    }
};

exports.getAllResults = async (req, res) => {
    try {
        const { examId, resultStatus, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const results = await Result.getAll({
            examId: examId ? parseInt(examId) : undefined,
            resultStatus,
            search,
            limit: parseInt(limit),
            offset
        });

        const total = await Result.count({
            examId: examId ? parseInt(examId) : undefined,
            resultStatus
        });

        res.json({
            success: true,
            data: {
                results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get all results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get results'
        });
    }
};

exports.getExamStatistics = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await require('../models/Exam').Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const stats = await Result.getStatistics(examId);

        const results = await Result.getAll({ examId: parseInt(examId) });

        const gradeDistribution = {
            A: results.filter(r => r.percentage >= 90).length,
            B: results.filter(r => r.percentage >= 75 && r.percentage < 90).length,
            C: results.filter(r => r.percentage >= 60 && r.percentage < 75).length,
            D: results.filter(r => r.percentage >= 40 && r.percentage < 60).length,
            F: results.filter(r => r.percentage < 40).length
        };

        res.json({
            success: true,
            data: {
                exam: {
                    id: exam.id,
                    name: exam.exam_name,
                    code: exam.exam_code
                },
                statistics: stats,
                gradeDistribution,
                recentResults: results.slice(0, 10)
            }
        });
    } catch (error) {
        console.error('Get exam statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam statistics'
        });
    }
};

exports.getUserStatistics = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const stats = await Result.getUserStatistics(userId);
        const results = await Result.findByUser(userId);

        const subjectWisePerformance = {};
        results.forEach(r => {
            if (!subjectWisePerformance[r.subject_name]) {
                subjectWisePerformance[r.subject_name] = {
                    attempts: 0,
                    totalScore: 0,
                    avgPercentage: 0
                };
            }
            subjectWisePerformance[r.subject_name].attempts++;
            subjectWisePerformance[r.subject_name].totalScore += r.percentage;
        });

        Object.keys(subjectWisePerformance).forEach(subject => {
            subjectWisePerformance[subject].avgPercentage = 
                subjectWisePerformance[subject].totalScore / subjectWisePerformance[subject].attempts;
        });

        res.json({
            success: true,
            data: {
                statistics: stats,
                subjectWisePerformance,
                recentResults: results.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics'
        });
    }
};

exports.generateCertificate = async (req, res) => {
    try {
        const { resultId } = req.params;

        const result = await Result.findById(resultId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        if (result.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (result.result_status !== 'pass') {
            return res.status(400).json({
                success: false,
                message: 'Certificate only available for passed exams'
            });
        }

        res.json({
            success: true,
            message: 'Certificate generation feature',
            data: {
                resultCode: result.result_code,
                userName: `${result.first_name} ${result.last_name}`,
                examName: result.exam_name,
                percentage: result.percentage,
                date: result.generated_at,
                certificateUrl: `/api/certificates/${result.result_code}.pdf`
            }
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate certificate'
        });
    }
};
