const User = require('../models/User');
const { uploadVideo } = require('./youtube');

let activeTimeout = null;

async function taskManager() {
    console.log('>>> TASK MANAGER RESTARTED !!!');

    // Clear the existing active timeout if present
    if (activeTimeout) {
        clearTimeout(activeTimeout);
        console.log('Cleared the existing timeout on restart.');
    }

    // Fetch all users
    const users = await User.find();

    let nearestTask = null;
    let nearestTimeDiff = Infinity;

    // Loop over all users and their tasks
    for (const user of users) {
        for (const task of user.tasks) {
            const nextUploadTime = task.nextUploadTime;
            const timeDifference = nextUploadTime - new Date();

            if (timeDifference < 0) {
                // Task's next upload time is in the past, recalculate it
                console.log(`Task for user: ${user.googleId}, task: ${task.taskID} has a past upload time`);
                task.nextUploadTime = calculateNextUploadTime(task.dailyLimit);
                await user.save();
            }

            // Find the task with the nearest future upload time
            if (timeDifference > 0 && timeDifference < nearestTimeDiff) {
                nearestTimeDiff = timeDifference;
                nearestTask = { user, task, timeDifference };
            }
        }
    }

    if (nearestTask) {
        const { user, task, timeDifference } = nearestTask;

        console.log(`Scheduled task for user: ${user.googleId}, task: ${task.taskID} in ${timeDifference}ms`);

        // timeout to upload video at scheduled time
        activeTimeout = setTimeout(async () => {

            console.log(`Uploading video for user: ${user.googleId}, task: ${task.taskID}`);
            const updatedTask = await uploadVideo(user, task);
            const taskIndex = user.tasks.findIndex(t => t.taskID === task.taskID);
            user.tasks[taskIndex] = updatedTask;


            await user.save();
            console.log(`User tasks updated for user: ${user.googleId}`);

            activeTimeout = null;
            taskManager(); // continue the task manager

        }, timeDifference); // Set the timeout for the task's upload
    } else {
        console.log('No valid future tasks to schedule.');
    }
}

module.exports = taskManager;
