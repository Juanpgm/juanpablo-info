---
title: "Geointeligencia con GCP: de coberturas vegetales a decisiones de política pública"
description: "Cómo un pipeline de imágenes satelitales, índices de vegetación y GIS en Google Cloud puede convertirse en un insumo directo para decisiones de política ambiental territorial."
pubDate: 2026-06-05
tags: ["geointeligencia", "data-engineering"]
draft: false
---

Un mapa de coberturas vegetales no sirve de mucho si vive solo como una imagen bonita en un informe PDF. Sirve cuando se puede cruzar, actualizar y consultar junto con el resto de los datos territoriales de una ciudad: presupuesto ambiental, denuncias ciudadanas, licencias de construcción, zonas de expansión urbana. Ese cruce es, en esencia, lo que entiendo por geointeligencia aplicada a política pública: no solo producir el dato geoespacial, sino integrarlo a una infraestructura donde otros equipos puedan usarlo sin depender de un especialista en GIS para cada consulta.

## De la imagen satelital al índice de vegetación

El punto de partida son imágenes multiespectrales (por ejemplo, Sentinel-2), de las que se calcula el NDVI (Índice de Vegetación de Diferencia Normalizada), una medida estándar de densidad y salud de la cobertura vegetal a partir de las bandas de infrarrojo cercano (NIR) y rojo (RED):

$$\text{NDVI} = \frac{\text{NIR} - \text{RED}}{\text{NIR} + \text{RED}}$$

En código, sobre un raster ya recortado al límite municipal:

```python
import rasterio
import numpy as np

with rasterio.open("sentinel2_nir.tif") as nir_src, rasterio.open("sentinel2_red.tif") as red_src:
    nir = nir_src.read(1).astype("float32")
    red = red_src.read(1).astype("float32")

ndvi = (nir - red) / (nir + red + 1e-6)
```

Valores de NDVI cercanos a 1 indican vegetación densa y saludable; valores cercanos a 0 o negativos indican suelo desnudo, agua o superficie construida. Comparar el NDVI de la misma zona en distintos períodos es lo que permite detectar pérdida de cobertura vegetal de forma objetiva, sin depender de recorridos de campo exhaustivos.

## De raster a decisión: el pipeline en GCP

Calcular un NDVI es solo el primer eslabón. El valor real aparece cuando ese resultado se integra a un pipeline reproducible:

1. **Ingesta**: un job periódico descarga las escenas Sentinel-2 más recientes para el área de interés y las almacena en Cloud Storage.
2. **Procesamiento**: se calcula el NDVI y se vectoriza el resultado en polígonos de cobertura (denso, medio, degradado), usando umbrales validados con puntos de control en campo.
3. **Carga a BigQuery GIS**: los polígonos resultantes se cargan como geometrías nativas en BigQuery, lo que permite consultas espaciales directas —por ejemplo, cuántas hectáreas de cobertura densa hay dentro de una comuna específica— con SQL estándar en lugar de herramientas de escritorio GIS:

```sql
SELECT
  comuna,
  SUM(ST_AREA(geometria)) / 10000 AS hectareas_cobertura_densa
FROM coberturas_vegetales
WHERE clase = 'denso'
GROUP BY comuna
ORDER BY hectareas_cobertura_densa DESC;
```

4. **Consumo**: el resultado alimenta tableros públicos y reportes técnicos que antes se producían manualmente cada varios meses, y que ahora se actualizan cada vez que hay una nueva escena satelital disponible.

## Por qué esto es una decisión de política, no solo un dato técnico

La razón por la que este tipo de pipeline importa más allá de lo técnico es que convierte una pregunta ambigua ("¿estamos perdiendo cobertura vegetal en la ciudad?") en una pregunta verificable y con evidencia trazable a una fuente pública (imágenes satelitales de acceso abierto). Eso cambia la naturaleza de la conversación con tomadores de decisión: en lugar de discutir percepciones, se discute sobre un mapa actualizado con metodología documentada.

Mi rol en este tipo de proyectos rara vez termina en el cálculo del NDVI. Termina cuando ese resultado se convierte en un insumo que un equipo de planeación ambiental puede consultar sin depender de mí —lo cual, para efectos prácticos, es la verdadera definición de infraestructura de datos bien construida.
