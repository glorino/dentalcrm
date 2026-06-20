const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect x="0" y="0" width="1024" height="1024" rx="220" fill="#3b82f6"/>
  <text x="512" y="620" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="380" fill="white" text-anchor="middle">SSV</text>
</svg>`;

async function convert() {
  const outputPath = path.join(__dirname, 'public', 'app-icon.png');
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile(outputPath);
  console.log('Created:', outputPath);
}

convert().catch(console.error);