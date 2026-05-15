const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="background:black;margin:0">
          <img id="cam" style="width:100%;height:100vh;object-fit:contain"/>
          <script>
            const ws = new WebSocket('wss://bebek-takip-server.onrender.com/flutter');
            ws.binaryType = 'blob';
            ws.onmessage = (e) => {
              const url = URL.createObjectURL(e.data);
              document.getElementById('cam').src = url;
            };
          </script>
        </body>
      </html>
    `);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sunucu Aktif!\n');
  }
});
