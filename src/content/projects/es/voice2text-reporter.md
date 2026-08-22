---
title: "Voice2Text Reporter"
description: "Módulo FastAPI plug-and-play que graba una nota de voz, la transcribe localmente con faster-whisper, almacena el audio en S3 o disco y devuelve un reporte JSON."
projectId: "voice2text-reporter"
pubDate: 2026-08-21
draft: false
---

## Resumen

Voice2Text Reporter es un módulo de FastAPI diseñado para resolver un problema muy concreto: convertir una nota de voz en un registro estructurado y persistido, sin depender de una API de transcripción de pago y sin que el audio salga del servidor. Se graba una nota, se transcribe, se guarda el audio y se devuelve un JSON con el texto, el idioma detectado, la duración y la ubicación del archivo.

Su rasgo distintivo es que no es una aplicación cerrada sino una pieza reutilizable. Está pensado para acoplarse a cualquier proyecto FastAPI existente con una sola línea: importar el `router` y montarlo con `include_router()`. El módulo es autocontenido, lee toda su configuración de variables de entorno y no introduce estado global en la aplicación anfitriona. Esto lo convierte menos en un producto y más en un componente: algo que un equipo agrega a su backend cuando necesita capturar reportes hablados —por ejemplo, notas de inspección de campo dictadas desde un teléfono— y transformarlos en datos consultables.

La transcripción ocurre localmente con [faster-whisper](https://github.com/SYSTRAN/faster-whisper). Esto tiene una consecuencia directa sobre el problema que resuelve: no hay clave de API, no hay costo por minuto transcrito y ningún fragmento de audio se envía a un tercero. Para casos donde el contenido dictado es sensible o donde el volumen haría inviable pagar por transcripción externa, esa decisión es la razón misma por la que el módulo existe.

## Arquitectura

El módulo sigue un patrón de puertos y adaptadores (ports & adapters). La lógica pública vive en un `APIRouter` de FastAPI, y tanto el almacenamiento del audio como la persistencia del registro se resuelven a través de interfaces abstractas cuyas implementaciones concretas se eligen por variables de entorno, sin tocar código.

```
Cliente (nota de voz)
        │
        ▼
   APIRouter FastAPI  (voice2text/router.py)
        │
        ├── Transcriber → faster-whisper (transcripción local)
        │
        ├── Storage (BaseStorage ABC)
        │      ├── local_storage.py → sistema de archivos local
        │      └── s3_storage.py    → AWS S3
        │
        └── Repository (BaseRepository ABC)
               ├── json_repo.py     → archivo JSON (thread-safe)
               └── firebase_repo.py → Firestore
```

El flujo de una carga es lineal: el endpoint recibe el audio por `multipart/form-data`, el transcriptor lo procesa con Whisper, el backend de almacenamiento guarda el binario y el backend de repositorio persiste el registro con su marca de tiempo. La separación en dos ejes independientes —dónde vive el audio y dónde vive el metadato— permite combinaciones como disco local en desarrollo y S3 más Firestore en producción, seleccionadas solo por configuración.

El transcriptor se implementa como un singleton para no recargar el modelo de Whisper en cada solicitud, y las dependencias se resuelven mediante fábricas de inyección de dependencias con `lru_cache`. Los modelos de datos usan Pydantic v2. Junto al módulo reutilizable se incluye una aplicación FastAPI de ejemplo (`app/main.py`) que lo monta de forma autónoma para probarlo directamente.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework del módulo y del router | Permite exponer la funcionalidad como un `APIRouter` montable en cualquier app FastAPI, con validación Pydantic y documentación OpenAPI automática en `/docs` |
| **faster-whisper** | Transcripción de voz a texto | Corre 100% local: sin clave de API, sin costo por uso y sin que el audio salga del servidor; ofrece varios tamaños de modelo para equilibrar precisión y velocidad |
| **Whisper (modelos)** | Motor de reconocimiento | Buena precisión en español (WER de ~5–15% según el tamaño del modelo) y ejecución viable en CPU con cuantización `int8` |
| **AWS S3 / sistema de archivos** | Almacenamiento del audio | Backend intercambiable: disco local para desarrollo, S3 para producción, elegido por variable de entorno sin cambios de código |
| **JSON / Firebase Firestore** | Persistencia del registro | Archivo JSON sin dependencias para empezar, o Firestore cuando se necesita una base de datos gestionada; mismo contrato de repositorio |

## Instalación

El módulo se instala con sus dependencias directas. Requiere además `ffmpeg` disponible en el `PATH`, ya que faster-whisper lo usa para decodificar el audio.

```bash
pip install fastapi uvicorn[standard] python-multipart faster-whisper boto3 python-dotenv aiofiles
```

Instalación de `ffmpeg` según el sistema operativo:

```bash
# Windows
winget install FFmpeg

# macOS
brew install ffmpeg

# Ubuntu
apt install ffmpeg
```

La configuración se toma de un archivo `.env`. Los valores por defecto funcionan para desarrollo local sin cambios:

```bash
cp .env.example .env
```

La aplicación de ejemplo se levanta con Uvicorn, y la documentación interactiva queda disponible en `/docs`:

```bash
uvicorn app.main:app --reload
```

Para integrarlo en un proyecto FastAPI propio bastan dos líneas: importar el router y montarlo bajo el prefijo deseado.

```python
from fastapi import FastAPI
from voice2text import router

app = FastAPI()
app.include_router(router, prefix="/voice")
```

Toda la personalización —modelo de Whisper, dispositivo (`cpu`/`cuda`), backend de almacenamiento y de repositorio, zona horaria, orígenes CORS— se controla por variables de entorno documentadas en el README del repositorio.

## Decisiones de diseño

**Transcripción local en vez de una API externa.** La decisión que define el proyecto es no depender de un servicio de transcripción de pago. Al usar faster-whisper en el propio servidor se elimina el costo por minuto, la necesidad de gestionar una clave de API y, sobre todo, el envío de audio potencialmente sensible a un tercero. El precio de esa decisión es el cómputo local, que el proyecto mitiga ofreciendo modelos de distintos tamaños y cuantización `int8` para que la ejecución en CPU siga siendo práctica.

**Puertos y adaptadores para almacenamiento y persistencia.** En lugar de acoplar el módulo a S3 o a Firestore, cada responsabilidad se define como una clase base abstracta con implementaciones intercambiables. Esto permite empezar con el par más simple —disco local y archivo JSON, sin infraestructura ni dependencias de nube— y pasar a S3 y Firestore en producción cambiando solo variables de entorno. La lógica del router no sabe ni le importa dónde terminan los datos.

**Módulo montable, no aplicación monolítica.** Exponer la funcionalidad como un `APIRouter` autocontenido, que no agrega estado global y se monta con `include_router()`, es una decisión pensada para la reutilización. Convierte la captura de notas de voz en una capacidad que se añade a un backend existente, en vez de un servicio separado que haya que desplegar y coordinar aparte.

**Compatibilidad con las condiciones reales de captura.** El módulo comprime el audio con gzip antes de subirlo (~40% de reducción de tamaño) y maneja el tipo MIME `video/mp4` que generan las notas de voz de Safari en iOS. Son detalles pequeños, pero apuntan a que la captura ocurre desde teléfonos móviles y con ancho de banda limitado, no desde un entorno controlado.

## Aprendizajes

Voice2Text Reporter demuestra el valor de diseñar una funcionalidad como componente y no como aplicación. Al combinar transcripción local —que resuelve costo y privacidad de raíz— con un patrón de puertos y adaptadores para el almacenamiento y la persistencia, el resultado es una pieza que se acopla a proyectos muy distintos sin reescribir nada: solo importar un router y ajustar variables de entorno. Es un recordatorio de que las decisiones de arquitectura más útiles no siempre son las más visibles, sino las que hacen que el mismo código sirva sin fricción en escenarios que no se anticiparon.
