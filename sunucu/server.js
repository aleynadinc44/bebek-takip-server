const WebSocket = require('ws');
const http = require('http');

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
              if (e.data instanceof Blob) {
                const url = URL.createObjectURL(e.data);
                document.getElementById('cam').src = url;
              }
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

const wss = new WebSocket.Server({ server });

let espSocket = null;
let flutterSockets = new Set();

wss.on('connection', (ws, req) => {
  const url = req.url;

  if (url === '/esp32') {
    console.log('Kamera (ESP32) buluta bağlandı.');
    espSocket = ws;

    // ESP32'den gelen görüntüleri tüm Flutter istemcilerine gönder
    ws.on('message', (message) => {
      flutterSockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });

    ws.on('close', () => {
      console.log('Kamera bağlantısı koptu.');
      espSocket = null;
    });

  } else if (url === '/flutter') {
    console.log('Uygulama (Flutter) buluta bağlandı.');
    flutterSockets.add(ws);

    // Flutter'dan gelen komutları ESP32'ye ilet
    ws.on('message', (message) => {
      if (espSocket && espSocket.readyState === WebSocket.OPEN) {
        espSocket.send(message);
        console.log('Flutter komutu ESP32ye iletildi:', message.toString());
      }
    });

    ws.on('close', () => {
      console.log('Uygulama ayrıldı.');
      flutterSockets.delete(ws);
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
