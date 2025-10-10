#!/usr/bin/env tsx
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const HERO_DIR = 'public/images/hero';
const MAX_WIDTH = 1920;
const QUALITY = 82;

async function optimizeImage(filepath: string) {
  const filename = path.basename(filepath);
  const stats = fs.statSync(filepath);
  const sizeBefore = (stats.size / 1024).toFixed(0);

  console.log(`\nProcessing: ${filename}`);
  console.log(`  Original: ${sizeBefore}KB`);

  // Get image metadata
  const metadata = await sharp(filepath).metadata();
  console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);

  // Optimize
  let pipeline = sharp(filepath);

  // Resize if needed
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  // Convert to progressive JPEG with optimized quality
  await pipeline
    .jpeg({
      quality: QUALITY,
      progressive: true,
      mozjpeg: true, // Use mozjpeg if available
    })
    .toFile(filepath + '.tmp');

  // Replace original
  fs.renameSync(filepath + '.tmp', filepath);

  // Get new size
  const newStats = fs.statSync(filepath);
  const sizeAfter = (newStats.size / 1024).toFixed(0);
  const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);

  console.log(`  Optimized: ${sizeAfter}KB (${savings}% smaller)`);
}

async function main() {
  console.log('🖼️  Optimizing hero images with Sharp...\n');

  const files = fs.readdirSync(HERO_DIR)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .map(f => path.join(HERO_DIR, f));

  for (const file of files) {
    await optimizeImage(file);
  }

  console.log('\n✅ Image optimization complete!');
}

main();
