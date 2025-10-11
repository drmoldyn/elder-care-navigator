import { createClient } from '@supabase/supabase-js';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exportDemandReport() {
  const { data, error } = await supabase
    .from('view_session_demand')
    .select('*')
    .order('session_date', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('Failed to load session demand view', error);
    process.exit(1);
  }

  const csv = stringify(data ?? [], {
    header: true,
    columns: {
      session_date: 'Date',
      state: 'State',
      care_type: 'Care Type',
      session_count: 'Sessions',
      email_captures: 'Email Captures',
    },
  });

  const outputPath = path.join(process.cwd(), 'reports', `session-demand-${Date.now()}.csv`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, csv, 'utf8');
  console.log(`Report exported to ${outputPath}`);
}

exportDemandReport();
