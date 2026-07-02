const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const prefix = 'orc-warrior-optimized';
const files = [
  'model.obj',
  'material.mtl',
  'texture_pbr_20250901.png',
  'texture_pbr_20250901_metallic.png',
  'texture_pbr_20250901_normal.png',
  'texture_pbr_20250901_roughness.png'
];

const urls = {};
for (const file of files) {
  const { data } = supabase.storage.from('3d').getPublicUrl(`${prefix}/${file}`);
  urls[file] = data.publicUrl;
  console.log(`${file} -> ${data.publicUrl}`);
}

fs.writeFileSync(path.join(__dirname, 'orc-warrior-public-urls.json'), JSON.stringify(urls, null, 2));
