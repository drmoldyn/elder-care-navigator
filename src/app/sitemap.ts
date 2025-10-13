import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

import { generateLocationSlug, getTopRankedLocations } from '@/lib/locations/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sunsetwell.com'
  const now = new Date()

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/navigator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/metros`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/scoring`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Generate metro entries from JSON files
  let metroEntries: MetadataRoute.Sitemap = []
  try {
    const metrosDir = path.join(process.cwd(), 'data', 'metros')
    const metroFiles = fs.readdirSync(metrosDir)
    metroEntries = metroFiles
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        url: `${baseUrl}/metros/${file.replace('.json', '')}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
  } catch (error) {
    console.error('[sitemap] Failed to load metro entries', error)
  }

  // Generate location entries
  try {
    const topLocations = await getTopRankedLocations(120)
    const locationEntries = topLocations.map((loc) => ({
      url: `${baseUrl}/locations/${generateLocationSlug(loc.city, loc.state)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...baseEntries, ...metroEntries, ...locationEntries]
  } catch (error) {
    console.error('[sitemap] Failed to load location entries', error)
    return [...baseEntries, ...metroEntries]
  }
}
