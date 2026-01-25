const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./modules/logger');
const metrics = require('./modules/metrics');
const { validateEnv, isValidObjectId } = require('./modules/validation');
const { newJob } = require('./modules/cron');
const { vm, summary } = require('./modules/stats');
const PROJECTS = require('./models/Project');

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'AUTH_USER', 'AUTH_PASS'];
validateEnv(requiredEnv);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('APP', 'Connected to MongoDB'))
    .catch(err => {
        logger.error('APP', 'MongoDB connection error', { error: err.message });
        process.exit(1);
    });

app.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
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

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);
    } catch (err) {
        logger.error('APP', 'Error rendering index', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/metrics', (req, res) => {
    res.json(metrics.getMetrics());
});

app.get('/:id', async (req, res) => {
    const startTime = Date.now();
    try {
        if (req.params.id === 'favicon.ico') {
            return res.status(204).end();
        }

        if (!isValidObjectId(req.params.id)) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).send('Service not found');
        }

        const project = await PROJECTS.findById(req.params.id);
        if (!project) {
            const duration = Date.now() - startTime;
            metrics.recordRequest(404, duration);
            return res.status(404).send('Service not found');
        }

        const viewModel = vm(project);

        res.render('project', {
            statusMessage: viewModel.status === 'down' ? 'Service Degraded' : `${project.name} is Online`,
            statusClass: viewModel.status === 'down' ? 'degraded' : 'online',
            lastUpdated: new Date().toUTCString(),
            project: viewModel
        });

        const duration = Date.now() - startTime;
        metrics.recordRequest(200, duration);
    } catch (err) {
        logger.error('APP', 'Error rendering project', { error: err.message });
        const duration = Date.now() - startTime;
        metrics.recordRequest(500, duration);
        res.status(500).send('Internal Server Error');
    }
});

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));

app.listen(PORT, () => {
    logger.info('APP', `Server is running on port ${PORT}`);
});

(async () => {
    const projects = await PROJECTS.find();
    projects.forEach(newJob);
})();