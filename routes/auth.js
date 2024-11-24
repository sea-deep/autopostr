const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const router = express.Router();

// Google OAuth Strategy Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/callback", 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        const userName = profile.displayName || 'noname';

        if (!user) {
            // If the user doesn't exist, create a new one
            user = await User.create({
                googleId: profile.id,
                name: userName,
                email: profile.emails[0].value,
                accessToken, // Save the accessToken
                refreshToken, // Save the refreshToken
            });
        } else {
            // If the user exists, update the tokens
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
    console.log('Redirecting to Google OAuth');
    passport.authenticate('google', {
        scope: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtubepartner',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ]
    })(req, res);  // Fix the syntax here
});

// Google OAuth callback route
router.get('/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/dashboard');  // On success, redirect to dashboard
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

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router;
