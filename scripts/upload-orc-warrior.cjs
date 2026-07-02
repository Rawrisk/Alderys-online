const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const srcDir = path.join(__dirname, '..', 'public', 'dev-models', 'orc-warrior-optimized');
const prefix = 'orc-warrior-optimized';
const oneYear = 60 * 60 * 24 * 365;

const files = [
  { name: 'model.obj', contentType: 'model/obj' },
  { name: 'material.mtl', contentType: 'text/plain' },
  { name: 'texture_pbr_20250901.png', contentType: 'image/png' },
  { name: 'texture_pbr_20250901_metallic.png', contentType: 'image/png' },
  { name: 'texture_pbr_20250901_normal.png', contentType: 'image/png' },
  { name: 'texture_pbr_20250901_roughness.png', contentType: 'image/png' }
];

(async () => {
  const urls = {};
  for (const file of files) {
    const filePath = path.join(srcDir, file.name);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `${prefix}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('3d')
      .upload(storagePath, buffer, { contentType: file.contentType, upsert: true });

    if (uploadError) {
      console.error(`Upload failed for ${file.name}:`, uploadError.message);
      continue;
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from('3d')
      .createSignedUrl(storagePath, oneYear);

    if (signError) {
      console.error(`Sign failed for ${file.name}:`, signError.message);
      continue;
    }

    urls[file.name] = signedData.signedUrl;
    console.log(`Uploaded ${file.name} -> ${signedData.signedUrl}`);
  }

  fs.writeFileSync(path.join(__dirname, 'orc-warrior-urls.json'), JSON.stringify(urls, null, 2));
})();
