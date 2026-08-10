---
title: "Geointelligence with GCP: from vegetation cover to public policy decisions"
description: "How a pipeline of satellite imagery, vegetation indices, and GIS on Google Cloud can become a direct input for territorial environmental policy decisions."
pubDate: 2026-06-05
tags: ["geointeligencia", "data-engineering"]
draft: false
---

A vegetation cover map isn't worth much if it only lives as a pretty image in a PDF report. It becomes useful when it can be cross-referenced, updated, and queried alongside the rest of a city's territorial data: environmental budget, citizen complaints, construction permits, urban expansion zones. That cross-referencing is, in essence, what I understand geointelligence applied to public policy to mean: not just producing the geospatial data, but integrating it into infrastructure where other teams can use it without depending on a GIS specialist for every single query.

## From satellite image to vegetation index

The starting point is multispectral imagery (Sentinel-2, for instance), from which we calculate NDVI (Normalized Difference Vegetation Index), a standard measure of vegetation cover density and health derived from the near-infrared (NIR) and red (RED) bands:

$$\text{NDVI} = \frac{\text{NIR} - \text{RED}}{\text{NIR} + \text{RED}}$$

In code, over a raster already clipped to the municipal boundary:

```python
import rasterio
import numpy as np

with rasterio.open("sentinel2_nir.tif") as nir_src, rasterio.open("sentinel2_red.tif") as red_src:
    nir = nir_src.read(1).astype("float32")
    red = red_src.read(1).astype("float32")

ndvi = (nir - red) / (nir + red + 1e-6)
```

NDVI values close to 1 indicate dense, healthy vegetation; values near 0 or negative indicate bare soil, water, or built surfaces. Comparing the NDVI of the same area across different time periods is what lets you objectively detect vegetation loss, without relying on exhaustive field surveys.

## From raster to decision: the pipeline on GCP

Calculating an NDVI is only the first link. The real value shows up once that result is integrated into a reproducible pipeline:

1. **Ingestion**: a periodic job downloads the most recent Sentinel-2 scenes for the area of interest and stores them in Cloud Storage.
2. **Processing**: NDVI is calculated and the result is vectorized into cover polygons (dense, medium, degraded), using thresholds validated against field control points.
3. **Load into BigQuery GIS**: the resulting polygons are loaded as native geometries in BigQuery, which enables direct spatial queries — for example, how many hectares of dense cover exist within a given district — using standard SQL instead of desktop GIS tools:

```sql
SELECT
  comuna,
  SUM(ST_AREA(geometria)) / 10000 AS hectareas_cobertura_densa
FROM coberturas_vegetales
WHERE clase = 'denso'
GROUP BY comuna
ORDER BY hectareas_cobertura_densa DESC;
```

4. **Consumption**: the result feeds public dashboards and technical reports that used to be produced manually every few months, and that now refresh every time a new satellite scene becomes available.

## Why this is a policy decision, not just a technical one

The reason this kind of pipeline matters beyond the technical layer is that it turns an ambiguous question ("are we losing vegetation cover in the city?") into a verifiable one, with evidence traceable back to a public source (openly available satellite imagery). That changes the nature of the conversation with decision-makers: instead of arguing over perceptions, the conversation is grounded in an up-to-date map with documented methodology.

My role in this kind of project rarely ends at the NDVI calculation. It ends when that result becomes something an environmental planning team can query on its own, without depending on me — which, for practical purposes, is the real definition of well-built data infrastructure.
