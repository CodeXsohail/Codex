const testSchedule = require('../config/testConfig');

const checkTestAccess = (req, res, next) => {
    const now = new Date();
    const testStart = new Date(testSchedule.startTime);
    const testEnd = new Date(testSchedule.endTime);

    // Store test timing in res.locals for use in templates
    res.locals.testTiming = {
        hasStarted: now >= testStart,
        hasEnded: now >= testEnd,
        startTime: testStart,
        endTime: testEnd,
        currentTime: now
    };

    if (req.path === '/test') {
        if (now < testStart) {
            return res.render('waitingRoom', {
                message: 'Test has not started yet',
                startTime: testStart
            });
        }
        
        if (now > testEnd) {
            return res.render('testClosed', {
                message: 'Test submission window has closed'
            });
        }
    }

    next();
};

module.exports = checkTestAccess; 