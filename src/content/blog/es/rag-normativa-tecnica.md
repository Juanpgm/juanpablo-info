---
title: "RAG para normativa técnica: consultar la NSR-10 en lenguaje natural"
description: "Cómo diseñar un sistema RAG que permita consultar la norma sismo-resistente NSR-10 en lenguaje natural, con citas trazables al artículo exacto en lugar de respuestas inventadas."
pubDate: 2026-06-20
tags: ["ia", "bim"]
draft: false
---

La NSR-10, la norma sismo-resistente colombiana, tiene más de mil páginas repartidas en varios títulos. Cualquier ingeniero estructural que la haya usado en el día a día sabe lo que cuesta encontrar el artículo exacto que aplica a un caso particular: uno recuerda el concepto ("cuantía mínima de refuerzo a flexión") pero no necesariamente el número de artículo ni el título donde vive. Ese es exactamente el tipo de problema donde un sistema RAG aporta valor real, y donde además hay que ser especialmente cuidadoso con las alucinaciones: en normativa técnica, una respuesta inventada no es un error trivial.

## Por qué RAG y no solo un modelo de lenguaje

Pedirle directamente a un modelo de lenguaje general "¿cuál es la cuantía mínima de refuerzo según la NSR-10?" es arriesgado: el modelo puede generar una cifra plausible pero incorrecta, sin ninguna forma de verificarla. RAG resuelve esto separando dos responsabilidades: la **recuperación** (encontrar los fragmentos reales de la norma que son relevantes a la pregunta) y la **generación** (redactar una respuesta clara a partir de esos fragmentos, citándolos). El modelo nunca "inventa" contenido normativo: solo reformula lo que efectivamente está en el fragmento recuperado.

## La arquitectura, paso a paso

**1. Chunking con contexto normativo.** Dividir la norma en fragmentos de tamaño fijo (por ejemplo, 500 tokens) sin más criterio rompe la estructura jerárquica del documento. En su lugar, el chunking respeta la jerarquía título → capítulo → artículo, y cada fragmento conserva metadata sobre a qué artículo pertenece:

```python
chunks = []
for articulo in parse_nsr10_por_articulo(documento):
    chunks.append({
        "texto": articulo.texto,
        "titulo": articulo.titulo,      # p.ej. "Título C — Concreto estructural"
        "articulo": articulo.numero,    # p.ej. "C.7.12.2"
    })
```

**2. Embeddings y vector store.** Cada fragmento se convierte en un vector de embedding y se indexa en una base vectorial. Para normativa técnica en español, usar un modelo de embeddings entrenado o afinado en español y, si es posible, en vocabulario técnico de ingeniería, mejora sensiblemente la calidad de la recuperación frente a un modelo genérico en inglés.

**3. Recuperación semántica.** Ante una pregunta como "¿qué cuantía mínima de refuerzo aplica a una losa maciza?", el sistema recupera los $k$ fragmentos más cercanos semánticamente, no solo los que comparten palabras exactas — así responde bien aunque el usuario use un término distinto al de la norma.

**4. Generación con cita obligatoria.** El prompt al modelo de lenguaje incluye una instrucción explícita: responder únicamente con base en los fragmentos recuperados y citar el artículo exacto de cada afirmación. Si los fragmentos recuperados no contienen la respuesta, el modelo debe decir explícitamente que no la encontró, en lugar de completar el vacío con conocimiento general.

```python
prompt = f"""
Responde la pregunta usando SOLO los fragmentos de la NSR-10 dados abajo.
Cita el artículo exacto (ej. "según C.7.12.2...") en cada afirmación.
Si la respuesta no está en los fragmentos, dilo explícitamente.

Fragmentos:
{contexto_recuperado}

Pregunta: {pregunta_usuario}
"""
```

## Lo que la NSR-10 me enseñó sobre construir el sistema

Diseñar este sistema tuvo un paralelo directo con mi experiencia como diseñador estructural: la norma existe precisamente para eliminar la ambigüedad en decisiones que tienen consecuencias sobre la seguridad de las personas. Un sistema RAG mal diseñado —que responde con confianza aunque no tenga la fuente correcta— viola ese mismo principio en el dominio de IA. Por eso el criterio de diseño no fue solo "¿responde bien la mayoría de las veces?" sino "¿es honesto cuando no sabe?".

En la práctica, el sistema se usa hoy como una primera capa de consulta rápida para ingenieros junior, con el artículo citado siempre visible y un enlace directo al texto original de la norma —nunca como reemplazo del criterio profesional, sino como un atajo confiable para llegar más rápido al artículo correcto.
