/**
 * AgroPOS Dev Server
 * - Serve static files từ thư mục hiện tại
 * - Hot reload: client tự F5 khi file thay đổi (SSE)
 * - Chạy: node server.js
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const DIR  = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── SSE clients đang chờ reload ──
const sseClients = new Set();

// ── Watch toàn bộ thư mục, debounce 300ms ──
let debounce;
fs.watch(DIR, { recursive: true }, (event, filename) => {
  if (!filename || filename.includes('node_modules')) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`[reload] ${filename} changed`);
    sseClients.forEach(res => {
      res.write('data: reload\n\n');
    });
  }, 300);
});

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  // SSE endpoint cho hot reload
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // Static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(DIR, urlPath);
  const ext      = path.extname(filePath).toLowerCase();
  const mime     = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback về app chính
      fs.readFile(path.join(DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(injectReload(d2.toString()));
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': mime });
    // Inject hot-reload script vào HTML
    if (ext === '.html') {
      res.end(injectReload(data.toString()));
    } else {
      res.end(data);
    }
  });
});

// ── Inject đoạn JS vào trước </body> ──
function injectReload(html) {
  const script = `
<script>
(function(){
  const es = new EventSource('/__reload');
  es.onmessage = e => { if(e.data === 'reload') location.reload(); };
  es.onerror   = () => { es.close(); setTimeout(()=>location.reload(), 2000); };
  console.log('[AgroPOS] Hot reload enabled');
})();
</script>`;
  return html.replace('</body>', script + '\n</body>');
}

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅  AgroPOS đang chạy tại:');
  console.log(`  👉  http://localhost:${PORT}`);
  console.log('');
  console.log('  🔄  Hot reload BẬT – sửa file rồi nhấn Lưu, trình duyệt tự reload');
  console.log('  📂  Thư mục:', DIR);
  console.log('');
});
