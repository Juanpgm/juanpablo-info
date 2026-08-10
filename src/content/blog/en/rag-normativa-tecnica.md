---
title: "RAG for technical codes: querying the NSR-10 building code in natural language"
description: "How to design a RAG system that lets you query Colombia's NSR-10 seismic code in natural language, with citations traceable to the exact article instead of invented answers."
pubDate: 2026-06-20
tags: ["ia", "bim"]
draft: false
---

The NSR-10, the Colombian seismic-resistant building code, runs over a thousand pages split across several titles. Any structural engineer who has used it day to day knows how hard it is to find the exact article that applies to a specific case: you remember the concept ("minimum flexural reinforcement ratio") but not necessarily the article number or which title it lives under. That's exactly the kind of problem where a RAG system delivers real value — and where you also have to be especially careful about hallucinations: in technical codes, a made-up answer isn't a trivial error.

## Why RAG and not just a language model

Directly asking a general-purpose language model "what's the minimum reinforcement ratio according to the NSR-10?" is risky: the model can generate a plausible-sounding but incorrect figure, with no way to verify it. RAG solves this by splitting the problem into two separate responsibilities: **retrieval** (finding the actual fragments of the code relevant to the question) and **generation** (writing a clear answer from those fragments, citing them). The model never "invents" regulatory content — it only rephrases what's actually present in the retrieved fragment.

## The architecture, step by step

**1. Chunking with regulatory context.** Splitting the code into fixed-size chunks (say, 500 tokens) with no other criterion breaks the document's hierarchical structure. Instead, chunking follows the title → chapter → article hierarchy, and each fragment carries metadata about which article it belongs to:

```python
chunks = []
for articulo in parse_nsr10_por_articulo(documento):
    chunks.append({
        "texto": articulo.texto,
        "titulo": articulo.titulo,      # e.g. "Title C — Structural Concrete"
        "articulo": articulo.numero,    # e.g. "C.7.12.2"
    })
```

**2. Embeddings and vector store.** Each fragment is converted into an embedding vector and indexed in a vector database. For technical codes in Spanish, using an embedding model trained or fine-tuned on Spanish — and ideally on engineering-specific vocabulary — noticeably improves retrieval quality compared to a generic English-language model.

**3. Semantic retrieval.** Given a question like "what minimum reinforcement ratio applies to a solid slab?", the system retrieves the $k$ semantically closest fragments, not just the ones sharing exact keywords — so it still answers well even when the user's wording differs from the code's own terminology.

**4. Generation with mandatory citation.** The prompt to the language model includes an explicit instruction: answer only based on the retrieved fragments, and cite the exact article for every claim. If the retrieved fragments don't contain the answer, the model must explicitly say it couldn't find one, instead of filling the gap with general knowledge.

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

## What the NSR-10 taught me about building the system

Designing this system drew a direct parallel with my experience as a structural designer: the code exists precisely to remove ambiguity from decisions with consequences for people's safety. A badly designed RAG system — one that answers confidently even when it doesn't have the right source — violates that same principle in the AI domain. That's why the design criterion was never just "does it answer correctly most of the time?" but "is it honest when it doesn't know?"

In practice, the system is used today as a first-pass, fast lookup layer for junior engineers, with the cited article always visible and a direct link to the original text of the code — never as a replacement for professional judgment, but as a reliable shortcut to get to the right article faster.
