// Person facts for JSON-LD (design.md §8) and Footer contact links. Facts
// sourced from proposal.md (§1 intent) and design.md §8.
export const site = {
  name: 'Juan Pablo Guzmán Martínez',
  jobTitle: 'Civil Engineer · AI & Data Science Specialist',
  email: 'juanp.gzmz@gmail.com',
  sameAs: [
    'https://www.linkedin.com/in/jp-guzman',
    // TODO: confirm real GitHub username before Phase 4/5 JSON-LD + repo wiring.
    'https://github.com/jpguzman',
  ],
  address: {
    locality: 'Cali',
    region: 'Valle del Cauca',
    country: 'CO',
  },
  knowsLanguage: ['es', 'en', 'de'] as const,
  knowsAbout: [
    'Artificial Intelligence',
    'Data Science',
    'Civil Engineering',
    'BIM',
    'Geospatial Intelligence',
  ],
} as const;

export type Site = typeof site;
