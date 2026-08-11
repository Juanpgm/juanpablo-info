---
title: "SSJ Data Warehouse — backend analítico para seguridad ciudadana"
description: "API en FastAPI sobre PostgreSQL para el Data Warehouse del Observatorio de Seguridad de la Secretaría de Seguridad y Justicia de Cali, con migraciones versionadas y despliegue en Railway."
projectId: "security-observatory-dwh"
pubDate: 2026-08-11
draft: false
---

## Resumen

SSJ Data Warehouse es el backend del Observatorio de Seguridad de la Secretaría de Seguridad y Justicia (SSJ) de Cali. Su propósito es consolidar, almacenar y exponer datos relacionados con seguridad ciudadana —incidentes, delitos, indicadores territoriales— en un formato que analistas, tomadores de decisión y otros sistemas de la Secretaría puedan consultar de forma confiable.

El proyecto nace de un problema recurrente en entidades públicas: la información de seguridad suele vivir dispersa en hojas de cálculo, reportes manuales y bases de datos operativas no pensadas para análisis. Un observatorio de seguridad necesita lo contrario: datos limpios, con historial, con trazabilidad de cómo cambiaron, y accesibles vía una interfaz estable para paneles, reportes y aplicaciones de consulta. Eso es exactamente lo que resuelve este backend: una capa de API (FastAPI) sobre un almacén analítico (PostgreSQL), con el ciclo de vida del esquema controlado por migraciones versionadas y empaquetado en contenedores Docker para que el entorno de desarrollo y el de producción sean el mismo.

El público objetivo es interno: equipos técnicos y analistas de la Secretaría que necesitan una fuente de datos confiable para construir tableros, indicadores y reportes de seguridad, sin depender de extracciones manuales repetidas cada vez que se necesita una cifra actualizada.

## Arquitectura

El repositorio sigue una separación de responsabilidades simple y estándar para un servicio de datos:

- **`api/`** — la capa de aplicación construida con FastAPI. Expone los endpoints HTTP que sirven los datos del warehouse, valida las solicitudes y traduce entre el modelo de dominio y las respuestas JSON consumidas por clientes externos.
- **`migrations/`** — el historial versionado del esquema de PostgreSQL. Cada cambio a la estructura de datos (tablas, columnas, índices) queda registrado como un paso reproducible, en lugar de aplicarse a mano contra la base de producción.
- **`docker/` y `Dockerfile`/`docker-compose.yml`** — la definición de los contenedores que empaquetan la API y, en desarrollo local, levantan también la base de datos para pruebas sin depender de infraestructura externa.
- **`scripts/`** — utilidades operativas (carga de datos, tareas de mantenimiento) que acompañan al servicio sin formar parte de la API en sí.
- **`tests/`** — pruebas automatizadas sobre la lógica de la API y el acceso a datos.
- **`railway.json` / `railway.toml`** — configuración de despliegue en Railway, la plataforma donde corre el servicio en producción.

El flujo de datos es directo: PostgreSQL actúa como el warehouse (la fuente de verdad analítica), la API en FastAPI es la única puerta de entrada para leer esos datos desde fuera, y las migraciones son el mecanismo que mantiene el esquema de la base sincronizado entre entornos y a lo largo del tiempo. Todo el conjunto se empaqueta como contenedor Docker, que es la misma unidad que se despliega en Railway.

## Stack técnico

| Componente | Tecnología | Por qué |
|---|---|---|
| Lenguaje | Python | Ecosistema maduro para trabajo con datos, tipado opcional y curva de adopción baja para un equipo técnico pequeño |
| Framework de API | FastAPI | Tipado con Pydantic, validación automática de entradas, documentación OpenAPI generada sin esfuerzo adicional y rendimiento adecuado para cargas de lectura analítica |
| Base de datos | PostgreSQL | Motor relacional robusto, con soporte maduro para consultas analíticas, índices avanzados y extensiones (geoespaciales, por ejemplo) relevantes para datos territoriales de seguridad |
| Migraciones | Sistema de migraciones versionado (carpeta `migrations/`) | El esquema de un warehouse institucional no puede depender de cambios manuales; cada modificación queda documentada y es reversible |
| Contenedores | Docker / Docker Compose | Paridad entre entorno local y producción; onboarding reproducible para cualquier persona que se sume al proyecto |
| Despliegue | Railway | Plataforma gestionada que permite desplegar contenedores y provisionar PostgreSQL sin operar infraestructura propia |
| Gestión de dependencias | `requirements.txt` / `pyproject.toml` | Definición explícita y reproducible del entorno Python |

## Instalación

El flujo de instalación sigue el patrón estándar de un servicio FastAPI sobre PostgreSQL, consistente con lo que expone el repositorio (`requirements.txt`, `Dockerfile`, `docker-compose.yml`, `migrations/`):

```bash
# 1. Clonar el repositorio
git clone https://github.com/Juanpgm/SSJDWHDLH.git
cd SSJDWHDLH

# 2. Crear y activar un entorno virtual
python -m venv .venv
source .venv/bin/activate  # en Windows: .venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# editar .env con la cadena de conexión a PostgreSQL, por ejemplo:
# DATABASE_URL=postgresql://usuario:password@localhost:5432/ssj_dwh

# 5. Aplicar migraciones sobre la base de datos
# (comando según la herramienta de migraciones usada en migrations/, p. ej. Alembic)
alembic upgrade head

# 6. Levantar la API en desarrollo
uvicorn api.main:app --reload
```

Para un entorno más cercano a producción, `docker-compose.yml` permite levantar la API junto con una instancia local de PostgreSQL con un solo comando (`docker compose up`), evitando instalar PostgreSQL manualmente en la máquina de desarrollo. En producción, el mismo `Dockerfile` es la imagen que Railway construye y despliega, usando `railway.json`/`railway.toml` para la configuración específica de la plataforma.

## Decisiones de diseño

**Migraciones versionadas en lugar de cambios manuales al esquema.** En un warehouse institucional, el esquema de datos no es un detalle técnico interno: es lo que determina si un indicador de seguridad calculado hoy sigue siendo comparable con uno de hace seis meses. Aplicar cambios de esquema a mano —directamente contra la base de producción— es la forma más rápida de introducir inconsistencias silenciosas que después son muy difíciles de rastrear en un contexto de reportes gubernamentales. Versionar cada cambio hace que el historial del esquema sea auditable, reversible y replicable en cualquier entorno nuevo.

**PostgreSQL en vez de un almacén NoSQL.** Para datos de seguridad ciudadana —incidentes tipificados, ubicaciones, fechas, relaciones entre entidades— el caso de uso es fundamentalmente relacional y analítico: se necesitan agregaciones, joins entre dimensiones (tipo de delito, comuna, periodo) y consultas ad hoc que un motor relacional maduro resuelve de forma más directa que un almacén de documentos. PostgreSQL además ofrece extensiones geoespaciales relevantes para datos territoriales, algo que pesa en un observatorio que trabaja con ubicaciones dentro de la ciudad.

**FastAPI como capa de exposición, no como lógica de negocio.** Mantener la API como una capa delgada sobre PostgreSQL —en vez de acumular lógica de transformación de datos dentro de los endpoints— facilita que la validación de tipos (vía Pydantic) y la documentación (OpenAPI automática) se mantengan honestas respecto a lo que realmente devuelve el servicio. Para un backend consumido por otros equipos técnicos de la Secretaría, tener contratos de API claros y autodocumentados reduce fricción de integración.

**Railway como plataforma de despliegue.** Para un proyecto de este tamaño, operar infraestructura propia (orquestación, balanceo, aprovisionamiento de base de datos) es costo que no se traduce en valor para el observatorio. Railway permite desplegar la imagen Docker y provisionar PostgreSQL gestionado con configuración mínima, dejando el esfuerzo de ingeniería concentrado en el dominio del problema —datos de seguridad— en vez de en la operación de servidores.

## Aprendizajes

Construir este backend dejó una lección clara: en proyectos de datos para entidades públicas, la disciplina técnica alrededor del esquema y el control de versiones no es un lujo, es lo que hace posible que un indicador de seguridad sea confiable a lo largo del tiempo y defendible ante quien lo audite. Trabajar con datos sensibles de seguridad ciudadana —que eventualmente informan decisiones de política pública— exige que cada cambio a la estructura de datos sea explicable, no solo funcional. Esa mentalidad, más que cualquier elección puntual de framework, es lo que termina distinguiendo un prototipo de un sistema en el que un observatorio institucional puede apoyarse.
