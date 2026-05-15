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
let cameraEnabled = false; // Sunucu tarafı kamera durumu

wss.on('connection', (ws, req) => {
  const url = req.url;

  if (url === '/esp32') {
    console.log('Kamera (ESP32) buluta bağlandı.');
    espSocket = ws;

    // ESP32'den gelen frame'leri ilet — sadece kamera açıksa
    ws.on('message', (message) => {
      if (!cameraEnabled) return;

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

    // Flutter'dan gelen komutları işle ve ESP32'ye ilet
    ws.on('message', (message) => {
      const msg = message.toString();

      try {
        const json = JSON.parse(msg);

        // Kamera aç/kapat komutu
        if (typeof json.cameraEnabled === 'boolean') {
          cameraEnabled = json.cameraEnabled;
          console.log(`[KOMUT] Kamera durumu: ${cameraEnabled ? 'AÇIK' : 'KAPALI'}`);
        }
      } catch (e) {
        // JSON değilse sessizce geç
      }

      // Komutu ESP32'ye ilet
      if (espSocket && espSocket.readyState === WebSocket.OPEN) {
        espSocket.send(msg);
        console.log('[ESP32] Komut iletildi:', msg);
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
