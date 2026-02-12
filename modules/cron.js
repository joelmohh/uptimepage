const PROJECTS = require('../models/Project');
const CHECKS = require('../models/Checks');
const logger = require('./logger');
const metrics = require('./metrics');
const { sendNotification } = require('./notifications');

const jobs = new Map();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CHECK_INTERVAL = 60000;
let globalCheckInterval = null;
let isCheckRunning = false;

function startGlobalChecker() {
    if (globalCheckInterval) return;
    
    logger.info('CRON', 'Starting global checker');
    
    performGlobalCheck();
    
    globalCheckInterval = setInterval(performGlobalCheck, CHECK_INTERVAL);
}

function stopGlobalChecker() {
    if (globalCheckInterval) {
        clearInterval(globalCheckInterval);
        globalCheckInterval = null;
        logger.info('CRON', 'Global checker stopped');
    }
}

async function performGlobalCheck() {
    if (isCheckRunning) {
        logger.warn('CRON', 'Check already running, skipping this cycle');
        return;
    }
    
    isCheckRunning = true;
    try {
        await runAllJobs();
    } catch (err) {
        logger.error('CRON', 'Error in global check', { error: err.message });
    } finally {
        isCheckRunning = false;
    }
}

function newJob(project) {
    const projectId = project._id.toString();
    jobs.set(projectId, { active: true, interval: project.interval });
    
    if (!globalCheckInterval) {
        startGlobalChecker();
    }
}

function stopJob(projectId) {
    const job = jobs.get(projectId);
    if (job) {
        jobs.delete(projectId);
    }
}

function restartJob(project) {
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
        
        if(!response.ok){
            sendNotification(project._id.toString(), `Alert: Service ${project.name} is down. Response code: ${response.status}`, `The service at ${project.url} returned a status code of ${response.status}.`);
        }

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

async function runAllJobs() {
    const projects = await PROJECTS.find();
    const results = [];
    
    for (const project of projects) {
        const { status, responseTime, responseCode } = await checkService(project);
        const now = new Date();
        const dayKey = nDay(now);
        const projectId = project._id.toString();

        try {
            await CHECKS.create({
                project: projectId,
                status,
                responseTime,
                responseCode
            });
        } catch (err) {
            logger.error('CRON', `Failed to create check for ${projectId}`, { error: err.message });
        }

        const updateData = {
            status,
            lastChecked: now,
            lastResponseTime: responseTime,
            lastResponseCode: responseCode
        };

        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                const freshProject = await PROJECTS.findById(projectId);
                if (!freshProject) {
                    logger.warn('CRON', `Project ${projectId} not found`);
                    break;
                }

                updateData.last90Days = updateRoll(freshProject.last90Days, dayKey, status, responseTime);

                const updated = await PROJECTS.findByIdAndUpdate(projectId, updateData, { new: true });
                
                metrics.recordCronCheck(status, false);
                logger.info('CRON', `${updated.name}: ${status}`, { responseTime });
                results.push({ projectId, status });
                break;
            } catch (err) {
                retries++;
                if (err.name === 'VersionError' && retries < MAX_RETRIES) {
                    logger.warn('CRON', `Version conflict, retrying (${retries}/${MAX_RETRIES})`, { projectId });
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                } else {
                    metrics.recordCronCheck(status, true);
                    logger.error('CRON', `Failed to update project ${projectId}`, { error: err.message, retries });
                    break;
                }
            }
        }
    }
    
    return results;
}

module.exports = { 
    checkService, 
    newJob, 
    restartJob, 
    stopJob, 
    jobs, 
    runAllJobs,
    startGlobalChecker,
    stopGlobalChecker,
    performGlobalCheck
};
