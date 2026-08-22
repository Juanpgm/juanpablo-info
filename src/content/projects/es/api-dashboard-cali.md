---
title: "API Dashboard Cali"
description: "Backend FastAPI y PostgreSQL para el data warehouse de la Alcaldía de Cali: datos presupuestales, contratos SECOP y seguimiento de proyectos, con carga incremental desde Excel."
projectId: "api-dashboard-cali"
pubDate: 2026-08-21
draft: false
---

## Resumen

La Alcaldía de Santiago de Cali maneja información pública que vive dispersa en muchas fuentes: presupuesto asignado y ejecutado por proyecto, contratos registrados en SECOP, avances del Plan de Acción, equipamientos e infraestructura vial. Cada una de esas fuentes suele llegar como archivos de Excel con formatos distintos, símbolos monetarios, columnas cambiantes y criterios de nomenclatura que no siempre coinciden entre dependencias. Consultar o cruzar esos datos de forma confiable, sin un lugar central donde vivan estandarizados, es lento y propenso a error.

API Dashboard Cali es el backend que cierra esa brecha. Es el sistema que centraliza la información presupuestal, contractual y de seguimiento de proyectos de la Alcaldía en una sola base de datos PostgreSQL, y la expone a través de una API REST especializada por dominio. No es una aplicación de cara al ciudadano: es infraestructura de datos interna, pensada para alimentar consultas, tableros y análisis con información ya limpia, tipada y consistente. En la práctica, hace de data warehouse de la entidad, con endpoints por categoría —catálogos base, datos presupuestales, contratos SECOP, seguimiento del Plan de Acción, infraestructura y administración— más un sistema de transformación que convierte los Excel de origen en JSON normalizados listos para cargar.

El proyecto va por la versión 2.6.0, y buena parte de su historia reciente es de consolidación: alinear los modelos de SQLAlchemy, los esquemas de Pydantic y la estructura real de PostgreSQL para que hablen exactamente el mismo idioma, corregir campos que debían ser `nullable=False` para garantizar integridad, unificar nombres de campos como `periodo_corte` en todas las tablas y endpoints, y simplificar los JOIN de contratos para mejorar rendimiento. Es el tipo de trabajo poco vistoso pero decisivo en un sistema de datos gubernamentales: si el modelo, el esquema y la tabla no coinciden, los datos se corrompen en silencio y nadie puede auditarlos después.

## Arquitectura

El sistema se organiza en dos grandes bloques que trabajan sobre la misma base de datos: la aplicación FastAPI que sirve la API, y el sistema de transformación que prepara los datos antes de que entren. Entre ambos se sienta un inicializador que construye y puebla la base.

```
Archivos Excel de origen (presupuesto, SECOP, Plan de Acción, infraestructura)
        │
        ▼
transformation_app/  ── scripts data_transformation_*.py
   app_inputs/   →  limpieza, validación de tipos, normalización
   app_outputs/  →  JSON estandarizados
        │
        ▼
database_initializer.py  ── crea estructura desde modelos SQLAlchemy,
   crea índices, carga incremental con UPSERT, genera reporte
        │
        ▼
   PostgreSQL (25 tablas)
        │
        ▼
fastapi_project/  ── main.py (endpoints) · models.py (SQLAlchemy)
   schemas.py (Pydantic) · database.py (conexión)
        │
        ▼
   API REST + Swagger UI / ReDoc  →  consumidores (tableros, análisis)
```

La aplicación FastAPI se estructura en las cuatro piezas clásicas de un servicio de datos: `main.py` con los endpoints y la configuración de la API, `models.py` con los modelos SQLAlchemy que definen las tablas, `schemas.py` con los esquemas Pydantic que validan y serializan, y `database.py` con la configuración de conexión y el pool. Los endpoints están agrupados por dominio: gestión de catálogos (centros gestores, programas, áreas funcionales, propósitos, retos), datos presupuestales (movimientos y ejecución), contratos SECOP, seguimiento del Plan de Acción (resumen, productos, actividades), infraestructura (equipamientos y vial, con soporte GeoJSON) y administración (health checks, estadísticas, información de esquemas). Estos últimos aparecen al final en Swagger UI, una decisión deliberada de organización de la documentación interactiva.

El sistema de transformación vive aparte, en `transformation_app/`. Cada tipo de dato tiene su script —`data_transformation_ejecucion_presupuestal.py`, `data_transformation_contratos_secop.py`, `data_transformation_seguimiento_pa.py`, `data_transformation_unidades_proyecto.py`— que toma los Excel de `app_inputs/`, les quita símbolos monetarios, espacios y caracteres especiales, convierte los tipos, normaliza formatos de fecha, número y texto, y deja JSON limpios en `app_outputs/`, organizados por dominio. Esa separación entre "transformar" y "cargar" es intencional: el dato crudo se limpia una vez, de forma reproducible, antes de tocar la base.

El puente entre ambos mundos es `database_initializer.py`, descrito en el proyecto como el corazón del sistema de inicialización. Detecta automáticamente si corre en entorno local o en Railway, crea toda la estructura de tablas a partir de los modelos SQLAlchemy, genera los índices de rendimiento, y carga los datos de forma incremental: solo inserta lo nuevo, omite las tablas que ya tienen registros, usa UPSERT para evitar duplicados y filtra automáticamente registros inválidos (por ejemplo, los que llegan con un BPIN nulo, que violaría las restricciones de integridad). Al terminar produce un reporte fechado en Markdown con la duración, el entorno, las tablas creadas y las estadísticas de carga.

El modelo de datos gira alrededor del **BPIN** (código de proyecto de inversión, tipo `BIGINT`), que actúa como eje común entre presupuesto, contratos e infraestructura. La estandarización de tipos es explícita en la versión 2.6.0: períodos en `VARCHAR` con formato `YYYY-MM`, valores monetarios en `DECIMAL(15,2)`, porcentajes en `DECIMAL(5,2)`, fechas en `DATE` ISO, y `nullable=False` en los campos críticos.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework de la API | Tipado con Pydantic, documentación Swagger/ReDoc generada automáticamente, y rendimiento asíncrono adecuado para un servicio I/O-bound que consulta constantemente PostgreSQL |
| **PostgreSQL** | Base de datos central (data warehouse) | Base relacional robusta para datos presupuestales y contractuales que sí tienen esquema estable; soporta índices, tipos precisos como `DECIMAL(15,2)` y años de datos históricos |
| **SQLAlchemy** | ORM y definición de tablas | Los modelos son la única fuente de verdad de la estructura: el inicializador crea la base directamente desde ellos, con `nullable=False` en campos críticos para garantizar integridad |
| **Pydantic** | Validación y serialización | Valida todos los endpoints y, con `from_attributes=True`, serializa directamente desde los objetos ORM; mantener modelos y esquemas alineados es lo que evita la corrupción silenciosa de datos |
| **Pandas + OpenPyXL** | Transformación de Excel a JSON | Herramientas estándar de Python para leer, limpiar y normalizar archivos `.xlsx` con potencialmente millones de registros antes de cargarlos |

## Instalación

Requisitos base: Python 3.8 o superior, PostgreSQL 12 o superior, y las herramientas para leer archivos `.xlsx`. Primero se crea la base y el usuario en PostgreSQL:

```sql
CREATE DATABASE api_dashboard_cali;
CREATE USER api_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE api_dashboard_cali TO api_user;
```

Luego se clona el repositorio y se prepara el entorno virtual:

```bash
git clone https://github.com/Juanpgm/api_dashboard_cali.git
cd api-dashboard-db

python -m venv env
source env/bin/activate   # En Windows: env\Scripts\activate

pip install -r requirements.txt
```

Las credenciales van en un archivo `.env` en la raíz:

```env
POSTGRES_USER=api_user
POSTGRES_PASSWORD=tu_contraseña_segura
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=api_dashboard_cali

# Para despliegue en Railway (opcional):
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database
```

El paso crítico —marcado así en el propio proyecto— es inicializar la base antes de arrancar la API. Este comando crea la estructura, los índices y carga los datos:

```bash
python database_initializer.py
```

Con la base lista, se levanta el servidor:

```bash
uvicorn fastapi_project.main:app --reload
```

La documentación interactiva queda disponible automáticamente en `/docs` (Swagger UI), `/redoc` y `/openapi.json`. La salud del servicio se verifica con `curl http://localhost:8000/health` y el estado de la base con `curl http://localhost:8000/database_status`. Para producción, el proyecto recomienda ejecutar detrás de Gunicorn con workers de Uvicorn (`gunicorn fastapi_project.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`).

## Decisiones de diseño

**Modelos, esquemas y tablas alineados como una sola verdad.** El foco central de la versión 2.6.0 fue lograr consistencia perfecta entre los modelos SQLAlchemy, los esquemas Pydantic y la estructura real de PostgreSQL. Es una decisión que parece de mantenimiento pero es de fondo: en un sistema de datos, si el modelo declara un campo de una forma y la tabla lo tiene de otra, los datos se degradan sin que salte ningún error visible. Definir la estructura una sola vez en los modelos SQLAlchemy, y hacer que el inicializador construya la base directamente desde ellos, elimina la posibilidad de que la definición y la realidad se separen.

**Separar la transformación de la carga.** Los Excel de origen no se cargan directamente a la base. Pasan primero por scripts de transformación que limpian símbolos monetarios, validan tipos, normalizan formatos y producen JSON estandarizados. Recién esos JSON entran a PostgreSQL. Separar las dos etapas hace que la limpieza sea reproducible y auditable —siempre se puede volver a correr la transformación sobre el mismo Excel y obtener el mismo JSON— y evita mezclar la lógica frágil de leer hojas de cálculo con la lógica de persistencia.

**Carga incremental con UPSERT en lugar de recarga total.** El inicializador está pensado para ejecutarse repetidamente sin miedo: detecta las tablas que ya tienen datos y las omite, y usa UPSERT para no duplicar registros. Esto convierte la actualización de datos en una operación segura y de bajo riesgo, en vez de un borrado-y-recarga que dejaría la base inconsistente si algo falla a mitad de camino. El filtrado automático de registros inválidos (por ejemplo, BPIN nulo) va en la misma línea: no dejar que un dato malformado tumbe toda la carga.

**BPIN como eje del modelo, con arquitectura BPIN-centric para contratos.** El código de proyecto de inversión es el identificador que atraviesa presupuesto, contratos e infraestructura. Diseñar el modelo alrededor de él —incluida la optimización específica de contratos SECOP hacia una arquitectura BPIN-centric, con un JOIN simplificado hacia `contratos_valores` y una respuesta unificada `ContratoCompleto`— permite cruzar información entre dominios de forma natural y consultar todo lo asociado a un proyecto con un solo identificador.

**PostgreSQL relacional, no un almacén de documentos.** A diferencia de datos de campo semiestructurados, la información presupuestal y contractual de una alcaldía sí tiene un esquema estable y necesita integridad estricta, tipos monetarios precisos e índices para consultar años de historia. Una base relacional con tipos como `DECIMAL(15,2)`, restricciones `nullable=False` e índices en los campos críticos (BPIN, períodos, códigos) es la herramienta correcta para eso, y es lo que sostiene la capacidad reportada de cargar decenas de miles de registros en segundos.

## Aprendizajes

Este proyecto demuestra que, en un sistema de datos, la parte difícil no es exponer endpoints sino garantizar que el dato que sale sea confiable. La mayor parte del trabajo de valor —alinear modelos, esquemas y tablas, estandarizar tipos, separar la transformación de la carga, hacer la inicialización incremental y auditable— es invisible desde afuera, pero es exactamente lo que distingue un data warehouse en el que se puede confiar de una colección de tablas que nadie se atreve a cruzar. Para información pública que alimenta decisiones y rendición de cuentas, esa confiabilidad no es un lujo: es el producto.
