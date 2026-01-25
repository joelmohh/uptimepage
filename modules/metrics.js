const logger = require('./logger');

class Metrics {
    constructor() {
        this.startTime = Date.now();
        this.requests = {
            total: 0,
            successful: 0,
            failed: 0
        };
        this.responseTime = {
            min: Infinity,
            max: 0,
            avg: 0,
            total: 0,
            count: 0
        };
        this.cronChecks = {
            total: 0,
            up: 0,
            down: 0,
            failed: 0
        };
    }

    recordRequest(statusCode, duration) {
        this.requests.total++;
        if (statusCode >= 200 && statusCode < 300) {
            this.requests.successful++;
        } else {
            this.requests.failed++;
        }
        
        this.recordResponseTime(duration);
    }

    recordResponseTime(duration) {
        this.responseTime.min = Math.min(this.responseTime.min, duration);
        this.responseTime.max = Math.max(this.responseTime.max, duration);
        this.responseTime.total += duration;
        this.responseTime.count++;
        this.responseTime.avg = Math.round(this.responseTime.total / this.responseTime.count);
    }

    recordCronCheck(status, failed = false) {
        this.cronChecks.total++;
        if (failed) {
            this.cronChecks.failed++;
        } else if (status === 'up') {
            this.cronChecks.up++;
        } else {
            this.cronChecks.down++;
        }
    }

    getMetrics() {
        const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60);
        
        return {
            uptime: `${uptime}m`,
            requests: this.requests,
            responseTime: {
                min: this.responseTime.min === Infinity ? 0 : this.responseTime.min,
                max: this.responseTime.max,
                avg: this.responseTime.avg
            },
            cronChecks: this.cronChecks
        };
    }

    logMetrics() {
        logger.info('METRICS', 'Application metrics', this.getMetrics());
    }
}

module.exports = new Metrics();
