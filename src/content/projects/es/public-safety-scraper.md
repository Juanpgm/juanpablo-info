---
title: "SYJ WebScrapper: pipeline multifuente para monitorear percepción de seguridad en Cali"
description: "Pipeline de scraping multifuente en FastAPI que agrega radio en vivo transcrita con Whisper y fuentes sociales para monitorear la seguridad ciudadana en Cali."
projectId: "public-safety-scraper"
pubDate: 2026-08-11
draft: false
---

## Resumen

SYJ WebScrapper nace de un problema muy concreto de gestión pública: para diseñar política de seguridad ciudadana en Cali no basta con las cifras oficiales de un boletín trimestral, hace falta pulso en tiempo real de cómo se está hablando de la inseguridad en la ciudad, en radio, en redes sociales y en medios digitales. Este proyecto es un pipeline de scraping multifuente que recolecta, transcribe y agrega esas señales dispersas en un solo lugar consultable por API.

El sistema combina tres tipos de fuente que rara vez conviven en un mismo pipeline: portales de noticias locales (con parsing por selectores CSS específicos de cada medio), transmisiones de radio en vivo (transcritas automáticamente con Whisper) y plataformas sociales (YouTube, Instagram, Twitter vía Nitter y Facebook). El resultado se expone a través de una API REST en FastAPI que permite consultar artículos, lanzar jobs de scraping bajo demanda y seguir la transcripción de radio en tiempo real vía Server-Sent Events.

El caso de uso de fondo es de interés público: dar a un cliente gubernamental —la Secretaría de Seguridad y Justicia de Cali— visibilidad temprana sobre percepción ciudadana de seguridad, antes de que ese consenso emerja en indicadores oficiales que tardan semanas o meses en consolidarse.

## Arquitectura

El proyecto se organiza en capas con responsabilidades bien separadas, cada una desacoplable de las demás:

- **Capa de API** (`api/`): endpoints FastAPI que exponen el pipeline vía HTTP, gestionan jobs asíncronos en background y sirven la documentación interactiva (Swagger UI) para consumo por terceros.
- **Capa de scraping** (`src/scrapers/`): fetchers HTTP que combinan `requests`, `cloudscraper` (para sortear protecciones anti-bot tipo Cloudflare) y Selenium como fallback cuando el sitio requiere renderizado JavaScript.
- **Capa de parsing** (`src/parsers/`): extractores específicos por fuente, con selectores CSS adaptados a cada medio de noticias local.
- **Conectores sociales** (`src/social/`): integraciones dedicadas a YouTube, Instagram y Nitter (proxy libre de Twitter/X que evita las restricciones de la API oficial).
- **Módulo de radio** (`src/radio/`): monitoreo de streams de radio en vivo y transcripción automática con `faster-whisper`.
- **Enriquecimiento NLP** (`src/nlp/`): detección de barrio/ubicación, análisis de sentimiento y clasificación de tipo de incidente sobre el texto ya extraído, con fallback opcional a Ollama para inferencia local más avanzada.

El flujo de datos sigue un patrón lineal con puntos de control: **descubrimiento → fetch (HTML cacheado) → parsing (extracción CSS) → enriquecimiento NLP → almacenamiento JSON**. Un índice de artículos en `data/checkpoints/article_index.json` evita reprocesar contenido ya visto, lo cual importa cuando se hace scraping recurrente sobre las mismas fuentes varias veces al día.

La orquestación de qué se scrapea y cuándo vive en archivos de configuración YAML separados por tipo de fuente (`config/scraper_config.yaml` para ajustes globales, `config/sources/` por medio de noticias, `config/social_sources.yaml` y `config/radio_sources.yaml`), lo que permite añadir o desactivar una fuente sin tocar código.

## Stack técnico

| Tecnología | Rol en el proyecto |
| --- | --- |
| **FastAPI + Pydantic v2** | Capa de API REST, validación de payloads y documentación automática vía Swagger UI |
| **faster-whisper** | Transcripción de audio de radio en vivo a texto, optimizada para correr sin GPU dedicada |
| **yt-dlp** | Descarga y extracción de audio/metadata de contenido de YouTube para transcripción |
| **requests + cloudscraper** | Fetch HTTP estándar y bypass de protecciones anti-bot en portales de noticias |
| **Selenium** | Fallback para sitios que requieren renderizado JavaScript real |
| **APScheduler** | Programación de corridas automáticas del pipeline (por defecto, dos ventanas diarias) |
| **Ollama (opcional)** | Inferencia NLP local para enriquecimiento avanzado sin depender de APIs externas de pago |
| **Docker Compose** | Empaquetado del servicio con perfil opcional para levantar Ollama junto a la API |

La elección de FastAPI sobre Flask o Django responde a que el proyecto necesita async nativo para los jobs de scraping en background y tipado fuerte con Pydantic para validar la variedad de payloads que llegan de fuentes tan distintas entre sí. `faster-whisper` en lugar del Whisper original de OpenAI reduce el costo de cómputo de transcribir streams de radio de forma continua, un requisito no negociable cuando la fuente es audio en vivo y no un archivo grabado.

## Instalación

```bash
git clone https://github.com/Juanpgm/SYJ_webscrapper.git
cd SYJ_webscrapper

python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

El proyecto requiere Python 3.12+ y, para la transcripción de YouTube, Node.js (usado en la generación del PO Token que YouTube exige para descargas no autenticadas). ChromeDriver es opcional y solo se necesita si el scraping recurre al fallback de Selenium.

Variables de entorno típicas para credenciales por fuente (nombres exactos configurables en `config/social_sources.yaml` y equivalentes):

```bash
YOUTUBE_API_KEY=...
INSTAGRAM_SESSION_ID=...
NITTER_INSTANCE_URL=...
FACEBOOK_ACCESS_TOKEN=...
```

Para levantar la API en modo desarrollo:

```bash
python run_api.py --host 127.0.0.1 --port 8000 --reload
```

La documentación interactiva queda disponible en `http://localhost:8000/docs`. Alternativamente, el pipeline puede ejecutarse por línea de comandos sin la API (`python main.py --fecha-desde 01/01/2026 --fuentes el_pais_cali`) o dejarse corriendo bajo el scheduler automático (`python run_scheduler.py`), y todo el servicio puede empaquetarse con `docker-compose.yml`, que incluye un perfil opcional para levantar Ollama junto a la API.

## Decisiones de diseño

**Multifuente en lugar de un solo feed.** Depender de una única fuente —por ejemplo solo prensa digital— deja al sistema ciego ante conversación que ocurre primero en redes o en radio, y vulnerable a que esa fuente cambie su estructura HTML o cierre acceso. Combinar noticias, radio y redes da redundancia de señal: si una fuente falla o se retrasa, las demás sostienen la cobertura, y el cruce entre fuentes permite detectar cuándo un incidente reportado en radio empieza a replicarse en redes sociales, una señal de escalamiento que ninguna fuente aislada puede dar por sí sola.

**Transcripción de radio en vivo como fuente de primera clase.** La radio sigue siendo, en Cali, un canal donde la ciudadanía reporta y comenta inseguridad en tiempo real, antes de que ese contenido llegue a texto en cualquier otro medio. Tratar la radio como stream continuo transcrito (vía SSE) en lugar de como grabación procesada por lotes fue deliberado: el valor de la señal cae rápido con la latencia, y un pipeline batch de "transcribir al final del día" hubiera llegado sistemáticamente tarde para monitoreo operativo.

**Aceptar que el scraping social es frágil, y diseñar para eso.** Nitter como proxy de Twitter/X, o el login por cookies/OAuth que expone la API para YouTube, son soluciones que pueden romperse cuando la plataforma origen cambia su comportamiento. En vez de pretender que estas integraciones son estables, el diseño las aísla en conectores independientes (`src/social/`) con endpoints propios de autenticación (`/auth/youtube/cookies`, `/auth/youtube/login`, `/auth/youtube/po-token`), de forma que un conector caído no tumba el resto del pipeline ni bloquea las fuentes de noticias o radio.

**Checkpoints explícitos sobre reprocesamiento implícito.** Con un scheduler corriendo dos veces al día sobre las mismas fuentes, sin un índice de artículos ya vistos el sistema terminaría rehaciendo trabajo (y potencialmente saturando fuentes con rate limits agresivos) en cada corrida. El índice en `data/checkpoints/article_index.json` es una solución simple pero deliberada: barata de mantener, y suficiente para el volumen de fuentes del proyecto sin necesitar una base de datos dedicada para esa función.

## Aprendizajes

Construir este pipeline dejó una lección que se repite en cualquier proyecto de datos para el sector público: la fuente más valiosa casi nunca es la más limpia. Un feed RSS bien estructurado es fácil de consumir pero llega tarde y filtrado; la radio en vivo y las redes sociales son ruidosas, frágiles y requieren manejo activo de fallos, pero son las que de verdad capturan percepción ciudadana en el momento en que se está formando. Para un cliente como la Secretaría de Seguridad y Justicia de Cali, ese desfase entre "señal limpia y tardía" versus "señal ruidosa y oportuna" no es un detalle técnico: es la diferencia entre un reporte que confirma lo que ya se sabía y una alerta temprana que todavía permite actuar.
