---
title: "Del concreto reforzado al gradiente descendente: mi salto de la ingeniería civil a la IA"
description: "Cómo pasé de diseñar estructuras en concreto reforzado bajo la NSR-10 a construir modelos de datos e IA para el sector público, y por qué ambos mundos se parecen más de lo esperado."
pubDate: 2026-08-05
tags: ["carrera", "ia"]
draft: false
---

Durante mis primeros años como ingeniero civil, mi trabajo giraba alrededor de un objetivo muy concreto (literalmente): que una estructura resistiera las cargas para las que fue diseñada, con un margen de seguridad calculado, verificable y documentado. Diseñé graderías, cubiertas y elementos de concreto reforzado siguiendo la NSR-10, la norma sismo-resistente colombiana, donde cada cuantía de acero y cada nudo estructural tiene que responder a un cálculo trazable. No hay espacio para la intuición sin verificación: hay que iterar, revisar derivas, ajustar secciones, volver a correr el análisis.

Años después, sentado frente a un modelo de machine learning que no convergía, tuve una sensación extrañamente familiar. Estaba ajustando hiperparámetros, revisando una curva de pérdida que oscilaba en lugar de bajar, y pensé: esto es lo mismo que ajustar un pórtico que no cumple deriva. Se cambia una variable, se vuelve a correr el modelo, se observa el resultado, se ajusta de nuevo. La ingeniería estructural y el entrenamiento de modelos comparten una misma lógica de fondo: optimización iterativa bajo restricciones.

## El paralelo que no esperaba

El diseño estructural bajo la NSR-10 es, en el fondo, un problema de optimización restringida: minimizar cantidad de acero y concreto sujeto a que la estructura cumpla derivas admisibles, resistencia última y ductilidad mínima. El entrenamiento de un modelo de gradiente descendente es exactamente la misma estructura matemática, solo que la "restricción" se vuelve una penalización dentro de la función de pérdida y el "diseño" son los pesos de la red.

En pseudocódigo, así de simple luce el corazón de ambos procesos:

```python
theta = initial_guess()
for step in range(max_iterations):
    gradient = compute_gradient(loss_function, theta)
    theta = theta - learning_rate * gradient
    if converged(theta):
        break
```

Cuando calibraba a mano una sección de concreto, mi "learning rate" era mi criterio de ingeniero: cuánto ajustar la cuantía de refuerzo en cada iteración sin sobrecorregir. En un modelo de datos, ese mismo criterio se llama `learning_rate` y hay que calibrarlo con la misma disciplina: si es muy alto, el modelo "oscila" igual que una estructura sobrediseñada en un ciclo; si es muy bajo, converge tan lento que el proyecto no avanza.

## Por qué el salto no fue una ruptura

No dejé la ingeniería civil para "irme a sistemas". El punto de quiebre fue notar que buena parte de las decisiones de infraestructura pública —dónde poner un semáforo, qué barrio priorizar en un programa de gestión del riesgo, qué corredor merece inversión en alumbrado— dependían de datos que existían, pero estaban dispersos, sin estructurar, sin un pipeline que los convirtiera en algo consultable. Mi primer acercamiento serio a la ciencia de datos fue justamente eso: tomar información territorial que ya existía en planos, expedientes y bases de Excel, y convertirla en algo que un modelo pudiera usar para predecir o priorizar.

Especializarme en inteligencia artificial no fue un cambio de vocación sino una extensión de la misma pregunta que me hice como ingeniero civil: ¿cómo diseño algo que funcione de forma confiable, bajo datos reales y con consecuencias sobre personas? La diferencia es que ahora, en lugar de un pórtico de concreto, el "sistema" que diseño es un pipeline de datos, un modelo de riesgo espaciotemporal o una arquitectura RAG que consulta normativa técnica.

## Lo que me llevo de un mundo al otro

Tres hábitos de la ingeniería civil resultaron directamente transferibles al trabajo con datos e IA:

1. **Trazabilidad**: así como cada elemento estructural debe poder justificarse con una memoria de cálculo, cada predicción de un modelo en producción debería poder explicarse: qué datos la generaron, con qué versión del modelo, bajo qué supuestos.
2. **Márgenes de seguridad**: en estructuras se diseña con factores de mayoración de carga; en modelos de riesgo, el equivalente es no confiar ciegamente en la predicción puntual sino trabajar con intervalos y validación cruzada.
3. **Disciplina de iteración**: ni una estructura ni un modelo salen bien a la primera. La diferencia entre un ingeniero junior y uno senior, en ambos mundos, es qué tan rápido identifica por qué algo no converge.

Este blog nace de esa convicción: que construir infraestructura física y construir infraestructura de datos son, en el fondo, la misma disciplina aplicada a materiales distintos. En los próximos textos voy a desarrollar casos concretos —de planos BIM a Data Warehouses, de coberturas vegetales a decisiones de política pública, de la NSR-10 consultada en lenguaje natural— que muestran cómo esos dos mundos, en mi trabajo diario, ya convergieron.
