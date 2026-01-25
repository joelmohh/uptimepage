const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

const { newJob, stopJob, restartJob } = require('../modules/cron');
const { vm } = require('../modules/stats');

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
    try {
        const projects = await PROJECTS.find();
        res.json(projects.map(vm));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }    
});

router.get('/services/:id', async (req, res) => {
    try {
        const project = await PROJECTS.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(vm(project));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// NEW PROJECT
router.post('/services', authorize, async (req, res) => {
    const { service_name, name, url, interval, timeout, description } = req.body;
    const finalName = name || service_name;
    if (!finalName || !url) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newProject = new PROJECTS({
            name: finalName,
            description: description || '',
            url,
            interval: interval || defaults.interval,
            timeout: timeout || defaults.timeout
        });

        const savedProject = await newProject.save();

        newJob(savedProject);

        res.status(201).json(vm(savedProject));

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// DELETE PROJECT
router.delete('/services/:id', authorize, async (req, res) => {
    try {
        const deletedProject = await PROJECTS.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        stopJob(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
router.put('/services/:id', authorize, async (req, res) => {
    const { name, url, interval, timeout, status, description } = req.body;

    try {
        const updatedProject = await PROJECTS.findByIdAndUpdate(
            req.params.id,
            { name, url, interval, timeout, status, description },
            { new: true }
        );
        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        restartJob(updatedProject);
        res.json(vm(updatedProject));
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});



module.exports = router;