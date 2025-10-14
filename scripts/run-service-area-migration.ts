/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { execSql } from './lib/exec-sql';
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

  function resolveMigrationPath(arg?: string): string {
    if (arg && typeof arg === 'string') {
      if (arg && !arg.startsWith('supabase/migrations/')) return path.join('supabase/migrations', arg);
      return arg;
    }
    const dir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = readdirSync(dir).filter(f => f.endsWith('create_service_areas.sql')).sort();
    if (files.length === 0) {
      throw new Error('Migration file not found. Pass a path, e.g. supabase/migrations/202510140947_create_service_areas.sql');
    }
    return path.join(dir, files[files.length - 1]);
  }

  const argPath = process.argv[2];
  const sqlPath = resolveMigrationPath(argPath);
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    // Execute the migration as a single batch; fallback handles RPC/REST
    const result = await execSql(supabase, sql, { supabaseUrl, serviceKey: supabaseServiceKey });
    if (!result.ok) {
      // Split and try line-by-line if batch fails
      console.log('⚠️  Batch exec failed; trying statements sequentially...');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      for (const statement of statements) {
        const step = await execSql(supabase, statement, { supabaseUrl, serviceKey: supabaseServiceKey });
        if (!step.ok) {
          console.error('❌ Error executing statement:', step.error);
          console.error('Statement:', statement.substring(0, 160) + '...');
          throw step.error;
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
    console.error(`2. Copy contents of: ${sqlPath}`);
    console.error('3. Paste and run in SQL Editor');
    console.error('4. Then run: pnpm tsx scripts/import-service-areas.ts\n');
    process.exit(1);
  }
}

runMigration();
