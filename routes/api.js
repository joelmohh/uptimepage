const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

// Module imports
const { vm } = require('../modules/stats');
const { isValidObjectId, isValidUrl } = require('../modules/validation');
const { checkService } = require('../modules/cron');
const PROJECTS = require('../models/Project');
const defaults = require('../config.json');
var { projectsList } = require('../modules/cron');

// Authorization middleware
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

// API Endpoints
router.get('/services', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1) || req.query.page;
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
        console.error('[ERROR] Failed to fetch services', { error: err.message });
        res.status(500).json({ error: 'Failed to fetch services' });
    }    
});

router.get('/services/:id', async (req, res) => {
    try {

        if (!isValidObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const project = await PROJECTS.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(vm(project));

    } catch (err) {
    
        console.error('[ERROR] Failed to fetch service', { error: err.message });
        res.status(500).json({ error: 'Failed to fetch service' });
    
    }
});


router.post('/services', authorize, async (req, res) => {
    try {
        const { name, url, interval, timeout } = req.body

        if (!name || !url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const newProject = new PROJECTS({
            name: name,
            url,
            interval: interval || defaults.interval,
            timeout: timeout || defaults.timeout
        });

        const savedProject = await newProject.save();
        await checkService(savedProject);
        const freshProject = await PROJECTS.findById(savedProject._id);

        // ADD TO PROJECTS LIST
        projectsList.push({
            id: savedProject._id.toString(),
            name: savedProject.name,
            url: savedProject.url,
        });

        res.status(201).json(vm(freshProject || savedProject));
        
    } catch (err) {
        console.error('[ERROR] Failed to create project', { error: err.message });
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.delete('/services/:id', authorize, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const deletedProject = await PROJECTS.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // REMOVE FROM PROJECTS LIST
        projectsList = projectsList.filter(project => project.id !== deletedProject._id.toString());

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('[ERROR] Failed to delete project', { error: err.message });
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

router.put('/services/:id', authorize, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { name, url, interval, timeout, status } = req.body;

        if (url && !isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (interval !== undefined) updateData.interval = interval;
        if (timeout !== undefined) updateData.timeout = timeout;
        if (status !== undefined) updateData.status = status;

        const updatedProject = await PROJECTS.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        //UPDATE PROJECTS LIST (remove and add)
        projectsList = projectsList.filter(project => project.id !== updatedProject._id.toString());
        projectsList.push({
            id: updatedProject._id.toString(),
            name: updatedProject.name,
            url: updatedProject.url
        });

        res.json(vm(updatedProject));
    } catch (err) {
        console.error('[ERROR] Failed to update project', { error: err.message });
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.get('/cron', async (req, res) => {
    try {
        const projects = projectsList.length > 0 ? projectsList : await PROJECTS.find();

        for (const project of projects) {
            const result = await checkService(project);
            console.log(`[CRON] Checked ${project.name}: ${result.status} (${result.responseTime}ms)`);
        }

        res.json({ message: 'Cron job executed successfully' });
    }
    catch (err) {
        console.error('[ERROR] Failed to execute cron job', { error: err.message });
        res.status(500).json({ error: 'Failed to execute cron job' });
    }
});

module.exports = router