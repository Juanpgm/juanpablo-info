---
title: "Gestor Educativo"
description: "Backend FastAPI para expedientes educativos: PostgreSQL asíncrono, autenticación JWT, cifrado de datos personales con Fernet y generación de documentos vía OCR + LLM."
projectId: "gestor-educativo"
pubDate: 2026-08-21
draft: false
---

## Resumen

Gestor Educativo es un backend para la gestión de expedientes educativos: las notas, diplomas y certificados que una institución emite y custodia sobre sus estudiantes. El proyecto se inspira en [Parchment](https://www.parchment.com/), la plataforma que digitaliza la emisión y verificación de credenciales académicas, y ataca el mismo problema: convertir un proceso históricamente manual —llenar plantillas, firmar, sellar, archivar y luego demostrar que un documento es auténtico— en un flujo digital, trazable y verificable.

El núcleo del sistema es doble. Por un lado gestiona los datos: guarda de forma estructurada la información de estudiantes y sus registros académicos, con la particularidad de que los datos personales sensibles se almacenan cifrados. Por otro lado genera los documentos: toma esa información y produce diplomas y certificados a partir de plantillas, e incorpora un pipeline que combina OCR y un modelo de lenguaje para asistir el llenado a partir de documentos existentes.

El problema real que resuelve es la brecha entre "el dato académico" y "el documento oficial verificable". Un certificado educativo no vale solo por lo que dice, sino por poder demostrar que lo emitió quien dice haberlo emitido y que no fue alterado. Por eso el sistema no se limita a rellenar una plantilla: cada documento generado queda asociado a un mecanismo de verificación por hash y código QR, de modo que un tercero pueda comprobar su validez sin depender de un trámite manual.

## Arquitectura

El servicio es una API REST sobre FastAPI, organizada en capas claras: los routers de la API delegan en servicios de negocio, que a su vez operan sobre modelos ORM persistidos en PostgreSQL de forma asíncrona.

```
Cliente / institución
        │
        ▼
   FastAPI (app/main.py)
        │
        ├── api/v1/        → 9 routers REST
        │
        ├── services/      → lógica de negocio
        │                    (auth, certificación, email, documentos)
        │
        ├── template_agent/→ pipeline OCR → LLM → plantilla
        │        (Tesseract → OpenAI → docxtpl sobre templates/*.docx)
        │
        ├── models/        → 11 modelos SQLAlchemy (async)
        │        │
        │        ▼
        │   PostgreSQL 16 (asyncpg)  ← alembic gestiona migraciones
        │
        └── utils/         → cifrado de datos personales (Fernet)
```

FastAPI actúa como capa de orquestación y validación: los esquemas Pydantic definen y validan la forma de cada solicitud y respuesta, y la configuración del servicio se centraliza en `config.py` mediante `BaseSettings`. La persistencia se hace con SQLAlchemy 2.0 en modo asíncrono sobre `asyncpg`, y el esquema de la base de datos evoluciona a través de migraciones gestionadas con Alembic.

La generación de documentos vive en un subsistema propio, `template_agent`, que encadena tres etapas: OCR con Tesseract para extraer texto de documentos de entrada, un modelo de lenguaje de OpenAI para interpretar y estructurar ese texto, y `docxtpl` para volcar el resultado sobre plantillas `.docx`. Ese pipeline está separado de la lógica de negocio general precisamente porque es el punto donde convergen tres dependencias externas distintas y donde conviene aislar el costo y la latencia del LLM del resto de la API.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework de la API | Validación con Pydantic, documentación automática en `/docs` y rendimiento asíncrono adecuado para un servicio I/O-bound que consulta base de datos y servicios externos |
| **PostgreSQL 16 + asyncpg** | Base de datos operativa | Base relacional robusta para datos académicos estructurados y con relaciones; `asyncpg` habilita acceso asíncrono sin bloquear el event loop |
| **SQLAlchemy 2.0 (async)** | ORM | API asíncrona moderna que integra con `asyncpg` y mantiene el modelo de datos en código tipado (11 modelos) |
| **JWT (HS256) + bcrypt** | Autenticación | Tokens firmados para sesiones sin estado y hashing de contraseñas con bcrypt; base para el control de acceso por roles |
| **Fernet (AES-128-CBC)** | Cifrado de datos personales | Cifrado simétrico autenticado para proteger PII en reposo dentro de la base de datos |
| **docxtpl + Tesseract OCR + OpenAI** | Generación de documentos | Plantillas `.docx` rellenadas programáticamente, alimentadas por un pipeline OCR + LLM que extrae e interpreta datos de documentos de entrada |
| **Gmail API (OAuth2)** | Envío de correo | Entrega de documentos vía la API de Gmail con OAuth2, sin gestionar un servidor SMTP propio |
| **Docker + Railway** | Despliegue | Empaquetado reproducible con Docker Compose y despliegue gestionado en Railway |

## Instalación

El camino recomendado usa Docker Compose, que levanta la API junto con sus dependencias:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Juanpgm/gestor_educativo
cd gestor_educativo

# 2. Copiar el archivo de entorno y completarlo con tus valores
cp secrets/.env.example secrets/.env

# 3. Levantar los servicios
docker compose up -d

# 4. Aplicar las migraciones de base de datos
docker compose exec app alembic upgrade head
```

Con eso, la API queda disponible en `http://localhost:8000`, la documentación interactiva en `http://localhost:8000/docs` y PgAdmin en `http://localhost:5050`. Los valores concretos de configuración (credenciales, claves y secretos) viven en `secrets/.env` y se cargan desde `config.py`.

Para desarrollo local sin Docker:

```bash
python -m venv .venv
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install -e ".[dev]"
make dev
```

## Decisiones de diseño

**Cifrado de PII en reposo con Fernet.** Un expediente educativo contiene datos personales que no deberían quedar en texto plano en la base de datos. El proyecto cifra esa información sensible con Fernet (AES-128-CBC autenticado) a través de utilidades dedicadas en `utils/`, de modo que un acceso directo a la base no expone los datos personales. Es una decisión que asume el costo de cifrar y descifrar en el camino a cambio de una garantía concreta sobre el dato en reposo.

**Verificación de documentos por hash + QR, no por confianza en el emisor.** La certificación no se apoya en que "el documento parezca oficial", sino en un mecanismo comprobable: cada documento generado queda asociado a un hash y un código QR que permiten verificar su autenticidad e integridad de forma independiente. Esto convierte la verificación en un acto técnico y no en un trámite manual, que es exactamente el valor que aporta una plataforma de credenciales frente a un PDF suelto.

**El pipeline OCR → LLM → plantilla aislado en su propio subsistema.** Llenar documentos a partir de material existente combina tres dependencias externas —Tesseract, OpenAI y las plantillas `docxtpl`— con perfiles de costo y latencia muy distintos al resto de la API. Encapsular ese flujo en `template_agent`, separado de los servicios de negocio, mantiene el resto del sistema simple y localiza en un solo lugar la lógica más cara y variable; no en vano el propio proyecto contempla un seguimiento de costo del LLM.

**PostgreSQL asíncrono en toda la ruta.** Los datos académicos son relacionales por naturaleza (estudiantes, registros, documentos, roles), lo que justifica una base relacional en lugar de un almacén documental. La elección de `asyncpg` con SQLAlchemy 2.0 en modo asíncrono evita que las consultas a base de datos bloqueen el event loop de FastAPI, coherente con un servicio que además hace llamadas de red a OpenAI y a la API de Gmail.

## Aprendizajes

Gestor Educativo muestra que un sistema de credenciales no es un CRUD más: el valor no está solo en guardar datos, sino en poder demostrar después que un documento es auténtico y que el dato personal estuvo protegido en todo momento. Esa exigencia empuja decisiones concretas —cifrar la PII en reposo, verificar por hash y QR en vez de por apariencia, y aislar el pipeline de generación con su costo asociado— que solo tienen sentido cuando se toma en serio que el producto final es un documento oficial verificable, no una fila en una tabla.
