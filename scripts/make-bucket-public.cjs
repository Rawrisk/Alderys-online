const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase.storage.updateBucket('3d', { public: true });
  if (error) {
    console.error('Failed to make bucket public:', error.message);
    process.exit(1);
  }
  console.log('Bucket "3d" is now public:', JSON.stringify(data));
})();
