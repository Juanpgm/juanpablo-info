// Projects seed (design.md §3/§6). All 11 entries below are real, public
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
      fr: 'Backend de capture de terrain pour DAGMA-360 : un service FastAPI adossé à Firestore en temps réel, des photos de reconnaissance stockées sur Amazon S3, une capture de coordonnées GPS et des métriques exposées via Prometheus.',
      ru: 'Бэкенд для полевого сбора данных DAGMA-360: сервис на FastAPI с Firestore в реальном времени, фотографии разведки, хранящиеся в Amazon S3, захват GPS-координат и метрики, доступные через Prometheus.',
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
      fr: "Backend du Data Warehouse de l'Observatoire de la Sécurité (Secrétariat à la Sécurité et à la Justice de Cali) : une API FastAPI sur PostgreSQL, avec migrations versionnées, conteneurs Docker et déploiement sur Railway.",
      ru: 'Бэкенд хранилища данных Обсерватории безопасности (Секретариат безопасности и юстиции Кали): API на FastAPI поверх PostgreSQL с версионируемыми миграциями, Docker-контейнерами и развёртыванием на Railway.',
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
      fr: "Estimation des précipitations par AutoML et deep learning à partir de données météorologiques et d'images satellites, automatisant la sélection de modèles, le réglage des hyperparamètres et l'ingénierie des variables pour la prévision climatique et la gestion des risques de catastrophes.",
      ru: 'Оценка количества осадков с помощью AutoML и глубокого обучения на основе метеорологических данных и спутниковых снимков с автоматизацией выбора модели, настройки гиперпараметров и генерации признаков для климатического прогнозирования и управления рисками стихийных бедствий.',
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
      fr: 'Pipeline de scraping multi-source pour surveiller la perception de la sécurité citoyenne à Cali : une API REST FastAPI, une transcription automatique de radio en direct et une capture depuis des sources sociales (YouTube, Instagram, Twitter/Nitter, Facebook).',
      ru: 'Многоисточниковый конвейер сбора данных для мониторинга восприятия безопасности гражданами в Кали: REST API на FastAPI, автоматическая расшифровка радиоэфира в реальном времени и сбор данных из социальных источников (YouTube, Instagram, Twitter/Nitter, Facebook).',
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
      fr: 'Backend WhatsApp de réponse aux urgences environnementales pour DAGMA : transcription vocale avec Whisper, extraction de données avec LangChain et GPT-4o, classification automatique de la gravité et géolocalisation avec PostGIS.',
      ru: 'Бэкенд для реагирования на экологические чрезвычайные ситуации через WhatsApp для DAGMA: транскрипция голоса с помощью Whisper, извлечение данных с LangChain и GPT-4o, автоматическая классификация степени тяжести и геолокация с PostGIS.',
    },
    stack: ['Python', 'LangChain', 'Groq', 'PostGIS'],
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
      fr: "Outil d'extraction de données pour les budgets de travaux de génie civil (analyses de prix unitaires) du PDF vers Excel, avec des scripts de vérification pour consolider l'analyse des prix unitaires.",
      ru: 'Инструмент извлечения данных из смет на гражданское строительство (анализ единичных расценок) из PDF в Excel, со скриптами проверки для консолидации анализа единичных расценок.',
    },
    stack: ['Python', 'PDF Parsing', 'Excel'],
    repoUrl: 'https://github.com/Juanpgm/pdf_pptos_civil',
    isExample: false,
    featured: false,
  },
  {
    id: 'calitrack-360',
    name: 'CaliTrack 360',
    description: {
      es: 'Progressive Web App para la captura en campo del estado de proyectos de infraestructura de la ciudad: autenticación con Firebase, registro fotográfico y captura de coordenadas GPS desde dispositivos móviles.',
      en: "Progressive Web App for field capture of the city's infrastructure project status: Firebase authentication, photographic logging, and GPS coordinate capture from mobile devices.",
      de: 'Progressive Web App zur Felderfassung des Status städtischer Infrastrukturprojekte: Firebase-Authentifizierung, fotografische Dokumentation und GPS-Koordinatenerfassung von mobilen Geräten aus.',
      fr: "Progressive Web App pour la capture de terrain de l'état des projets d'infrastructure de la ville : authentification Firebase, journalisation photographique et capture de coordonnées GPS depuis des appareils mobiles.",
      ru: 'Progressive Web App для полевого учёта статуса городских инфраструктурных проектов: аутентификация через Firebase, фотофиксация и захват GPS-координат с мобильных устройств.',
    },
    stack: ['Svelte', 'Firebase', 'PWA'],
    repoUrl: 'https://github.com/Juanpgm/artefacto-calitrack-360',
    isExample: false,
    featured: false,
  },
  {
    id: 'gestor-proyectos',
    name: 'Gestor de Proyectos',
    description: {
      es: 'Dashboard interactivo en Next.js para la gestión y visualización de proyectos de inversión pública de la Alcaldía de Santiago de Cali, con métricas compactas y filtros unificados.',
      en: "Interactive Next.js dashboard for managing and visualizing public investment projects for the Santiago de Cali city government, with compact metrics and unified filters.",
      de: 'Interaktives Next.js-Dashboard zur Verwaltung und Visualisierung öffentlicher Investitionsprojekte der Stadtverwaltung von Santiago de Cali, mit kompakten Kennzahlen und einheitlichen Filtern.',
      fr: "Tableau de bord interactif Next.js pour la gestion et la visualisation des projets d'investissement public de la municipalité de Santiago de Cali, avec des indicateurs compacts et des filtres unifiés.",
      ru: 'Интерактивная панель на Next.js для управления и визуализации проектов государственных инвестиций администрации Сантьяго-де-Кали с компактными метриками и едиными фильтрами.',
    },
    stack: ['TypeScript', 'Next.js', 'Vercel'],
    repoUrl: 'https://github.com/Juanpgm/gestor_proyectos_vercel',
    isExample: false,
    featured: false,
  },
  {
    id: 'gestor-proyectos-api',
    name: 'Gestor de Proyectos API',
    description: {
      es: 'API REST en FastAPI que da interoperabilidad al artefacto de seguimiento de proyectos, con Firebase/Firestore como backend de datos en tiempo real.',
      en: 'REST API built with FastAPI that provides interoperability for the project-tracking artifact, with Firebase/Firestore as a real-time data backend.',
      de: 'REST-API mit FastAPI, die Interoperabilität für das Projektverfolgungs-Artefakt bereitstellt, mit Firebase/Firestore als Echtzeit-Datenbackend.',
      fr: "API REST construite avec FastAPI qui assure l'interopérabilité de l'artefact de suivi de projets, avec Firebase/Firestore comme backend de données en temps réel.",
      ru: 'REST API на FastAPI, обеспечивающий взаимодействие с инструментом отслеживания проектов, с Firebase/Firestore в качестве бэкенда данных в реальном времени.',
    },
    stack: ['Python', 'FastAPI', 'Firebase', 'Firestore'],
    repoUrl: 'https://github.com/Juanpgm/gestor_proyecto_api',
    isExample: false,
    featured: false,
  },
  {
    id: 'dagma-360-capture',
    name: 'DAGMA-360 Capture',
    description: {
      es: 'Despliegue del artefacto de captura de campo CaliTrack 360 adaptado para el DAGMA, para el registro de intervenciones y jornadas técnicas de gestión ambiental.',
      en: 'Deployment of the CaliTrack 360 field-capture artifact adapted for DAGMA, for logging interventions and technical environmental-management field days.',
      de: 'Bereitstellung des CaliTrack-360-Felderfassungs-Artefakts, angepasst für DAGMA, zur Dokumentation von Maßnahmen und technischen Einsätzen im Umweltmanagement.',
      fr: "Déploiement de l'artefact de capture de terrain CaliTrack 360 adapté pour DAGMA, pour l'enregistrement des interventions et des journées techniques de gestion environnementale.",
      ru: 'Развёртывание инструмента полевого сбора данных CaliTrack 360, адаптированного для DAGMA, для учёта мероприятий и технических выездов по экологическому менеджменту.',
    },
    stack: ['Svelte', 'Firebase', 'PWA'],
    repoUrl: 'https://github.com/Juanpgm/dagma-360-capture',
    isExample: false,
    featured: false,
  },
  {
    id: 'task-tracker-gobops',
    name: 'Task Tracker GobOps',
    description: {
      es: 'Sistema de seguimiento de requerimientos para la Alcaldía de Santiago de Cali, con frontend en Svelte/Vite, autenticación Firebase y pruebas end-to-end multiplataforma con Playwright.',
      en: 'Requirements-tracking system for the Santiago de Cali city government, with a Svelte/Vite frontend, Firebase authentication, and cross-platform end-to-end testing with Playwright.',
      de: 'System zur Nachverfolgung von Anforderungen für die Stadtverwaltung von Santiago de Cali, mit Svelte/Vite-Frontend, Firebase-Authentifizierung und plattformübergreifenden End-to-End-Tests mit Playwright.',
      fr: "Système de suivi des exigences pour la municipalité de Santiago de Cali, avec un frontend Svelte/Vite, une authentification Firebase et des tests end-to-end multiplateformes avec Playwright.",
      ru: 'Система отслеживания требований для администрации Сантьяго-де-Кали с фронтендом на Svelte/Vite, аутентификацией через Firebase и кроссплатформенным сквозным тестированием с Playwright.',
    },
    stack: ['Svelte', 'TypeScript', 'Firebase', 'Playwright'],
    repoUrl: 'https://github.com/Juanpgm/task-tracker-gobops',
    isExample: false,
    featured: false,
  },
];
