const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const skillsRoutes = require('./routes/skills');
const matchRoutes = require('./routes/matches');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
});

// Routes
// API Routes
console.log('Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes); // Admin routes
console.log('Routes registered successfully');


// Test route
app.get('/', (req, res) => {
    res.send('API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Add this after connecting to MongoDB
mongoose.connection.on('connected', () => {
  console.log('\nMongoDB connected to database:', mongoose.connection.db.databaseName);
});

mongoose.connection.on('disconnected', () => {
  console.log('\nMongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  POST /api/auth/signup');
    console.log('  POST /api/auth/login');
    console.log('  GET /api/users');
    console.log('  GET /api/matches');
    console.log('  GET /api/payments/earnings');
    console.log('  POST /api/matches/request');
    console.log('  GET /api/matches/received');
    console.log('  POST /api/matches/:matchId/accept');
    console.log('  POST /api/matches/:matchId/reject');
    console.log('  POST /api/payments');
    
    // Add route debugging
    console.log('\nRegistered Payment Routes:');
    paymentRoutes.stack.forEach((route) => {
        if (route.route && route.route.path) {
            const methods = Object.keys(route.route.methods).map(method => method.toUpperCase()).join(', ');
            console.log(`  ${methods} ${route.route.path}`);
        }
    });
});