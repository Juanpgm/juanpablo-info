// Minimal stub — Phase 3 (task 3.3) expands this file alongside
// skills.ts / education.ts / projects.ts / nav.ts. Facts sourced from
// proposal.md (§1 intent, §8 design JSON-LD Person plan).
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
