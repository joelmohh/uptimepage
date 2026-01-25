const cron = require('node-cron');
const PROJECTS = require('../models/Project');
const CHECKS = require('../models/Checks');

const jobs = new Map(); 

function newJob(project) {
    const projectId = project._id.toString();

    stopJob(projectId);

    const job = cron.schedule(`*/${project.interval} * * * *`, async () => {
        const { status, responseTime, responseCode } = await checkService(project);

        const freshProject = await PROJECTS.findById(projectId);
        if (!freshProject) return;

        const now = new Date();
        const dayKey = nDay(now);

        await CHECKS.create({
            project: projectId,
            status,
            responseTime,
            responseCode
        });

        freshProject.status = status;
        freshProject.lastChecked = now;
        freshProject.lastResponseTime = responseTime;
        freshProject.lastResponseCode = responseCode;

        freshProject.last90Days = updateRoll(freshProject.last90Days, dayKey, status, responseTime);

        await freshProject.save();

        console.log(`[CRON] ${freshProject.name}: ${status} (${responseTime}ms)`);
    });

    jobs.set(projectId, job);
}

function stopJob(projectId) {
    const job = jobs.get(projectId);
    if (job) {
        job.stop();
        jobs.delete(projectId);
    }
}

function restartJob(project) {
    stopJob(project._id.toString());
    newJob(project);
}

function nDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function updateRoll(history = [], dayKey, status, responseTime) {
    const safeResponse = Number.isFinite(responseTime) ? responseTime : 0;

    const normalized = (Array.isArray(history) ? history : []).map(entry => ({
        date: nDay(entry?.date || dayKey),
        upCount: Number.isFinite(entry?.upCount) ? entry.upCount : 0,
        downCount: Number.isFinite(entry?.downCount) ? entry.downCount : 0,
        total: Number.isFinite(entry?.total) ? entry.total : 0,
        avgResponseTime: Number.isFinite(entry?.avgResponseTime) ? entry.avgResponseTime : 0
    }));

    const idx = normalized.findIndex(entry => entry.date.getTime() === dayKey.getTime());

    if (idx === -1) {
        normalized.push({
            date: dayKey,
            upCount: status === 'up' ? 1 : 0,
            downCount: status === 'down' ? 1 : 0,
            total: 1,
            avgResponseTime: safeResponse
        });
    } else {
        const entry = normalized[idx];
        const upCount = entry.upCount + (status === 'up' ? 1 : 0);
        const downCount = entry.downCount + (status === 'down' ? 1 : 0);
        const total = entry.total + 1;
        const prevWeighted = Number.isFinite(entry.avgResponseTime) && Number.isFinite(entry.total)
            ? entry.avgResponseTime * entry.total
            : 0;
        const avgResponseTime = (prevWeighted + safeResponse) / total;

        normalized[idx] = {
            ...entry,
            upCount,
            downCount,
            total,
            avgResponseTime
        };
    }

    const sorted = normalized.sort((a, b) => a.date - b.date);
    if (sorted.length > 90) {
        return sorted.slice(sorted.length - 90);
    }
    return sorted;
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
            responseTime,
            responseCode: response.status
        };

    } catch (err) {
        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        return {
            status: 'down',
            responseTime,
            responseCode: 0
        };
    }
}
module.exports = { checkService, newJob, restartJob, stopJob, jobs };
