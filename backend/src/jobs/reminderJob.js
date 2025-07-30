/**
 * This file handles scheduled reminder jobs for the fee management system
 * It uses Node.js setInterval for local development
 * In production, AWS EventBridge will trigger the lambda functions instead
 */
const { checkDueFees } = require('../handlers/fees');

// Initialize scheduled jobs (only used for local development)
const init = () => {
    console.log('Initializing reminder job scheduler...');
    
    // For local development only - run the check every day at 7 AM
    // In production, AWS EventBridge will trigger the Lambda instead
    setInterval(() => {
        const now = new Date();
        // Run at 7:00 AM every day (local time)
        if (now.getHours() === 7 && now.getMinutes() === 0) {
            console.log('Running scheduled fee check...');
            checkDueFees()
                .then(result => console.log('Scheduled fee check completed:', result))
                .catch(err => console.error('Error in scheduled fee check:', err));
        }
    }, 60 * 1000); // Check every minute
    
    // Run once at startup during development to test
    if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - running initial fee check...');
        checkDueFees()
            .then(result => console.log('Initial fee check completed:', result))
            .catch(err => console.error('Error in initial fee check:', err));
    }
};

module.exports = {
    init
};
