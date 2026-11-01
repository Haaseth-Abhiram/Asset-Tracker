const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'zyllotech-logo.png',
  'zyllotech-full-logo.png'
];

files.forEach((f) => {
  const src = path.join(rootDir, f);
  const dest = path.join(publicDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

console.log('Build completed successfully: Static assets synced to public.');
process.exit(0);
