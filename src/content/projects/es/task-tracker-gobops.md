---
title: "Task Tracker GobOps"
description: "Sistema de seguimiento de requerimientos para la Alcaldía de Santiago de Cali: frontend Svelte/Vite, autenticación Firebase y pruebas E2E multiplataforma con Playwright."
projectId: "task-tracker-gobops"
pubDate: 2026-08-11
draft: false
---

## Resumen

Una alcaldía recibe requerimientos —solicitudes, quejas, trámites, tareas asignadas a distintas dependencias— por múltiples canales, y alguien tiene que responder tres preguntas básicas en cualquier momento: ¿qué entró?, ¿quién lo tiene?, ¿en qué estado está? Cuando esa visibilidad depende de hojas de cálculo dispersas o de que cada equipo lleve su propio registro, lo que se pierde no es solo tiempo: es la capacidad de rendir cuentas sobre requerimientos que tienen un ciudadano esperando del otro lado.

Task Tracker GobOps es el sistema construido para la Alcaldía de Santiago de Cali que resuelve ese problema de visibilidad. Es una herramienta de seguimiento de requerimientos con flujo tipo Kanban, pensada para que distintos equipos y niveles de autorización —administradores, superadministradores, usuarios operativos— puedan ver el estado de un requerimiento, moverlo entre etapas, registrar visitas programadas y dejar evidencia fotográfica del avance, todo desde una interfaz web instalable como aplicación progresiva.

El proyecto combina un frontend en Svelte y Vite con autenticación y datos en Firebase, y una suite de pruebas end-to-end con Playwright que valida el comportamiento del sistema en distintos navegadores y plataformas. Esa combinación no es incidental: en una herramienta que usan funcionarios públicos para gestionar trabajo que afecta a la ciudadanía, que el flujo de seguimiento funcione de forma confiable importa tanto como que exista.

## Arquitectura

El sistema sigue una separación clara entre interfaz, autenticación/datos y validación automatizada del comportamiento:

```
Usuario (funcionario / inspector) — navegador o PWA instalada
        │
        ▼
   Svelte + Vite (UI, componentes, stores de estado)
        │
        ├── Firebase Authentication → identidad y roles (Super Admin, Admin, Usuario)
        ├── Firebase (datos)        → requerimientos, visitas, evidencia fotográfica
        └── APIs de backend (Railway) → validación de acceso y catálogo de proyectos
        │
        ▼
   Suite Playwright (E2E) → valida flujos críticos en múltiples navegadores/plataformas
```

El frontend en Svelte concentra la lógica de presentación y el estado de la interfaz —tablero Kanban, formularios de requerimiento, registro de visitas—. Firebase Authentication resuelve la identidad del usuario y sus permisos, incluyendo permisos temporales con fecha de expiración, un requisito típico de estructuras institucionales donde el acceso no siempre es permanente. Sobre esa autenticación, el sistema añade una capa de validación cruzada con APIs propias de backend, de forma que la autorización no descansa únicamente en el token de Firebase sino en una doble verificación del lado del servidor. Playwright corre por fuera del código de producción, contra la aplicación desplegada o levantada localmente, ejercitando los flujos de usuario de principio a fin en distintos motores de navegador.

## Stack técnico

| Tecnología | Rol en el proyecto | Por qué esta elección |
|---|---|---|
| **Svelte 4 + TypeScript** | Frontend | Componentes compilados sin virtual DOM, menos JavaScript en el cliente y una curva de iteración rápida para un equipo pequeño construyendo una herramienta interna; TypeScript aporta contratos de tipos sobre entidades como requerimiento, visita y rol de usuario |
| **Vite** | Build y desarrollo | Arranque de servidor de desarrollo casi instantáneo y hot module replacement, lo que acorta el ciclo de prueba mientras se ajusta un flujo de trabajo tan iterativo como un tablero de seguimiento |
| **Firebase (Auth + base de datos)** | Identidad y persistencia | Autenticación gestionada con soporte de roles y permisos con expiración, sin tener que construir y mantener esa infraestructura desde cero para un sistema de uso institucional |
| **APIs backend en Railway** | Validación de acceso y catálogo de proyectos | Una capa adicional de verificación del lado del servidor sobre lo que entrega Firebase, y el punto donde vive la lógica de negocio específica del dominio (catálogo de proyectos, reglas de acceso) que no pertenece al cliente |
| **Playwright** | Pruebas end-to-end | Cobertura de los flujos críticos —autenticación, movimiento de requerimientos, registro de visitas— ejecutada contra distintos navegadores, para detectar regresiones antes de que las note un funcionario en producción |
| **PWA** | Distribución | Instalable directamente desde el navegador, sin pasar por una tienda de aplicaciones, adecuado para un grupo cerrado de usuarios institucionales |

## Instalación

El flujo de configuración sigue el patrón estándar de un proyecto Vite, con la particularidad de que las credenciales de Firebase y de los servicios de backend nunca se versionan directamente:

```bash
git clone https://github.com/Juanpgm/task-tracker-gobops.git
cd task-tracker-gobops

npm install
```

La configuración de entorno se maneja copiando la plantilla de ejemplo y completando las credenciales reales fuera del control de versiones:

```bash
cp .env.local.example .env.local
```

```bash
# .env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_API_BASE_URL=...
```

Con las variables configuradas:

```bash
npm run dev     # servidor de desarrollo con Vite
npm run build   # build de producción
```

Para ejecutar la suite de pruebas end-to-end con Playwright:

```bash
npx playwright install   # descarga los binarios de navegador la primera vez
npx playwright test      # corre la suite completa
npx playwright test --ui # modo interactivo para depurar un flujo específico
```

## Decisiones de diseño

**Playwright para pruebas E2E en una herramienta de gobierno, no solo pruebas unitarias.** Un sistema de seguimiento de requerimientos falla de forma silenciosa cuando falla mal: un requerimiento que no cambia de estado, un rol que no debería tener acceso y lo tiene, un formulario de visita que no guarda. Ese tipo de fallo rara vez lo detecta una prueba unitaria aislada porque involucra la interacción completa entre UI, autenticación y persistencia. Invertir en Playwright —que ejercita el flujo real del usuario en varios navegadores— es reconocer que la confiabilidad de una herramienta institucional se juega en el camino completo, no en funciones sueltas, y que un funcionario público no debería ser quien reporta la regresión.

**Svelte y Vite por velocidad de iteración, no solo por rendimiento.** Un sistema de seguimiento institucional rara vez nace con requisitos completos y estables; los roles, los estados del Kanban y los campos de un requerimiento se ajustan sobre la marcha a medida que el equipo de la Alcaldía usa la herramienta y pide cambios. Vite recorta el ciclo de feedback local casi a cero, y Svelte, al compilar a JavaScript imperativo sin runtime pesado, mantiene esos ciclos de ajuste rápidos incluso a medida que la aplicación crece.

**Doble validación de autorización en vez de confiar solo en Firebase.** Delegar toda la autorización al token de Firebase es más simple, pero deja la lógica de negocio de permisos —quién puede ver qué proyecto, qué rol tiene acceso temporal— fuera del control directo del backend propio. Añadir una capa de verificación en las APIs de Railway cuesta una llamada adicional, pero evita que un cambio de configuración en Firebase o un token mal emitido se traduzca directamente en acceso indebido a información de gestión pública.

**UX de tablero Kanban para usuarios no necesariamente técnicos.** El público de la herramienta no son desarrolladores: son funcionarios e inspectores que necesitan entender de un vistazo en qué estado está un requerimiento sin tener que interpretar una tabla dinámica o un reporte exportado. Un tablero visual con movimiento directo entre columnas reduce la distancia entre "el dato existe en el sistema" y "la persona que lo necesita lo entiende", que es, en el fondo, el objetivo real de cualquier herramienta de seguimiento.

## Aprendizajes

Construir una herramienta de seguimiento para una entidad pública deja una lección que no es exclusivamente técnica: la confiabilidad no es un lujo de ingeniería, es parte del contrato con el usuario. Cuando el usuario es un funcionario que gestiona requerimientos ciudadanos, un flujo roto no es un bug incómodo, es un requerimiento que se queda sin atender y nadie lo nota hasta que alguien pregunta por él. Invertir en pruebas end-to-end multiplataforma con Playwright, en una capa de autorización que no depende de un solo proveedor, y en una interfaz que prioriza la claridad sobre la sofisticación, es la forma de tomarse en serio que del otro lado de la pantalla hay trabajo institucional real, no solo datos.
