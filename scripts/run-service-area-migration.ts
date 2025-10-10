/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🗄️  Running service area migration...\n');

  const sqlPath = 'supabase/migrations/0006_create_service_areas.sql';
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    // Execute the SQL migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution via the REST API
      console.log('⚠️  exec_sql not available, using direct SQL execution...');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement
          });

          if (stmtError) {
            console.error(`❌ Error executing statement:`, stmtError.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            throw stmtError;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Table `home_health_service_areas` created with indexes.');
    console.log('\nNext step: Run the import script:');
    console.log('   pnpm tsx scripts/import-service-areas.ts');

  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\n📋 Manual migration required:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Copy contents of: supabase/migrations/0006_create_service_areas.sql');
    console.error('3. Paste and run in SQL Editor');
    console.error('4. Then run: pnpm tsx scripts/import-service-areas.ts\n');
    process.exit(1);
  }
}

runMigration();
