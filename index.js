require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const taskManager = require('./helpers/taskManager');
const path = require('path');
const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGO_URI);

app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/dashboard', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'dashboard.html');
    res.sendFile(filePath);
});

taskManager();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
