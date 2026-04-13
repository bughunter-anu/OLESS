const { Exam, ExamSession, StudentAnswer } = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const db = require('../config/database');

exports.getAllExams = async (req, res) => {
    try {
        const { subjectId, examLevel, search, page = 1, limit = 20 } = req.query;

        const exams = await Exam.findAll({
            subjectId: subjectId ? parseInt(subjectId) : undefined,
            examLevel,
            search,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: exams
        });
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exams'
        });
    }
};

exports.getExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const stats = await Result.getStatistics(id);

        res.json({
            success: true,
            data: {
                ...exam,
                statistics: stats
            }
        });
    } catch (error) {
        console.error('Get exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam'
        });
    }
};

exports.createExam = async (req, res) => {
    try {
        const {
            examName, subjectId, description, examLevel, durationMinutes,
            totalQuestions, totalMarks, passingMarks, difficultyDistribution,
            randomizeQuestions, randomizeOptions, showResultsImmediately,
            allowReview, startDate, endDate
        } = req.body;

        const exam = await Exam.create({
            examName,
            subjectId,
            description,
            examLevel: examLevel || 'beginner',
            durationMinutes: durationMinutes || 60,
            totalQuestions: totalQuestions || 20,
            totalMarks: totalMarks || 100,
            passingMarks: passingMarks || 40,
            difficultyDistribution,
            randomizeQuestions,
            randomizeOptions,
            showResultsImmediately,
            allowReview,
            startDate,
            endDate,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: exam
        });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create exam'
        });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        await Exam.update(id, updateData);

        res.json({
            success: true,
            message: 'Exam updated successfully'
        });
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update exam'
        });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Exam.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.json({
            success: true,
            message: 'Exam deleted successfully'
        });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete exam'
        });
    }
};

exports.startExam = async (req, res) => {
    try {
        const { examId } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        if (!exam.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Exam is not active'
            });
        }

        if (exam.start_date && new Date(exam.start_date) > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Exam has not started yet'
            });
        }

        if (exam.end_date && new Date(exam.end_date) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Exam has ended'
            });
        }

        const hasActive = await ExamSession.hasActiveSession(req.user.id, examId);
        if (hasActive) {
            return res.status(400).json({
                success: false,
                message: 'You have an active exam session'
            });
        }

        const existingResult = await ExamSession.checkExistingAttempt(req.user.id, examId);
        if (existingResult) {
            return res.status(400).json({
                success: false,
                message: 'You have already attempted this exam',
                data: { resultCode: existingResult.session_id }
            });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const session = await ExamSession.create({
            examId,
            userId: req.user.id,
            ipAddress,
            userAgent
        });

        const questions = await Question.getRandomQuestions(examId, req.user.id);
        
        const selectedQuestions = questions.slice(0, exam.total_questions);
        
        const examQuestions = selectedQuestions.map(q => ({
            id: q.id,
            questionText: q.question_text,
            questionType: q.question_type,
            options: exam.randomize_options ? 
                [q.option_a, q.option_b, q.option_c, q.option_d].sort(() => Math.random() - 0.5) :
                [q.option_a, q.option_b, q.option_c, q.option_d]
        }));

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'START_EXAM', 'Exam', `Started exam: ${exam.exam_name}`, ipAddress]
        );

        res.json({
            success: true,
            message: 'Exam started successfully',
            data: {
                sessionId: session.sessionId,
                exam: {
                    name: exam.exam_name,
                    duration: exam.duration_minutes,
                    totalQuestions: exam.total_questions,
                    totalMarks: exam.total_marks,
                    passingMarks: exam.passing_marks
                },
                questions: examQuestions
            }
        });
    } catch (error) {
        console.error('Start exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start exam'
        });
    }
};

exports.getExamSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ExamSession.findBySessionId(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const answers = await StudentAnswer.getBySession(session.id);

        res.json({
            success: true,
            data: {
                session: {
                    id: session.id,
                    sessionId: session.session_id,
                    status: session.status,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    timeRemaining: session.time_remaining
                },
                exam: {
                    name: session.exam_name,
                    duration: session.duration_minutes
                },
                answers: answers.map(a => ({
                    questionId: a.question_id,
                    selectedAnswer: a.selected_answer
                }))
            }
        });
    } catch (error) {
        console.error('Get exam session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam session'
        });
    }
};

exports.saveAnswer = async (req, res) => {
    try {
        const { sessionId, questionId, answer, timeSpent } = req.params;

        const session = await ExamSession.findBySessionId(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (session.status !== 'in_progress') {
            return res.status(400).json({
                success: false,
                message: 'Exam session is not active'
            });
        }

        const question = await Question.findById(parseInt(questionId));

        const isCorrect = answer && answer.toUpperCase() === question.correct_answer;
        const marksObtained = isCorrect ? question.marks : (question.negative_marks || 0);

        await StudentAnswer.save({
            sessionId: session.id,
            questionId: parseInt(questionId),
            selectedAnswer: answer,
            isCorrect,
            marksObtained
        });

        res.json({
            success: true,
            message: 'Answer saved'
        });
    } catch (error) {
        console.error('Save answer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save answer'
        });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ExamSession.findBySessionId(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (session.status !== 'in_progress') {
            return res.status(400).json({
                success: false,
                message: 'Exam already submitted'
            });
        }

        await ExamSession.complete(sessionId);

        const answers = await StudentAnswer.getBySession(session.id);
        
        let totalScore = 0;
        let totalMarks = session.total_marks;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unattempted = 0;

        for (const answer of answers) {
            if (answer.selected_answer === null) {
                unattempted++;
            } else if (answer.is_correct) {
                correctAnswers++;
                totalScore += answer.marks_obtained;
            } else {
                wrongAnswers++;
                totalScore += answer.marks_obtained;
            }
        }

        const percentage = (totalScore / totalMarks) * 100;

        const topicAnalysis = await Question.getTopicWiseAnalysis(req.user.id, session.exam_id);

        const strengthWeakness = {
            strongest: topicAnalysis.filter(t => t.accuracy >= 70).map(t => t.topic_name),
            weakest: topicAnalysis.filter(t => t.accuracy < 50).map(t => t.topic_name),
            needsImprovement: topicAnalysis.filter(t => t.accuracy >= 50 && t.accuracy < 70).map(t => t.topic_name)
        };

        const result = await Result.create({
            sessionId: session.id,
            userId: req.user.id,
            examId: session.exam_id,
            totalScore,
            totalMarks,
            percentage,
            correctAnswers,
            wrongAnswers,
            unattempted,
            timeTakenSeconds: (new Date() - new Date(session.start_time)) / 1000,
            topicAnalysis,
            strengthWeakness
        });

        await db.query(
            'INSERT INTO activity_logs (user_id, action, module, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SUBMIT_EXAM', 'Exam', `Submitted exam. Score: ${totalScore}/${totalMarks}`]
        );

        res.json({
            success: true,
            message: 'Exam submitted successfully',
            data: {
                resultCode: result.resultCode,
                totalScore,
                totalMarks,
                percentage,
                correctAnswers,
                wrongAnswers,
                unattempted,
                resultStatus: percentage >= session.passing_marks ? 'pass' : 'fail',
                topicAnalysis,
                strengthWeakness
            }
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit exam'
        });
    }
};

exports.getMyExamSessions = async (req, res) => {
    try {
        const { status } = req.query;

        const sessions = await ExamSession.findByUser(req.user.id, { status });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get my exams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get exam sessions'
        });
    }
};
