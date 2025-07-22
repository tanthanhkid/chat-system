#!/usr/bin/env node
/**
 * Simple HTTP server for serving test-embedding.html
 * Fixes file:// protocol issues and resource loading
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 5500;
const HOST = 'localhost';

// MIME types mapping
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css', 
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // Try to serve index.html from directory
            const indexPath = path.join(filePath, 'index.html');
            if (fs.existsSync(indexPath)) {
                return serveFile(res, indexPath);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Directory listing not available');
                return;
            }
        }

        const mimeType = getMimeType(filePath);
        const content = fs.readFileSync(filePath);
        
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': content.length,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-cache'
        });
        
        res.end(content);
        
    } catch (error) {
        console.error(`Error serving ${filePath}:`, error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
}

const server = http.createServer((req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let pathname = decodeURIComponent(url.pathname);
        
        // Handle OPTIONS requests (CORS preflight)
        if (req.method === 'OPTIONS') {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end();
            return;
        }

        // Default to test-embedding.html for root
        if (pathname === '/') {
            pathname = '/test-embedding.html';
        }

        // Remove leading slash and resolve file path
        const relativePath = pathname.substring(1);
        const filePath = path.resolve(__dirname, relativePath);
        
        // Security check - ensure file is within project directory
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        console.log(`${req.method} ${req.url} -> ${filePath}`);
        serveFile(res, filePath);
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 Test server running at http://${HOST}:${PORT}/`);
    console.log(`📄 Test page: http://${HOST}:${PORT}/test-embedding.html`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log('');
    console.log('🎯 Widget test instructions:');
    console.log('1. Make sure backend services are running:');
    console.log('   - docker-compose up -d (database)');
    console.log('   - npm run dev:server (chat server)');
    console.log('   - npm run dev:admin (admin interface)');
    console.log('2. Open http://localhost:5500/ in your browser');
    console.log('3. Click User 1 button to test widget loading');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});