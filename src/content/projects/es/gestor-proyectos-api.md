---
title: "Gestor de Proyectos API"
description: "API REST en FastAPI que da interoperabilidad al artefacto de seguimiento de proyectos, con Firebase/Firestore como backend de datos en tiempo real."
projectId: "gestor-proyectos-api"
pubDate: 2026-08-11
draft: false
---

## Resumen

El seguimiento de proyectos de inversión pública — contratos, unidades de proyecto, avances físicos y financieros — es un dato que necesita estar disponible para más de un consumidor a la vez: un tablero de control, un proceso de reporte interno, potencialmente otras herramientas que se construyan después. Gestor de Proyectos API es el servicio que hace posible eso: una capa REST construida en FastAPI que se sienta encima de Firestore y expone ese dato de seguimiento de forma estructurada, filtrable y documentada, en lugar de dejar que cada cliente hable directamente con la base de datos.

Es el backend de contrapartida del proyecto `gestor-proyectos`, el tablero en Next.js que consume esta API para mostrar el estado de contratos y unidades de proyecto. La relación entre ambos es intencional: el dashboard no sabe nada de Firestore, ni tiene credenciales para tocarlo directamente — solo sabe hablar HTTP contra esta API. Esa separación es lo que permite que el mismo dato de seguimiento sirva a un frontend hoy y, sin tocar una línea del dashboard, a un segundo cliente mañana.

El problema real que resuelve no es solo "exponer datos" — es dar interoperabilidad a un artefacto de seguimiento de proyectos que, sin esta capa, quedaría atrapado en una base de datos NoSQL solo accesible desde el código que la escribió originalmente. La API es el contrato explícito entre el dato y quien lo consume.

## Arquitectura

El servicio sigue una forma de pipeline simple, de tres capas:

```
Cliente (dashboard gestor-proyectos, u otro consumidor)
        │
        ▼
   FastAPI (main.py)
        │
        ├── api/scripts/contratos_operations.py   → lógica de contratos de seguimiento
        ├── api/scripts/firebase_operations.py     → operaciones genéricas sobre Firestore
        │
        ▼
   database/firebase_config.py
        │
        ▼
   Firebase / Firestore  → datos en tiempo real
```

FastAPI actúa como capa de interoperabilidad: recibe la solicitud HTTP, aplica los filtros que el cliente pida (por ejemplo, referencia de contrato o centro gestor), delega la consulta a Firestore a través del módulo de configuración de Firebase, y devuelve una respuesta JSON con un contrato estable — algo que un cliente externo puede consumir sin conocer la forma interna de las colecciones de Firestore ni sus particularidades como base NoSQL.

El servicio expone endpoints agrupados por función: salud del sistema (`/health`) y documentación autogenerada (`/docs`, `/redoc`), endpoints de interoperabilidad con el artefacto de seguimiento (`/contratos/init_contratos_seguimiento`, con filtros por `referencia_contrato` y `nombre_centro_gestor`), y un grupo heredado de unidades de proyecto (`/unidades-proyecto`, `/unidades-proyecto/summary`, `/unidades-proyecto/calidad-datos`) que incluye métricas de calidad de datos con historial diario.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Python + FastAPI** | Framework de la API REST | Tipado, validación automática de parámetros de consulta, y documentación Swagger/ReDoc generada sin esfuerzo adicional — importante para un servicio pensado para ser consumido por terceros |
| **Firebase / Firestore** | Backend de datos en tiempo real | Sincronización inmediata entre lo que se escribe y lo que los clientes leen, sin necesidad de infraestructura de websockets o polling propia; encaja con datos de seguimiento que cambian con frecuencia |
| **Docker / docker-compose** | Empaquetado y despliegue | Un mismo artefacto reproducible tanto en desarrollo local como en plataformas de despliegue tipo Railway o Render |

## Instalación

```bash
git clone https://github.com/Juanpgm/gestor_proyecto_api.git
cd gestor_proyecto_api

pip install -r requirements.txt
```

El proyecto necesita un archivo `.env` con la configuración de Firebase:

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
GOOGLE_CLOUD_PROJECT=tu-proyecto-id
PORT=8000
```

En desarrollo local, la autenticación contra Firebase se resuelve con Application Default Credentials; en producción, con una Service Account Key inyectada como variable de entorno — en ningún caso el archivo de credenciales viaja dentro del repositorio.

Con las variables configuradas, el servicio se levanta directamente:

```bash
python main.py
```

o, de forma equivalente y contenida, con Docker:

```bash
docker-compose up --build
```

La API queda disponible en `http://localhost:8000`, con documentación interactiva en `/docs` y `/redoc`.

## Decisiones de diseño

**Una API REST en vez de que el frontend hable directo con Firestore.** El SDK de cliente de Firestore permite que un frontend consulte la base de datos directamente, y para un solo cliente eso ahorra una capa. Pero en cuanto aparece un segundo consumidor — o la necesidad de aplicar una regla de negocio, un filtro compuesto, o simplemente cambiar de proveedor de base de datos sin reescribir cada cliente — esa conveniencia se paga cara. Meter FastAPI en medio centraliza el contrato de datos en un solo lugar: los filtros de negocio (`referencia_contrato`, `nombre_centro_gestor`) viven en el backend, no duplicados en cada cliente que los necesite.

**Firestore para datos que cambian y se leen en tiempo real.** El seguimiento de proyectos no es un reporte estático — contratos avanzan, unidades de proyecto cambian de estado, y quien consulta el dato espera ver la versión más reciente sin refrescar manualmente. Una base relacional tradicional habría requerido resolver esa sincronización con polling o una capa de eventos aparte; Firestore la resuelve de forma nativa, a costa de aceptar un modelo de datos NoSQL menos estructurado que SQL.

**Endpoints "legacy" mantenidos junto a los nuevos, no reemplazados.** El grupo de `/unidades-proyecto` convive con el nuevo grupo de `/contratos`, en lugar de forzar una migración de golpe. En un servicio que ya tiene consumidores activos, romper un endpoint existente para "limpiar" la API tiene un costo real para quien depende de él; extender en paralelo y dejar que el consumo legacy se apague naturalmente es la opción más responsable con quien ya integró contra el servicio.

**Documentación generada, no escrita a mano.** Swagger y ReDoc se generan automáticamente a partir de los modelos y rutas de FastAPI. Para una API cuyo propósito explícito es dar interoperabilidad a otros sistemas, que la documentación nunca se desactualice respecto al código es más valioso que un documento externo redactado aparte que alguien tiene que recordar mantener.

## Aprendizajes

Construir esta API deja una lección concreta sobre interoperabilidad en el contexto de un sistema de seguimiento de proyectos públicos: el valor de una API REST no está en la complejidad de su lógica interna, sino en la estabilidad del contrato que ofrece hacia afuera. Un dashboard, un proceso de reporte o una integración futura solo pueden confiar en el dato si el contrato — los endpoints, los filtros, la forma de la respuesta — no cambia debajo de ellos sin aviso. Separar el dashboard de Firestore detrás de esta capa no fue una decisión de arquitectura por moda; fue la forma más directa de garantizar que el seguimiento de un proyecto público pueda tener más de un consumidor sin que cada uno reimplemente el acceso a los datos por su cuenta.
