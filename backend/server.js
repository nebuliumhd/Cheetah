const express = require('express');
const path = require('path');

const app = express();
const PORT = 80;

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route (Express 4.x compatible)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
