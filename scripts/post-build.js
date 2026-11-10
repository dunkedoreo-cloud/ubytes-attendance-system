import fs from 'fs';

// 1. Copy dist/index.html to root index.html and 404.html (for GitHub Pages root hosting)
if (fs.existsSync('dist/index.html')) {
  fs.copyFileSync('dist/index.html', 'index.html');
  fs.copyFileSync('dist/index.html', '404.html');
}

// 2. Copy dist/assets to ./assets
if (fs.existsSync('dist/assets')) {
  fs.cpSync('dist/assets', 'assets', { recursive: true, force: true });
}

// 3. Copy dist/ to docs/
if (fs.existsSync('dist')) {
  fs.cpSync('dist', 'docs', { recursive: true, force: true });
}
console.log('Successfully synchronized compiled assets to root index.html, 404.html, assets/, and docs/!');
