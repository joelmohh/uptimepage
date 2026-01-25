const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

const { newJob, stopJob, restartJob } = require('../modules/cron');
const { vm } = require('../modules/stats');
const logger = require('../modules/logger');
const metrics = require('../modules/metrics');
const { isValidObjectId, isValidUrl } = require('../modules/validation');

const PROJECTS = require('../models/Project');
const defaults = require('../config.json');

function authorize(req, res, next) {
    const token = req.headers['x-api-key'];
    if (!token) return res.status(403).json({ error: 'Forbidden' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.username !== process.env.AUTH_USER) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden' });
    }
}

router.get('/services', async (req, res) => {
    const startTime = Date.now();
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const status = req.query.status;
        const skip = (page - 1) * limit;

        let query = {};
        if (status && ['up', 'down'].includes(status)) {
            query.status = status;
        }

        const projects = await PROJECTS.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await PROJECTS.countDocuments(query);

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);

        res.json({
            data: projects.map(vm),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('API', 'Failed to fetch services', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).json({ error: 'Failed to fetch services' });
    }    
});

router.get('/services/:id', async (req, res) => {
    const startTime = Date.now();
    try {
        if (!isValidObjectId(req.params.id)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Service not found' });
        }

        const project = await PROJECTS.findById(req.params.id);
        if (!project) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Service not found' });
        }

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);
        res.json(vm(project));
    } catch (err) {
        logger.error('API', 'Failed to fetch service', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

router.post('/services', authorize, async (req, res) => {
    const startTime = Date.now();
    try {
        const { service_name, name, url, interval, timeout, description } = req.body;
        const finalName = name || service_name;

        if (!finalName || !url) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(400, duration);
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!isValidUrl(url)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(400, duration);
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const newProject = new PROJECTS({
            name: finalName,
            description: description || '',
            url,
            interval: interval || defaults.interval,
            timeout: timeout || defaults.timeout
        });

        const savedProject = await newProject.save();
        newJob(savedProject);

        const duration = Date.now() - startTime;
        metrics.recordRequest(201, duration);
        res.status(201).json(vm(savedProject));
    } catch (err) {
        logger.error('API', 'Failed to create project', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.delete('/services/:id', authorize, async (req, res) => {
    const startTime = Date.now();
    try {
        if (!isValidObjectId(req.params.id)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Project not found' });
        }

        const deletedProject = await PROJECTS.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Project not found' });
        }

        stopJob(req.params.id);

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        logger.error('API', 'Failed to delete project', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

router.put('/services/:id', authorize, async (req, res) => {
    const startTime = Date.now();
    try {
        if (!isValidObjectId(req.params.id)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Project not found' });
        }

        const { name, url, interval, timeout, status, description } = req.body;

        if (url && !isValidUrl(url)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(400, duration);
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (interval !== undefined) updateData.interval = interval;
        if (timeout !== undefined) updateData.timeout = timeout;
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;

        const updatedProject = await PROJECTS.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedProject) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).json({ error: 'Project not found' });
        }

        restartJob(updatedProject);

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);
        res.json(vm(updatedProject));
    } catch (err) {
        logger.error('API', 'Failed to update project', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

module.exports = router;