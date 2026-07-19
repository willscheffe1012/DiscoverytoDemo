import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] || '.';
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.map': 'application/json' };

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const safePath = normalize(url.pathname).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath);
  const target = existsSync(filePath) ? filePath : join(root, 'index.html');
  response.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream');
  createReadStream(target).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Discovery to Demo running at http://localhost:${port}`);
});
