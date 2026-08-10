---
title: "EDAN: How Damage and Needs Are Assessed After a Disaster"
description: "What the EDAN methodology is, how damage and needs get assessed after a disaster in two stages, and what data actually gets collected in the field."
pubDate: 2026-07-28
tags: ["gestion-riesgo", "normativa"]
heroImage: ../../../assets/blog/edan-evaluacion-danos-analisis-necesidades.en.svg
heroImageAlt: "Four-step EDAN flow: event, fast initial assessment, sector-by-sector complementary assessment, and consolidated report"
heroImageCaption: "Standardized data at every stage, consolidable across municipalities."
draft: false
---

When an earthquake, a flood, or a landslide hits a populated area, the first operational question isn't "how much was lost" but "how fast, and with how good information, can we decide where to act first?" The institutional answer to that question, in Colombia and across much of Latin America, is EDAN — Evaluación de Daños y Análisis de Necesidades, or Damage and Needs Assessment. It's not just another form among many: it's the standardized methodology connecting what happens on the ground to the decisions made by whoever allocates resources. Working closely with Colombia's National Disaster Risk Management framework, I learned why that standardization, bureaucratic as it might sound, is what actually saves time when time is the one thing in short supply.

## Two levels of assessment

EDAN, as implemented under the [SNGRD](/en/blog/sistema-nacional-gestion-riesgo-desastres/) framework, isn't done all at once or at a single level of detail. It runs in two complementary stages:

- **Initial (rapid) assessment**: carried out in the first hours after the event, with limited resources and directly in the field, prioritizing speed over exhaustiveness. Its goal is to size the general magnitude of the impact — approximate number of people affected, homes with visible damage, interrupted roads — quickly enough to trigger a proportional response without waiting for a full census.
- **Complementary assessment**: carried out over the following days, with technical teams going sector by sector — infrastructure, housing, public services, productive sector — turning a rough estimate into data with enough resolution to design actual recovery programs, not just immediate emergency response.

That two-stage split isn't a methodological whim: it recognizes that perfect information and timely information almost never arrive together, and that a well-designed risk-management system needs both, in the right order.

## What data actually gets collected

On the ground, a typical EDAN form — Colombia uses formats aligned with the OCHA/Red Cross EDAN methodology, adapted by UNGRD — collects information structured into consistent categories:

1. **Infrastructure**: roads, bridges, water and sewage networks, with a severity level (light, moderate, severe, destroyed).
2. **Housing**: number of affected housing units, distinguishing repairable damage from total loss — the central figure for sizing temporary shelter needs.
3. **Services**: continuity of power, potable water, health, and education in the affected zone.
4. **Affected population**: number of people, households, and groups with differential vulnerability (older adults, people with disabilities, young children), which drives response prioritization, not just its total magnitude.

## Why standardization speeds up the response

The reason this feels so close to home, even coming from a data-focused technical role, is that EDAN is fundamentally a structured field-data-capture problem under adverse conditions: limited connectivity, little time, staff with different levels of technical training filling out the same form across different municipalities. When that data is captured consistently — same categories, same severity scale, same format — it can be consolidated automatically at the departmental or national level without anyone having to manually reconcile reports built on different structures. It's essentially the same problem I faced building field geospatial data-capture systems for DAGMA: the quality of the final decision depends less on the downstream analysis and more on how well-designed the form is that someone fills out in the rain, with no signal, in a hurry.

## Closing

EDAN doesn't eliminate the uncertainty of a disaster, but it does turn it into something workable: numbers comparable across municipalities, categories a mayor and a UNGRD director can read the same way, and a basis for justifying — not improvising — the allocation of recovery resources. That discipline of standardizing data capture at the most chaotic possible moment is, to me, one of the clearest examples of why good data engineering and good risk management end up being, at bottom, the same craft.
