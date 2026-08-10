---
title: "From drawings to pipelines: how a BIM model feeds a territorial Data Warehouse"
description: "A technical walkthrough of extracting structured data from a BIM model (IFC) and turning it into queryable tables inside a GCP Data Warehouse, without losing traceability."
pubDate: 2026-07-20
tags: ["bim", "data-engineering"]
draft: false
---

A well-built BIM model is, in practice, a database with geometry attached. Every element — a beam, a segment of a water network, a light fixture — carries structured properties: material, dimensions, construction phase, design owner. The problem is that this information almost never leaves the `.rvt` or `.ifc` file where it lives. It stays trapped inside a desktop tool while the rest of the organization — planning, budgeting, construction tracking — keeps working from spreadsheets disconnected from the model.

Coordinating BIM across several public infrastructure projects, I kept running into the same question from planning teams: "can you get me what's in the model as a table?" The right technical answer isn't a manual Excel export every time someone asks — it's a pipeline that does it repeatably.

## From IFC to rows

The IFC (Industry Foundation Classes) format is an open standard, and unlike proprietary formats, it can be read programmatically. The `ifcopenshell` Python library lets you walk through an IFC file and extract exactly the attributes that matter for reporting, without relying on manual exports from the modeling software:

```python
import ifcopenshell

model = ifcopenshell.open("project.ifc")

rows = []
for element in model.by_type("IfcBuildingElement"):
    psets = ifcopenshell.util.element.get_psets(element)
    rows.append({
        "global_id": element.GlobalId,
        "type": element.is_a(),
        "name": element.Name,
        "phase": psets.get("Pset_Construction", {}).get("Phase"),
        "material": psets.get("Pset_MaterialCommon", {}).get("Material"),
    })
```

That `rows` list is already tabular: each row is a model element with its structured properties, ready to load into a staging table.

## The full pipeline

The flow we ended up implementing has three stages — a fairly classic ETL, applied to an unusual input source: a BIM model.

1. **Extraction**: a scheduled job reads the latest exported IFC for the project (every BIM coordination deliverable produces a new version) and outputs the tabular dataset described above.
2. **Transformation**: phase and material names are normalized against a controlled catalog (so "21 MPa concrete" and "f'c=21MPa concrete" don't show up as two different materials), and aggregate metrics are computed: element counts per phase, estimated physical progress by comparing modeled phases against actual construction phases.
3. **Load**: the result is loaded into BigQuery, inside the same territorial Data Warehouse where other sources already live — budget, schedule, risk-management indicators — enabling cross-analysis that used to be impossible, like correlating the BIM model's physical progress against reported budget execution without anyone manually reconciling both sources.

## Why traceability matters

A common mistake when "flattening" a BIM model into tables is losing the link back to the source model. That's why every row keeps the IFC element's `global_id`: if someone in the Data Warehouse spots an inconsistency — say, an element tagged "phase 2" when it should be "phase 1" — they can go straight back to the BIM model and locate the exact element, not just a generic name.

This "drawings to pipelines" pattern isn't specific to BIM — it's the same principle I apply to any technical source that's inherently unstructured: construction records, field reports, GIS layers. Turn it into something queryable without giving up the ability to trace back to the original source. It's, at its core, the same traceability discipline a structural calculation demands, applied to data instead of reinforcement bars.

The practical result: a territorial tracking dashboard that used to take days to update manually now refreshes automatically every time a new version of the BIM model is published, without the planning team ever having to open the modeling software.
