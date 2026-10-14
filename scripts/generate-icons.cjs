const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

if (!fs.existsSync(svgPath)) {
  console.error('File public/icon.svg tidak ditemukan!');
  process.exit(1);
}

const svgStandard = fs.readFileSync(svgPath);

// Maskable SVG dengan margin safe-zone 15% agar logo tidak terpotong launcher lingkaran Android
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="72" y="72" width="368" height="368" rx="88" fill="url(#badge)" filter="url(#shadow)" stroke="#93c5fd" stroke-width="6" />
    <text x="256" y="295" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="140" fill="#ffffff" text-anchor="middle" letter-spacing="2">PP1</text>
    <text x="256" y="360" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="34" fill="#93c5fd" text-anchor="middle" letter-spacing="6">HR STAFF</text>
  </g>
</svg>
`;

async function generateAll() {
  console.log('Generating PWA icons from SVG...');
  await sharp(Buffer.from(svgStandard)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(Buffer.from(svgStandard)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(Buffer.from(svgStandard)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svgMaskable)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(Buffer.from(svgStandard)).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Seluruh icon PWA berhasil dibuat di folder /public!');
}

generateAll().catch((err) => {
  console.error('Error saat membuat icon:', err);
  process.exit(1);
});
