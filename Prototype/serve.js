// Tiny static server: node serve.js  ->  http://localhost:5173
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = process.env.PORT || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
http.createServer((req, res) => {
  // list of real sprites dropped into assets/sprites (the game falls back to placeholders for the rest)
  if (req.url.startsWith('/__sprites')) {
    let list = [];
    try { list = fs.readdirSync(path.join(root, 'assets', 'sprites')).filter(f => f.endsWith('.png')); } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(list));
  }
  const p = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[\/\\]+/, '');
  const file = path.join(root, p || 'index.html');
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log('Mine Rush prototype: http://localhost:' + port));
