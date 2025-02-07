const mongoose = require('mongoose');
const Question = require('./models/questions'); // Path to your Question model
const questions = require('./questions.json'); // Import your JSON file

// Connect to MongoDB
mongoose.connect('mongodb+srv://carbon:carbon.cloud.db@clusteraljm.3s6bi.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAljm/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Insert questions into the database
const insertQuestions = async () => {
  try {
    await Question.deleteMany(); // Optional: Clear existing questions
    await Question.insertMany(questions);
    console.log('Questions inserted successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error inserting questions:', err);
    mongoose.disconnect();
  }
};

insertQuestions();