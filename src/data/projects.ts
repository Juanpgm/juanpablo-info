// Projects seed (design.md §3/§6). All 6 entries below are real, public
// GitHub repos (`isExample: false`, `repoUrl` set) — `lib/github.ts` merges
// `{stars, primaryLanguage, lastUpdated}` at build time via a live GitHub API
// call per repo, falling back to `stale: true` on the seed if that fetch
// fails (network error, rate limit, 404 — design.md §6 contract). None of
// these are placeholders.
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
    id: 'dagma-360-api',
    name: 'API Artefacto 360 DAGMA',
    description: {
      es: 'API del artefacto de captura de campo para DAGMA-360: FastAPI con Firestore en tiempo real, fotos de reconocimiento en Amazon S3, captura de coordenadas GPS y métricas expuestas vía Prometheus.',
      en: 'Field-capture backend for DAGMA-360: a FastAPI service backed by real-time Firestore, reconnaissance photos stored in Amazon S3, GPS coordinate capture, and metrics exposed via Prometheus.',
      de: 'Backend für die Felderfassung von DAGMA-360: ein FastAPI-Service mit Echtzeit-Firestore, in Amazon S3 gespeicherten Erkundungsfotos, GPS-Koordinatenerfassung und über Prometheus bereitgestellten Metriken.',
    },
    stack: ['Python', 'FastAPI', 'Firebase', 'AWS S3'],
    repoUrl: 'https://github.com/Juanpgm/api-artefacto-360-dagma',
    isExample: false,
    featured: true,
  },
  {
    id: 'security-observatory-dwh',
    name: 'SSJ Data Warehouse',
    description: {
      es: 'Backend del Data Warehouse del Observatorio de Seguridad (Secretaría de Seguridad y Justicia de Cali): API en FastAPI sobre PostgreSQL, con migraciones versionadas, contenedores Docker y despliegue en Railway.',
      en: "Backend for the Security Observatory's Data Warehouse (Cali's Secretariat of Security and Justice): a FastAPI API on PostgreSQL, with versioned migrations, Docker containers, and deployment on Railway.",
      de: 'Backend für das Data Warehouse des Sicherheitsobservatoriums (Sekretariat für Sicherheit und Justiz von Cali): eine FastAPI-API auf PostgreSQL mit versionierten Migrationen, Docker-Containern und Deployment auf Railway.',
    },
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    repoUrl: 'https://github.com/Juanpgm/SSJDWHDLH',
    isExample: false,
    featured: true,
  },
  {
    id: 'automl-rain-estimation',
    name: 'AutoML4RainEstimation',
    description: {
      es: 'Estimación de precipitación con AutoML y Deep Learning a partir de datos meteorológicos e imágenes satelitales, optimizando selección de modelo, hiperparámetros e ingeniería de variables para pronóstico climático y gestión de riesgo de desastres.',
      en: 'Rainfall estimation with AutoML and deep learning from weather data and satellite imagery, automating model selection, hyperparameter tuning, and feature engineering for climate forecasting and disaster risk management.',
      de: 'Niederschlagsschätzung mit AutoML und Deep Learning auf Basis von Wetterdaten und Satellitenbildern, mit automatisierter Modellauswahl, Hyperparameter-Tuning und Feature Engineering für Klimavorhersage und Katastrophenrisikomanagement.',
    },
    stack: ['Python', 'AutoML', 'Deep Learning', 'Jupyter'],
    repoUrl: 'https://github.com/Juanpgm/AutoML4RainEstimation',
    isExample: false,
    featured: true,
  },
  {
    id: 'public-safety-scraper',
    name: 'SYJ WebScrapper',
    description: {
      es: 'Pipeline de scraping multifuente para monitorear la percepción de seguridad ciudadana en Cali: API REST en FastAPI, transcripción automática de radio en vivo y captura de fuentes sociales (YouTube, Instagram, Twitter/Nitter, Facebook).',
      en: 'Multi-source scraping pipeline for monitoring citizen security perception in Cali: a FastAPI REST API, automatic live-radio transcription, and capture from social sources (YouTube, Instagram, Twitter/Nitter, Facebook).',
      de: 'Multi-Source-Scraping-Pipeline zur Beobachtung der Sicherheitswahrnehmung der Bürger in Cali: eine FastAPI-REST-API, automatische Live-Radio-Transkription und Erfassung sozialer Quellen (YouTube, Instagram, Twitter/Nitter, Facebook).',
    },
    stack: ['Python', 'FastAPI', 'Web Scraping'],
    repoUrl: 'https://github.com/Juanpgm/SYJ_webscrapper',
    isExample: false,
    featured: false,
  },
  {
    id: 'dagma-emergency-bot',
    name: 'DAGMA Emergencias Bot',
    description: {
      es: 'Backend de atención de emergencias ambientales vía WhatsApp para el DAGMA: transcripción de voz con Whisper, extracción de datos con LangChain y GPT-4o, clasificación automática de gravedad y geolocalización con PostGIS.',
      en: 'WhatsApp environmental-emergency response backend for DAGMA: voice transcription with Whisper, data extraction with LangChain and GPT-4o, automatic severity classification, and geolocation with PostGIS.',
      de: 'WhatsApp-Backend zur Bearbeitung von Umweltnotfällen für DAGMA: Sprachtranskription mit Whisper, Datenextraktion mit LangChain und GPT-4o, automatische Schweregrad-Klassifizierung und Geolokalisierung mit PostGIS.',
    },
    stack: ['Python', 'LangChain', 'GPT-4o', 'PostGIS'],
    repoUrl: 'https://github.com/Juanpgm/emergencias-chatbot-dagma',
    isExample: false,
    featured: false,
  },
  {
    id: 'civil-budget-pdf-extractor',
    name: 'PDF Presupuestos Civil',
    description: {
      es: 'Herramienta de extracción de datos de presupuestos de obra civil (APUs) desde PDF hacia Excel, con scripts de verificación para consolidar el análisis de precios unitarios.',
      en: 'Data-extraction tool for civil works budgets (unit price analyses) from PDF to Excel, with verification scripts to consolidate unit-price analysis.',
      de: 'Werkzeug zur Datenextraktion aus Bauprojekt-Kostenvoranschlägen (Einheitspreisanalysen) von PDF nach Excel, mit Verifizierungsskripten zur Konsolidierung der Einheitspreisanalyse.',
    },
    stack: ['Python', 'PDF Parsing', 'Excel'],
    repoUrl: 'https://github.com/Juanpgm/pdf_pptos_civil',
    isExample: false,
    featured: false,
  },
];
