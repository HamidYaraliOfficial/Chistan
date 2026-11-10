#!/usr/bin/env node
/*
 * Tiny static file server for local play:  npm start   (or: node tools/serve.js [port])
 * The game also works by simply opening index.html in a browser.
 */
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var port = parseInt(process.argv[2] || process.env.PORT, 10) || 8080;
var types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'
};

http.createServer(function (req, res) {
  var url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url.slice(-1) === '/') url += 'index.html';
  var file = path.normalize(path.join(root, url));
  if (file.indexOf(root + path.sep) !== 0 && file !== root) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, function () {
  console.log('Chistan is running at http://localhost:' + port + '  (Ctrl+C to stop)');
});
