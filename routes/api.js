const express = require('express');
const router = express.Router();
const User = require('../models/User');
const taskManager = require('../helpers/taskManager');
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}



router.post('/addtask', isAuthenticated, async (req, res) => {
    const { task } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task content is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // add the task in tasks array
        user.tasks.push(task);
        await user.save();
        taskManager();
        res.json({ success: true, message: 'Task added', tasks: user.tasks });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/viewtasks', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'ok', tasks: user.tasks });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.delete('/deletetask', isAuthenticated, async (req, res) => {
    const { taskID } = req.body;
    if (!taskID) {
        return res.status(400).json({ error: 'taskID is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        const taskIndex = user.tasks.findIndex(task => task.taskID === taskID);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task with specified taskID not found' });
        }

        // Remove the task from the tasks array
        user.tasks.splice(taskIndex, 1);
        await user.save();
        taskManager();
        res.json({ success: true, message: 'Task deleted', tasks: user.tasks });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
