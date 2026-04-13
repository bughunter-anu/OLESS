const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (!result.isEmpty()) break;
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    };
};

const authValidations = {
    register: [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be 3-50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email required')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
        body('firstName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name required'),
        body('lastName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name required'),
        body('role')
            .optional()
            .isIn(['student', 'operator'])
            .withMessage('Invalid role')
    ],
    login: [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username required'),
        body('password')
            .notEmpty()
            .withMessage('Password required')
    ]
};

const subjectValidations = {
    create: [
        body('subjectCode')
            .trim()
            .isLength({ min: 2, max: 20 })
            .withMessage('Subject code must be 2-20 characters')
            .matches(/^[A-Z0-9]+$/)
            .withMessage('Subject code must be uppercase alphanumeric'),
        body('subjectName')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Subject name must be 2-100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description max 500 characters'),
        body('creditHours')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Credit hours must be 1-10')
    ],
    update: [
        body('subjectName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Subject name must be 2-100 characters')
    ]
};

const questionValidations = {
    create: [
        body('questionText')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Question must be 10-1000 characters'),
        body('questionType')
            .isIn(['mcq', 'true_false'])
            .withMessage('Question type must be mcq or true_false'),
        body('subjectId')
            .isInt({ min: 1 })
            .withMessage('Valid subject required'),
        body('difficultyLevel')
            .optional()
            .isIn(['beginner', 'intermediate', 'advanced', 'expert', 'guru'])
            .withMessage('Invalid difficulty level'),
        body('correctAnswer')
            .isIn(['A', 'B', 'C', 'D'])
            .withMessage('Correct answer must be A, B, C, or D'),
        body('marks')
            .optional()
            .isInt({ min: 0, max: 10 })
            .withMessage('Marks must be 0-10')
    ],
    bulkCreate: [
        body('questions')
            .isArray({ min: 1 })
            .withMessage('Questions array required'),
        body('questions.*.questionText')
            .trim()
            .isLength({ min: 10, max: 1000 }),
        body('questions.*.questionType')
            .isIn(['mcq', 'true_false']),
        body('questions.*.subjectId')
            .isInt({ min: 1 }),
        body('questions.*.correctAnswer')
            .isIn(['A', 'B', 'C', 'D'])
    ]
};

const examValidations = {
    create: [
        body('examName')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Exam name must be 3-200 characters'),
        body('subjectId')
            .isInt({ min: 1 })
            .withMessage('Valid subject required'),
        body('durationMinutes')
            .optional()
            .isInt({ min: 5, max: 300 })
            .withMessage('Duration must be 5-300 minutes'),
        body('totalQuestions')
            .optional()
            .isInt({ min: 1, max: 200 })
            .withMessage('Total questions must be 1-200'),
        body('totalMarks')
            .optional()
            .isInt({ min: 10, max: 1000 })
            .withMessage('Total marks must be 10-1000'),
        body('passingMarks')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Passing marks required')
    ],
    start: [
        body('examId')
            .isInt({ min: 1 })
            .withMessage('Valid exam ID required')
    ]
};

module.exports = {
    validate,
    authValidations,
    subjectValidations,
    questionValidations,
    examValidations
};
