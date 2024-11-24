const User = require('../models/User');
const { uploadVideo } = require('./youtube');

let activeTimeout = null;

async function taskManager() {
    console.log('>>> TASK MANAGER RESTARTED !!!');

    // Step 1: Clear the existing active timeout
    if (activeTimeout) {
        clearTimeout(activeTimeout);
        console.log('Cleared the existing timeout on restart.');
    }

    // Step 2: Get all users
    const users = await User.find();

    // Step 3: Find the task with the earliest future upload time
    let nearestTask = null;
    let nearestTimeDiff = Infinity;

    for (const user of users) {
        for (const task of user.tasks) {
            const nextUploadTime = task.nextUploadTime;
            const timeDifference = nextUploadTime - new Date();

            // For only positive time in the future, past will be ignored
            if (timeDifference > 0 && timeDifference < nearestTimeDiff) {
                nearestTimeDiff = timeDifference;
                nearestTask = { user, task, timeDifference };
            }
        }
    }

    // Step 4: If we found a valid future task, schedule it
    if (nearestTask) {
        const { user, task, timeDifference } = nearestTask;

        console.log(`Scheduled task for user: ${user.googleId}, task: ${task.taskID} in ${timeDifference}ms`);

        // Set a timeout to execute the task at the scheduled time
        activeTimeout = setTimeout(async () => {
            try {
                console.log(`Uploading video for user: ${user.googleId}, task: ${task.taskID}`);
                const updatedTask = await uploadVideo(user, task);

                if (!updatedTask) {
                    // Remove the task if it's no longer valid (like if it's deleted or doesn't need to be re-uploaded)
                    user.tasks = user.tasks.filter(t => t.taskID !== task.taskID);
                } else {
                    // Update the task if necessary
                    const taskIndex = user.tasks.findIndex(t => t.taskID === task.taskID);
                    user.tasks[taskIndex] = updatedTask;
                }

                await user.save();

                // After task completion, re-run the task manager to find the next task
                taskManager();
            } catch (error) {
                console.error('Error during video upload:', error);
            } finally {
                // Clean up the timeout entry
                activeTimeout = null;
            }
        }, timeDifference);
    } else {
        console.log('No valid future tasks to schedule.');
    }
}

module.exports = taskManager;
