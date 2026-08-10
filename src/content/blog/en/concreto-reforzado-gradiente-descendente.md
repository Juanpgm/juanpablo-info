---
title: "From reinforced concrete to gradient descent: my jump from civil engineering to AI"
description: "How I went from designing reinforced concrete structures under Colombia's seismic code to building data and AI architectures for the public sector — and why both worlds resemble each other."
pubDate: 2026-08-05
tags: ["carrera", "ia"]
draft: false
---

In my first years as a civil engineer, my work revolved around one very concrete goal (literally): making sure a structure would resist the loads it was designed for, with a calculated, verifiable, and documented safety margin. I designed bleachers, roofs, and reinforced concrete elements following the NSR-10, Colombia's seismic design code, where every steel reinforcement ratio and every structural joint has to be backed by a traceable calculation. There is no room for unverified intuition: you iterate, check drift limits, adjust sections, and re-run the analysis.

Years later, sitting in front of a machine learning model that wasn't converging, I had a strangely familiar feeling. I was tuning hyperparameters, watching a loss curve oscillate instead of decreasing, and I thought: this is the same as adjusting a frame that fails a drift check. You change one variable, re-run the model, observe the result, adjust again. Structural engineering and model training share the same underlying logic: iterative optimization under constraints.

## The parallel I didn't expect

Structural design under the NSR-10 is, at its core, a constrained optimization problem: minimize the amount of steel and concrete subject to the structure meeting allowable drift, ultimate strength, and minimum ductility. Training a model with gradient descent has exactly the same mathematical structure — the "constraint" simply becomes a penalty term inside the loss function, and the "design" becomes the weights of the network.

In pseudocode, this is the core of both processes, stripped to its essentials:

```python
theta = initial_guess()
for step in range(max_iterations):
    gradient = compute_gradient(loss_function, theta)
    theta = theta - learning_rate * gradient
    if converged(theta):
        break
```

When I calibrated a concrete section by hand, my "learning rate" was engineering judgment: how much to adjust the reinforcement ratio on each iteration without overcorrecting. In a data model, that same judgment is called `learning_rate`, and it has to be calibrated with the same discipline: too high, and the model "oscillates" just like an overdesigned structure caught in a feedback loop; too low, and it converges so slowly the project never moves forward.

## Why the jump wasn't a break

I didn't leave civil engineering to "go into tech." The turning point was noticing that a large share of public infrastructure decisions — where to place a traffic light, which neighborhood to prioritize in a risk-management program, which corridor deserves investment in public lighting — depended on data that already existed but was scattered, unstructured, with no pipeline turning it into something queryable. My first serious foray into data science was exactly that: taking territorial information that already lived in drawings, files, and spreadsheets, and turning it into something a model could use to predict or prioritize.

Specializing in artificial intelligence wasn't a change of vocation; it was an extension of the same question I asked myself as a civil engineer: how do I design something that works reliably, on real data, with real consequences for people? The difference is that now, instead of a concrete frame, the "system" I design is a data pipeline, a spatiotemporal risk model, or a RAG architecture that queries technical regulations.

## What carried over from one world to the other

Three habits from civil engineering turned out to be directly transferable to data and AI work:

1. **Traceability**: just as every structural element must be justifiable through a calculation report, every prediction from a model in production should be explainable — what data generated it, under which model version, under which assumptions.
2. **Safety margins**: structures are designed with load amplification factors; the equivalent in risk models is never trusting a point prediction blindly, but working with intervals and cross-validation instead.
3. **Iteration discipline**: neither a structure nor a model comes out right on the first try. The difference between a junior and a senior engineer, in both worlds, is how fast they identify why something isn't converging.

This blog was born from that conviction: that building physical infrastructure and building data infrastructure are, at their core, the same discipline applied to different materials. In upcoming posts I'll walk through concrete cases — from BIM drawings to data warehouses, from vegetation cover to public policy decisions, from the NSR-10 queried in natural language — that show how those two worlds, in my day-to-day work, have already converged.
