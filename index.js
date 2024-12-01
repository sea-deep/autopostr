require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');  // Import MongoStore
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const taskManager = require('./helpers/taskManager');
const path = require('path');
const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGO_URI);

// Session middleware with MongoDB store
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,  // Use the same MongoDB URI for session storage
        collectionName: 'sessions',       // Session collection name in MongoDB
        ttl: 14 * 24 * 60 * 60,           // Session TTL (Time To Live) in seconds (14 days)
    })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/dashboard', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'dashboard.html');
    res.sendFile(filePath);
});

app.get('/legal', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'legal.html');
    res.sendFile(filePath);
});

app.get('/repo', async (req, res) => {
    res.redirect('https://github.com/sea-deep/autopostr')
});

app.use((req, res) => {
    const filePath = path.join(__dirname, 'public', '404.html');
    res.status(404).sendFile(filePath);
});



taskManager();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
