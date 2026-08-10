---
title: "Data sovereignty: why I explored local AI infrastructure in the public sector"
description: "The technical and public-policy reasons behind deploying self-hosted AI models instead of relying exclusively on external APIs for sensitive public-sector data."
pubDate: 2026-05-20
tags: ["ia", "carrera"]
draft: false
---

Every time a language model processes a public agency's environmental data, citizen security data, or risk management data through an external API, that data leaves the agency's own infrastructure. Most of the time that isn't a real problem. But there are categories of data — critical infrastructure locations, georeferenced crime patterns, information about vulnerable populations — where that data leaving actually matters, and where the question "where does this data physically live while the model is processing it?" stops being a technical detail and becomes a public policy decision.

That question is what led me to explore local AI infrastructure (self-hosted models) for several of the public-sector projects I worked on.

## The technical argument, not just the political one

Beyond data sovereignty, there are purely technical reasons to consider local infrastructure:

- **Latency and availability**: a local model doesn't depend on an external service's uptime or on rate limits that can block a production process at the worst possible moment.
- **Cost at scale**: for recurring, high-volume workloads (classifying thousands of citizen reports a day, for example), the marginal cost of an amortized dedicated GPU can end up lower than constant API calls, depending on volume.
- **Model version control**: a self-hosted model doesn't change behavior unless the team explicitly decides to change it. A model served behind an external API can be silently updated, which is risky when production processes depend on consistent behavior.

## What "local AI infrastructure" means in practice

This isn't about training a model from scratch — that rarely makes sense for a public agency. It's about taking an open model (from the Llama or Mistral family, for example) and serving it within your own infrastructure, or in a cloud environment where the data stays under controlled jurisdiction and contract, instead of sending it to a third-party API. A typical local deployment configuration, using an inference engine like vLLM or Ollama, looks like this:

```yaml
model: mistral-7b-instruct
quantization: int8
max_context_tokens: 8192
served_via: vllm
gpu: 1x A10G
network_policy: internal-only   # no outbound internet access
```

The key part of that last parameter, `network_policy: internal-only`, is precisely the point: the model processes information within the agency's network perimeter, with the data never leaving to a third party.

## The real costs of this decision

Being honest about the trade-offs matters as much as making the case for the decision itself. A moderately sized self-hosted model (7B–13B parameters) doesn't always match the quality of the larger proprietary models available via API. It requires GPU infrastructure, maintenance, and a team capable of operating it — costs that an external API abstracts away entirely. The right answer isn't "always local" or "always external API," but classifying use cases by data sensitivity and volume, and applying local infrastructure only where it's actually justified.

## What this exploration confirmed for me

Exploring this wasn't a purely technical exercise — it was also a way of bringing to the public sector a conversation that's already fairly mature in the private tech sector: where the data lives, who controls it, and what happens if the external provider changes its terms of service. For a public agency handling critical infrastructure and citizen data, that conversation shouldn't be optional. At its core, it's the same discipline I apply to any architecture decision: understand explicitly what you're optimizing for and what you're risking, before committing to a solution.
