const mongoose = require('mongoose');
const Question = require('../models/questions');
const questions = require('../questions.json');
require("dotenv").config();

mongoose.connect(process.env.RUI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function importQuestions() {
    try {
        // Clear existing questions
        await Question.deleteMany({});
        
        // Import new questions
        await Question.insertMany(questions);
        
        console.log('Questions imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing questions:', error);
        process.exit(1);
    }
}

importQuestions(); 