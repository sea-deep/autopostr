const User = require('../models/User');
const { uploadVideo } = require('./youtube');

let activeTimeout = null;

const taskManager = async () => {
    try {
        const users = await User.find({ 'tasks.0': { $exists: true } });

        for (const user of users) {
            for (const task of user.tasks) {
                const timeDifference = new Date(task.nextUploadTime) - Date.now();

                if (timeDifference <= 0) {
                    const execution = await executeTask(task);

                    const taskIndex = user.tasks.findIndex(t => t.taskID === task.taskID);
                    if (!execution) {
                        user.tasks.splice(taskIndex, 1); // Remove the task if execution failed
                    } else {
                        user.tasks[taskIndex] = execution; // Update the task with the new execution details
                    }

                    await user.save();
                } else {
                    setTimeout(async () => {
                        const execution = await executeTask(task);

                        const taskIndex = user.tasks.findIndex(t => t.taskID === task.taskID);
                        if (!execution) {
                            user.tasks.splice(taskIndex, 1); // Remove the task if execution failed
                        } else {
                            user.tasks[taskIndex] = execution; // Update the task with the new execution details
                        }

                        await user.save();

                        activeTimeout = null;
                        taskManager(); // Continue the task manager

                    }, timeDifference); // Set the timeout for the task's upload
                }
            }
        }
    } catch (error) {
        console.error('Error in taskManager:', error);
    }
};

module.exports = taskManager;
