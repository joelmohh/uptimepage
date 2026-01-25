const mongoose = require('mongoose');

const ProjectsSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: {
        type: String,
        default: ''
    },
    url: { 
        type: String, 
        required: true 
    },
    interval: { 
        type: Number, 
        required: true 
    },
    timeout: { 
        type: Number, 
        required: true 
    },
    lastResponseTime: {
        type: Number
    },
    lastResponseCode: {
        type: Number
    },
    status: { 
        type: String, 
        enum: ['up', 'down'], 
        default: 'down' 
    },
    last90Days: [{ 
        date: Date,
        upCount: { type: Number, default: 0 },
        downCount: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
    }],
    lastChecked: { 
        type: Date 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Projects', ProjectsSchema);