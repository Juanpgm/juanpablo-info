---
title: "CaliTrack 360"
description: "PWA en Svelte para captura en campo del estado de proyectos de infraestructura: autenticación Firebase, fotos y coordenadas GPS desde el móvil."
projectId: "calitrack-360"
pubDate: 2026-08-11
draft: false
---

## Resumen

Cali ejecuta proyectos de infraestructura —vías, andenes, redes de servicios— que alguien tiene que verificar en el sitio: ¿avanzó la obra?, ¿coincide con lo reportado?, ¿en qué estado quedó tras la última visita? Ese trabajo lo hace un inspector de campo, casi siempre desde un teléfono, muchas veces en zonas donde la señal celular es intermitente.

CaliTrack 360 es la aplicación que soporta esa captura. Es una Progressive Web App construida en Svelte que permite a un inspector autenticarse, registrar el estado de un proyecto de infraestructura, tomar fotografías del avance y capturar las coordenadas GPS del sitio, todo desde el navegador del dispositivo móvil sin necesidad de instalar una app nativa desde una tienda de aplicaciones.

El problema que resuelve no es solo "digitalizar un formulario". Es específico del trabajo de campo: el dato tiene que capturarse en el momento y en el lugar exactos —una foto tomada después, en la oficina, no prueba nada; una coordenada escrita de memoria no es confiable—, y la herramienta tiene que funcionar razonablemente bien aunque la conectividad no sea buena, porque exigirle al inspector que vuelva a un punto con señal para completar un registro es fricción que termina en datos incompletos o reportes reconstruidos de memoria al final del día.

## Arquitectura

El proyecto es, en esencia, un frontend Svelte que actúa como PWA instalable, con Firebase como backend de autenticación y sincronización de datos, y las APIs nativas del navegador —cámara y geolocalización— como puente hacia el hardware del dispositivo:

```
Inspector en campo (navegador móvil / PWA instalada)
        │
        ├── Cámara del dispositivo    → captura fotográfica del proyecto
        ├── Geolocalización (GPS)     → coordenadas del punto de inspección
        │
        ▼
   Svelte (componentes de UI + stores)
        │
        ├── Firebase Auth   → identidad del inspector
        ├── Firestore       → estado y registros del proyecto
        └── Service Worker  → cacheo de assets, funcionamiento offline
```

La capa de UI en Svelte concentra la lógica de formulario y presentación; los stores manejan el estado que se comparte entre pantallas (sesión activa, registro en curso). Firebase cubre dos responsabilidades separadas: Auth valida quién es el inspector, y Firestore guarda los registros de forma que puedan sincronizarse en cuanto haya conectividad, sin depender de un backend propio para esa capa. El service worker, generado a partir de la configuración PWA, es lo que permite que la aplicación cargue e incluso capture datos con la red caída o inestable, sincronizando cuando la señal vuelve.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Svelte 4 + TypeScript + Vite** | Frontend | Componentes compilados sin virtual DOM de por medio, lo que se traduce en menos JavaScript enviado al dispositivo y mejor tiempo de carga en conexiones móviles limitadas; TypeScript aporta contratos de tipos para los datos de campo (coordenadas, metadatos de foto, estado del proyecto) |
| **Firebase Authentication** | Identidad | Autenticación gestionada sin mantener infraestructura propia de usuarios y contraseñas, con soporte de sesión persistente en el dispositivo |
| **PWA (vite-plugin-pwa)** | Instalabilidad y offline | Permite "instalar" la app desde el navegador —ícono en el escritorio del teléfono, pantalla completa— y cachear los recursos estáticos para que la aplicación abra incluso sin señal |
| **Geolocation API / MediaDevices API** | Captura de coordenadas y fotos | APIs nativas del navegador; no requieren SDK adicional ni permisos fuera del modelo estándar de permisos web |

## Instalación

El repositorio incluye scripts de setup automatizado además de la ruta manual estándar de un proyecto Vite:

```bash
git clone https://github.com/Juanpgm/artefacto-calitrack-360.git
cd artefacto-calitrack-360

# Windows
.\setup.ps1
.\verify-setup.ps1

# Linux/macOS
./setup.sh
./verify-setup.sh
```

Para una instalación manual, con Node.js 18 o superior:

```bash
npm install
```

El frontend necesita un archivo `.env.local` con las credenciales del proyecto Firebase:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
```

Con las variables configuradas:

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
```

## Decisiones de diseño

**PWA en lugar de aplicación nativa.** Distribuir una app nativa implica tiendas de aplicaciones, procesos de aprobación y —lo más relevante para este caso de uso— una fricción de instalación que no tiene sentido para un grupo relativamente pequeño de inspectores institucionales. Una PWA se instala desde un enlace, sin pasar por Play Store, y se actualiza sola en el siguiente despliegue. Para una herramienta interna de una entidad de infraestructura, esa velocidad de distribución pesa más que las capacidades adicionales de una app nativa que este caso de uso no necesita.

**Svelte sobre un framework más pesado.** En un dispositivo móvil de gama media, con conectividad que no siempre es buena, cada kilobyte de JavaScript que hay que descargar y ejecutar cuenta. Svelte compila a código imperativo sin runtime de framework corriendo en el cliente, lo que reduce el peso inicial de la aplicación frente a alternativas con virtual DOM. Para una app cuyo público es un inspector de campo, no un usuario de oficina con banda ancha, esa diferencia de rendimiento es funcional, no cosmética.

**Offline-first como requisito, no como mejora.** Un formulario que exige conexión constante para no perder lo que el inspector ya diligenció es, en la práctica, un formulario que se pierde a mitad de registro cada vez que hay un hueco de señal. Apoyarse en el service worker de la PWA para cachear la aplicación y sostener el registro en curso —incluso si la sincronización final con Firestore espera a que vuelva la señal— es la diferencia entre una herramienta usable en campo y una que solo funciona en la demo de oficina.

**Firebase como backend completo en vez de una API propia.** Para el alcance de esta aplicación —autenticación de un grupo cerrado de inspectores y sincronización de registros de proyecto— montar un backend a medida habría significado construir y mantener autenticación, base de datos y sincronización en tiempo real desde cero. Firebase resuelve las tres con un SDK del lado del cliente, lo que deja el esfuerzo de desarrollo concentrado en la experiencia de captura, que es donde de verdad está el valor para el usuario final.

## Aprendizajes

Diseñar una herramienta de captura de campo obliga a diseñar primero para las condiciones del terreno y solo después para la pantalla. La señal se cae, la batería se agota a mitad de jornada, el sol impide leer bien la interfaz, y ninguno de esos problemas se resuelve con más funcionalidad: se resuelve con menos fricción. CaliTrack 360 es, en el fondo, un recordatorio de que la mejor herramienta para un inspector de infraestructura no es la que hace más cosas, sino la que le garantiza que el dato que capturó en el sitio —la foto, la coordenada, el estado del proyecto— realmente va a llegar, así la conexión no acompañe.
