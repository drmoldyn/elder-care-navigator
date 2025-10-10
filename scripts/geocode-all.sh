#!/bin/bash

# Geocode all facilities in batches
# Runs continuously until all facilities are geocoded

echo "🗺️  Starting continuous geocoding process"
echo "=========================================="
echo ""

# Run geocoding in a loop
while true; do
  echo "Starting new batch of 1000 facilities..."
  pnpm tsx scripts/geocode-facilities.ts --batch-size=1000

  # Check exit code
  if [ $? -ne 0 ]; then
    echo "❌ Geocoding failed. Stopping."
    exit 1
  fi

  # Check how many are remaining
  REMAINING=$(pnpm tsx -e "
    import { createClient } from '@supabase/supabase-js';
    import dotenv from 'dotenv';
    dotenv.config({ path: '.env.local' });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { count } = await supabase.from('resources').select('*', {count: 'exact', head: true}).is('latitude', null).not('street_address', 'is', null);
    console.log(count || 0);
  " 2>/dev/null)

  echo "📊 Remaining facilities: $REMAINING"

  if [ "$REMAINING" -lt 100 ]; then
    echo "✅ Geocoding complete! Less than 100 facilities remaining."
    break
  fi

  echo "Waiting 2 seconds before next batch..."
  sleep 2
done

echo ""
echo "🎉 All facilities geocoded!"
