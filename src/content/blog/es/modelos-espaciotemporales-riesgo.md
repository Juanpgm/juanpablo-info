---
title: "Modelos espaciotemporales de riesgo: predecir el dónde antes que el cuándo"
description: "Por qué en gestión pública del riesgo suele ser más útil acertar la zona que la fecha exacta, y cómo construimos un modelo espaciotemporal de concentración de incidentes."
pubDate: 2026-07-05
tags: ["data-engineering", "geointeligencia"]
draft: false
---

Cuando empecé a trabajar con modelos de riesgo para seguridad ciudadana, la primera pregunta que me hicieron los tomadores de decisión no fue "¿cuándo va a pasar algo?" sino "¿dónde debo poner más atención esta semana?". Esa distinción cambia por completo el diseño del modelo. Predecir el instante exacto de un evento raro es, en la práctica, casi imposible con los datos disponibles; predecir zonas de concentración de riesgo, en cambio, es un problema mucho más tratable y, para efectos operativos, igual de útil.

## El dato de partida: eventos como puntos en espacio y tiempo

La materia prima de un modelo espaciotemporal de riesgo son eventos georreferenciados con marca de tiempo: cada incidente reportado tiene una latitud, una longitud y una fecha. El primer paso técnico es discretizar el espacio en una grilla (celdas de, por ejemplo, 200x200 metros) y el tiempo en ventanas (semanas o franjas horarias), para pasar de "puntos dispersos" a "conteos por celda-ventana", que es la unidad sobre la que efectivamente se modela.

```python
import geopandas as gpd

# eventos: GeoDataFrame con geometría de punto y columna 'fecha'
eventos["celda"] = eventos.geometry.apply(lambda p: grid_index(p, cell_size=200))
eventos["semana"] = eventos["fecha"].dt.isocalendar().week

conteos = (
    eventos.groupby(["celda", "semana"])
    .size()
    .rename("n_eventos")
    .reset_index()
)
```

## Por qué un enfoque tipo proceso de Poisson

Los conteos de eventos raros por celda y ventana de tiempo se comportan razonablemente bien bajo un proceso de Poisson: la probabilidad de observar $k$ eventos en una celda-ventana con tasa esperada $\lambda$ es

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

El trabajo del modelo, entonces, no es "adivinar" un evento puntual sino estimar $\lambda$ para cada celda-ventana como función de variables explicativas: densidad poblacional, uso del suelo, cercanía a corredores viales, historial reciente de incidentes (autocorrelación espacial y temporal). Un modelo aditivo generalizado o un gradient boosting sobre estos conteos suele superar ampliamente a una heurística manual basada solo en el histórico bruto, porque incorpora covariables territoriales que cambian más lento que el propio evento.

## Del modelo al mapa operativo

Un modelo de riesgo que solo vive en un notebook no cambia ninguna decisión. La parte que realmente importa —y donde mi formación en ingeniería civil y planeación territorial se vuelve directamente relevante— es traducir $\lambda$ estimado por celda en un mapa de calor interpretable, con capas GIS que el equipo operativo pueda cruzar con su conocimiento del terreno: ¿esa celda de riesgo alto coincide con un corredor sin alumbrado público? ¿Con una intersección vial conflictiva que ya estaba identificada en otro estudio?

Esa capa de cruce territorial es la que convierte un modelo estadístico en una herramienta de priorización real. En la práctica, publicamos el resultado como una capa GIS actualizada semanalmente, consumida tanto por analistas (que revisan el detalle celda por celda) como por un tablero ejecutivo con las diez zonas de mayor riesgo esperado para la semana.

## Los límites que hay que comunicar bien

Ningún modelo de este tipo predice un evento individual, y es importante ser explícito sobre eso con quien toma la decisión: el output es una probabilidad relativa de concentración, no una certeza. Comunicar mal esta distinción —dejar creer que el modelo "sabe" que algo va a pasar en un lugar específico— es el error más costoso que puede cometer un equipo de datos en este dominio, porque erosiona la confianza institucional en el modelo la primera vez que la realidad no coincide exactamente con la celda señalada.

Predecir el dónde antes que el cuándo no es una limitación del modelo: es, la mayoría de las veces, la pregunta que la gestión pública del riesgo realmente necesita responder.
