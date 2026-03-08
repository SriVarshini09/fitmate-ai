const fs = require('fs');

fs.mkdirSync('public/icons', { recursive: true });

function svgIcon(size) {
  const r = Math.round(size * 0.2);
  const p = (x, y) => (size * x).toFixed(1) + ',' + (size * y).toFixed(1);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">',
    '  <rect width="' + size + '" height="' + size + '" rx="' + r + '" fill="#1a1a0e"/>',
    '  <polygon points="' + [p(0.58,0.08), p(0.28,0.52), p(0.48,0.52), p(0.42,0.92), p(0.72,0.48), p(0.52,0.48)].join(' ') + '" fill="#a8e32a"/>',
    '</svg>'
  ].join('\n');
}

// Write SVGs (vite-plugin-pwa can use these if we reference them, but we need PNG)
fs.writeFileSync('public/icons/icon-192.svg', svgIcon(192));
fs.writeFileSync('public/icons/icon-512.svg', svgIcon(512));

// Try to convert using sharp if available
try {
  const sharp = require('sharp');
  sharp(Buffer.from(svgIcon(192))).resize(192,192).png().toFile('public/icons/icon-192.png', () => {});
  sharp(Buffer.from(svgIcon(512))).resize(512,512).png().toFile('public/icons/icon-512.png', () => {});
  console.log('PNG icons created via sharp');
} catch(e) {
  // Copy favicon.ico as placeholder PNG — vite-plugin-pwa will still work
  fs.copyFileSync('public/favicon.ico', 'public/icons/icon-192.png');
  fs.copyFileSync('public/favicon.ico', 'public/icons/icon-512.png');
  console.log('PNG icons created from favicon (sharp not available)');
}
