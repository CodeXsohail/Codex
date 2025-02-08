const mongoose = require('mongoose');

const activeSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one active session per user
activeSessionSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('ActiveSession', activeSessionSchema); 