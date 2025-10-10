/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDataQuality() {
  console.log('\n🔍 Testing Elder Care Navigator Data Quality\n');
  console.log('='.repeat(60));

  try {
    // 1. Total count
    const { count: totalCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total Facilities: ${totalCount?.toLocaleString()}`);

    // 2. Sample 5 facilities to show real data
    const { data: examples } = await supabase
      .from('resources')
      .select('*')
      .not('quality_rating', 'is', null)
      .limit(5);

    console.log('\n🏥 Sample High-Quality Facilities:\n');
    examples?.forEach((facility: any, index: number) => {
      console.log(`   ${index + 1}. ${facility.title}`);
      console.log(`      📍 ${facility.street_address || 'Address not listed'}`);
      console.log(`      ⭐ Quality Rating: ${facility.quality_rating}/5`);
      console.log(`      💳 Insurance: Medicare: ${facility.medicare_accepted ? '✓' : '✗'}, Medicaid: ${facility.medicaid_accepted ? '✓' : '✗'}, VA: ${facility.veterans_affairs_accepted ? '✓' : '✗'}`);
      console.log(`      🏷️  Type: ${facility.category?.join(', ')}`);
      console.log(`      🛏️  Beds: ${facility.total_beds || 'N/A'}\n`);
    });

    //3. Test searchability by category
    console.log('='.repeat(60));
    console.log('\n📂 Facilities by Type:\n');

    const { count: nursingCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .contains('category', ['nursing_home']);

    console.log(`   Nursing Homes: ${nursingCount?.toLocaleString()}`);

    const { count: assistedCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .contains('category', ['assisted_living']);

    console.log(`   Assisted Living: ${assistedCount?.toLocaleString()}`);

    // 4. Test insurance filtering
    console.log('\n💳 Insurance Acceptance:\n');

    const { count: medicareCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('medicare_accepted', true);

    console.log(`   Medicare: ${medicareCount?.toLocaleString()} facilities`);

    const { count: medicaidCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('medicaid_accepted', true);

    console.log(`   Medicaid: ${medicaidCount?.toLocaleString()} facilities`);

    const { count: vaCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('veterans_affairs_accepted', true);

    console.log(`   VA Benefits: ${vaCount?.toLocaleString()} facilities`);

    // 5. Test rating filtering
    const { count: highRated } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .gte('quality_rating', 4);

    console.log(`\n⭐ 4+ Star Rated: ${highRated?.toLocaleString()} facilities`);

    // 6. Test combined search (realistic scenario)
    console.log('\n='.repeat(60));
    console.log('\n🎯 Realistic Search Test:\n');
    console.log('   Scenario: Medicare + Medicaid, 4+ stars, Nursing Homes\n');

    const { data: combinedResults, count: combinedCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .eq('medicare_accepted', true)
      .eq('medicaid_accepted', true)
      .gte('quality_rating', 4)
      .contains('category', ['nursing_home'])
      .limit(5);

    console.log(`   Found: ${combinedCount?.toLocaleString()} matching facilities`);
    console.log(`   Top 5 results:\n`);
    combinedResults?.forEach((facility: any, index: number) => {
      console.log(`      ${index + 1}. ${facility.title}`);
      console.log(`         ⭐ ${facility.quality_rating}/5 | 🛏️ ${facility.total_beds} beds | 📍 ${facility.street_address}\n`);
    });

    // 7. Check data completeness
    const { count: withRating } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('quality_rating', 'is', null);

    const { count: withAddress } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('street_address', 'is', null);

    const { count: withBeds } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .not('total_beds', 'is', null);

    console.log('='.repeat(60));
    console.log('\n✅ Data Completeness:\n');
    console.log(`   Quality Ratings: ${((withRating! / totalCount!) * 100).toFixed(1)}%`);
    console.log(`   Street Addresses: ${((withAddress! / totalCount!) * 100).toFixed(1)}%`);
    console.log(`   Bed Counts: ${((withBeds! / totalCount!) * 100).toFixed(1)}%`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Data Quality Test Complete!\n');
    console.log(`🎉 Summary: ${totalCount?.toLocaleString()} facilities ready to search`);
    console.log(`   - ${nursingCount?.toLocaleString()} nursing homes`);
    console.log(`   - ${assistedCount?.toLocaleString()} assisted living facilities`);
    console.log(`   - ${medicareCount?.toLocaleString()} accept Medicare`);
    console.log(`   - ${highRated?.toLocaleString()} rated 4+ stars\n`);

  } catch (error) {
    console.error('\n❌ Error testing data quality:', error);
  }
}

testDataQuality();
