const Question = require('../models/Question');

exports.getAllQuestions = async (req, res) => {
    try {
        const { subjectId, topicId, questionType, difficultyLevel, approvalStatus, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const questions = await Question.findAll({
            subjectId: subjectId ? parseInt(subjectId) : undefined,
            topicId: topicId ? parseInt(topicId) : undefined,
            questionType,
            difficultyLevel,
            approvalStatus,
            search,
            limit: parseInt(limit),
            offset
        });

        const total = await Question.count({
            subjectId: subjectId ? parseInt(subjectId) : undefined,
            difficultyLevel,
            questionType
        });

        res.json({
            success: true,
            data: {
                questions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get questions'
        });
    }
};

exports.getQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findById(id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get question'
        });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const {
            questionText, questionType, subjectId, topicId, difficultyLevel,
            optionA, optionB, optionC, optionD, correctAnswer, explanation,
            marks, negativeMarks
        } = req.body;

        const question = await Question.create({
            questionText,
            questionType,
            subjectId,
            topicId: topicId || null,
            difficultyLevel: difficultyLevel || 'beginner',
            optionA,
            optionB,
            optionC,
            optionD,
            correctAnswer,
            explanation,
            marks: marks || 1,
            negativeMarks: negativeMarks || 0,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: question
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create question'
        });
    }
};

exports.bulkCreateQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        const results = [];
        const errors = [];

        for (let i = 0; i < questions.length; i++) {
            try {
                const q = questions[i];
                const question = await Question.create({
                    questionText: q.questionText,
                    questionType: q.questionType,
                    subjectId: q.subjectId,
                    topicId: q.topicId || null,
                    difficultyLevel: q.difficultyLevel || 'beginner',
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    marks: q.marks || 1,
                    negativeMarks: q.negativeMarks || 0,
                    createdBy: req.user.id
                });
                results.push(question);
            } catch (err) {
                errors.push({ index: i, error: err.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Created ${results.length} questions`,
            data: {
                created: results.length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    } catch (error) {
        console.error('Bulk create questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create questions'
        });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            questionText, questionType, subjectId, topicId, difficultyLevel,
            optionA, optionB, optionC, optionD, correctAnswer, explanation,
            marks, negativeMarks, isActive, approvalStatus
        } = req.body;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        await Question.update(id, {
            questionText,
            questionType,
            subjectId,
            topicId,
            difficultyLevel,
            optionA,
            optionB,
            optionC,
            optionD,
            correctAnswer,
            explanation,
            marks,
            negativeMarks,
            isActive,
            approvalStatus
        });

        res.json({
            success: true,
            message: 'Question updated successfully'
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update question'
        });
    }
};

exports.approveQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        await Question.update(id, {
            approvalStatus: status,
            approvedBy: req.user.id
        });

        res.json({
            success: true,
            message: `Question ${status} successfully`
        });
    } catch (error) {
        console.error('Approve question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update question status'
        });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Question.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete question'
        });
    }
};

exports.getQuestionStats = async (req, res) => {
    try {
        const { subjectId } = req.query;

        const stats = {
            total: await Question.count({ subjectId: subjectId ? parseInt(subjectId) : undefined }),
            byType: {},
            byDifficulty: {},
            bySubject: []
        };

        const types = ['mcq', 'true_false'];
        for (const type of types) {
            stats.byType[type] = await Question.count({
                questionType: type,
                subjectId: subjectId ? parseInt(subjectId) : undefined
            });
        }

        const difficulties = ['beginner', 'intermediate', 'advanced', 'expert', 'guru'];
        for (const diff of difficulties) {
            stats.byDifficulty[diff] = await Question.count({
                difficultyLevel: diff,
                subjectId: subjectId ? parseInt(subjectId) : undefined
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get question stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get question statistics'
        });
    }
};
