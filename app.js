const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Express Setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[INFO] Connected to MongoDB'))
    .catch(err => console.error('[ERROR] MongoDB connection error:', err));

// Config File
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));

// Routes
app.get('/', (req, res) => {

    const projects = config.services;

    res.render('index', {
        statusMessage: "All Systems Online",
        statusClass: "online",
        lastUpdated: new Date().toUTCString(),
        projects: projects
    });
});
app.get('/:id', (req, res) => {
    const project = config.services.find(s => s.id === req.params.id);
    //if (!project) {
    //    return res.status(404).send('Service not found');
    //}

    res.render('project', {
        statusMessage: `Dashboard is Online`,
        statusClass: "online",
        lastUpdated: new Date().toUTCString(),
        projects: [project]
    });
});


app.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);
});
