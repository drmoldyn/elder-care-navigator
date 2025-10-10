import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  // Get first row to see column structure
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('📊 Resource Schema:');
    console.log('\nColumn names:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof data[0][key]}`);
    });
    console.log('\n📝 Sample data:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema();
