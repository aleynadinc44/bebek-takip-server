const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bebek Takip WebSocket Sunucusu Aktif!\n');
});

const wss = new WebSocket.Server({ server });

let espSocket = null;
let flutterSockets = new Set();

wss.on('connection', (ws, req) => {
    const url = req.url;
    if (url === '/esp32') {
        console.log('Kamera (ESP32) buluta bağlandı.');
        espSocket = ws;
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
    } 
    else if (url === '/flutter') {
        console.log('Uygulama (Flutter) buluta bağlandı.');
        flutterSockets.add(ws);
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
