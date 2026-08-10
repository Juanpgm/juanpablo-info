// Person facts for JSON-LD (design.md §8) and Footer contact links. Facts
// sourced from proposal.md (§1 intent) and design.md §8.
export const site = {
  name: 'Juan Pablo Guzmán Martínez',
  jobTitle: 'Civil Engineer · AI & Data Science Specialist',
  email: 'juanp.gzmz@gmail.com',
  sameAs: [
    'https://www.linkedin.com/in/jp-guzman',
    'https://github.com/Juanpgm',
  ],
  address: {
    locality: 'Cali',
    region: 'Valle del Cauca',
    country: 'CO',
  },
  // TODO: set your WhatsApp number here (E.164 format, digits only, e.g.
  // "573001234567") to activate the WhatsApp contact button. Leave empty to
  // keep it hidden.
  whatsapp: {
    number: '',
    message: '',
  },
  knowsLanguage: ['es', 'en'] as const,
  knowsAbout: [
    'Artificial Intelligence',
    'Data Science',
    'Civil Engineering',
    'BIM',
    'Geospatial Intelligence',
  ],
} as const;

export type Site = typeof site;
