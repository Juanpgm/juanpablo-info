---
title: "Soberanía de datos: por qué exploré infraestructura de IA local en el sector público"
description: "Las razones técnicas y de política pública detrás de desplegar modelos de IA autoalojados en lugar de depender exclusivamente de APIs externas para datos sensibles del sector público."
pubDate: 2026-05-20
tags: ["ia", "carrera"]
draft: false
---

Cada vez que un modelo de lenguaje procesa datos ambientales, de seguridad ciudadana o de gestión del riesgo de una entidad pública a través de una API externa, esos datos salen de la infraestructura de la entidad. En la mayoría de los casos eso no es un problema real. Pero hay categorías de datos —ubicaciones de infraestructura crítica, patrones de criminalidad georreferenciados, información de poblaciones vulnerables— donde esa salida de datos sí importa, y donde la pregunta "¿dónde vive físicamente este dato mientras el modelo lo procesa?" deja de ser un detalle técnico y se vuelve una decisión de política pública.

Esa pregunta es la que me llevó a explorar infraestructura de IA local (modelos autoalojados) para varios de los proyectos en los que trabajé en el sector público.

## El argumento técnico, no solo el político

Más allá de la soberanía de datos, hay razones puramente técnicas para considerar infraestructura local:

- **Latencia y disponibilidad**: un modelo local no depende de la disponibilidad de un servicio externo ni de límites de tasa (rate limits) que pueden bloquear un proceso de producción en el peor momento.
- **Costo a escala**: para cargas de trabajo recurrentes y de alto volumen (por ejemplo, clasificar miles de reportes ciudadanos al día), el costo marginal de una GPU propia amortizada puede ser menor que el de llamadas API constantes, dependiendo del volumen.
- **Control de versión del modelo**: un modelo autoalojado no cambia de comportamiento sin que el equipo lo decida explícitamente. Un modelo servido detrás de una API externa puede actualizarse silenciosamente, lo cual es riesgoso cuando hay procesos productivos que dependen de un comportamiento consistente.

## Qué significa "infraestructura de IA local" en la práctica

No se trata de entrenar un modelo desde cero — eso rara vez tiene sentido para una entidad pública. Se trata de tomar un modelo abierto (por ejemplo, de la familia Llama o Mistral) y servirlo dentro de la infraestructura propia o en una nube donde los datos permanecen bajo jurisdicción y contrato controlado, en lugar de enviarlos a una API de terceros. Una configuración típica de despliegue local, usando un motor de inferencia como vLLM u Ollama, luce así:

```yaml
model: mistral-7b-instruct
quantization: int8
max_context_tokens: 8192
served_via: vllm
gpu: 1x A10G
network_policy: internal-only   # sin salida a internet
```

La clave de ese último parámetro, `network_policy: internal-only`, es precisamente el punto: el modelo procesa la información dentro del perímetro de red de la entidad, sin que el dato salga hacia un tercero.

## Los costos reales de esta decisión

Ser honesto sobre las contrapartidas es tan importante como defender la decisión. Un modelo autoalojado de tamaño moderado (7B–13B parámetros) no siempre iguala la calidad de los modelos propietarios más grandes disponibles vía API. Requiere infraestructura de GPU, mantenimiento, y un equipo capaz de operarla —costos que una API externa abstrae por completo. La decisión correcta no es "siempre local" ni "siempre API externa", sino clasificar los casos de uso según la sensibilidad del dato y el volumen, y aplicar la infraestructura local solo donde efectivamente se justifica.

## Lo que me confirmó esta exploración

Explorar esto no fue un ejercicio puramente técnico: fue también una forma de traer al sector público una conversación que en el sector privado de tecnología ya está bastante madura —dónde vive el dato, quién lo controla, y qué pasa si el proveedor externo cambia sus términos de servicio. Para una entidad pública que maneja datos de infraestructura crítica y de ciudadanos, esa conversación no debería ser opcional. Es, en el fondo, la misma disciplina que aplico a cualquier decisión de arquitectura: entender explícitamente qué se está optimizando y qué se está arriesgando, antes de comprometerse con una solución.
