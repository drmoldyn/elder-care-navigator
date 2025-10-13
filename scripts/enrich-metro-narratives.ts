#!/usr/bin/env tsx

/**
 * Enriches all metro JSON files with comprehensive narrative content
 * Run: npm run tsx scripts/enrich-metro-narratives.ts
 */

import fs from 'fs';
import path from 'path';
import { NarrativeGenerator } from './lib/narrative-generator';
import type { EnhancedMetroData } from './types/metro-narrative';

const METROS_DIR = path.join(process.cwd(), 'data', 'metros');

async function enrichAllMetros() {
  console.log('🚀 Starting metro narrative enrichment...\n');

  const generator = new NarrativeGenerator();
  const files = fs.readdirSync(METROS_DIR).filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} metro files to enrich\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(METROS_DIR, file);

    try {
      // Read existing metro data
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const metroData = JSON.parse(rawData) as EnhancedMetroData;

      console.log(`📝 Processing: ${metroData.metro} (${metroData.count} facilities)`);

      // Generate enhanced narrative
      const enhancedNarrative = generator.generate(metroData);

      // Merge with existing data
      const enrichedData: EnhancedMetroData = {
        ...metroData,
        enhancedNarrative,
      };

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2), 'utf-8');

      console.log(`   ✅ Enhanced with ${enhancedNarrative.faqs.length} FAQs, ${Object.keys(enhancedNarrative.decisionFramework).length} decision paths`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Enrichment complete!`);
  console.log(`   ✅ Success: ${successCount} metros`);
  console.log(`   ❌ Errors: ${errorCount} metros`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run the enrichment
enrichAllMetros().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
