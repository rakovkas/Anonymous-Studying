const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();
require('./config/auth');

// Import routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const favoriteRoutes = require('./routes/favorites');
const topicRoutes = require('./routes/topics');

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

const app = express();

// Enable CORS for frontend
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true // Allow cookies to be sent
}));

app.use(express.json());

// Session configuration
app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    name: 'connect.sid', // Be explicit about the cookie name
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // Allow cross-site requests with top-level navigation
        path: '/' // Explicit path setting
    },
    unset: 'destroy' // Ensure complete removal on req.session.destroy()
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Home route
app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');
});

// Mount auth routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // Also mount under /api for frontend API calls

// Special route for Google callback - this must match exactly what's registered in Google Cloud Console
app.get('/google/callback', passport.authenticate('google', {
    failureRedirect: 'http://localhost:5173/login',
    session: true
}), (req, res) => {
    // Successful authentication, redirect to frontend callback route
    res.redirect('http://localhost:5173/auth/callback');
});

// Protected route example
app.get('/protected', isLoggedIn, (req, res) => {
    res.json({
        message: "You're authenticated!",
        user: {
            id: req.user.id,
            username: req.user.username
        }
    });
});

// API routes for tickets, replies, etc.
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/topics', topicRoutes);
// app.use('/api/replies', replyRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});