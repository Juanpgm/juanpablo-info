---
title: "Telemática y modelos predictivos: cómo el ML y el deep learning leen datos en tiempo real"
description: "Diferencias reales entre machine learning clásico y deep learning para series de tiempo de sensores, con un ejemplo de pipeline predictivo en telemetría."
pubDate: 2026-06-02
tags: ["ia", "data-engineering"]
heroImage: ../../../assets/blog/telematica-modelos-predictivos-ml-dl.svg
heroImageAlt: "Pipeline de sensores telemétricos a un modelo de ML/DL que produce un indicador de riesgo predicho en tiempo real"
heroImageCaption: "De la señal cruda del sensor a una alerta accionable: el mismo flujo detrás de un sistema de alerta temprana."
draft: false
---

La telemática —sensores que transmiten datos en tiempo real desde equipos, vehículos o infraestructura instrumentada— genera un tipo de dato particular: series de tiempo de alta frecuencia, con ruido de sensor, gaps por pérdida de señal, y patrones que cambian según el contexto operativo. Convertir ese flujo continuo en un modelo predictivo confiable exige decisiones técnicas distintas a las de un problema de datos tabulares estático, y ahí es donde la elección entre machine learning clásico y deep learning deja de ser una preferencia estilística y se vuelve una decisión de ingeniería.

## Machine learning clásico vs. deep learning para series de tiempo

Un modelo de ML clásico —random forest, gradient boosting, incluso una regresión regularizada— necesita que alguien diseñe las variables: media móvil de las últimas N lecturas, desviación estándar en una ventana, tasa de cambio, hora del día. Esa ingeniería de variables (feature engineering) es donde vive el conocimiento del dominio, y cuando el fenómeno es relativamente bien entendido, un modelo clásico bien alimentado con buenas variables suele ser más rápido de entrenar, más interpretable, y sorprendentemente competitivo.

El deep learning —redes recurrentes tipo LSTM/GRU, o arquitecturas más recientes basadas en atención— aprende directamente de la secuencia cruda, sin que alguien tenga que diseñar a mano cada variable. Esto es valioso cuando el patrón temporal es complejo o cuando hay demasiadas señales de entrada como para diseñar variables manualmente para cada una, pero tiene un costo real: necesita más datos, más cómputo, y es notablemente más difícil de interpretar cuando alguien pregunta "¿por qué el modelo predijo esto?".

## Un ejemplo: de telemetría cruda a indicador de riesgo

Pensemos en un caso concreto: sensores que transmiten vibración, temperatura y presión desde equipo en operación, y la meta es predecir un indicador de riesgo antes de que se materialice una falla. Un flujo típico de feature engineering a predicción se ve así:

```python
# Pseudo-código: ventana deslizante -> features -> predicción
def build_features(window: list[dict]) -> dict:
    values = [r["vibration"] for r in window]
    return {
        "vib_mean": mean(values),
        "vib_std": stdev(values),
        "vib_trend": linear_slope(values),
        "temp_last": window[-1]["temperature"],
        "pressure_delta": window[-1]["pressure"] - window[0]["pressure"],
    }

def predict_risk(stream, model, window_size=60):
    buffer = deque(maxlen=window_size)
    for reading in stream:
        buffer.append(reading)
        if len(buffer) == window_size:
            features = build_features(list(buffer))
            risk_score = model.predict_proba(features)["high_risk"]
            if risk_score > ALERT_THRESHOLD:
                emit_alert(reading["sensor_id"], risk_score)
```

La parte que casi nunca se discute lo suficiente es el umbral de alerta (`ALERT_THRESHOLD`): calibrarlo mal en cualquier dirección tiene un costo real, ya sea saturar de falsos positivos a quien recibe la alerta o dejar pasar una falla real. Ese mismo problema de calibración de umbrales es el que enfrenta cualquier [sistema de alerta temprana](/es/blog/sistemas-alerta-temprana-sismos/), sea sísmico o industrial: el modelo predictivo es solo la mitad del sistema, la otra mitad es decidir con qué sensibilidad se dispara la alerta.

## Cuándo usar cuál

En mi experiencia, la pregunta correcta no es "¿ML o deep learning?" en abstracto, sino: ¿tengo suficiente volumen de datos etiquetados para justificar una red neuronal?, ¿el fenómeno tiene variables de dominio bien conocidas que puedo diseñar a mano?, y ¿necesito poder explicar la predicción a alguien que va a tomar una decisión operativa con ella? Si las respuestas apuntan a datos limitados y necesidad de interpretabilidad, un modelo clásico bien construido gana casi siempre. Si hay volumen y el patrón es genuinamente complejo, el deep learning empieza a justificar su costo.

## De sensores físicos a decisiones a tiempo

Este problema —convertir flujos de datos ruidosos y continuos en indicadores accionables— es exactamente el mismo que enfrenté trabajando en modelos de riesgo espaciotemporal para el sector público: la fuente cambia (un sensor industrial, una estación GNSS, un reporte de incidente georreferenciado), pero el reto de ingeniería es idéntico. Construir bien ese puente entre la señal física y el modelo predictivo es, para mí, el punto exacto donde la ingeniería tradicional y la ciencia de datos dejan de ser disciplinas separadas.
