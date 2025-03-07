const express = require('express');
const app = express();
const PORT = 3001; // Using a different port

// Basic route
app.get('/', (req, res) => {
    res.send('Hello World! This is a minimal server.');
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Minimal server running at http://localhost:${PORT}`);
});

// Keep the process running
process.stdin.resume(); 