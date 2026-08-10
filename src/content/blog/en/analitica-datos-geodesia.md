---
title: "Data Analytics in Geodesy: From GNSS Point to Ground Deformation Model"
description: "How a data pipeline turns raw GNSS and InSAR observations into a ground deformation model useful for early geotechnical monitoring."
pubDate: 2026-05-19
tags: ["geointeligencia", "data-engineering"]
heroImage: ../../../assets/blog/analitica-datos-geodesia.en.svg
heroImageAlt: "Geodetic data pipeline: from a GNSS/InSAR station to a ground deformation model, through ingestion and time-series analysis"
heroImageCaption: "The same data pipeline pattern used in security observatories works for ground geodetic monitoring."
draft: false
---

A GNSS station delivers, in its rawest form, a cloud of noisy coordinates: multipath, atmospheric variations, clock errors, cycle slips. That point cloud is useless to anyone until it becomes something interpretable: a clean time series showing how much a ground point has moved, in what direction, and at what rate. Data analytics in geodesy is, at its core, the same problem I solved building data pipelines for the public sector in Cali: how to take a raw, noisy signal all the way to a reliable model someone can actually act on.

## From Raw Observation to Usable Data

The two most common observation sources for deformation monitoring are GNSS (fixed stations or periodic campaigns that measure three-dimensional position with millimeter-level precision) and InSAR (satellite radar interferometry, which compares image pairs to detect line-of-sight displacement over large areas without field instrumentation). Each source has its own noise profile and sampling frequency, so the first real data-engineering task isn't analytical, it's ingestion: normalizing formats (RINEX for GNSS, SLC products or interferograms for InSAR), aligning temporal and spatial reference frames, and getting everything into a common schema before any statistical model touches the data.

## The Pipeline: Ingestion, Filtering, Time Series, Model

In practice, a geodetic analytics pipeline follows a fairly stable sequence:

1. **Ingestion**: raw data (GNSS observations, InSAR interferograms) enters an analytical store — in my experience designing Cali's Security Observatory Data Warehouse, this meant ETL running 100% on GCP, with BigQuery as the analytical layer — and gets versioned by station and observation date.
2. **Noise filtering**: outliers are removed, cycle slips corrected, and atmospheric and multipath correction models applied. This stage determines final quality more than any other: too aggressive a filter smooths out real deformation, too lax a filter lets through noise that gets mistaken for ground movement.
3. **Time-series analysis**: trend models (linear, or nonlinear if there's acceleration) are fit to the clean data to estimate deformation velocity per point, typically in millimeters/year.
4. **Deformation model**: values are spatially interpolated between points or InSAR pixels to generate a continuous deformation-velocity map over the area of interest, ready to cross-reference with other layers — geology, land use, precipitation — inside a geographic information system.

## Why This Matters for Early Detection

A well-built deformation model detects subtle accelerations in ground movement long before they're visible to the naked eye. That's exactly the input a [mass movement monitoring system](/en/blog/movimientos-remocion-en-masa-tipos/) needs: it's not about waiting for a crack to appear on the surface, it's about detecting that a slope's deformation velocity is increasing weeks or months before a catastrophic failure. Geodetic analytics, properly integrated into a data pipeline, turns a geotechnical hazard from something reactive into something continuously monitorable.

## The Bridge Between Territory and Data

This is, perhaps, the most direct example of why I'm interested in the intersection between civil engineering and data science: geodesy produces real physical signals of ground behavior, and data engineering is what turns those signals into actionable information at scale. Having built analytical pipelines for urban security data and having worked with geospatial data for protected territory at DAGMA made it very clear that the technical challenge is the same regardless of whether the data comes from a crime sensor or a GNSS station: reliable ingestion, honest noise filtering, and a model someone can actually use to decide in time.
