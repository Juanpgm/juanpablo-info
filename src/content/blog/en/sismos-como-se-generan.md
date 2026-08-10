---
title: "Earthquakes: How They Form and Why Colombia Lives With the Risk"
description: "How earthquakes are generated, the plate tectonics behind them, and why Colombia, and the Cauca Valley in particular, lives under high seismic hazard."
pubDate: 2026-03-10
tags: ["sismica", "gestion-riesgo"]
heroImage: ../../../assets/blog/sismos-como-se-generan.svg
draft: false
---

When I worked on structural design under Colombia's NSR-10 seismic code, the first question for any project was never "how big should this beam be?" It was "how hard can the ground shake here?" Understanding how earthquakes are generated isn't geological trivia; it's the starting point for every seismic engineering decision in a country crossed by several active tectonic plate boundaries.

## The plate tectonics behind an earthquake

The Earth's crust isn't one continuous shell — it's a mosaic of rigid plates floating over the upper mantle, moving relative to each other at a few centimeters per year. Most earthquakes happen at plate boundaries, where strain energy accumulated over decades or centuries is released suddenly once the friction locking two rock blocks together finally gives way.

Colombia sits in a particularly complex tectonic position: the Nazca plate (oceanic), the Caribbean plate, and the South American plate (continental) all converge here. The Nazca plate subducts beneath the South American plate along the Pacific coast, generating subduction earthquakes that can be very deep and of large magnitude. But inland, active crustal fault systems also generate shallow earthquakes — often more locally destructive even at lower magnitude.

One of those systems is the Cauca-Romeral fault system, which runs through much of western Colombia and passes relatively close to Cali, where I've built most of my career. That proximity isn't an anecdotal detail — it's exactly the kind of information a structural engineer needs to understand why their municipality falls under a high seismic hazard zone.

## Magnitude, intensity, and why they aren't the same thing

Magnitude and intensity are commonly confused, but for structural design the distinction is central.

- **Magnitude**: measures the energy released at the earthquake's focus (hypocenter). It's a single number per event (for example, on the moment magnitude scale, Mw) and doesn't change depending on where you're standing.
- **Intensity**: measures the perceived effect and observed damage at a specific location, and it does vary with distance to the epicenter, soil type, and building characteristics. A moderate-magnitude earthquake can produce very high intensities if the epicenter is shallow and the local soil amplifies the signal, as happens in soft alluvial deposits.

That distinction is exactly why seismic design doesn't work with just "how big was the earthquake" — it works with design spectra that capture how the local soil and the structure itself respond to that energy.

## Why this matters for building design

The NSR-10 (Colombia's seismic-resistant design code) translates all of this geological knowledge into concrete design parameters: the effective peak acceleration (Aa), the effective peak acceleration for velocity (Av), and the soil profile determine the design spectrum a structural engineer must use. These parameters aren't arbitrary — they're the result of decades of seismic hazard studies modeling the probability of a given level of ground motion occurring in each part of the country.

During my work on projects like the "Teatrino" reinforced-concrete amphitheater, that link between regional geology and design code stopped being theory and became a real engineering decision: the project's location within a high seismic hazard zone required a structural system with a specific energy-dissipation capacity, not an aesthetic choice.

For a deeper look at how Colombia's code translates this hazard into concrete design requirements, I wrote in detail about the [NSR-10 review and updates](/en/blog/nsr-10-revision-novedades/). And for the more practical angle — what to do in the moment an earthquake hits — I have a specific guide on [how to act during an earthquake](/en/blog/como-actuar-en-caso-de-sismo/).

## From geology to data

What started for me as a purely structural question ended up opening the door to the world of data: modern seismic hazard models depend on sensor networks, historical event catalogs, and probabilistic models that process enormous volumes of geospatial information. That same logic — turning scattered physical signals into actionable information — is what I later found in my work with risk-management and geointelligence systems in the public sector. Understanding how an earthquake is generated isn't just geology; it's the first link in a chain that, done well, ends up saving lives.
