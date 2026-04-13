const { Subject, Topic } = require('../models/Subject');

exports.getAllSubjects = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const subjects = await Subject.findAll({
            search,
            limit: parseInt(limit),
            offset
        });

        const total = await Subject.count();

        res.json({
            success: true,
            data: {
                subjects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subjects'
        });
    }
};

exports.getSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        const topics = await Topic.findBySubject(id);

        res.json({
            success: true,
            data: {
                ...subject,
                topics
            }
        });
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subject'
        });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const { subjectCode, subjectName, description, creditHours } = req.body;

        const existing = await Subject.findByCode(subjectCode);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Subject code already exists'
            });
        }

        const subject = await Subject.create({
            subjectCode,
            subjectName,
            description,
            creditHours,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subject'
        });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { subjectName, description, creditHours, isActive } = req.body;

        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        await Subject.update(id, { subjectName, description, creditHours, isActive });

        res.json({
            success: true,
            message: 'Subject updated successfully'
        });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update subject'
        });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Subject.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete subject'
        });
    }
};

exports.getAllTopics = async (req, res) => {
    try {
        const { subjectId, difficultyLevel, search } = req.query;

        const topics = await Topic.findAll({
            subjectId: subjectId ? parseInt(subjectId) : undefined,
            difficultyLevel,
            search
        });

        res.json({
            success: true,
            data: topics
        });
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get topics'
        });
    }
};

exports.createTopic = async (req, res) => {
    try {
        const { subjectId, topicName, topicCode, description, difficultyLevel, weightage } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        const topic = await Topic.create({
            subjectId,
            topicName,
            topicCode,
            description,
            difficultyLevel,
            weightage
        });

        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: topic
        });
    } catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create topic'
        });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { topicName, topicCode, description, difficultyLevel, weightage, isActive } = req.body;

        const topic = await Topic.findById(id);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        await Topic.update(id, { topicName, topicCode, description, difficultyLevel, weightage, isActive });

        res.json({
            success: true,
            message: 'Topic updated successfully'
        });
    } catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update topic'
        });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Topic.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        res.json({
            success: true,
            message: 'Topic deleted successfully'
        });
    } catch (error) {
        console.error('Delete topic error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete topic'
        });
    }
};
