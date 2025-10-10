import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSearch() {
  console.log('\n🔍 Testing Search Functionality\n');
  console.log('='.repeat(60));

  // Test 1: Search by specific ZIP code
  const testZip = '10001'; // Manhattan, NYC
  console.log(`\n📍 Test 1: Facilities near ZIP ${testZip}\n`);

  // Get ZIP prefix for proximity matching
  const prefix = testZip.substring(0, 3); // "100"

  const { data: zipResults, count: zipCount } = await supabase
    .from('resources')
    .select('title, street_address, zip_code, quality_rating, category', { count: 'exact' })
    .ilike('zip_code', `${prefix}%`)
    .order('quality_rating', { ascending: false, nullsFirst: false })
    .limit(5);

  console.log(`   Found ${zipCount} facilities in ZIP prefix ${prefix}xx`);
  console.log(`   Top 5 results:\n`);
  zipResults?.forEach((facility, index) => {
    console.log(`      ${index + 1}. ${facility.title}`);
    console.log(`         📍 ${facility.street_address} (ZIP: ${facility.zip_code})`);
    console.log(`         ⭐ ${facility.quality_rating || 'N/A'}/5`);
    console.log(`         🏷️  ${facility.category?.join(', ')}\n`);
  });

  // Test 2: Search with filters (Medicare + 4+ stars)
  console.log('='.repeat(60));
  console.log(`\n💊 Test 2: Medicare-accepting, 4+ stars near ZIP ${testZip}\n`);

  const { data: filteredResults, count: filteredCount } = await supabase
    .from('resources')
    .select('title, street_address, zip_code, quality_rating, total_beds', { count: 'exact' })
    .ilike('zip_code', `${prefix}%`)
    .eq('medicare_accepted', true)
    .gte('quality_rating', 4)
    .order('quality_rating', { ascending: false })
    .limit(5);

  console.log(`   Found ${filteredCount} matching facilities`);
  console.log(`   Top 5 results:\n`);
  filteredResults?.forEach((facility, index) => {
    console.log(`      ${index + 1}. ${facility.title}`);
    console.log(`         📍 ${facility.street_address} (ZIP: ${facility.zip_code})`);
    console.log(`         ⭐ ${facility.quality_rating}/5 | 🛏️ ${facility.total_beds} beds\n`);
  });

  // Test 3: Broader search (different ZIP)
  const testZip2 = '90210'; // Beverly Hills, CA
  const prefix2 = testZip2.substring(0, 3);

  console.log('='.repeat(60));
  console.log(`\n🌴 Test 3: Assisted Living near ZIP ${testZip2}\n`);

  const { data: caResults, count: caCount } = await supabase
    .from('resources')
    .select('title, street_address, zip_code, category', { count: 'exact' })
    .ilike('zip_code', `${prefix2}%`)
    .contains('category', ['assisted_living'])
    .limit(5);

  console.log(`   Found ${caCount} assisted living facilities`);
  console.log(`   Top 5 results:\n`);
  caResults?.forEach((facility, index) => {
    console.log(`      ${index + 1}. ${facility.title}`);
    console.log(`         📍 ${facility.street_address} (ZIP: ${facility.zip_code})\n`);
  });

  console.log('='.repeat(60));
  console.log('\n✨ Search tests complete!\n');
}

testSearch();
