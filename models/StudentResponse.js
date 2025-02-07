const mongoose = require("mongoose");

const studentResponseSchema = new mongoose.Schema({
    uname: {
        type: String,
        required: true
    },
    answers: [{
        questionId: Number,
        selectedAnswer: String,
        correct: Boolean,
        timeSpent: Number // Time spent on each question in seconds
    }],
    score: Number,
    totalQuestions: Number,
    submittedAt: {
        type: Date,
        default: Date.now
    },
    testDuration: Number, // Total time taken in seconds
    accuracy: Number, // Percentage of correct answers
    performance: {
        easy: Number, // Score in easy questions
        medium: Number, // Score in medium questions
        hard: Number // Score in hard questions
    }
});

// Add virtual for calculating percentage
studentResponseSchema.virtual('percentage').get(function() {
    return ((this.score / this.totalQuestions) * 100).toFixed(2);
});

// Add method to calculate performance metrics
studentResponseSchema.methods.calculateMetrics = function() {
    this.accuracy = (this.score / this.totalQuestions) * 100;
    
    // Calculate performance by difficulty
    const difficultyScores = {
        easy: { total: 0, correct: 0 },
        medium: { total: 0, correct: 0 },
        hard: { total: 0, correct: 0 }
    };
    
    this.answers.forEach(answer => {
        // You'll need to add difficulty to your questions model
        // This is just a placeholder
        const difficulty = 'medium';
        difficultyScores[difficulty].total++;
        if (answer.correct) {
            difficultyScores[difficulty].correct++;
        }
    });
    
    this.performance = {
        easy: (difficultyScores.easy.correct / difficultyScores.easy.total) * 100 || 0,
        medium: (difficultyScores.medium.correct / difficultyScores.medium.total) * 100 || 0,
        hard: (difficultyScores.hard.correct / difficultyScores.hard.total) * 100 || 0
    };
};

const StudentResponse = mongoose.model('StudentResponse', studentResponseSchema);
module.exports = StudentResponse;