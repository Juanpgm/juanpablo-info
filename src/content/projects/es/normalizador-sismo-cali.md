---
title: "Normalizador Sismo Cali"
description: "Job horario que integra evaluaciones de daños EDAN y visitas de campo del sismo de Cali en una tabla normalizada, cruzando registros sin llave común y publicándola en Google Sheets."
projectId: "normalizador-sismo-cali"
pubDate: 2026-08-21
draft: false
---

## Resumen

Durante una emergencia sísmica, la información no llega por un solo canal ni con un formato único. En el caso del sismo de Cali, la respuesta generó dos fuentes de datos distintas: la evaluación de daños (**EDAN**), diligenciada como una hoja madre, y las **visitas** de campo, capturadas como respuestas de un formulario. Ambas describen los mismos predios y personas afectadas, pero las llena gente distinta, a mano, y **no comparten una llave** que permita unirlas de forma directa.

Este proyecto es el servicio que cierra esa brecha. Toma las dos fuentes, las cruza registro por registro y produce una única tabla normalizada donde cada fila indica de dónde proviene: de ambas fuentes (`edan+visita`), solo de EDAN (`solo_edan`) o solo de una visita (`solo_visita`). Esa tabla, junto con las estadísticas de cada corrida, se publica **cada hora** en un documento de Google Sheets, de modo que quienes coordinan la respuesta trabajan siempre sobre un consolidado actualizado en lugar de sobre dos planillas que nadie terminó de conciliar.

El valor real está en el cruce. Unir dos fuentes que sí comparten un identificador es trivial; unir dos que no lo comparten, donde una dirección puede estar escrita de cinco maneras y un nombre puede tener errores de digitación, es el problema difícil. El pipeline aborda eso con una cascada de ocho niveles de evidencia y descarta todo par que no supere un umbral de confianza, priorizando no ensuciar el consolidado con emparejamientos dudosos.

## Arquitectura

El sistema se organiza en tres piezas: el motor de integración, el publicador y el scheduler que lo dispara cada hora.

```
EDAN (hoja madre)      Visitas (formulario)
        │                       │
        └───────────┬───────────┘
                    ▼
        integracion/  — cascada de 8 niveles de evidencia
        (handshake de dirección, vector, puente
         espacial, TF-IDF, fuzzy, embeddings)
                    │
                    ▼
        tabla normalizada + estadísticas
                    │
                    ▼
        publicador → Google Sheets (EDAN SISMO)
           ├── tabla_integrada
           └── integracion_stats
```

El paquete `integracion/` contiene el cruce: cada par candidato pasa por niveles sucesivos de evidencia —desde el handshake de dirección y el puente espacial hasta TF-IDF, fuzzy matching y embeddings— y se conserva únicamente si supera el umbral de confianza configurado. El análisis de por qué el 62% de match es el techo seguro está documentado en el repositorio (`INVESTIGACION_matching.md`), y el detalle del pipeline en `README_integracion.md`.

El publicador escribe **solo dos hojas** del documento `EDAN SISMO`: `tabla_integrada` (todos los registros, con y sin match) e `integracion_stats` (matches por método, tasa, cobertura de coordenadas, distribución de confianza, umbrales usados y procedencia de la ejecución). Ninguna otra hoja se toca. Como protección, el publicador resuelve las hojas destino por título **y** verifica su `sheetId` contra el valor fijado en `integracion/config.py`: si alguien renombra o recrea una pestaña, la corrida aborta en vez de escribir en el lugar equivocado, y nunca crea, borra ni duplica hojas.

El entrypoint del scheduler es `job.py`: corre sin argumentos, siempre con datos frescos, sin exportar Excel, y **sale con código distinto de cero si falla** para que la ejecución quede marcada como fallida.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python** | Lenguaje del pipeline y del job | Ecosistema maduro para procesamiento de datos y para las técnicas de matching (TF-IDF, fuzzy, embeddings) que sostienen el cruce |
| **Pandas** | Manipulación y normalización de las tablas | Estructura natural para cargar, cruzar y consolidar las dos fuentes tabulares en una sola tabla de salida |
| **Google Sheets API** | Publicación del consolidado | Las fuentes ya viven en hojas de cálculo y el consumo lo hace gente no técnica; publicar en Sheets mantiene el resultado donde el equipo ya trabaja, sin construir un frontend aparte |

## Instalación

Para levantar el proyecto localmente:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows; source .venv/bin/activate en Linux/macOS
pip install -r requirements.txt
```

El acceso a Google Sheets requiere las credenciales de un service account. Se pueden entregar de dos maneras: un archivo `service_account.json` en la raíz (está en `.gitignore` y nunca se commitea) o la variable de entorno `GOOGLE_SERVICE_ACCOUNT_JSON` con su contenido.

Comandos principales:

```bash
python run_integration.py                                  # corrida normal, Excel en output/
python run_integration.py --fresh                          # ignora el cache, relee las hojas
python run_integration.py --no-embedding                   # sin el nivel de embeddings (más rápido)
python run_integration.py --fresh --no-export --to-sheets  # lo que ejecuta el job por hora
pytest -q
```

El flag `--fresh` no es opcional para publicar: sin él, el pipeline lee los pickles de `output/cache/` y republicaría datos viejos.

## Automatización

El job corre cada hora en **Railway** (proyecto `normalizador-sismo-cali`, servicio `normalizador`), con la configuración versionada en `railway.json`:

```json
"deploy": { "cronSchedule": "0 * * * *", "restartPolicyType": "NEVER" }
```

Hay una trampa documentada en este montaje: `railway.json` llega al manifest del deployment pero **no** configura el scheduler, porque Railway lee `cronSchedule` del *service instance*. Un servicio desplegado solo con el archivo construye la imagen y nunca la ejecuta —deployments con `buildOnly: true`, logs vacíos y `serviceInstance.cronSchedule = null`—. Por eso, tras crear el servicio o cambiar el horario, hay que aplicar los settings explícitamente:

```bash
python scripts/railway_setup.py          # aplica y verifica
python scripts/railway_setup.py --show   # solo reporta
```

El secreto `GOOGLE_SERVICE_ACCOUNT_JSON` se carga como variable del servicio y nunca entra a la imagen: `.dockerignore` excluye el archivo de credenciales de todas las capas. Como los logs de Railway tienen retención limitada y no tienen estructura, el job guarda su propia copia en un volumen montado en `/data`: `integracion.log` con la salida completa (rota a los 5 MB, guarda 5 archivos) y `runs.jsonl` con una línea JSON por ejecución (estado, duración, registros publicados, matches, tasa). Si el volumen no está montado, la corrida sigue con stdout solamente: loguear nunca es motivo para fallar una ejecución.

## Decisiones de diseño

**Un solo scheduler a la vez.** El repositorio incluye workflows de GitHub Actions (`ci.yml` corre los tests en cada push), pero `hourly.yml` quedó deliberadamente **solo como disparo manual**. Si tuviera cron, Railway y GitHub publicarían en las mismas dos hojas cada hora y se pisarían. La regla explícita es un único scheduler responsable de la publicación.

**El contenedor debe terminar rápido.** Railway saltea una ejecución si la anterior sigue corriendo. Eso convierte la brevedad de la corrida en un requisito operativo, no en una preferencia: un job que se cuelga no solo falla esa hora, sino que puede bloquear las siguientes.

**Verificación de identidad de la hoja antes de escribir.** Resolver la hoja destino solo por título sería frágil: un renombrado accidental bastaría para escribir sobre datos equivocados. Verificar además el `sheetId` contra un valor fijado en configuración convierte esa fragilidad en una parada segura —la corrida aborta— en lugar de una corrupción silenciosa.

**Manejo explícito de datos personales.** Las fuentes contienen datos de personas afectadas y el repositorio es público, lo que obliga a decisiones concretas: `service_account.json`, `output/`, `data/` y todo `*.xlsx` están en `.gitignore`; los notebooks se commitean sin outputs (`scripts/strip_notebooks.py`, verificado por CI en cada push); y la tabla publicada no incluye nombres, correos ni teléfonos.

## Aprendizajes

El proyecto demuestra que gran parte del trabajo de integración de datos no está en mover filas, sino en unir de forma confiable fuentes que nadie diseñó para encajar. Cruzar dos planillas sin llave común obliga a razonar sobre evidencia y confianza en lugar de sobre igualdad exacta, y a aceptar un techo de match honesto antes que inflar la cobertura con emparejamientos dudosos. Alrededor de ese núcleo, las decisiones operativas —un único scheduler, contenedores que terminan rápido, verificación de la hoja destino y un tratamiento serio de los datos personales— son las que hacen que un job automático corriendo cada hora sobre datos sensibles de una emergencia sea algo en lo que un equipo puede confiar.
