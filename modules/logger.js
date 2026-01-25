const fs = require('node:fs');
const path = require('node:path');

const logsDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const LogLevel = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

function formatTimestamp() {
    return new Date().toISOString();
}

function formatLog(level, context, message, data) {
    const timestamp = formatTimestamp();
    const logEntry = {
        timestamp,
        level,
        context,
        message,
        ...(data && { data })
    };
    return JSON.stringify(logEntry);
}

function writeToFile(level, logEntry) {
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${level.toLowerCase()}-${date}.log`;
    const filePath = path.join(logsDir, fileName);
    
    // removed for vercel
    //fs.appendFileSync(filePath, logEntry + '\n', { encoding: 'utf-8' });
}

function log(level, context, message, data) {
    const logEntry = formatLog(level, context, message, data);
    console.log(logEntry);
    writeToFile(level, logEntry);
}

const logger = {
    error: (context, message, data) => log(LogLevel.ERROR, context, message, data),
    warn: (context, message, data) => log(LogLevel.WARN, context, message, data),
    info: (context, message, data) => log(LogLevel.INFO, context, message, data),
    debug: (context, message, data) => log(LogLevel.DEBUG, context, message, data)
};

module.exports = logger;
