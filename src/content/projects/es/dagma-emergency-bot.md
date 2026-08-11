---
title: "DAGMA Emergencias Bot: triage de emergencias ambientales por WhatsApp"
description: "Backend de emergencias ambientales por WhatsApp para el DAGMA: transcribe voz con Whisper, extrae datos con LangChain y GPT-4o, clasifica gravedad y geolocaliza con PostGIS."
projectId: "dagma-emergency-bot"
pubDate: 2026-08-11
draft: false
---

## Resumen

DAGMA Emergencias Bot es un backend de atención de emergencias ambientales construido para el Departamento Administrativo de Gestión del Medio Ambiente (DAGMA) de Cali. Su función es simple de enunciar y compleja de operar bien: recibir reportes ciudadanos de incidentes ambientales — quemas, vertimientos, tala ilegal, fauna en riesgo, contaminación de fuentes hídricas — a través de WhatsApp, y convertir un mensaje de texto o nota de voz en un registro estructurado, geolocalizado y priorizado que un equipo de respuesta pueda actuar sin fricción.

El problema de fondo no es tecnológico sino operativo: una entidad pública con capacidad de respuesta limitada necesita saber, en minutos, qué reportes son urgentes y dónde ocurren, sin obligar al ciudadano a llenar un formulario o instalar una aplicación. El bot resuelve esa brecha usando el canal de mensajería que la gente ya tiene abierto, y desplazando el trabajo de estructuración — extraer ubicación, clasificar gravedad, ubicar coordenadas — del ciudadano al sistema.

## Arquitectura

El flujo del sistema sigue una tubería lineal de procesamiento, desde el mensaje entrante hasta el registro persistido:

```
WhatsApp (Twilio webhook)
        │
        ▼
Recepción del mensaje (texto o nota de voz)
        │
        ▼
Transcripción de voz (Whisper)          ← solo si el mensaje es audio
        │
        ▼
Extracción de datos estructurados (LangChain + GPT-4o)
        │
        ▼
Clasificación automática de gravedad (alta / media / baja)
        │
        ▼
Geolocalización (PostGIS)               ← coordenadas explícitas o inferidas del texto
        │
        ▼
Persistencia (PostgreSQL + PostGIS)
```

El punto de entrada es un webhook que recibe eventos de WhatsApp a través de Twilio. Si el mensaje llega como nota de voz, se transcribe antes de continuar; si llega como texto, pasa directo a la etapa de extracción. A partir de ahí, un pipeline construido con LangChain orquesta la llamada a GPT-4o para extraer campos estructurados del texto libre: nombre del reportante, datos de contacto, categoría de la emergencia, descripción, ubicación mencionada y cualquier detalle de contexto relevante.

Con esos campos ya estructurados, el sistema clasifica automáticamente el nivel de gravedad del reporte y resuelve la geolocalización: si el mensaje trae coordenadas explícitas se usan directamente, y si no, se infieren a partir de la ubicación descrita en el texto. PostGIS almacena y opera esas coordenadas como datos geoespaciales de primera clase, no como texto libre, lo que habilita después consultas espaciales (reportes cercanos a una fuente hídrica, densidad de incidentes por comuna, etc.).

Todo el estado final se persiste en PostgreSQL, con el resto del sistema organizado en capas: configuración, conectividad a base de datos, esquemas de validación, modelos ORM, servicios de negocio y routers de API — una separación convencional que mantiene la lógica de extracción/clasificación desacoplada del transporte HTTP.

## Stack técnico

| Componente | Rol en el sistema | Por qué se eligió |
|---|---|---|
| **Whisper** | Transcripción de notas de voz a texto | Permite reportar una emergencia hablando, sin escribir — crítico en un momento de estrés o urgencia, y más rápido que teclear en un teléfono |
| **LangChain** | Orquestación de la extracción de datos | Estandariza el prompting, el parseo de salida estructurada y el manejo de la llamada al LLM como una etapa de pipeline reutilizable, en vez de código ad hoc por caso |
| **GPT-4o** | Extracción de campos estructurados desde texto libre | Modelo con buena comprensión de lenguaje natural en español y capacidad de seguir un esquema de salida consistente para datos como ubicación, categoría y contacto |
| **Groq** | Proveedor de inferencia complementario | Infraestructura de baja latencia para las llamadas del pipeline donde la velocidad de respuesta importa más que la profundidad del razonamiento, como pasos de clasificación |
| **PostGIS** | Almacenamiento y consulta de datos geoespaciales | Trata la ubicación del incidente como un tipo de dato geoespacial nativo sobre PostgreSQL, en vez de coordenadas sueltas en columnas de texto, habilitando consultas espaciales reales |
| **FastAPI / PostgreSQL** | Capa de API y persistencia | Framework async para exponer el webhook y los endpoints de consulta, con acceso a base de datos asíncrono (asyncpg) y ORM con SQLAlchemy 2.0 |

## Instalación

El flujo de arranque documentado en el repositorio sigue el patrón estándar de un backend Python con base de datos geoespacial:

```bash
git clone https://github.com/Juanpgm/emergencias-chatbot-dagma.git
cd emergencias-chatbot-dagma

python -m venv venv
source venv/bin/activate  # en Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Configuración de variables de entorno (`.env`), con las credenciales que el pipeline necesita en cada etapa:

```bash
# Proveedores de LLM
OPENAI_API_KEY=...
GROQ_API_KEY=...

# Integración de WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...

# Base de datos (PostgreSQL con extensión PostGIS)
DATABASE_URL=postgresql+asyncpg://usuario:password@host:5432/dagma_db
```

Antes de levantar el servicio, la base de datos debe tener la extensión PostGIS habilitada y las migraciones aplicadas con Alembic:

```bash
alembic upgrade head
```

Y finalmente, levantar el servidor FastAPI:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

El webhook de Twilio debe apuntar a la URL pública del endpoint correspondiente para que los mensajes de WhatsApp lleguen al sistema.

## Decisiones de diseño

**WhatsApp como canal, no una aplicación dedicada.** Construir una app móvil habría significado pedirle a cada ciudadano que la descargue, la instale y aprenda a usarla antes de poder reportar una emergencia — una barrera real quien ya está frente a un incendio forestal o un vertimiento no va a detenerse a instalar software. WhatsApp ya está en el teléfono de casi todo el mundo en Cali; usarlo como canal elimina esa fricción de adopción por completo y convierte el reporte en algo tan simple como enviar un mensaje a un contacto conocido.

**Transcripción de voz como característica de accesibilidad, no de conveniencia.** Escribir un reporte detallado con las manos temblando, en movimiento, o mientras se observa el incidente, es más lento y propenso a errores que simplemente hablar. La transcripción con Whisper baja la barrera de entrada para quienes tienen dificultad para escribir con rapidez o comodidad en un teléfono, y reduce el tiempo entre que alguien presencia una emergencia y el reporte llega al sistema — una variable que en un contexto de emergencia importa tanto como la precisión del dato.

**Clasificación automática de gravedad como mecanismo de triage.** Un equipo de respuesta ambiental de una entidad pública no tiene capacidad para atender todos los reportes con la misma prioridad ni al mismo tiempo. Clasificar automáticamente cada reporte como de gravedad alta, media o baja en el momento de la ingesta — en lugar de dejarlo para revisión manual posterior — permite que los casos urgentes salgan a la vista del equipo humano de inmediato, sin esperar a que alguien revise una cola de mensajes sin priorizar.

**PostGIS en vez de coordenadas como texto plano.** Guardar latitud y longitud como columnas numéricas sueltas habría bastado para mostrar un punto en un mapa, pero no para responder preguntas operativas como "qué reportes están cerca de este río" o "dónde se concentran los incidentes de esta comuna". PostGIS convierte la ubicación en un dato geoespacial consultable desde el día uno, lo cual importa especialmente cuando la utilidad real del sistema no es solo registrar reportes individuales sino detectar patrones espaciales de riesgo ambiental a lo largo del tiempo.

## Aprendizajes

Este proyecto deja una lección que se aplica más allá del stack técnico: en un sistema de atención ciudadana, la arquitectura correcta es la que reduce la distancia entre "algo está pasando" y "alguien con capacidad de actuar lo sabe". Cada decisión del pipeline — el canal, la transcripción, la clasificación automática, la geolocalización estructurada — apunta a comprimir esa distancia, no a acumular funcionalidad. Para una entidad como el DAGMA, con recursos de respuesta finitos frente a un territorio extenso, ese tipo de eficiencia operativa importa tanto como la corrección técnica del código: un reporte bien clasificado y bien ubicado que llega rápido vale más que un sistema sofisticado que llega tarde.
