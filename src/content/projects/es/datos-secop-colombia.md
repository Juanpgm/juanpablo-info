---
title: "Datos SECOP Colombia"
description: "MVP en Python que extrae datos abiertos del SECOP vía la API de Socrata e ingesta procesos y contratos en PostgreSQL/PostGIS con cargas idempotentes tipo upsert."
projectId: "datos-secop-colombia"
pubDate: 2026-08-21
draft: false
---

## Resumen

El SECOP (Sistema Electrónico para la Contratación Pública) publica los datos de la contratación pública colombiana como datos abiertos, accesibles a través de la plataforma Socrata. Son conjuntos de datos grandes y en constante actualización: procesos de contratación y contratos adjudicados por entidades de todo el país.

Datos SECOP Colombia es un MVP —nombrado internamente `contratos_warehouse`— que resuelve el primer paso para trabajar con esa información: extraerla de la API de Socrata y llevarla a una base de datos propia sobre la que sí se puede consultar, cruzar y analizar. En lugar de depender de exportaciones manuales o de golpear la API en cada consulta, el proyecto construye un almacén local en PostgreSQL que se puede refrescar de forma repetible.

El foco del MVP es demostrar el flujo de ingesta de extremo a extremo con una separación clara por dominios —procesos y contratos— y con cargas idempotentes, de modo que reejecutar la ingesta no duplique registros sino que los actualice.

## Arquitectura

El proyecto está organizado por dominios, con las utilidades compartidas aisladas en su propio módulo:

```
API Socrata (datos abiertos SECOP)
        │
        ▼
   src/common  → cliente API, DB, logging, settings
        │
        ├── src/procesos   → ingesta de procesos
        └── src/contratos  → ingesta de contratos
                    │
                    ▼
        PostgreSQL + PostGIS
        (tablas UPSERT-ready, db/migrations/001_init.sql)
```

`src/common` concentra lo transversal: el cliente de la API de Socrata, el acceso a la base de datos, el logging y la configuración. Sobre esa base, `src/procesos` y `src/contratos` implementan cada uno la ingesta de su dominio. El esquema vive en `db/migrations/001_init.sql`, que crea las tablas base preparadas para upsert e incluye la extensión PostGIS para el manejo de datos geográficos.

El script `scripts/run_mvp.py` ata todo el flujo: ejecuta 10 requests de prueba por dataset y realiza el upsert correspondiente, sirviendo como punto de entrada para validar la ingesta sin descargar el conjunto completo.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python** | Lenguaje de la ingesta y los scripts | Ecosistema maduro para consumo de APIs, ETL y manejo de datos; permite separar la lógica por dominios con módulos claros |
| **API de Socrata** | Fuente de los datos abiertos del SECOP | Es la vía oficial de acceso a los datos abiertos de la contratación pública colombiana |
| **PostgreSQL** | Almacén de datos | Base relacional robusta para consultar y cruzar procesos y contratos localmente, con soporte nativo para upsert |
| **PostGIS** | Extensión geoespacial | Habilita el almacenamiento y consulta de datos geográficos directamente en la base de datos |

## Instalación

Pasos de la puesta en marcha, tomados del README del repositorio:

```bash
git clone https://github.com/Juanpgm/datos_secop_colombia.git
cd datos_secop_colombia
```

Configurar el entorno y la base de datos:

```bash
# 1. Copiar la plantilla de entorno y ajustar DATABASE_URL
cp .env.example .env

# 2. Aplicar la migración inicial en PostgreSQL
#    db/migrations/001_init.sql (tablas base + PostGIS)

# 3. Ejecutar la ingesta de prueba
./.venv/Scripts/python.exe scripts/run_mvp.py
```

El acceso a Socrata usa un `SOCRATA_APP_TOKEN`. Si no existe en `.env`, se puede generar de forma headless con un script dedicado que no persiste usuario ni contraseña —los toma únicamente de variables de entorno de sesión:

```bash
# PowerShell
$env:SOCRATA_EMAIL='tu_email'
$env:SOCRATA_PASSWORD='tu_password'
./.venv/Scripts/python.exe scripts/bootstrap_socrata_token.py
```

El script `bootstrap_socrata_token.py` solo corre si `SOCRATA_APP_TOKEN` aún no está definido en `.env`.

## Decisiones de diseño

**Separación por dominios desde el inicio.** Procesos y contratos son datasets distintos del SECOP, con su propia forma y su propia lógica de ingesta. Modularlos en `src/procesos` y `src/contratos` sobre una base compartida (`src/common`) mantiene cada ingesta independiente y evita que las utilidades comunes —cliente API, DB, logging, settings— se dupliquen o se enreden con la lógica de cada dominio.

**Tablas preparadas para upsert.** El esquema se define desde la migración inicial con tablas "UPSERT-ready", de forma que la ingesta sea idempotente: reejecutarla actualiza los registros existentes en vez de duplicarlos. Para datos que se refrescan periódicamente desde una fuente externa, esta es la diferencia entre un almacén confiable y uno que acumula basura en cada corrida.

**Token de Socrata generado sin persistir credenciales.** El bootstrap del `SOCRATA_APP_TOKEN` toma el email y la contraseña solo desde variables de entorno de sesión y no los guarda en ningún archivo. Además, solo se ejecuta si el token no existe todavía. Es una decisión deliberada para no dejar credenciales en disco y para no repetir un paso ya resuelto.

**Corrida de prueba acotada.** `run_mvp.py` limita la ejecución a 10 requests por dataset. Al ser un MVP, el objetivo es validar el flujo completo de extracción y upsert sin descargar los conjuntos completos, lo que hace la iteración rápida y barata durante el desarrollo.

## Aprendizajes

El proyecto muestra que un MVP de datos bien planteado no se trata de mover el mayor volumen posible, sino de dejar el flujo correcto: una fuente oficial, una separación limpia por dominios, un esquema idempotente y un manejo de credenciales que no deja rastros en disco. Con esas piezas en su lugar, escalar de 10 requests de prueba a la ingesta completa es una cuestión de configuración, no de rediseño.
