const express = require('express');
const path = require('path');

const app = express();
const PORT = 5500;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve test embedding page
app.get('/test-embedding.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-embedding.html'));
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Widget test page: http://localhost:${PORT}/test-embedding.html`);
});