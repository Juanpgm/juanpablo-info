---
title: "Spatiotemporal risk models: predicting the where before the when"
description: "Why in public risk management getting the zone right often beats getting the exact date right, and how we built a spatiotemporal model of incident concentration."
pubDate: 2026-07-05
tags: ["data-engineering", "geointeligencia"]
draft: false
---

When I started working on risk models for public safety, the first question decision-makers asked me wasn't "when is something going to happen?" but "where should I pay more attention this week?" That distinction completely changes how you design the model. Predicting the exact instant of a rare event is, in practice, close to impossible with the data available; predicting zones of risk concentration, on the other hand, is a far more tractable problem, and just as useful operationally.

## The raw input: events as points in space and time

The raw material for a spatiotemporal risk model is georeferenced, timestamped events: every reported incident has a latitude, a longitude, and a date. The first technical step is discretizing space into a grid (say, 200x200 meter cells) and time into windows (weeks or time-of-day bands), turning "scattered points" into "counts per cell-window" — the actual unit the model operates on.

```python
import geopandas as gpd

# events: GeoDataFrame with point geometry and a 'date' column
events["cell"] = events.geometry.apply(lambda p: grid_index(p, cell_size=200))
events["week"] = events["date"].dt.isocalendar().week

counts = (
    events.groupby(["cell", "week"])
    .size()
    .rename("n_events")
    .reset_index()
)
```

## Why a Poisson-process-style approach

Counts of rare events per cell-window behave reasonably well under a Poisson process: the probability of observing $k$ events in a cell-window with expected rate $\lambda$ is

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

The model's job, then, isn't to "guess" a point-in-time event but to estimate $\lambda$ for each cell-window as a function of explanatory variables: population density, land use, proximity to major corridors, recent incident history (spatial and temporal autocorrelation). A generalized additive model or gradient boosting over these counts tends to substantially outperform a manual heuristic based purely on raw history, because it incorporates territorial covariates that change more slowly than the event itself.

## From model to operational map

A risk model that only lives in a notebook doesn't change a single decision. The part that actually matters — and where my background in civil engineering and territorial planning becomes directly relevant — is translating the estimated $\lambda$ per cell into an interpretable heat map, with GIS layers the operations team can cross-reference against their own field knowledge: does that high-risk cell overlap with a corridor lacking public lighting? With a conflict-prone intersection already flagged in another study?

That territorial cross-referencing layer is what turns a statistical model into a real prioritization tool. In practice, we published the result as a GIS layer refreshed weekly, consumed both by analysts (who review the cell-level detail) and by an executive dashboard listing the ten highest expected-risk zones for the week.

## The limits worth communicating clearly

No model of this kind predicts an individual event, and it's important to be explicit about that with decision-makers: the output is a relative probability of concentration, not a certainty. Miscommunicating this distinction — letting people believe the model "knows" something will happen at a specific spot — is the most costly mistake a data team can make in this domain, because it erodes institutional trust in the model the first time reality doesn't line up exactly with the flagged cell.

Predicting the where before the when isn't a limitation of the model. Most of the time, it's the actual question public risk management needs answered.
