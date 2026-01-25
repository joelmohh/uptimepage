const express = require('express');
const router = express.Router();

const path = require('node:path');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');

const { newJob } = require('../modules/cron');

const PROJECTS = require('../models/Project');

router.get('/services', (req, res) => {
    PROJECTS.find().then(projects => {
        res.json(projects);
    }).catch(err => {
        res.status(500).json({ error: 'Failed to fetch services' });
    });    
});

router.get('/services/:id', (req, res) => {
    const service = config.services.find(s => s.id === req.params.id);
    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
});

// NEW PROJECT
router.post('/services', async (req, res) => {
    const API_KEY = req.headers['x-api-key'];
    if (!API_KEY || !jwt.verify(API_KEY, process.env.JWT_SECRET || jwt.decode(API_KEY).username !== process.env.AUTH_USER)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { service_name, url, interval, timeout } = req.body;
    if (!service_name || !url || !interval || !timeout) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newProject = new PROJECTS({
            name: service_name,
            url,
            interval,
            timeout
        });

        const savedProject = await newProject.save();

        newJob(savedProject);

        res.status(201).json(savedProject);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// DELETE PROJECT
router.delete('/services/:id', async (req, res) => {
    const API_KEY = req.headers['x-api-key'];
    if (!API_KEY || !jwt.verify(API_KEY, process.env.API_SECRET || jwt.decode(API_KEY).username !== process.env.AUTH_USER)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const deletedProject = await PROJECTS.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
router.put('/services/:id', async (req, res) => {
    const API_KEY = req.headers['x-api-key'];
    if (!API_KEY || !jwt.verify(API_KEY, process.env.API_SECRET || jwt.decode(API_KEY).username !== process.env.AUTH_USER)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, url, interval, timeout, status } = req.body;

    try {
        const updatedProject = await PROJECTS.findByIdAndUpdate(
            req.params.id,
            { name, url, interval, timeout, status },
            { new: true }
        );
        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});



module.exports = router;