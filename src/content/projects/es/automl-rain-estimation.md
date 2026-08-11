---
title: "AutoML4RainEstimation: estimación de precipitación con AutoML y Deep Learning"
description: "Estimación de precipitación con AutoML y Deep Learning a partir de datos meteorológicos e imágenes satelitales, para pronóstico climático y gestión de riesgo de desastres."
projectId: "automl-rain-estimation"
pubDate: 2026-08-11
draft: false
---

## Resumen

AutoML4RainEstimation es un proyecto de investigación aplicada que estima precipitación combinando datos meteorológicos de estaciones terrestres con imágenes satelitales, usando AutoML y Deep Learning para automatizar la selección de modelo, el ajuste de hiperparámetros y la ingeniería de variables. El objetivo no es solo técnico: una estimación de lluvia más precisa y oportuna alimenta directamente el pronóstico climático y la gestión de riesgo de desastres, dos áreas donde un error de estimación se traduce en decisiones operativas reales (alertas tempranas, evacuaciones, dimensionamiento de infraestructura hidráulica).

El repositorio vive en [github.com/Juanpgm/AutoML4RainEstimation](https://github.com/Juanpgm/AutoML4RainEstimation) y está estructurado como un proyecto de experimentación en Jupyter Notebook: el flujo completo —desde la carga de datos hasta la evaluación del modelo— se ejecuta en un notebook (`AutoML4RainEstimation.ipynb`), lo cual es coherente con la naturaleza exploratoria de un problema donde todavía se está determinando qué combinación de features y qué familia de modelos generaliza mejor.

La precipitación es un fenómeno difícil de modelar: depende de variables atmosféricas no lineales, tiene alta variabilidad espacial y temporal, y las fuentes de datos disponibles (estaciones puntuales vs. imágenes satelitales de cobertura amplia pero menor resolución temporal) capturan aspectos distintos y parcialmente complementarios del mismo evento. Ese es precisamente el problema que el proyecto ataca: en vez de fijar a mano un modelo y una arquitectura, delega la búsqueda de la mejor combinación a herramientas de AutoML, dejando al ingeniero enfocarse en la calidad y el significado físico de los datos de entrada.

## Arquitectura / Metodología

El pipeline sigue la forma típica de un proyecto de forecasting con AutoML, con dos fuentes de entrada que se combinan antes del modelado:

1. **Ingesta de datos**: datos meteorológicos tabulares (variables de estaciones: temperatura, humedad, presión, viento, etc.) junto con imágenes satelitales que aportan contexto espacial sobre formación de nubes y patrones de precipitación.
2. **Ingeniería de variables**: transformación de las series meteorológicas y las imágenes en features utilizables por los modelos, incluyendo variables temporales (estacionalidad, tendencia) relevantes para el pronóstico de series de tiempo.
3. **Selección de modelo vía AutoML**: en lugar de comprometerse de entrada con una única arquitectura, se delega a frameworks de AutoML la búsqueda sobre distintas familias de modelos (desde modelos de forecasting especializados en series de tiempo hasta ensembles de deep learning).
4. **Ajuste de hiperparámetros**: el propio framework de AutoML explora el espacio de hiperparámetros, evitando el trabajo manual —costoso y poco sistemático— de tunear cada modelo candidato por separado.
5. **Evaluación**: comparación de los modelos candidatos sobre el problema de estimación de precipitación, con el objetivo de identificar la combinación de datos y modelo con mejor desempeño para el caso de uso de pronóstico climático.

Todo el flujo se ejecuta de forma interactiva y reproducible en un notebook, lo que facilita iterar sobre el preprocesamiento y comparar resultados de distintos frameworks de AutoML dentro de la misma sesión de trabajo.

## Stack técnico

| Componente | Tecnología | Por qué |
|---|---|---|
| Lenguaje | Python (3.6+) | Estándar de facto en el ecosistema de ciencia de datos y ML; máxima compatibilidad con librerías de AutoML y deep learning. |
| Entorno de experimentación | Jupyter Notebook | Permite iterar visualmente sobre datos, features y resultados de modelos en un flujo de investigación exploratorio, en lugar de un pipeline de producción cerrado. |
| Forecasting de series de tiempo | NeuralProphet | Modelo de forecasting basado en redes neuronales pensado específicamente para series temporales, útil como base o comparación frente a los modelos que produce el AutoML. |
| AutoML | AutoGluon | Automatiza la búsqueda de modelo y de hiperparámetros sobre múltiples familias de algoritmos (incluyendo deep learning), reduciendo el trabajo manual de tuning. |
| Deep Learning (backend) | PyTorch (subconjunto) | Motor de entrenamiento de los modelos neuronales usados por AutoGluon y NeuralProphet; el proyecto ajusta manualmente qué componentes de PyTorch instalar para evitar conflictos de dependencias en el entorno de notebook. |
| Datos de entrada | Estaciones meteorológicas + imágenes satelitales | Combinación de una fuente puntual de alta frecuencia temporal con una fuente de cobertura espacial amplia, para compensar las limitaciones de cada una por separado. |

## Instalación

El proyecto está pensado para ejecutarse directamente desde el notebook, con las dependencias instaladas en las primeras celdas en lugar de un `requirements.txt` tradicional. Un flujo de arranque típico:

```bash
git clone https://github.com/Juanpgm/AutoML4RainEstimation.git
cd AutoML4RainEstimation
```

Con un entorno virtual de Python 3.6 o superior activo, y Jupyter instalado:

```bash
python -m venv .venv
source .venv/bin/activate  # en Windows: .venv\Scripts\activate
pip install jupyter
jupyter notebook
```

Dentro de `AutoML4RainEstimation.ipynb`, las primeras celdas instalan las dependencias específicas del proyecto:

```bash
!pip install -q neuralprophet
!pip install autogluon
```

El README del repositorio indica además la desinstalación de ciertos paquetes de PyTorch (`torchvision`, `torchaudio`, `torchtext`) antes de instalar AutoGluon, una precaución habitual cuando se combinan librerías de AutoML con dependencias de deep learning que traen versiones de PyTorch potencialmente incompatibles entre sí. Con las dependencias instaladas, el notebook se ejecuta de principio a fin en el propio entorno de Jupyter (local o en un servicio como Google Colab, para el que este tipo de flujo de instalación por celdas está especialmente pensado).

## Decisiones de diseño

**AutoML en vez de tuning manual de un solo modelo.** Elegir a mano una arquitectura y afinar sus hiperparámetros exige tiempo de un especialista en ML que, en un proyecto de investigación aplicada a un dominio distinto (climatología, gestión de riesgo), no siempre está disponible. Delegar la búsqueda de modelo e hiperparámetros a AutoGluon permite invertir el esfuerzo humano donde más rinde: en la calidad de los datos de entrada y en la interpretación de resultados, no en la búsqueda de arquitectura por prueba y error.

**Combinar datos de estación con imágenes satelitales, en vez de usar solo una fuente.** Las estaciones meteorológicas dan series de alta frecuencia temporal pero son puntuales en el espacio; las imágenes satelitales dan cobertura espacial amplia pero con menor resolución temporal y una relación más indirecta con la precipitación real en superficie. Ninguna fuente por sí sola es suficiente para estimar precipitación con la granularidad espacial y temporal que exige un sistema de alerta temprana; combinarlas es una apuesta explícita por la complementariedad de los datos sobre la comodidad de trabajar con una sola fuente.

**Notebook como unidad de trabajo, no un paquete productivo.** Para un problema donde todavía se está iterando sobre qué features y qué modelos funcionan mejor, forzar una estructura de paquete Python con módulos, tests y CI habría sido prematuro. El notebook prioriza velocidad de iteración y visibilidad inmediata de resultados intermedios (gráficas, métricas por modelo), que es lo que un proyecto en fase de investigación necesita antes de pensar en productivizar un pipeline.

**Frameworks especializados en series de tiempo (NeuralProphet) junto a AutoML general (AutoGluon).** La precipitación es fundamentalmente una serie temporal con estacionalidad y tendencia, así que tiene sentido comparar el resultado del AutoML general contra un modelo diseñado específicamente para forecasting, en vez de asumir que la búsqueda automática siempre superará a una herramienta especializada en el problema.

## Aprendizajes

Trabajar en estimación de precipitación con estas herramientas conecta directamente con la formación de ingeniería civil del autor: un pronóstico de lluvia más confiable no es un ejercicio académico, es un insumo para decisiones de gestión de riesgo —desde sistemas de alerta temprana hasta el dimensionamiento de obras de drenaje— donde subestimar o sobrestimar precipitación tiene un costo humano y económico concreto. La lección práctica de este proyecto es que el valor de AutoML en un dominio de aplicación como climatología no está en reemplazar el juicio del ingeniero, sino en liberar tiempo para lo que realmente requiere criterio de dominio: decidir qué variables tienen sentido físico, qué fuentes de datos combinar y cómo interpretar un modelo cuya arquitectura fue elegida automáticamente.
