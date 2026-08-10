// Education + certifications (static typed data, design.md §3/§6 — not a
// Content Collection: small, stable list). Institution names are proper
// nouns and stay unlocalized; `program`/`note` are per-locale since they
// describe the degree/distinction in prose.
import type { Locale } from '../i18n';

type Localized = Record<Locale, string>;

export interface EducationEntry {
  id: string;
  institution: string;
  program: Localized;
  location: string;
  startYear: number;
  endYear?: number;
  note?: Localized; // e.g. honor distinction
}

export const education: EducationEntry[] = [
  {
    id: 'uao-ia',
    institution: 'Universidad Autónoma de Occidente (UAO)',
    program: {
      es: 'Especialización en Inteligencia Artificial',
      en: 'Specialization in Artificial Intelligence',
      de: 'Spezialisierung in Künstlicher Intelligenz',
      fr: 'Spécialisation en intelligence artificielle',
      ru: 'Специализация по искусственному интеллекту',
    },
    location: 'Cali, Colombia',
    startYear: 2024,
    endYear: 2025,
  },
  {
    id: 'uibague-civil',
    institution: 'Universidad de Ibagué',
    program: {
      es: 'Ingeniería Civil',
      en: 'Civil Engineering',
      de: 'Bauingenieurwesen',
      fr: 'Génie civil',
      ru: 'Гражданское строительство',
    },
    location: 'Ibagué, Colombia',
    startYear: 2012,
    endYear: 2017,
    note: {
      es: 'Mención de honor',
      en: 'Honor distinction',
      de: 'Auszeichnung mit Ehrenmention',
      fr: "Mention d'honneur",
      ru: 'Похвальная грамота',
    },
  },
  {
    id: 'epfl',
    institution: 'École Polytechnique Fédérale de Lausanne (EPFL)',
    program: {
      es: 'Programa de formación complementaria',
      en: 'Complementary training program',
      de: 'Ergänzendes Fortbildungsprogramm',
      fr: 'Programme de formation complémentaire',
      ru: 'Программа дополнительного обучения',
    },
    location: 'Lausana, Suiza',
    startYear: 2017,
    endYear: 2018,
  },
  {
    id: 'uc-bigdata',
    institution: 'University of California',
    program: {
      es: 'Introduction to Big Data',
      en: 'Introduction to Big Data',
      de: 'Introduction to Big Data',
      fr: 'Introduction to Big Data',
      ru: 'Introduction to Big Data',
    },
    location: 'En línea',
    startYear: 2018,
  },
  {
    id: 'platzi-ml',
    institution: 'Platzi',
    program: {
      es: 'Ruta de Machine Learning',
      en: 'Machine Learning track',
      de: 'Machine-Learning-Programm',
      fr: 'Parcours Machine Learning',
      ru: 'Курс по машинному обучению',
    },
    location: 'En línea',
    startYear: 2019,
    endYear: 2020,
  },
];

export interface Certification {
  id: string;
  name: Localized;
  issuer: string;
  year: number;
}

export const certifications: Certification[] = [
  {
    id: 'what-works-cities',
    name: {
      es: 'Certificación What Works Cities',
      en: 'What Works Cities Certification',
      de: 'What-Works-Cities-Zertifizierung',
      fr: 'Certification What Works Cities',
      ru: 'Сертификация What Works Cities',
    },
    issuer: 'Bloomberg Philanthropies · Results for America',
    year: 2024,
  },
];
