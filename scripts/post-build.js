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

// 4. Copy public/ images directly to root (so GitHub Pages root hosting can find ubytes_logo.png, default_avatar.jpg, etc.)
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  for (const file of publicFiles) {
    fs.copyFileSync(`public/${file}`, file);
  }
}
console.log('Successfully synchronized compiled assets to root index.html, 404.html, assets/, public root files, and docs/!');
