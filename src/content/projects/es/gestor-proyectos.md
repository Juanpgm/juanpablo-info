---
title: "Gestor de Proyectos - Dashboard de Inversión Pública"
description: "Dashboard interactivo en Next.js para la gestión y visualización de proyectos de inversión pública de la Alcaldía de Santiago de Cali, con métricas compactas y filtros unificados."
projectId: "gestor-proyectos"
pubDate: 2026-08-11
draft: false
---

## Resumen

La Alcaldía de Santiago de Cali ejecuta, en cualquier momento, decenas de proyectos de inversión pública en paralelo: infraestructura vial, equipamientos comunitarios, intervenciones ambientales, obras en distintas comunas y barrios de la ciudad. Cada uno tiene un código BPIN, un estado de ejecución, una ubicación geográfica y un avance que alguien —un funcionario, un contratista, un ciudadano interesado— necesita poder consultar sin tener que cruzar hojas de cálculo o reportes dispersos.

Gestor de Proyectos es un dashboard interactivo construido en Next.js que centraliza esa información. Su función no es solo mostrar datos: es dar a quien lo consulta una vista compacta y navegable de un universo grande de proyectos, con la posibilidad de buscar por BPIN, nombre o zona geográfica, filtrar por comuna y barrio, y visualizar la distribución territorial de las obras sobre un mapa. El problema real que resuelve es de escala y de tiempo: cuando hay muchos proyectos concurrentes, la pregunta no es "¿existe el dato?" sino "¿puedo encontrarlo y entenderlo en segundos?". Ese es el objetivo explícito del proyecto, y se refleja en decisiones de diseño muy concretas de densidad de información y jerarquía visual.

## Arquitectura

El dashboard sigue la forma típica de una aplicación Next.js orientada a datos: una capa de presentación que consume datos estructurados y geoespaciales, los transforma para visualización, y los expone a través de componentes de UI compactos y filtros interconectados.

```
Datos de proyectos (JSON / GeoJSON en public/data, public/geodata)
        │
        ▼
  Next.js App (App Router, React + TypeScript)
        │
        ├── Redux Toolkit        → estado global: filtros activos,
        │                          selección de comuna/barrio, búsqueda
        │
        ├── Componentes de UI    → métricas compactas, tarjetas de
        │   (src/components)       proyecto, layout de dos columnas
        │
        ├── Leaflet / React Leaflet → mapas coropléticos y de puntos
        │                             sobre división administrativa
        │                             de Cali (GeoJSON)
        │
        └── Framer Motion        → transiciones de UI
        │
        ▼
  Despliegue en Vercel (build estático + funciones serverless)
```

Los datos de proyectos y la geometría de comunas/barrios se cargan desde archivos locales (`public/data/` y `public/geodata/`), no desde una base de datos externa en tiempo real; esto simplifica el despliegue y hace que el dashboard funcione como una capa de visualización sobre datos publicados periódicamente, en lugar de un sistema transaccional. El estado de filtros —búsqueda, comuna, barrio, categoría— vive en Redux Toolkit, lo que permite que múltiples componentes (mapa, listado, métricas) reaccionen a un mismo cambio de filtro sin pasar props manualmente por todo el árbol.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Next.js 14 (React 18) + TypeScript** | Framework y capa de frontend | Renderizado híbrido y tipado estático para una interfaz de datos que debe ser rápida de cargar y segura frente a errores de forma de los datos de proyectos |
| **Leaflet / React Leaflet** | Mapas coropléticos y de puntos | Librería madura y ligera para geovisualización en el navegador, con soporte directo de capas GeoJSON —necesario para representar comunas y barrios de Cali sin depender de un servicio de mapas propietario |
| **Redux Toolkit** | Estado global de filtros | Filtros unificados (búsqueda, comuna, barrio) que deben mantenerse sincronizados entre mapa, listado y métricas; un estado centralizado evita duplicar lógica de filtrado en cada componente |
| **Tailwind CSS** | Estilos | Permite iterar rápido sobre densidad visual y espaciados compactos, algo central cuando el objetivo explícito es reducir el espacio vertical por componente |
| **Framer Motion** | Animaciones de interfaz | Transiciones suaves en un dashboard con muchos elementos que aparecen/desaparecen según filtros, sin necesidad de escribir animaciones CSS a mano |
| **Vercel** | Despliegue | Integración nativa con Next.js, previews automáticos por rama y despliegue sin infraestructura propia — relevante para un proyecto consumido por personal de una entidad pública sin equipo de DevOps dedicado |

## Instalación

```bash
git clone https://github.com/Juanpgm/gestor_proyectos_vercel.git
cd gestor_proyectos_vercel

npm install
```

El proyecto requiere Node.js 18 o superior. Para desarrollo local:

```bash
npm run dev
```

Para generar el build de producción:

```bash
npm run build
```

El código sigue tipado estricto de TypeScript y una configuración de ESLint que se valida como parte del flujo de desarrollo. El despliegue a producción ocurre en Vercel, conectado directamente al repositorio: cada push a la rama principal genera un nuevo despliegue, y cada rama o pull request obtiene su propia URL de previsualización.

## Decisiones de diseño

**Densidad compacta como requisito de producto, no de estética.** El dashboard reduce deliberadamente el espacio vertical de sus componentes —gráficos escalados a un rango de altura fijo, layout de dos columnas en vez de una sola columna larga— porque el usuario real es un funcionario o ciudadano que necesita comparar muchos proyectos sin hacer scroll indefinido. En un dashboard de gestión pública, la alternativa a la densidad no es "más aire visual", es "menos proyectos visibles a la vez", y eso tiene un costo directo en qué tan rápido alguien encuentra lo que busca.

**Filtros jerárquicos y dependientes, no filtros planos.** Los barrios se filtran según la comuna seleccionada, en lugar de exponer una lista plana de todos los barrios de la ciudad. Es una decisión de jerarquía de información que refleja cómo un funcionario realmente piensa la ciudad —por comuna primero, por barrio después— y evita que un selector con decenas de opciones sin agrupar se vuelva inutilizable a medida que crece el número de proyectos.

**Búsqueda multi-categoría con aplicación automática de filtros.** La búsqueda no distingue entre buscar por código BPIN, por nombre de proyecto o por zona geográfica: unifica esas rutas de entrada en un solo campo con sugerencias, y aplica el filtro correspondiente automáticamente al seleccionar un resultado. Esto reconoce que distintos usuarios llegan al mismo dato por caminos distintos —un contratista conoce el BPIN, un ciudadano conoce el barrio— y no debería obligarse a nadie a saber de antemano en qué campo buscar.

**Next.js y Vercel para un stakeholder que no opera infraestructura.** La elección de Next.js con despliegue en Vercel prioriza iteración rápida y despliegue sin fricción por encima de flexibilidad de infraestructura. Para una entidad pública que consume el dashboard pero no lo administra técnicamente, cada rama con su propia URL de previsualización y despliegue automático en cada cambio reduce la dependencia de coordinación manual entre quien desarrolla y quien decide si un cambio se publica.

## Aprendizajes

Un dashboard de inversión pública se juzga menos por lo sofisticado de su stack y más por si una persona sin formación técnica encuentra, en segundos, el proyecto que le interesa. Eso desplaza buena parte del esfuerzo real del código hacia decisiones de jerarquía visual y de interacción —qué se filtra primero, cuánto espacio ocupa cada métrica, cómo se pregunta lo mismo de formas distintas— que no siempre son visibles en un diff pero determinan si la herramienta se usa o se abandona. En un contexto de transparencia gubernamental, esa facilidad de uso no es un lujo de UX: es, en buena parte, la razón de ser del proyecto.
