import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

rmSync('dist', { recursive: true, force: true });
execFileSync('tsc', { stdio: 'inherit' });
mkdirSync('dist/src', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
copyFileSync('src/styles.css', 'dist/src/styles.css');
