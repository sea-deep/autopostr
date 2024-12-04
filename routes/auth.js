require('dotenv').config();

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const router = express.Router();


const env = process.env.ENVIRONMENT;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.URL + "/auth/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        const userName = profile.displayName || 'noname';

        if (!user) {
            user = await User.create({
                googleId: profile.id,
                name: userName,
                email: profile.emails[0].value,
                accessToken,
                refreshToken,
            });
        } else {
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});


router.get('/', (req, res) => {
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/drive.readonly',
            //  'offline'
        ],
        accessType: 'offline', prompt: 'consent'
    })(req, res);
});


router.get('/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/dashboard');
});


router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ loggedIn: true, name: req.user.name });
    } else {
        res.json({ loggedIn: false });
    }
});


module.exports = router;
