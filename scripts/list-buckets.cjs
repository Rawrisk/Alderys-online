const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error.message);
    return;
  }
  console.log(JSON.stringify(data, null, 2));

  const { data: files, error: err2 } = await supabase.storage.from('3d').list('', { limit: 100 });
  if (err2) {
    console.error('Error listing 3d bucket:', err2.message);
  } else {
    console.log('3d bucket contents:', JSON.stringify(files, null, 2));
  }
})();
