const sharp = require('sharp');
const path = require('path');

const srcDir = 'D:\\A Conquista de Alderys\\Ia 3d models\\Orc warrior\\better';
const destDir = path.join(__dirname, '..', 'public', 'dev-models', 'orc-warrior-optimized');

const files = [
  'texture_pbr_20250901.png',
  'texture_pbr_20250901_metallic.png',
  'texture_pbr_20250901_normal.png',
  'texture_pbr_20250901_roughness.png'
];

(async () => {
  const fs = require('fs');
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    const before = fs.statSync(srcPath).size;
    await sharp(srcPath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 85 })
      .toFile(destPath);
    const after = fs.statSync(destPath).size;
    console.log(`${file}: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
