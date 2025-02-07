const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMath = require("ejs-mate");
const User = require("./models/users.js");
const Question = require("./models/questions.js");
const StudentResponse = require("./models/StudentResponse.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const bodyParser = require('body-parser');
const checkTestAccess = require('./middleware/testAccess');
const testSchedule = require('./config/testConfig');


require("dotenv").config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'public')));


app.engine("ejs", ejsMath);

// Add session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.RUI,
        ttl: 24 * 60 * 60 // Session TTL (1 day)
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true
    }
}));

// Add this after your session middleware but before your routes
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Move the currentUser middleware BEFORE your routes
// Place this right after your session middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
     next();
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

main().then((res) => {
    console.log("connected to database");
}).catch((err) => {
    console.log(err);
});
async function main() {
    await mongoose.connect(process.env.RUI);
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Listening on port 3000...");
});

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render("login.ejs", { error: null, success: null });
});


app.get("/events", (req, res) => {
    res.render("events.ejs");
});

app.get("/practice", (req, res) => {
    res.render("practice.ejs"); // Pass ls as an object property
});


app.get('/result/:uname', async (req, res) => {
  const { uname } = req.params;

  try {
    // Fetch both the student's result and user details
    const [studentResult, user] = await Promise.all([
      StudentResponse.findOne({ uname }),
      User.findOne({ uname })
    ]);

    if (!studentResult || !user) {
      return res.status(404).send('Result not found for the specified user.');
    }

    // Construct full name from user data
    const fullName = `${user.fname} ${user.lname}`;

    // Fetch the total number of questions for calculating the maximum score
    const totalQuestions = await Question.countDocuments();

    const percentage = ((studentResult.score / totalQuestions) * 100).toFixed(2);

    // Render the result page with full name and roll number
    res.render('result', {
      uname: fullName,
      roll: user.roll, // Add roll number
      score: studentResult.score,
      maxScore: totalQuestions,
      percentage,
    });
  } catch (err) {
    console.error('Error fetching result:', err);
    res.status(500).send('Internal server error');
  }
});


app.get('/test', requireAuth, async (req, res) => {
    try {
        // Get user data from session
        const { uname, name } = req.session.user;
        console.log('User session data:', req.session.user);

        // Fetch user data from database to get roll number
        const user = await User.findOne({ uname });
        const roll = user ? user.roll : '';
        
        // Fetch questions
        const questions = await Question.find({}).select('-answer').lean();
        console.log(`Fetched ${questions.length} questions from database`);

        if (questions.length === 0) {
            console.error('No questions found in database');
            return res.redirect('/dashboard');
        }

        res.render('test', { 
            questions,
            uname: uname,
            fullName: name,  // Use the name from session
            roll: roll      // Use roll from database
        });
    } catch (error) {
        console.error('Error loading test:', error);
        res.redirect('/dashboard');
    }
});


app.post("/checkuser", async (req, res) => {
    const { uname, roll } = req.body;

    try {
        const user = await User.findOne({ uname, roll });
        if (!user) {
            console.log('User not found:', uname); // Debug log
            return res.render("login.ejs", { 
                error: "Invalid username or roll number!", 
                success: null 
            });
        }

        // Set complete user session data
        req.session.user = {
            id: user._id,
            uname: user.uname,
            fname: user.fname,
            lname: user.lname,
            roll: user.roll,
            name: `${user.fname} ${user.lname}`
        };
        
        console.log('Session set:', req.session.user); // Debug log

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render("login.ejs", { 
                    error: "An error occurred. Please try again.", 
                    success: null 
                });
            }
            console.log('Session saved successfully'); // Debug log
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error("Login error:", error);
        res.render("login.ejs", { 
            error: "An error occurred. Please try again.", 
            success: null 
        });
    }
});


app.post('/submit', async (req, res) => {
    const testEnd = new Date(testSchedule.endTime);
    if (new Date() > testEnd) {
        return res.status(400).json({ 
            error: 'Test submission window has closed' 
        });
    }
    
    const { uname, rcode, answers } = req.body;

    // Debugging: Log received data
    console.log('Received data:', req.body);

    // Input validation
    if (!uname || !rcode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Invalid or missing answers data' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ uname });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for existing submission
        const existingSubmission = await StudentResponse.findOne({ uname });
        if (existingSubmission) {
            return res.status(400).json({ error: 'You have already submitted the test' });
        }

        // Fetch questions and calculate score
        const questions = await Question.find();
        let score = 0;
        const processedAnswers = [];

        // Calculate score and store processed answers
        questions.forEach((question) => {
            const studentAnswer = answers.find((a) => a.questionId === question.id);
            if (studentAnswer) {
                processedAnswers.push({
                    questionId: question.id,
                    selectedAnswer: studentAnswer.selectedAnswer,
                    correct: studentAnswer.selectedAnswer === question.answer
                });
                if (studentAnswer.selectedAnswer === question.answer) {
                    score++;
                }
            }
        });

        // Save response
        const studentResult = new StudentResponse({
            uname,
            answers: processedAnswers,
            score,
            submittedAt: new Date(),
            totalQuestions: questions.length
        });
        await studentResult.save();

        res.json({ 
            success: true, 
            redirectUrl: `/result/${uname}` 
        });
    } catch (err) {
        console.error('Error processing submission:', err);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});


// Secret registration route (no public links to this)
app.get("/register/:secretKey", async (req, res) => {
    const { secretKey } = req.params;
    // Use a secure secret key - in production this should be in env variables
    if (secretKey !== "silicon2024") {
        return res.status(404).send("Page not found");
    }
    res.render("register.ejs", { message: "" });
});

app.post("/register/:secretKey", async (req, res) => {
    const { secretKey } = req.params;
    if (secretKey !== "silicon2024") {
        return res.status(404).send("Page not found");
    }

    const { fname, lname, uname, roll } = req.body;

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ uname });
        if (existingUser) {
            return res.render("register.ejs", { 
                message: "Username already exists!" 
            });
        }

        // Create new user
        const newUser = new User({
            fname,
            lname,
            uname,
            roll
        });
        await newUser.save();
        res.render("register.ejs", { 
            message: "Registration successful! User can now login." 
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.render("register.ejs", { 
            message: "Error during registration. Please try again." 
        });
    }
});

// Add logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Update dashboard route with logging
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const existingSubmission = await StudentResponse.findOne({ uname: req.session.user.uname });
        const now = new Date();
        const testStart = new Date(testSchedule.startTime);
        const testEnd = new Date(testSchedule.endTime);

        res.render('loggedHome', { 
            rcode: req.session.user.name,
            uname: req.session.user.uname,
            hasSubmitted: !!existingSubmission,
            testStatus: {
                hasStarted: now >= testStart,
                hasEnded: now >= testEnd,
                startTime: testStart,
                endTime: testEnd
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/login');
    }
});

// Add a route to handle test access
app.get('/start-test', requireAuth, async (req, res) => {
    try {
        const now = new Date();
        const testStart = new Date(testSchedule.startTime);
        const testEnd = new Date(testSchedule.endTime);
        
        // Check if user has already submitted
        const existingSubmission = await StudentResponse.findOne({ 
            uname: req.session.user.uname 
        });

        if (existingSubmission) {
            return res.redirect(`/result/${req.session.user.uname}`);
        }

        // If test hasn't started, show waiting room
        if (now < testStart) {
            return res.render('waitingRoom', {
                startTime: testStart
            });
        }

        // If test has ended
        if (now > testEnd) {
            return res.render('testClosed', {
                message: 'Test submission window has closed'
            });
        }

        // If test is ongoing, redirect to test page
        res.redirect('/test');
    } catch (error) {
        console.error('Error accessing test:', error);
        res.redirect('/dashboard');
    }
});

// Add this route for testing (remove in production)
app.get("/add-test-questions", async (req, res) => {
    try {
        const sampleQuestions = [
            {
                id: 1,
                question: "What is the output of console.log(typeof [])?",
                options: ["array", "object", "undefined", "null"],
                answer: "object"
            },
            {
                id: 2,
                question: "Which method is used to add elements to the end of an array?",
                options: ["push()", "pop()", "shift()", "unshift()"],
                answer: "push()"
            },
            // Add more questions as needed
        ];

        await Question.deleteMany({}); // Clear existing questions
        await Question.insertMany(sampleQuestions);
        res.send("Test questions added successfully!");
    } catch (error) {
        res.status(500).send("Error adding test questions: " + error.message);
    }
});

// Add the middleware to your app
app.use(checkTestAccess);
