---
title: "Analítica de datos en geodesia: del punto GNSS al modelo de deformación del terreno"
description: "Cómo un pipeline de datos convierte observaciones GNSS e InSAR en un modelo de deformación del terreno útil para monitoreo geotécnico temprano."
pubDate: 2026-05-19
tags: ["geointeligencia", "data-engineering"]
heroImage: ../../../assets/blog/analitica-datos-geodesia.svg
heroImageAlt: "Pipeline de datos geodésicos: de una estación GNSS/InSAR a un modelo de deformación del terreno, pasando por ingesta y análisis de series temporales"
heroImageCaption: "El mismo patrón de pipeline de datos usado en observatorios de seguridad sirve para monitoreo geodésico del terreno."
draft: false
---

Una estación GNSS entrega, en su forma más cruda, una nube de coordenadas con ruido: multipath, variaciones atmosféricas, errores de reloj, saltos de ciclo. Esa nube de puntos no le sirve a nadie hasta que se convierte en algo interpretable: una serie temporal limpia que muestra cuánto se ha movido un punto del terreno, en qué dirección, y a qué velocidad. La analítica de datos en geodesia es, en el fondo, el mismo problema que resolví diseñando pipelines de datos para el sector público en Cali: cómo llevar una señal cruda y ruidosa hasta un modelo confiable en el que alguien pueda tomar una decisión.

## De la observación cruda a un dato usable

Las dos fuentes de observación más comunes para monitoreo de deformación son GNSS (estaciones fijas o campañas periódicas que miden posición tridimensional con precisión milimétrica) e InSAR (interferometría de radar satelital, que compara pares de imágenes para detectar desplazamientos de línea de vista en áreas extensas sin necesidad de instrumentación en campo). Cada fuente tiene su propio perfil de ruido y su propia frecuencia de muestreo, así que el primer trabajo real de ingeniería de datos no es analítico, es de ingesta: normalizar formatos (RINEX para GNSS, productos SLC o interferogramas para InSAR), alinear marcos de referencia temporal y espacial, y dejar todo en un esquema común antes de que un modelo estadístico toque el dato.

## El pipeline: ingesta, filtrado, series temporales, modelo

En la práctica, un pipeline de analítica geodésica sigue una secuencia bastante estable:

1. **Ingesta**: los datos crudos (observaciones GNSS, interferogramas InSAR) entran a un almacén analítico —en mi experiencia diseñando el Data Warehouse del Observatorio de Seguridad de Cali, esto significó ETL corriendo 100% sobre GCP, con BigQuery como capa analítica— y quedan versionados por estación y por fecha de observación.
2. **Filtrado de ruido**: se remueven outliers, se corrigen saltos de ciclo, y se aplican modelos de corrección atmosférica y de multipath. Esta etapa es la que más determina la calidad final: un filtro demasiado agresivo suaviza una deformación real, uno demasiado laxo deja pasar ruido que se confunde con movimiento del terreno.
3. **Análisis de series temporales**: sobre el dato limpio se ajustan modelos de tendencia (lineal, o no lineal si hay aceleración) para estimar velocidad de deformación por punto, típicamente en milímetros/año.
4. **Modelo de deformación**: se interpola espacialmente entre puntos o píxeles InSAR para generar un mapa continuo de velocidad de deformación sobre el área de interés, listo para cruzar con otras capas —geología, uso del suelo, precipitación— dentro de un sistema de información geográfica.

## Por qué esto importa para detección temprana

Un modelo de deformación bien construido detecta aceleraciones sutiles en el movimiento del terreno mucho antes de que sean visibles a simple vista. Esa es exactamente la señal que un [sistema de monitoreo de movimientos de remoción en masa](/es/blog/movimientos-remocion-en-masa-tipos/) necesita como insumo: no se trata de esperar a que aparezca una grieta en la superficie, sino de detectar que la velocidad de deformación de una ladera está aumentando semanas o meses antes de una falla catastrófica. La analítica geodésica, bien integrada a un pipeline de datos, convierte una amenaza geotécnica de algo reactivo en algo monitoreable de forma continua.

## El puente entre territorio y datos

Este es, quizás, el ejemplo más directo de por qué me interesa la intersección entre ingeniería civil y ciencia de datos: la geodesia produce señales físicas del comportamiento real del terreno, y la ingeniería de datos es lo que convierte esas señales en información accionable a escala. Haber construido pipelines analíticos para datos de seguridad urbana y haber trabajado con datos geoespaciales de territorio protegido en DAGMA me dejó clarísimo que el reto técnico es el mismo sin importar si el dato viene de un sensor de criminalidad o de una estación GNSS: ingesta confiable, filtrado honesto del ruido, y un modelo que alguien pueda usar para decidir a tiempo.
