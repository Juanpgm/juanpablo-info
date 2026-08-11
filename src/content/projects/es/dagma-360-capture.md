---
title: "DAGMA-360 Capture: captura de campo para gestión ambiental sobre CaliTrack 360"
description: "Despliegue del artefacto de captura de campo CaliTrack 360 adaptado para el DAGMA, para el registro de intervenciones y jornadas técnicas de gestión ambiental."
projectId: "dagma-360-capture"
pubDate: 2026-08-11
draft: false
---

## Resumen

DAGMA-360 Capture es el despliegue, para el Departamento Administrativo de Gestión del Medio Ambiente (DAGMA) de Cali, del artefacto de captura de campo **CaliTrack 360**. No es una aplicación construida desde cero: es una adaptación de una plataforma ya existente a un cliente institucional distinto, con un dominio de datos distinto.

El problema que resuelve es operativo y muy concreto. Los equipos técnicos del DAGMA realizan jornadas de campo —intervenciones ambientales, visitas de seguimiento, actividades de gestión sobre arbolado urbano, fuentes hídricas o espacio público— y necesitan un mecanismo confiable para registrar evidencia in situ: fotografías georreferenciadas, metadatos de la intervención, fecha y responsable, con la posibilidad de trabajar sin conectividad estable y sincronizar después. Antes de este tipo de herramienta, ese registro suele terminar disperso entre cámaras, mensajería y hojas de cálculo, lo que dificulta la trazabilidad y el reporte posterior.

La relación con CaliTrack 360 es el punto central de la historia de este proyecto. CaliTrack 360 nació como un artefacto genérico de captura de campo —pensado originalmente para estado de infraestructura urbana— construido como una Progressive Web App sobre Svelte y Firebase. En lugar de escribir una aplicación nueva para el DAGMA, la decisión fue reutilizar esa base y adaptar su capa de dominio: los formularios, las categorías de registro y el vocabulario pasan de "estado de infraestructura" a "intervención y jornada técnica de gestión ambiental", mientras que la arquitectura de captura, sincronización y almacenamiento se conserva intacta. Es, en esencia, la misma plataforma con una piel y un modelo de datos distintos para un cliente institucional distinto.

## Arquitectura

La forma general del sistema es la de una PWA cliente-céntrica respaldada por Firebase como backend administrado, heredada directamente de CaliTrack 360:

- **Capa de interfaz (Svelte):** componentes reactivos para el flujo de captura —formulario de registro, cámara/adjuntos, listado de intervenciones, vista de detalle— optimizados para uso en campo desde dispositivos móviles.
- **Capa de datos (Firebase):** Firestore (o Realtime Database, según la configuración del artefacto base) como almacén de documentos para las intervenciones registradas, Firebase Storage para las evidencias fotográficas, y Firebase Authentication para identificar al personal técnico que realiza cada registro.
- **Capa PWA:** service worker y manifest para instalación en el dispositivo, cacheo de assets estáticos y soporte de uso intermitente sin red, un requisito no negociable para trabajo de campo ambiental donde la cobertura de datos móviles no siempre es confiable.

Lo que cambia respecto al artefacto original no es la arquitectura sino el **modelo de dominio** que corre sobre ella: los esquemas de los formularios y las colecciones de datos se ajustan para capturar los campos propios de una intervención ambiental (tipo de intervención, ubicación, responsable técnico, jornada asociada) en lugar de los campos de un reporte de infraestructura genérico. Esa separación entre "plataforma" y "configuración de dominio" es lo que hace viable reutilizar el mismo código para un segundo cliente sin bifurcar el proyecto.

## Stack técnico

| Tecnología | Rol en el proyecto |
|---|---|
| **Svelte** | Framework de interfaz. Compila a JavaScript vanilla sin runtime pesado, lo cual importa en un contexto de campo donde el dispositivo y la red del usuario no siempre son óptimos. |
| **Firebase** | Backend-as-a-Service: autenticación, base de datos de documentos y almacenamiento de archivos, sin necesidad de operar infraestructura propia para un despliegue de este tamaño y criticidad. |
| **PWA (Progressive Web App)** | Instalabilidad, funcionamiento offline-first y sincronización diferida, condiciones esenciales para capturar evidencia en campo sin depender de conectividad continua. |

La combinación no es casual: es la misma que sostiene al artefacto base CaliTrack 360, y se conserva deliberadamente para no introducir una segunda pila de mantenimiento.

## Instalación

El flujo de arranque sigue el patrón estándar de una PWA Svelte + Firebase (los detalles exactos de scripts y variables pueden variar según la configuración específica de este despliegue en el repositorio):

```bash
git clone https://github.com/Juanpgm/dagma-360-capture.git
cd dagma-360-capture
npm install
```

Configuración del proyecto Firebase correspondiente a este despliegue (distinto del proyecto Firebase de CaliTrack 360 base, dado que cada cliente institucional aísla sus propios datos):

```bash
# .env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
```

Ejecución en desarrollo y construcción para producción:

```bash
npm run dev
npm run build
```

El despliegue del frontend se realiza sobre Vercel, siguiendo el mismo patrón de publicación que el artefacto base.

## Decisiones de diseño

**Reutilizar la plataforma en lugar de reconstruirla por cliente.** La decisión de fondo de este proyecto no es técnica sino de estrategia de producto: en lugar de escribir una aplicación de captura de campo distinta para cada entidad que la necesite, se mantiene un artefacto base (CaliTrack 360) y se despliegan variantes configuradas por dominio, como esta para el DAGMA. Esto reduce drásticamente el costo marginal de atender un segundo cliente institucional: no hay que rediseñar la arquitectura de sincronización offline, ni la capa de autenticación, ni el manejo de adjuntos fotográficos, que son las partes más costosas de acertar en una app de campo.

**Aislar datos por cliente, no por código.** Cada despliegue usa su propio proyecto Firebase, con sus propias credenciales y su propia base de datos. Esto evita mezclar datos ambientales del DAGMA con los de cualquier otro cliente del artefacto base, a costa de mantener más de un proyecto Firebase activo, un tradeoff razonable frente a la alternativa de una base de datos multi-tenant más compleja de operar y de auditar.

**Adaptar el vocabulario de dominio sin tocar la arquitectura.** El esfuerzo de adaptación para el DAGMA se concentra en formularios, categorías y textos de interfaz, no en el motor de captura, sincronización o almacenamiento. Esto acota el trabajo de cada nuevo despliegue a una superficie pequeña y predecible, y reduce el riesgo de introducir regresiones en la parte del sistema que ya fue probada en producción con el cliente anterior.

**PWA sobre app nativa.** Para el caso de uso —cuadrillas técnicas con dispositivos heterogéneos, sin proceso de distribución vía tiendas de aplicaciones— una PWA instalable evita el costo de mantener dos codebases nativas (iOS/Android) y una app store presence, a cambio de algunas limitaciones de acceso a hardware que, para fotografía y georreferenciación básica, resultan aceptables.

## Aprendizajes

DAGMA-360 Capture es, sobre todo, una lección de que la reutilización de plataforma es una decisión de arquitectura tan válida como cualquier otra, siempre que se sepa de antemano qué parte del sistema es "motor" y qué parte es "configuración". En operaciones de campo ambiental —donde la conectividad es intermitente, los dispositivos son heterogéneos y el tiempo del personal técnico es escaso— construir una app nueva por cada agencia habría significado repetir los mismos riesgos de sincronización offline y manejo de adjuntos una y otra vez. Adaptar un artefacto ya validado en producción, en cambio, traslada la energía de ingeniería a lo que realmente distingue a cada cliente: su vocabulario operativo y sus categorías de registro, no su infraestructura técnica.
