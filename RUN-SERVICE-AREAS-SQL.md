# Run This SQL in Supabase

**Before importing service area data**, you must create the table.

## Steps:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the entire contents of: `supabase/migrations/0006_create_service_areas.sql`
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

## Then run the import:

```bash
pnpm tsx scripts/import-service-areas.ts
```

This will import **528,025 ZIP code mappings** showing which home health agencies serve which areas.

## What this enables:

- **Accurate matching**: Users get home health agencies that actually serve their ZIP code
- **No distance sorting**: Home health results won't show misleading "miles away" since the agency comes to them
- **Better UX**: Separate "Care Facilities" (sorted by distance) from "Home Services" (filtered by service area)
