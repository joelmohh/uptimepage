const cron = require('node-cron');
const PROJECTS = require('../models/Project');

const jobs = new Map(); 

function newJob(project) {
    const projectId = project._id.toString();

    if (jobs.has(projectId)) return;

    const job = cron.schedule(`*/${project.interval} * * * *`, async () => {
        const { status, responseTime } = await checkService(project);

        const freshProject = await PROJECTS.findById(projectId);
        if (!freshProject) return;

        freshProject.status = status;
        freshProject.lastChecked = new Date();
        freshProject.lastResponseTime = responseTime;

        freshProject.last90Days.push({
            date: new Date(),
            status,
            responseTime
        });

        if (freshProject.last90Days.length > 90) {
            freshProject.last90Days.shift();
        }

        await freshProject.save();

        console.log(`[CRON] ${freshProject.name}: ${status} (${responseTime}ms)`);
    });

    jobs.set(projectId, job);
}


async function checkService(project) {
    const startTime = Date.now();
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, project.timeout);

    try {
        const response = await fetch(project.url, {
            method: 'GET',
            signal: controller.signal
        });

        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        return {
            status: response.ok ? 'up' : 'down',
            responseTime
        };

    } catch (err) {
        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        return {
            status: 'down',
            responseTime
        };
    }
}
module.exports = { checkService, newJob, jobs };
