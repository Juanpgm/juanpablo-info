---
title: "API Artefacto 360 DAGMA"
description: "Backend FastAPI para captura de campo ambiental: Firestore en tiempo real, fotos en S3, coordenadas GPS y métricas Prometheus."
projectId: "dagma-360-api"
pubDate: 2026-08-11
draft: false
---

## Resumen

DAGMA es la Dirección Administrativa de Gestión del Medio Ambiente de Cali, la entidad responsable de vigilar y hacer cumplir la normativa ambiental en la ciudad. Parte de ese trabajo ocurre en campo: inspectores que visitan predios, cuerpos de agua o zonas de riesgo, documentan hallazgos con fotografías, registran su ubicación exacta y generan reportes que luego alimentan procesos administrativos y legales.

La API Artefacto 360 DAGMA es el backend que sostiene ese flujo de captura. Es el servicio que recibe, valida y almacena lo que un inspector registra desde el terreno: coordenadas GPS, fotos de reconocimiento y datos operativos del grupo de trabajo, todo disponible en tiempo real para quienes coordinan las operaciones desde oficina. No es una aplicación de cara al ciudadano; es infraestructura interna, pensada para que el dato de campo llegue completo, con evidencia fotográfica trazable y sin fricción para el usuario que lo captura, muchas veces con conectividad limitada.

El problema real que resuelve es la brecha entre "lo que pasó en el sitio" y "lo que queda registrado". Antes de una herramienta así, esa brecha se llena con fotos sueltas, coordenadas transcritas a mano o reportes que se arman días después de la visita, con la pérdida de precisión que eso implica. Centralizar captura, geolocalización y evidencia fotográfica en una sola API reduce ese margen de error y deja un registro auditable desde el primer momento.

## Arquitectura

El servicio sigue un diseño de API REST convencional sobre FastAPI, con tres piezas externas especializadas cada una en un tipo de dato distinto:

```
Cliente de campo (app/dispositivo del inspector)
        │
        ▼
   FastAPI (app/main.py)
        │
        ├── Firestore  → datos estructurados en tiempo real
        │                (reconocimientos, reportes, sesiones,
        │                 usuarios, estado operativo)
        │
        ├── Amazon S3  → fotografías de reconocimiento
        │                (binarios pesados, fuera de Firestore)
        │
        └── Prometheus → métricas de salud y uso del servicio
```

FastAPI actúa como capa de orquestación: valida cada solicitud, verifica el token de identidad Firebase, decide si el dato va a Firestore o a S3, y expone endpoints agrupados por dominio — salud del servicio (`/ping`, `/health`), estado de la integración con Firebase (`/firebase/status`, `/firebase/collections`), operación propiamente dicha (`/grupo-operativo/reconocimiento`, `/grupo-operativo/reportes`), autenticación (`/auth/login`, `/auth/register`, `/auth/validate-session`) y administración (`/admin/users`).

La separación entre Firestore y S3 no es incidental: los metadatos y el estado operativo necesitan lectura/escritura rápida y sincronización entre varios usuarios viendo el mismo panel a la vez, mientras que las fotos son objetos binarios grandes que no deberían viajar por la misma vía que las consultas estructuradas. Prometheus se apoya encima de todo el servicio como capa de observabilidad, sin intervenir en la lógica de negocio.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework de la API | Tipado con Pydantic, generación automática de documentación Swagger/ReDoc, y rendimiento asíncrono adecuado para operaciones I/O-bound como llamadas a Firestore y S3 |
| **Firebase / Firestore** | Base de datos operativa | Sincronización en tiempo real entre clientes sin infraestructura de websockets propia; encaja con la naturaleza de datos semiestructurados de un reconocimiento de campo |
| **Firebase Auth** | Autenticación | Verificación de identidad delegada, con soporte de emulador para desarrollo local sin tocar credenciales de producción |
| **Amazon S3** | Almacenamiento de fotografías | Almacenamiento de objetos económico y duradero, desacoplado de la base de datos operativa |
| **Prometheus** | Métricas y monitoreo | Exposición de métricas en formato estándar, integrable con cualquier stack de observabilidad existente sin acoplar el servicio a un proveedor específico |

## Instalación

Pasos estándar para levantar el servicio en un entorno local:

```bash
git clone https://github.com/Juanpgm/api-artefacto-360-dagma.git
cd api-artefacto-360-dagma

python -m venv venv
source venv/bin/activate   # En Windows: venv\Scripts\activate

pip install -r requirements.txt
```

El servicio necesita un archivo `.env` con las credenciales de Firebase y AWS:

```bash
FIREBASE_CREDENTIALS_PATH=./credentials/serviceAccountKey.json
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=360-dagma-photos

# Solo para desarrollo local, nunca en producción:
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

Con las variables configuradas, el servicio se levanta con:

```bash
uvicorn app.main:app --reload
```

La documentación interactiva queda disponible automáticamente en `/docs` (Swagger) y `/redoc`, generada por FastAPI a partir de los modelos Pydantic del proyecto.

## Decisiones de diseño

**Firestore antes que una base relacional.** Los datos de un reconocimiento de campo no siguen un esquema rígido y predecible: varían según el tipo de hallazgo, el operativo y lo que el inspector necesite registrar en el momento. Forzar eso a un esquema SQL fijo habría significado migraciones constantes o columnas genéricas tipo `campo_extra_1`. Firestore permite que el documento crezca con el caso de uso real, y su sincronización en tiempo real es directamente aprovechable para que un coordinador vea el estado operativo actualizarse sin necesidad de refrescar ni de construir un canal de websockets aparte.

**S3 separado de la base de datos, no fotos en Firestore.** Firestore tiene límites de tamaño de documento y no está pensado para servir binarios pesados de forma eficiente. Separar el almacenamiento de fotos en S3 mantiene las consultas a Firestore rápidas y baratas, y permite aplicar a las imágenes políticas propias de almacenamiento de objetos — control de acceso, ciclo de vida, posible integración futura con un CDN — sin que eso afecte el rendimiento de las consultas operativas.

**Sin modo de verificación de token opcional.** El proyecto exige verificación estricta del ID token de Firebase, sin una ruta alterna que la omita "por ahora" en producción. Es una decisión deliberadamente poco flexible: en un sistema que alimenta procesos administrativos y potencialmente legales de una entidad ambiental, dejar una puerta de acceso sin autenticar — aunque sea temporal, aunque sea "solo para pruebas" — es el tipo de atajo que termina llegando a producción. El emulador de Firebase Auth resuelve la necesidad real de desarrollar sin tocar credenciales reales, sin sacrificar esa garantía.

**Prometheus en vez de logging ad hoc.** Exponer métricas en formato Prometheus, en lugar de simplemente registrar eventos en logs de texto, permite que cualquier stack de monitoreo estándar (Grafana u otro) consuma el estado del servicio sin acoplarlo a una herramienta propietaria. Para un servicio que corre en campo con conectividad intermitente, saber si el servicio está saludable, cuánta carga recibe y si Firestore o S3 están respondiendo con normalidad es una necesidad operativa, no un extra.

## Aprendizajes

Construir este servicio deja una lección clara: el software que soporta trabajo de campo se valida contra las condiciones del campo, no contra las del escritorio. Un inspector no tiene tiempo ni conectividad estable para reintentar una carga fallida cinco veces; un dato mal capturado en terreno no siempre es recuperable después. Eso empuja decisiones muy concretas — separar bien lo que es dato estructurado de lo que es evidencia fotográfica, no negociar la autenticación, exponer el estado de salud del servicio de forma explícita — que en un proyecto de escritorio podrían parecer sobreingeniería, pero que aquí son la diferencia entre un reporte ambiental confiable y uno que nadie puede auditar después.
