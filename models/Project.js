const mongoose = require('mongoose');

const ProjectsSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
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
    status: { 
        type: String, 
        enum: ['up', 'down'], 
        default: 'down' 
    },
    lastChecked: { 
        type: Date 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Projects', ProjectsSchema);