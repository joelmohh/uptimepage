const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Projects', required: true },
    status: { type: String, enum: ['up', 'down'], required: true },
    responseTime: { type: Number, required: true },
    responseCode: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Checks', CheckSchema)