var http = require('http');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname);
var port = Number(process.env.PORT || 4190);
var mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

http.createServer(function (request, response) {
  var clean = decodeURIComponent(String(request.url || '/').split('?')[0]);
  var target = path.resolve(root, '.' + (clean === '/' ? '/index.html' : clean));
  if (target.indexOf(root) !== 0) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  fs.readFile(target, function (error, body) {
    if (error) {
      if (!path.extname(clean)) {
        fs.readFile(path.join(root, 'index.html'), function (fallbackError, fallback) {
          if (fallbackError) { response.writeHead(404); response.end('Not found'); return; }
          response.writeHead(200, { 'Content-Type': mime['.html'] });
          response.end(fallback);
        });
        return;
      }
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
    response.end(body);
  });
}).listen(port, '127.0.0.1', function () {
  console.log('Atlas Lab V2 running at http://127.0.0.1:' + port + '/');
});
