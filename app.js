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
const { newJob } = require('./modules/cron');
const { vm, summary } = require('./modules/stats');

// Routes
app.get('/', async (req, res) => {

    const projects = await PROJECTS.find();
    const viewModels = projects.map(vm);
    const dashboard = summary(viewModels);

    res.render('index', {
        statusMessage: dashboard.statusMessage,
        statusClass: dashboard.statusClass,
        lastUpdated: new Date().toUTCString(),
        projects: viewModels,
        overall: dashboard
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

    const viewModel = vm(project);

    res.render('project', {
        statusMessage: viewModel.status === 'down' ? 'Service Degraded' : `${project.name} is Online`,
        statusClass: viewModel.status === 'down' ? 'degraded' : 'online',
        lastUpdated: new Date().toUTCString(),
        project: viewModel
    });
});

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dash'));


app.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);
});

(async () => {
    const projects = await PROJECTS.find();
    projects.forEach(newJob);
})();