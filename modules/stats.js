const DAY_MS = 24 * 60 * 60 * 1000;

function nDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getUptime(history = [], days = 90) {
    const cutoff = Date.now() - (days - 1) * DAY_MS;
    let up = 0;
    let total = 0;

    history.forEach(entry => {
        if (!entry || !entry.date) return;
        const time = new Date(entry.date).getTime();
        if (Number.isNaN(time) || time < cutoff) return;

        const ups = entry.upCount || 0;
        const downs = entry.downCount || 0;

        up += ups;
        total += ups + downs;
    });

    if (total === 0) return null;
    return Number(((up / total) * 100).toFixed(2));
}

function history(history = [], days = 90, segments = 60) {
    const dayMap = new Map();
    history.forEach(entry => {
        if (!entry || !entry.date) return;
        const key = nDay(entry.date).getTime();
        const ups = entry.upCount || 0;
        const downs = entry.downCount || 0;
        const total = ups + downs;
        if (total === 0) return;
        dayMap.set(key, ups / total);
    });

    const start = nDay(new Date(Date.now() - (days - 1) * DAY_MS));
    const values = [];
    for (let i = 0; i < days; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        const uptime = dayMap.get(day.getTime());
        values.push(uptime === undefined ? null : uptime);
    }

    const span = Math.ceil(days / segments);
    let output = '';
    for (let i = 0; i < segments; i++) {
        const slice = values.slice(i * span, (i + 1) * span);
        if (!slice.length) {
            output += '-';
            continue;
        }
        const valid = slice.filter(v => v !== null);
        if (!valid.length) {
            output += '-';
            continue;
        }
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
        output += avg >= 0.99 ? '1' : '0';
    }
    return output;
}

function buildResponseSeries(history = [], days = 90) {
    const cutoff = Date.now() - (days - 1) * DAY_MS;
    const filtered = history
        .filter(entry => entry && entry.date && typeof entry.avgResponseTime === 'number')
        .filter(entry => new Date(entry.date).getTime() >= cutoff)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = filtered.map(entry => new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
    const data = filtered.map(entry => Math.round(entry.avgResponseTime));

    return { labels, data };
}

function vm(project) {
    const uptime90 = getUptime(project.last90Days, 90) ?? 0;
    const uptime30 = getUptime(project.last90Days, 30) ?? uptime90;
    const uptime7 = getUptime(project.last90Days, 7) ?? uptime30;
    const uptime1 = getUptime(project.last90Days, 1) ?? uptime7;

    return {
        id: project._id.toString(),
        name: project.name,
        description: project.description || '',
        status: project.status,
        url: project.url,
        uptime90,
        uptime30,
        uptime7,
        uptime1,
        history: history(project.last90Days),
        responseSeries: buildResponseSeries(project.last90Days)
    };
}

function average(values = []) {
    const valid = values.filter(v => v !== null && v !== undefined);
    if (!valid.length) return 0;
    const sum = valid.reduce((a, b) => a + b, 0);
    return Number((sum / valid.length).toFixed(2));
}

function summary(projectsVM) {
    return {
        uptime90: average(projectsVM.map(p => p.uptime90)),
        uptime30: average(projectsVM.map(p => p.uptime30)),
        uptime7: average(projectsVM.map(p => p.uptime7)),
        uptime1: average(projectsVM.map(p => p.uptime1)),
        statusClass: projectsVM.some(p => p.status === 'down') ? 'degraded' : 'online',
        statusMessage: projectsVM.some(p => p.status === 'down') ? 'Some Systems Degraded' : 'All Systems Online'
    }
}

module.exports = { vm, summary }
