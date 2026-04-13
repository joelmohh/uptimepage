const PROJECTS = require('../models/Project');
const CHECKS = require('../models/Checks');
const { sendNotification } = require('./notifications');

var projectsList = [];

function updateLast90Days(last90Days = [], status, responseTime) {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);

    const safeResponseTime = Number(responseTime);
    const samples = Array.isArray(last90Days)
        ? last90Days
            .filter(entry => entry && entry.date)
            .map(entry => {
                const date = new Date(entry.date);
                const upCount = Number(entry.upCount || 0);
                const downCount = Number(entry.downCount || 0);
                const total = upCount + downCount;
                const avgResponseTime = Number(entry.avgResponseTime || 0);

                return {
                    date,
                    upCount,
                    downCount,
                    total,
                    avgResponseTime: Number.isFinite(avgResponseTime) ? avgResponseTime : 0
                };
            })
            .filter(entry => !Number.isNaN(entry.date.getTime()))
        : [];

    let dayEntry = samples.find(entry => {
        const entryDay = new Date(entry.date);
        entryDay.setHours(0, 0, 0, 0);
        return entryDay.getTime() === dayStart.getTime();
    });

    if (!dayEntry) {
        dayEntry = {
            date: dayStart,
            upCount: 0,
            downCount: 0,
            total: 0,
            avgResponseTime: 0
        };
        samples.push(dayEntry);
    }

    if (status === 'up') {
        dayEntry.upCount += 1;
    } else {
        dayEntry.downCount += 1;
    }

    const prevTotal = dayEntry.total;
    dayEntry.total = dayEntry.upCount + dayEntry.downCount;

    if (Number.isFinite(safeResponseTime) && safeResponseTime > 0) {
        dayEntry.avgResponseTime =
            ((dayEntry.avgResponseTime * prevTotal) + safeResponseTime) /
            dayEntry.total;
    }

    const cutoff = new Date(dayStart);
    cutoff.setDate(cutoff.getDate() - 89);

    return samples
        .filter(entry => entry.date >= cutoff)
        .sort((a, b) => a.date - b.date);
}

async function checkService(project) {
    const projectId = project._id || project.id;
    const startTime = Date.now();
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 7000);

    try {
        const response = await fetch(project.url, {
            method: 'GET',
            signal: controller.signal
        });

        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        if (!response.ok) {
            sendNotification(project.name, `[DOWN] Alert: Your project ${project.name} is down.`, `The service at ${project.url} returned a status code of ${response.status}.`);
        }


        const newCheck = new CHECKS({
            project: projectId,
            status: response.ok ? 'up' : 'down',
            responseTime,
            responseCode: response.status
        });

        const freshProject = await PROJECTS.findById(projectId);

        await PROJECTS.findByIdAndUpdate(projectId, {
            status: response.ok ? 'up' : 'down',
            lastResponseTime: responseTime,
            lastResponseCode: response.status,
            last90Days: updateLast90Days(freshProject?.last90Days || project.last90Days, response.ok ? 'up' : 'down', responseTime),
            lastChecked: new Date()
        }, { new: true });

        await newCheck.save();

        return {
            status: response.ok ? 'up' : 'down',
            responseTime,
            responseCode: response.status
        };

    } catch (err) {
        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        const freshProject = await PROJECTS.findById(projectId);
        await PROJECTS.findByIdAndUpdate(projectId, {
            status: 'down',
            lastResponseTime: responseTime,
            lastResponseCode: 0,
            last90Days: updateLast90Days(freshProject?.last90Days || project.last90Days, 'down', responseTime),
            lastChecked: new Date()
        }, { new: true });

        await new CHECKS({
            project: projectId,
            status: 'down',
            responseTime,
            responseCode: 0
        }).save();

        return {
            status: 'down',
            responseTime,
            responseCode: 0
        };
    }
}

module.exports = {
    checkService,
    projectsList
}

