// Projects seed (design.md §3/§6). Phase 5 (`lib/github.ts`) merges
// `{stars, primaryLanguage, lastUpdated}` at build time for entries with a
// `repoUrl`. All three launch entries are `isExample: true` — plausible,
// skillset-relevant showcases, not yet backed by a public repo; `repoUrl` is
// intentionally omitted so the build-time fetch is skipped entirely rather
// than pointed at a placeholder that would 404 (design.md §6 contract).
import type { Locale } from '../i18n';

type Localized = Record<Locale, string>;

export interface ProjectSeed {
  id: string;
  name: string;
  description: Localized;
  stack: string[];
  repoUrl?: string;
  isExample: boolean;
  featured?: boolean;
}

export const projects: ProjectSeed[] = [
  {
    id: 'gcp-etl-pipeline',
    name: 'DAGMA-360 ETL Pipeline',
    description: {
      es: 'Pipeline de ingesta y transformación de datos ambientales (calidad de aire, biodiversidad, alertas tempranas) sobre GCP, alimentando un Data Warehouse territorial.',
      en: 'Ingestion and transformation pipeline for environmental data (air quality, biodiversity, early alerts) on GCP, feeding a territorial Data Warehouse.',
      de: 'Ingestions- und Transformationspipeline für Umweltdaten (Luftqualität, Biodiversität, Frühwarnungen) auf GCP, die ein territoriales Data Warehouse speist.',
    },
    stack: ['GCP', 'Python', 'BigQuery', 'Airflow'],
    isExample: true,
    featured: true,
  },
  {
    id: 'geointeligencia-simap',
    name: 'SIMAP Geointeligencia',
    description: {
      es: 'Herramienta de geointeligencia sobre coberturas vegetales y biodiversidad urbana, combinando GIS, imágenes satelitales y un frontend en React para exploración territorial.',
      en: 'Geointelligence tool over vegetation cover and urban biodiversity, combining GIS, satellite imagery, and a React frontend for territorial exploration.',
      de: 'Geointelligenz-Tool für Vegetationsbedeckung und urbane Biodiversität, das GIS, Satellitenbilder und ein React-Frontend zur territorialen Exploration kombiniert.',
    },
    stack: ['GIS', 'PostGIS', 'Python', 'React'],
    isExample: true,
    featured: true,
  },
  {
    id: 'rag-nsr-10',
    name: 'RAG NSR-10',
    description: {
      es: 'Demo de un sistema RAG para consultar la norma sismo-resistente NSR-10 en lenguaje natural, con recuperación semántica sobre el articulado y citas trazables.',
      en: 'Demo of a RAG system to query the NSR-10 seismic design code in natural language, with semantic retrieval over the articles and traceable citations.',
      de: 'Demo eines RAG-Systems zur Abfrage der erdbebensicheren Bauvorschrift NSR-10 in natürlicher Sprache, mit semantischer Suche über die Artikel und nachvollziehbaren Quellenangaben.',
    },
    stack: ['Python', 'LangChain', 'Vector DB', 'FastAPI'],
    isExample: true,
    featured: true,
  },
];
