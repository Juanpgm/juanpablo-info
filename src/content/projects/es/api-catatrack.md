---
title: "API CataTrack"
description: "Backend FastAPI para el artefacto de captura CataTrack del DAGMA: Firestore en tiempo real, fotos en Amazon S3, coordenadas GPS y métricas Prometheus."
projectId: "api-catatrack"
pubDate: 2026-08-21
draft: false
---

## Resumen

CataTrack es el artefacto de captura de campo del DAGMA, el Departamento Administrativo de Gestión del Medio Ambiente de Cali. Esta API es el backend que sostiene ese artefacto: el servicio que recibe, valida y almacena lo que se registra desde el terreno durante una visita ambiental — coordenadas geoespaciales, fotografías de reconocimiento y datos operativos del grupo de trabajo.

No es una aplicación de cara al ciudadano, sino infraestructura interna. Su función es cerrar la brecha entre "lo que pasó en el sitio" y "lo que queda registrado": centralizar en una sola API la captura de datos estructurados, la geolocalización y la evidencia fotográfica, de modo que el dato de campo llegue completo y trazable en lugar de reconstruirse después a partir de fotos sueltas y coordenadas transcritas a mano.

El proyecto parte de la arquitectura de un servicio previo (`gestor_proyecto_api`) y la especializa para el flujo de captura del DAGMA. Expone endpoints organizados por dominio y se apoya en servicios gestionados para cada tipo de dato, con la documentación interactiva generada automáticamente por FastAPI.

## Arquitectura

El servicio es una API REST sobre FastAPI que delega el almacenamiento a tres piezas externas, cada una especializada en un tipo de dato distinto:

```
Cliente de campo (artefacto de captura CataTrack)
        │
        ▼
   FastAPI (app/main.py)
        │
        ├── Firebase / Firestore → datos estructurados en tiempo real
        │                          (reconocimientos, reportes, usuarios)
        │
        ├── Amazon S3           → fotografías de reconocimiento
        │                          (binarios pesados, fuera de Firestore)
        │
        └── Prometheus          → métricas del servicio (/metrics)
```

FastAPI actúa como capa de orquestación y agrupa sus endpoints por dominio: salud del servicio (`/ping`, `/health`, `/cors-test`, `/test/utf8`), estado de la integración con Firebase (`/firebase/status`, `/firebase/collections`, `/firebase/collections/summary`), operación del artefacto de captura (`/init/parques`, `/registrar-visita/`, `/grupo-operativo/reportes`, `/grupo-operativo/eliminar-reporte`, `/centros-gestores/nombres-unicos`) y administración y control de accesos (`/auth/login`, `/auth/register`, `/auth/validate-session`, `/auth/change-password`, `/auth/google`, `/admin/users`).

La separación entre Firestore y S3 no es incidental: los metadatos y el estado operativo necesitan lectura/escritura rápida y sincronización en tiempo real, mientras que las fotos son objetos binarios grandes que no deberían viajar por la misma vía que las consultas estructuradas. Firestore se apoya en la colección `reconocimientos_dagma` para los datos de campo, y Prometheus se sitúa por encima de todo el servicio como capa de observabilidad, sin intervenir en la lógica de negocio.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework de la API | Alto rendimiento, tipado con Pydantic y documentación Swagger/ReDoc generada automáticamente; adecuado para operaciones I/O-bound como llamadas a Firestore y S3 |
| **Firebase / Firestore** | Base de datos operativa | Sincronización en tiempo real entre clientes sin infraestructura de websockets propia; encaja con datos semiestructurados de un reconocimiento de campo |
| **Amazon S3** | Almacenamiento de fotografías | Almacenamiento de objetos duradero y desacoplado de la base de datos operativa, para binarios pesados fuera de Firestore |
| **Prometheus** | Métricas y monitoreo | Exposición de métricas en formato estándar vía `/metrics`, consumible por cualquier stack de observabilidad sin acoplar el servicio a un proveedor específico |

## Instalación

Pasos para levantar el servicio en un entorno local:

```bash
git clone https://github.com/Juanpgm/api-catatrack.git
cd api-catatrack

python -m venv venv
venv\Scripts\activate   # En Windows. En Linux/macOS: source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Editar .env con las credenciales de Firebase y AWS
```

La configuración de Firebase requiere un proyecto en Firebase Console y su archivo de credenciales, referenciado desde `.env`:

```bash
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
```

Para las fotografías se necesita un bucket de S3 y las credenciales de AWS:

```bash
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=360-dagma-photos
```

Con las variables configuradas, el servicio se levanta con:

```bash
uvicorn app.main:app --reload
```

La documentación interactiva queda disponible automáticamente en `http://localhost:8000/docs` (Swagger UI) y `http://localhost:8000/redoc`, generada por FastAPI a partir de los modelos Pydantic del proyecto.

## Decisiones de diseño

**S3 separado de la base de datos, no fotos en Firestore.** Firestore está pensado para documentos estructurados, no para servir binarios pesados de forma eficiente. Separar el almacenamiento de fotografías en S3 mantiene las consultas a Firestore rápidas y baratas, y permite aplicar a las imágenes políticas propias del almacenamiento de objetos — control de acceso, ciclo de vida — sin afectar el rendimiento de las consultas operativas.

**Firestore en tiempo real para el estado operativo.** Los datos de un reconocimiento de campo son semiestructurados y se benefician de la sincronización en tiempo real de Firestore: un coordinador puede ver el estado operativo actualizarse sin construir un canal de websockets aparte. La colección `reconocimientos_dagma` concentra ese flujo de campo.

**Soporte UTF-8 explícito.** El servicio trata los caracteres especiales del español como un requisito de primer orden — con un endpoint de prueba (`/test/utf8`) dedicado a verificarlo. En un sistema que registra nombres de predios, observaciones y reportes en español, la pérdida de acentos o eñes degrada directamente la calidad del dato ambiental.

**Métricas Prometheus en vez de logging ad hoc.** Exponer el estado del servicio en formato Prometheus (`/metrics`), en lugar de registrar eventos solo en logs de texto, permite que cualquier stack de monitoreo estándar consuma la salud y la carga del servicio sin acoplarlo a una herramienta propietaria — algo relevante para un servicio de captura de campo con conectividad intermitente.

## Aprendizajes

CataTrack muestra cómo especializar una arquitectura previa (`gestor_proyecto_api`) para un dominio concreto sin reinventarla: reutiliza el andamiaje de FastAPI, Firebase y S3 y lo adapta al flujo de captura ambiental del DAGMA. La lección central es la misma que en cualquier software de campo — separar bien el dato estructurado de la evidencia fotográfica, cuidar la codificación del texto y exponer el estado de salud del servicio no son extras, sino condiciones para que el dato ambiental capturado en terreno sea confiable y auditable después.
