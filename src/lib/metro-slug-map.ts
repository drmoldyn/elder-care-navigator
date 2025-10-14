/**
 * Maps city names to their corresponding metro area slugs
 * This allows /locations/portland-or to redirect to /metros/portland-vancouver-hillsboro
 */

type MetroMapping = {
  [key: string]: string; // city-state slug => metro slug
};

export const CITY_TO_METRO_SLUG: MetroMapping = {
  'new-york-ny': 'new-york-newark-jersey-city',
  'los-angeles-ca': 'los-angeles-long-beach-anaheim',
  'chicago-il': 'chicago-naperville-elgin',
  'dallas-tx': 'dallas-fort-worth-arlington',
  'houston-tx': 'houston-the-woodlands-sugar-land',
  'washington-dc': 'washington-arlington-alexandria',
  'miami-fl': 'miami-fort-lauderdale-west-palm-beach',
  'philadelphia-pa': 'philadelphia-camden-wilmington',
  'atlanta-ga': 'atlanta-sandy-springs-alpharetta',
  'phoenix-az': 'phoenix-mesa-chandler',
  'boston-ma': 'boston-cambridge-newton',
  'san-francisco-ca': 'san-francisco-oakland-berkeley',
  'riverside-ca': 'riverside-san-bernardino-ontario',
  'detroit-mi': 'detroit-warren-dearborn',
  'seattle-wa': 'seattle-tacoma-bellevue',
  'minneapolis-mn': 'minneapolis-st-paul-bloomington',
  'san-diego-ca': 'san-diego-chula-vista-carlsbad',
  'tampa-fl': 'tampa-st-petersburg-clearwater',
  'denver-co': 'denver-aurora-lakewood',
  'baltimore-md': 'baltimore-columbia-towson',
  'st-louis-mo': 'st-louis',
  'charlotte-nc': 'charlotte-concord-gastonia',
  'orlando-fl': 'orlando-kissimmee-sanford',
  'san-antonio-tx': 'san-antonio-new-braunfels',
  'portland-or': 'portland-vancouver-hillsboro',
  'sacramento-ca': 'sacramento-roseville-folsom',
  'pittsburgh-pa': 'Pittsburgh',
  'las-vegas-nv': 'las-vegas-henderson-paradise',
  'austin-tx': 'austin-round-rock-georgetown',
  'cincinnati-oh': 'cincinnati',
  'kansas-city-mo': 'kansas-city',
  'columbus-oh': 'columbus',
  'cleveland-oh': 'cleveland-elyria',
  'indianapolis-in': 'indianapolis-carmel-anderson',
  'san-jose-ca': 'san-jose-sunnyvale-santa-clara',
  'nashville-tn': 'nashville-davidson-murfreesboro-franklin',
  'virginia-beach-va': 'virginia-beach-norfolk-newport-news',
  'providence-ri': 'providence-warwick',
  'milwaukee-wi': 'milwaukee-waukesha',
  'jacksonville-fl': 'jacksonville',
  'memphis-tn': 'memphis',
  'oklahoma-city-ok': 'oklahoma-city',
  'louisville-ky': 'louisville-jefferson-county',
  'richmond-va': 'richmond',
  'new-orleans-la': 'new-orleans-metairie',
  'hartford-ct': 'hartford-east-hartford-middletown',
  'raleigh-nc': 'raleigh-cary',
  'salt-lake-city-ut': 'salt-lake-city',
  'birmingham-al': 'birmingham-hoover',
  'buffalo-ny': 'buffalo-cheektowaga',
};

/**
 * Get the metro slug for a given city-state combination
 */
export function getMetroSlugForCity(city: string, state: string): string | null {
  const citySlug = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
  return CITY_TO_METRO_SLUG[citySlug] || null;
}
