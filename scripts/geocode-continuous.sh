#!/bin/bash

# Continuous geocoding script that runs until all facilities are geocoded
# This script will keep running even after interruptions and can be restarted anytime
# It automatically resumes from where it left off

echo "🗺️  Continuous Geocoding Service"
echo "=================================="
echo ""
echo "This will geocode ALL facilities in batches of 500."
echo "You can stop anytime with Ctrl+C and restart later - it will resume automatically."
echo ""
echo "Press Ctrl+C to stop. The script will gracefully exit after the current batch."
echo ""

# Trap Ctrl+C for graceful shutdown
trap 'echo ""; echo "⚠️  Stopping after current batch..."; exit 0' SIGINT SIGTERM

# Counter for total batches processed
BATCHES_PROCESSED=0

# Run geocoding in a loop
while true; do
  # Get remaining count before batch
  REMAINING_BEFORE=$(pnpm tsx -e "
    import { createClient } from '@supabase/supabase-js';
    import dotenv from 'dotenv';
    dotenv.config({ path: '.env.local' });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { count } = await supabase.from('resources').select('*', {count: 'exact', head: true}).is('latitude', null).not('street_address', 'is', null);
    console.log(count || 0);
  " 2>/dev/null)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Batch #$((BATCHES_PROCESSED + 1))"
  echo "📍 Remaining facilities: $REMAINING_BEFORE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check if we're done
  if [ "$REMAINING_BEFORE" -lt 10 ]; then
    echo "✅ All facilities geocoded! Less than 10 remaining."
    echo ""
    echo "🎉 Summary:"
    echo "   Total batches processed: $BATCHES_PROCESSED"
    echo "   Facilities remaining: $REMAINING_BEFORE"
    echo ""
    break
  fi

  # Run batch
  pnpm tsx scripts/geocode-facilities.ts --batch-size=500

  # Check exit code
  if [ $? -ne 0 ]; then
    echo "❌ Geocoding batch failed. Stopping."
    exit 1
  fi

  BATCHES_PROCESSED=$((BATCHES_PROCESSED + 1))

  # Get remaining count after batch
  REMAINING_AFTER=$(pnpm tsx -e "
    import { createClient } from '@supabase/supabase-js';
    import dotenv from 'dotenv';
    dotenv.config({ path: '.env.local' });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { count } = await supabase.from('resources').select('*', {count: 'exact', head: true}).is('latitude', null).not('street_address', 'is', null);
    console.log(count || 0);
  " 2>/dev/null)

  GEOCODED_THIS_BATCH=$((REMAINING_BEFORE - REMAINING_AFTER))

  echo ""
  echo "✨ Batch #$BATCHES_PROCESSED complete:"
  echo "   Geocoded this batch: $GEOCODED_THIS_BATCH"
  echo "   Total remaining: $REMAINING_AFTER"
  echo "   Progress: $((100 - REMAINING_AFTER * 100 / 61052))% complete"
  echo ""

  # Short pause between batches
  sleep 2
done

echo ""
echo "🎊 All done! Geocoding complete."
echo ""
