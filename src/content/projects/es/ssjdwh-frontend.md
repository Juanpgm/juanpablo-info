---
title: "SSJDWH Frontend"
description: "Frontend en React, TypeScript y Vite para explorar los indicadores del data warehouse de seguridad de la Secretaría de Seguridad y Justicia de Cali."
projectId: "ssjdwh-frontend"
pubDate: 2026-08-21
draft: false
---

## Resumen

La Secretaría de Seguridad y Justicia de Cali (SyJDWH) concentra información sobre seguridad de la ciudad: indicadores que alimentan decisiones de política pública y seguimiento operativo. Ese tipo de dato solo es útil si alguien puede leerlo, filtrarlo y compararlo sin depender de un analista que arme un reporte a mano cada vez.

SSJDWH Frontend es la aplicación web que resuelve esa parte del problema. Es la capa de cara al usuario de la plataforma de analítica: una interfaz que consume los indicadores del data warehouse de seguridad y los presenta de forma navegable, para que quien coordina o analiza pueda explorar los datos directamente desde el navegador. No es el almacén de datos ni el backend que lo sirve; es el cliente que los vuelve consultables.

Está construida como una aplicación de página única (SPA) en React con TypeScript, empaquetada con Vite. El foco del proyecto es la exploración de indicadores: llevar el contenido del data warehouse a una pantalla donde tenga sentido para una persona.

## Arquitectura

El proyecto es una aplicación de cliente en React que se ejecuta por completo en el navegador. Vite actúa como servidor de desarrollo y empaquetador de producción, con recarga en caliente (HMR) durante el desarrollo y una salida estática optimizada para el despliegue. TypeScript cubre toda la base de código, aportando tipado sobre los datos de indicadores que la interfaz consume y renderiza.

La configuración de linting está pensada para una aplicación de producción: el repositorio parte de la plantilla oficial de Vite para React + TypeScript y contempla reglas de ESLint con verificación de tipos, incluyendo la opción de reglas específicas de React (`eslint-plugin-react-x` y `eslint-plugin-react-dom`) para acotar errores comunes de componentes.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **TypeScript** | Lenguaje base de la aplicación | Tipado estático sobre los datos de indicadores y los componentes; reduce errores en tiempo de compilación y hace la interfaz más mantenible a medida que crece |
| **React** | Capa de interfaz | Modelo de componentes adecuado para construir vistas de exploración de datos reutilizables e interactivas |
| **Vite** | Empaquetador y servidor de desarrollo | Recarga en caliente rápida (HMR) durante el desarrollo y build de producción optimizado; el plugin de React admite Fast Refresh vía Babel o SWC |

## Instalación

El repositorio sigue la estructura estándar de un proyecto Vite. Para levantarlo en local:

```bash
git clone https://github.com/Juanpgm/SSJDWH-frontend.git
cd SSJDWH-frontend

npm install
npm run dev
```

El servidor de desarrollo de Vite queda disponible en local con recarga en caliente. Para generar el build de producción:

```bash
npm run build
```

Los detalles de configuración específicos del proyecto viven en el repositorio.

## Decisiones de diseño

**TypeScript en toda la aplicación, no JavaScript.** Una interfaz cuyo propósito es explorar indicadores manipula constantemente estructuras de datos: series, filtros, agregados. Tipar esas estructuras de extremo a extremo detecta desajustes en tiempo de compilación en lugar de dejarlos aparecer como valores rotos en pantalla, y documenta la forma de los datos para quien retome el código.

**Vite como base del proyecto.** Frente a herramientas de build más pesadas, Vite ofrece un ciclo de desarrollo con recarga casi instantánea y un build de producción optimizado sin configuración extensa. Para una aplicación de página única centrada en la exploración de datos, ese ciclo rápido de iteración es directamente productivo.

**Configuración de linting orientada a producción.** El proyecto no se queda en las reglas mínimas de la plantilla: contempla reglas de ESLint con verificación de tipos y reglas específicas de React. Es una decisión deliberada para una aplicación destinada a uso real, donde la consistencia del código y la detección temprana de patrones problemáticos importan más que la comodidad inicial.

## Aprendizajes

Este proyecto muestra que el valor de un data warehouse de seguridad no está solo en almacenar el dato, sino en volverlo consultable por una persona. Separar esa responsabilidad en un frontend dedicado —React para la interfaz, TypeScript para la seguridad sobre los datos, Vite para un ciclo de desarrollo ágil— mantiene la capa de exploración enfocada en lo suyo: presentar los indicadores de forma navegable, sin cargar con la lógica del almacén que los produce.
