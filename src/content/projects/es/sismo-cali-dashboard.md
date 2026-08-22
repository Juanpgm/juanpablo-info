---
title: "Sismo Cali Dashboard"
description: "Dashboard estático en Leaflet para las inspecciones de habitabilidad tras el sismo de agosto de 2026 en Cali, alimentado por un pipeline en Python que limpia y publica los datos de campo."
projectId: "sismo-cali-dashboard"
pubDate: 2026-08-21
draft: false
---

## Resumen

El 10 de agosto de 2026 un sismo afectó a Cali y desencadenó un proceso de emergencia: evaluar qué edificaciones seguían siendo habitables. Ese trabajo se realiza mediante inspecciones EDE (habitabilidad de edificaciones), donde equipos en terreno visitan predios y registran el estado de cada estructura en un formulario. El resultado es un flujo constante de datos de campo que alguien tiene que consolidar y mostrar para que la respuesta a la emergencia se coordine sobre información real, no sobre percepciones.

Sismo Cali Dashboard es la pieza que cierra ese flujo del lado de la visualización. Es un tablero de mapa que muestra dónde se han hecho inspecciones y qué encontraron, para que quienes coordinan la emergencia puedan ver la situación de la ciudad de un vistazo. El dato de origen es un Excel de encuesta que se va llenando con las visitas; el dashboard lo convierte en un mapa consultable y actualizable.

El problema concreto que resuelve es el desfase entre un archivo de encuesta en bruto —crudo, con nombres de barrios mal codificados y columnas sin depurar— y una vista que un equipo de emergencia pueda leer en segundos. En medio de una emergencia no hay tiempo para abrir la hoja de cálculo, limpiarla a mano y ubicar cada registro; el sistema automatiza ese salto y deja el mapa actualizándose por sí solo.

## Arquitectura

El proyecto separa de forma deliberada dos mundos: un pipeline de datos en Python que corre fuera de línea y un frontend estático que no tiene backend. El frontend no consulta ninguna API en tiempo de ejecución; solo carga archivos JSON/GeoJSON precomputados que el pipeline dejó listos.

```
Google Drive (Excel de encuesta en bruto)
        │
        ▼
   scripts/ (pipeline Python)
        ├── prepare_basemaps.py  → simplifica los geojson base (12MB → <1MB),
        │                          repara mojibake en nombres de barrio
        ├── refresh_data.py      → descarga el xlsx, aplica la limpieza de
        │                          data_cleaning.ipynb, hace el cruce espacial
        │                          comuna/barrio y escribe los JSON de salida
        └── basemap_utils.py     → lógica compartida de extracción de nombres
                                   y reparación de mojibake
        │
        ▼
   web/data/ (inspections.json + meta.json + geojson)
        │
        ▼
   web/ (sitio estático Leaflet, sin build) → Vercel
```

El orden importa: `prepare_basemaps.py` se ejecuta una sola vez para dejar los mapas base ligeros y con los nombres corregidos, y debe correr antes que `refresh_data.py`. La fuente de verdad de la limpieza de columnas es el notebook `data_cleaning.ipynb`; `refresh_data.py` aplica exactamente ese contrato de limpieza, de modo que el criterio de depuración vive en un solo lugar.

El frontend en `web/` es un sitio estático con Leaflet y sin paso de build: se despliega tal cual a Vercel. El botón "Actualizar datos" de la interfaz vuelve a pedir el JSON publicado con cache-busting, así que los datos nuevos aparecen después de cada despliegue, sin recargar la página ni depender de un servidor propio.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python** | Pipeline de datos | Limpia el Excel de encuesta, hace el cruce espacial comuna/barrio y genera los JSON/GeoJSON que consume el mapa; corre fuera de línea, desacoplado del frontend |
| **Leaflet** | Mapa interactivo | Librería de mapas ligera que funciona sobre un sitio estático sin necesidad de build ni de infraestructura de servidor |
| **GeoJSON** | Datos geográficos | Formato estándar para las capas base (comunas, barrios, ejes viales) y los puntos de inspección; se sirve como archivo estático directamente al navegador |
| **Vercel** | Hosting y despliegue | Publica el sitio estático tal cual y permite redesplegar automáticamente tras cada actualización de datos |

## Instalación

El pipeline se ejecuta con los scripts de Python del repositorio. El primer paso, una sola vez, es preparar los mapas base; después se refrescan los datos:

```bash
git clone https://github.com/Juanpgm/sismo-cali-dashboard.git
cd sismo-cali-dashboard

# Una sola vez: simplifica los geojson base y repara nombres de barrio
python scripts/prepare_basemaps.py

# Refresco puntual (usa Drive si está disponible; si no, cae al xlsx local):
python scripts/refresh_data.py

# Refresco cada hora + redeploy automático a producción en Vercel:
python scripts/refresh_data.py --loop 3600 --deploy
```

Para el refresco automático desde Google Drive el archivo debe ser accesible. El README plantea dos vías: compartir la carpeta/archivo como "cualquiera con el enlace puede ver" (sin credenciales), o usar una cuenta de servicio compartiendo la carpeta con la cuenta indicada, descargando su clave JSON y exportando `GOOGLE_APPLICATION_CREDENTIALS` antes de correr el script (requiere `pip install google-api-python-client google-auth`). Si el archivo de Drive no está compartido, el script cae automáticamente al xlsx local.

El despliegue del sitio se hace desde la carpeta `web/`:

```bash
cd web
vercel deploy --prod --yes
```

## Decisiones de diseño

**Frontend estático sin backend.** El dashboard no expone ni consume una API en tiempo de ejecución: solo carga JSON precomputados. Para una emergencia esto es una ventaja de fiabilidad —no hay servidor de aplicación que pueda caerse bajo carga, y el sitio se sirve desde el CDN de Vercel— y de simplicidad: toda la lógica pesada (limpieza, cruce espacial) ocurre en el pipeline, no en el navegador de quien consulta el mapa.

**El notebook como fuente de verdad de la limpieza.** El contrato de limpieza de columnas vive en `data_cleaning.ipynb`, y `refresh_data.py` aplica exactamente esa misma limpieza. Mantener un único criterio de depuración evita que el script de producción y el análisis exploratorio se desincronicen y produzcan mapas distintos a partir del mismo Excel.

**Mapas base preprocesados una sola vez.** Los geojson base originales pesan alrededor de 12MB; `prepare_basemaps.py` los simplifica a menos de 1MB antes de servirlos. Al ser un paso previo y no algo que ocurra en cada refresco, el peso que llega al navegador se reduce sin repetir el trabajo en cada actualización. El mismo paso repara el mojibake de los nombres de barrio, un problema de codificación de caracteres que de otro modo se arrastraría a toda la visualización.

**Exclusión de PII en el dato publicado.** El pipeline deja fuera del JSON publicado las columnas con información personal identificable (`email`, `telefono`, `nombre_contacto`, `cod_predial_catastral`, `matricula_profesional`). El dashboard necesita mostrar dónde y en qué estado están las edificaciones, no los datos personales de los contactos; excluir esas columnas en origen —y no solo ocultarlas en la interfaz— asegura que el dato sensible nunca llega al archivo estático que cualquiera puede descargar.

## Aprendizajes

Este proyecto muestra que un tablero útil para una emergencia no necesita una arquitectura pesada: necesita que el dato en bruto llegue limpio, geolocalizado y sin información sensible a una vista que se lea rápido. Separar el trabajo caro en un pipeline offline y dejar que el frontend sea un simple sitio estático hace el sistema más difícil de romper justo cuando más importa que no se rompa, y trasladar la exclusión de PII al origen convierte una buena intención de privacidad en una garantía técnica.
