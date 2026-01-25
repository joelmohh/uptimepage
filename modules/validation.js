const mongoose = require('mongoose');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validateEnv(envVars) {
    const missing = [];
    
    envVars.forEach(envVar => {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    });

    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
}

module.exports = {
    isValidObjectId,
    isValidUrl,
    validateEnv
};
