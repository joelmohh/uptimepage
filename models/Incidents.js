const mongoose = require('mongoose');

const incidentsSchema = new mongoose.Schema({
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Projects', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['downtime', 'maintenance'], 
        required: true 
    },
    description: { 
        type: String 
    },
    startTime: { 
        type: Date, 
        required: true 
    },
    endTime: { 
        type: Date 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Incidents', incidentsSchema);