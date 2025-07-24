const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const server = http.createServer((req, res) => {
    let filePath = '';
    
    // Route handling
    if (req.url === '/' || req.url === '/index.html') {
        // Create index page with links to all designs
        const indexHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Interface Design Prototypes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
            text-align: center;
            margin-bottom: 40px;
            font-size: 2.5rem;
            font-weight: 300;
        }
        
        .designs {
            display: grid;
            gap: 30px;
            margin-top: 30px;
        }
        
        .design-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .design-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            background: rgba(255, 255, 255, 0.15);
        }
        
        .design-card h2 {
            color: #1e9df1;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        
        .design-card p {
            margin-bottom: 20px;
            opacity: 0.9;
        }
        
        .design-card .features {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        
        .design-card .features li {
            padding: 5px 0;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        .design-card .features li::before {
            content: '✨ ';
            margin-right: 8px;
        }
        
        .view-button {
            background: #1e9df1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-top: 15px;
        }
        
        .view-button:hover {
            background: #1d4ed8;
            transform: scale(1.05);
        }
        
        .note {
            background: rgba(251, 191, 36, 0.2);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: center;
        }
        
        .note strong {
            color: #fbbf24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Admin Interface Design Prototypes</h1>
        <p style="text-align: center; font-size: 1.1rem; opacity: 0.9;">
            Chọn một trong 6 thiết kế độc đáo để xem trước giao diện admin chat
        </p>
        
        <div class="designs">
            <div class="design-card" onclick="window.open('/design1', '_blank')">
                <h2>🌟 Design 1: Floating Glass Cards</h2>
                <p>Giao diện ethereal với các thẻ nổi 3D và hiệu ứng glass-morphism</p>
                <ul class="features">
                    <li>Thẻ hội thoại nổi với hiệu ứng parallax</li>
                    <li>Glass-morphism với backdrop blur</li>
                    <li>Navigation dạng orb với animations</li>
                    <li>Physics-inspired hover effects</li>
                </ul>
                <a href="/design1" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
            
            <div class="design-card" onclick="window.open('/design2', '_blank')">
                <h2>💻 Design 2: Command Terminal Zen</h2>
                <p>Interface lấy cảm hứng từ terminal với thẩm mỹ command-line hiện đại</p>
                <ul class="features">
                    <li>Terminal aesthetic với monospace typography</li>
                    <li>Command-line inspired interactions</li>
                    <li>Syntax highlighting cho message types</li>
                    <li>ASCII-art status indicators</li>
                </ul>
                <a href="/design2" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
            
            <div class="design-card" onclick="window.open('/design3', '_blank')">
                <h2>🎋 Design 3: Zen Garden Focus</h2>
                <p>Thiết kế ultra-minimal lấy cảm hứng từ vườn zen Nhật Bản</p>
                <ul class="features">
                    <li>Maximum whitespace utilization</li>
                    <li>Single conversation focus</li>
                    <li>Organic animations (breathing, ripples)</li>
                    <li>Mindful interaction patterns</li>
                </ul>
                <a href="/design3" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
            
            <div class="design-card" onclick="window.open('/design2a', '_blank')">
                <h2>🌈 Design 2A: Cyberpunk Neon Terminal</h2>
                <p>Terminal 80s cyberpunk với neon glow và hiệu ứng scanlines</p>
                <ul class="features">
                    <li>Hot magenta + electric cyan color scheme</li>
                    <li>Retro 80s aesthetic với CRT effects</li>
                    <li>Glitchy text effects và holographic styling</li>
                    <li>Animated neon borders và pulsing backgrounds</li>
                </ul>
                <a href="/design2a" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
            
            <div class="design-card" onclick="window.open('/design2b', '_blank')">
                <h2>💚 Design 2B: Matrix Hacker Terminal</h2>
                <p>Terminal lấy cảm hứng từ phim "Matrix" với digital rain effect</p>
                <ul class="features">
                    <li>Matrix green color scheme với phosphor glow</li>
                    <li>Falling digital rain background animation</li>
                    <li>Glitchy transitions và terminal boot sequences</li>
                    <li>Japanese katakana characters effects</li>
                </ul>
                <a href="/design2b" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
            
            <div class="design-card" onclick="window.open('/design2c', '_blank')">
                <h2>🧡 Design 2C: Retro Amber Terminal</h2>
                <p>Terminal vintage computer từ thập niên 80s với amber phosphor</p>
                <ul class="features">
                    <li>Warm amber color scheme với CRT monitor styling</li>
                    <li>VT323 pixelated fonts với scan effects</li>
                    <li>Phosphor burn effects và CRT bezel design</li>
                    <li>DOS-style commands và retro boot sequence</li>
                </ul>
                <a href="/design2c" target="_blank" class="view-button">Xem Thiết Kế →</a>
            </div>
        </div>
        
        <div class="note">
            <strong>📝 Lưu ý:</strong> Designs 1-3 duy trì chủ đề màu xanh dashboard (#1e9df1). 
            Terminal variants 2A-2C sử dụng color schemes sáng tạo (cyberpunk neon, matrix green, retro amber). 
            Tất cả đều tích hợp đầy đủ chức năng chat real-time với localization tiếng Việt.
        </div>
    </div>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexHtml);
        return;
    }
    
    // Handle design routes
    if (req.url === '/design1') {
        filePath = path.join(__dirname, 'design1-floating-glass.html');
    } else if (req.url === '/design2') {
        filePath = path.join(__dirname, 'design2-terminal-zen.html');
    } else if (req.url === '/design3') {
        filePath = path.join(__dirname, 'design3-zen-garden.html');
    } else if (req.url === '/design2a') {
        filePath = path.join(__dirname, 'design2a-cyberpunk-terminal.html');
    } else if (req.url === '/design2b') {
        filePath = path.join(__dirname, 'design2b-matrix-terminal.html');
    } else if (req.url === '/design2c') {
        filePath = path.join(__dirname, 'design2c-retro-amber-terminal.html');
    } else if (req.url === '/design2a-mobile') {
        filePath = path.join(__dirname, 'design2a-cyberpunk-mobile.html');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1><p><a href="/">← Back to Index</a></p>');
        return;
    }
    
    // Serve the HTML file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Internal Server Error</h1><p>Could not read file</p>');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log(`🎨 Design prototypes server running at:`);
    console.log(`📋 Index: http://localhost:${port}`);
    console.log(`🌟 Design 1: http://localhost:${port}/design1`);
    console.log(`💻 Design 2: http://localhost:${port}/design2`);
    console.log(`🎋 Design 3: http://localhost:${port}/design3`);
    console.log(`🌈 Design 2A: http://localhost:${port}/design2a`);
    console.log(`💚 Design 2B: http://localhost:${port}/design2b`);
    console.log(`🧡 Design 2C: http://localhost:${port}/design2c`);
    console.log(`📱 Design 2A Mobile: http://localhost:${port}/design2a-mobile`);
    console.log(`\n✨ Open http://localhost:${port} in your browser to view all designs!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down design server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});