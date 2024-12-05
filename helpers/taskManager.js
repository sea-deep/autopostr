const User = require('../models/User');
const { uploadVideo } = require('./youtube');

let activeTimeout = null;

const taskManager = async () => {
    try {
        const users = await User.find({ 'tasks.0': { $exists: true } });

        for (const user of users) {
            for (const task of user.tasks) {
                const timeDifference = new Date(task.nextUploadTime) - Date.now();

            if (timeDifference < 0) {
                // Task's next upload time is in the past, recalculate it
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


        // timeout to upload video at scheduled time
        activeTimeout = setTimeout(async () => {
            const updatedTask = await uploadVideo(user, task);
            const taskIndex = user.tasks.findIndex(t => t.taskID === task.taskID);
            user.tasks[taskIndex] = updatedTask;


            await user.save();
     
            activeTimeout = null;
            taskManager(); // continue the task manager

                    }, timeDifference); // Set the timeout for the task's upload
                }
            }
        }
    } catch (error) {
        console.error('Error in taskManager:', error);
    }
};

module.exports = taskManager;
