const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Add global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Simple chat API that doesn't use OpenAI
app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log('Received message:', message);
        
        // Send a simple response
        res.json({ 
            response: `This is a fallback response. You said: "${message}"`,
            fallback: true
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'An unexpected error occurred on the server.'
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
try {
    const server = app.listen(PORT, () => {
        console.log(`Simple server running on http://localhost:${PORT}`);
    });
    
    // Keep the server running
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
} catch (error) {
    console.error('Error starting server:', error);
} 