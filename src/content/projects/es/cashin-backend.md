---
title: "CashIn Backend"
description: "Backend AI-agent-first para automatizar cuentas de cobro de contratistas en Colombia: FastAPI, motor de agentes propio sobre LiteLLM, PostgreSQL con pgvector y arquitectura Ports & Adapters."
projectId: "cashin-backend"
pubDate: 2026-08-21
draft: false
---

## Resumen

En Colombia, un contratista que factura por prestación de servicios no emite una factura tradicional: emite una cuenta de cobro. Es un documento recurrente, mensual en muchos casos, que exige recopilar los mismos datos una y otra vez, generarlo en el formato correcto y hacerle seguimiento hasta el pago. Ese trabajo administrativo, repetitivo y de bajo valor, es exactamente el tipo de tarea que un agente de IA puede absorber.

CashIn Backend es el servicio que sostiene esa automatización. Está construido con una filosofía "AI-agent-first": no es una API tradicional a la que se le añadió IA como accesorio, sino un backend cuyo núcleo es un motor de agentes que orquesta la generación de documentos, la integración con Google (Gmail, Drive, Calendar), la consulta de contratos públicos y el cobro. El objetivo es que el flujo completo —desde reunir la información hasta entregar y cobrar la cuenta— pueda ejecutarse con la mínima intervención manual posible.

El servicio se apoya en fuentes y capacidades muy concretas del contexto colombiano: consulta SECOP II (el sistema de contratación pública) a través de la API Socrata de datos abiertos, genera los documentos en PDF y DOCX a partir de plantillas, extrae texto de documentos escaneados por OCR e integra Wompi como pasarela de pago local. Es infraestructura interna orientada al contratista, no una aplicación de cara al público general.

## Arquitectura

El flujo de una petición atraviesa capas bien delimitadas, desde el borde HTTP hasta el motor de agentes y sus dependencias:

```
HTTP Request
   │
   ▼
FastAPI (api/v1/)
   │
   ▼
Service Layer (services/)
   │
   ▼
Agent Engine (CompiledGraph)
   │
   ├── LLM      (vía LiteLLM: Gemini → Groq → Ollama)
   ├── DB       (PostgreSQL + pgvector opcional)
   └── Storage  (S3-compatible: MinIO dev / R2 prod)
```

El corazón del sistema es un motor de agentes propio: una clase `CompiledGraph` implementada en `app/agent/engine.py`, en lugar de depender de frameworks de orquestación de agentes de terceros. Sobre ese motor, LiteLLM funciona como capa de abstracción de modelos de lenguaje, lo que permite hablar con más de cien modelos distintos detrás de una misma interfaz.

La pieza que hace que el resto encaje es una arquitectura de Puertos y Adaptadores (Ports & Adapters), pensada para ser agnóstica del proveedor de nube. Cada dependencia externa —LLM, almacenamiento, correo, Drive, calendario— se define como un puerto (un `Protocol` de Python) con uno o más adaptadores concretos:

```
app/adapters/
├── llm/       port.py (LLMPort)      + litellm_adapter.py   (Gemini → Groq → Ollama)
├── storage/   port.py (StoragePort)  + s3_adapter.py        (MinIO dev / R2 prod)
├── email/     port.py (EmailPort)    + gmail_adapter.py     (OAuth 2.0 + tokens cifrados con Fernet)
├── drive/     port.py (DrivePort)    + drive_adapter.py     (Google Drive API)
└── calendar/  port.py (CalendarPort) + gcal_adapter.py      (Google Calendar API)
```

La regla que sostiene el diseño es explícita: el núcleo (`services/`, `agent/`, `models/`) nunca importa SDKs de nube directamente. Toda dependencia externa pasa por un puerto. Es lo que permite que el MVP corra en Railway sin dependencia de AWS, GCP o Azure, y que una futura migración de nube no toque la lógica de negocio.

El agente extiende sus capacidades mediante servidores MCP (Model Context Protocol), construidos sobre el SDK de Anthropic. Cada servidor expone un conjunto de herramientas: `gmail_server.py` (buscar, leer y enviar correos), `drive_server.py` (subir, listar y crear carpetas) y `calendar_server.py` (listar y consultar eventos). Se registran en `mcp_servers/mcp_config.json`.

## Stack técnico

> El README marca su tabla de stack como histórica/aspiracional; las filas siguientes reflejan lo que la propia documentación describe como la arquitectura implementada.

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python 3.12 + FastAPI** | Framework de la API asíncrona | Rendimiento async adecuado para un backend intensivo en I/O (llamadas a LLM, base de datos y almacenamiento), con tipado y documentación automática |
| **CompiledGraph (motor propio) + LiteLLM** | Motor de agentes y abstracción de LLM | Un motor de orquestación propio evita acoplar el núcleo a un framework de agentes externo; LiteLLM da acceso a más de 100 modelos tras una sola interfaz |
| **Ollama** | Modelos LLM locales | Ejecución de modelos sin costo en desarrollo y para privacidad, sin salir a un proveedor externo |
| **mcp[cli] (SDK de Anthropic)** | Servidores de herramientas del agente | Exponer capacidades (Gmail, Drive, Calendar) como herramientas MCP estandarizadas |
| **google-api-python-client** | Integración con Google | Acceso a Gmail, Drive y Calendar, ejes del flujo documental del contratista |
| **PostgreSQL 16 + pgvector (opcional)** | Datos primarios y búsqueda semántica | Base relacional robusta; pgvector habilita búsqueda semántica sobre embeddings donde está disponible (las corridas en SQLite de dev/test funcionan sin él) |
| **Cloudflare R2 / MinIO** | Almacenamiento de objetos | Almacenamiento compatible con S3: MinIO en desarrollo, R2 en producción, intercambiables por el mismo adaptador |
| **WeasyPrint + python-docx + Jinja2** | Generación de documentos | Producir las cuentas de cobro en PDF y DOCX a partir de plantillas |
| **pytesseract + pdf2image** | OCR | Extracción de texto de documentos escaneados |
| **Socrata API (data.gov.co)** | Consulta de SECOP II | Acceso a los contratos públicos de SECOP II (datasets `jbjy-vk9h`, `p6dx-8zbt`) |
| **Langfuse (self-hosted, opcional)** | Observabilidad de LLM | Trazas, puntajes de calidad y seguimiento de costos; inactivo salvo que se configuren las claves `LANGFUSE_*` |
| **Wompi** | Pasarela de pago | Cobro mediante una pasarela local del mercado colombiano |
| **Railway** | Despliegue | Contenedor Docker con CI/CD de configuración cero para el MVP |

## Instalación

El proyecto usa `uv` y un `Makefile` que envuelve el flujo de desarrollo local:

```bash
# 1. Preparar el entorno (uv + dependencias + pre-commit)
make setup

# 2. Levantar servicios locales (PostgreSQL + MinIO + Redis)
make up

# 3. Aplicar migraciones de base de datos
make migrate

# 4. Servidor de desarrollo con hot-reload en :8000
make dev
```

La documentación interactiva de la API queda disponible en `http://localhost:8000/docs`. El flujo de trabajo se completa con otros objetivos del `Makefile`: `make test` / `make test-cov` (pytest, con un mínimo de 70% de cobertura), `make lint` (Ruff + mypy estricto), `make security` (Bandit + pip-audit) y `make load-test` (Locust).

La configuración vive en un archivo `.env`, copiado desde `.env.example`. Las variables principales son:

```bash
DATABASE_URL=            # Cadena de conexión a PostgreSQL
JWT_SECRET_KEY=          # Mínimo 32 caracteres (usar scripts/generate_secrets.py)
S3_ENDPOINT_URL=         # Almacenamiento compatible con S3
S3_ACCESS_KEY=
S3_SECRET_KEY=
GEMINI_API_KEY=          # Proveedor LLM primario (Gemini Flash)
GROQ_API_KEY=            # Enrutamiento LLM (Groq)
# WOMPI_*                # Pasarela de pago (opcional en dev)
# LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST  (opcionales en dev)
```

## Decisiones de diseño

**Un motor de agentes propio en vez de un framework de terceros.** El núcleo de IA es una clase `CompiledGraph` implementada en el propio proyecto (`app/agent/engine.py`), no una dependencia como LangGraph o CrewAI. El README es explícito en que su tabla de stack original era aspiracional y que la arquitectura real prescinde de esos frameworks. Construir el motor internamente evita acoplar la lógica de agentes a las abstracciones y el ciclo de versiones de una biblioteca externa, a cambio de asumir el mantenimiento de la orquestación.

**Ports & Adapters para ser agnóstico de la nube.** La decisión estructural más fuerte del proyecto es que el núcleo nunca importa SDKs de nube directamente: cada dependencia externa se accede a través de un puerto (`Protocol`) con adaptadores intercambiables. Eso permite que el mismo código use MinIO en desarrollo y Cloudflare R2 en producción, o Gemini con reserva a Groq y luego a Ollama, sin tocar la capa de servicios. El beneficio concreto es que el MVP corre en Railway sin atarse a AWS, GCP ni Azure, y una migración futura de nube no llega hasta la lógica de negocio.

**Cadena de reserva (fallback) de LLM.** El adaptador de LLM define una cadena Gemini → Groq → Ollama. En lugar de depender de un único proveedor, el servicio degrada de forma ordenada: del modelo primario en la nube a uno de enrutamiento rápido y, finalmente, a un modelo local sin costo. Es una decisión que atiende tanto a la resiliencia (si un proveedor falla) como al costo y la privacidad (Ollama corre localmente).

**Migraciones en proceso al arranque, con un solo worker.** El despliegue en Railway no tiene un paso de migración separado en el pipeline. El esquema se construye dentro del handler `lifespan` de FastAPI (`app/main.py`): `Base.metadata.create_all` levanta el esquema base de forma idempotente y luego Alembic se invoca como subproceso para hacer `stamp head` (base recién creada) o `upgrade head` (aplicar deltas pendientes). Por eso el arranque usa un único worker de forma intencional: con las migraciones corriendo en proceso al boot, varios workers competirían por ejecutar `create_all` y Alembic a la vez. El escalado horizontal se hace con réplicas de Railway —instancias separadas, cada una con su propio `lifespan`— y no con `--workers N` en proceso.

**Dependencias opcionales que degradan sin romper.** Varias piezas del stack son deliberadamente opcionales. pgvector se usa donde está disponible, pero las corridas de desarrollo y prueba sobre SQLite funcionan sin él. Langfuse permanece inactivo salvo que se configuren sus claves. Wompi es opcional en desarrollo. Esto mantiene el entorno local ligero y no obliga a montar toda la infraestructura de producción para trabajar en el código.

## Aprendizajes

CashIn Backend demuestra cómo llevar la disciplina de la arquitectura hexagonal a un backend construido alrededor de agentes de IA: el núcleo permanece limpio de detalles de infraestructura, y todo lo volátil —el proveedor de LLM, el almacenamiento, la nube, la observabilidad— queda detrás de puertos intercambiables. Esa separación es lo que hace creíble la promesa "cloud-agnostic": no es un eslogan, es una consecuencia directa de que el código de negocio nunca conoce el SDK que hay al otro lado. En un dominio donde tanto los modelos de IA como los proveedores de nube cambian rápido, aislar el núcleo de esas decisiones es lo que permite que el sistema evolucione sin reescribirse.
