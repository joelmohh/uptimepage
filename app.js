const express = require('express');
const path = require('node:path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import modules
const { isValidObjectId } = require('./modules/validation');
const { vm, summary } = require('./modules/stats');
const PROJECTS = require('./models/Project');
var { projectsList } = require('./modules/cron');


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[INFO] Connected to MongoDB'))
    .catch(err => {
        console.error('[ERROR] MongoDB connection error', { error: err.message });
        process.exit(1);
    });

app.get('/', async (req, res) => {
    try {

        // TODO - Cache this result and update every 5 minutes to reduce database load
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

    } catch (err) {
        console.error('[ERROR] Error rendering index', { error: err.message });
        res.status(500).send('Internal Server Error');
    }
});


app.get('/:id', async (req, res) => {
    try {
        if (req.params.id === 'favicon.ico') {
            return res.status(204).end();
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(404).send('Service not found');
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

    } catch (err) {
        console.error('[ERROR] Error rendering project', { error: err.message });
        res.status(500).send('Internal Server Error');
    }
});

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);

    if(projectsList.length === 0){
        PROJECTS.find().then(projects => {
            projectsList = projects.map(project => ({
                id: project._id.toString(),
                name: project.name,
                url: project.url
            }));
        }).catch(err => {
            console.error('[ERROR] Failed to load projects on startup', { error: err.message });
        });
    }

});