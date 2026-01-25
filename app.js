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
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[INFO] Connected to MongoDB'))
    .catch(err => console.error('[ERROR] MongoDB connection error:', err));

const PROJECTS = require('./models/Project');

// Routes
app.get('/', async (req, res) => {

    const projects = await PROJECTS.find();

    res.render('index', {
        statusMessage: "All Systems Online",
        statusClass: "online",
        lastUpdated: new Date().toUTCString(),
        projects: projects
    });
});
app.get('/:id', async (req, res) => {
    if(req.params.id === 'favicon.ico') {
        return res.status(204).end();
    }
    const project = await PROJECTS.findById(req.params.id);
    if (!project) {
        return res.status(404).send('Service not found');
    }

    res.render('project', {
        statusMessage: `Dashboard is Online`,
        statusClass: "online",
        lastUpdated: new Date().toUTCString(),
        projects: [project]
    });
});

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));


app.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);
});
