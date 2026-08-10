---
title: "De planos a pipelines: cómo un modelo BIM alimenta un Data Warehouse territorial"
description: "Un recorrido técnico por extraer datos estructurados de un modelo BIM (IFC) y convertirlos en tablas consultables en un Data Warehouse en GCP, sin perder trazabilidad con el proyecto."
pubDate: 2026-07-20
tags: ["bim", "data-engineering"]
draft: false
---

Un modelo BIM bien construido es, en realidad, una base de datos con geometría. Cada elemento —una viga, un tramo de red hidráulica, una luminaria— tiene propiedades estructuradas: material, dimensiones, fase de construcción, responsable de diseño. El problema es que esa información casi nunca sale del archivo `.rvt` o `.ifc` donde vive. Se queda atrapada en una herramienta de escritorio mientras el resto de la organización —planeación, presupuesto, seguimiento de obra— sigue trabajando con hojas de cálculo desconectadas del modelo.

Coordinando BIM en varios proyectos de infraestructura pública, me encontré una y otra vez con la misma pregunta de los equipos de planeación: "¿esto que ves en el modelo, me lo puedes pasar en una tabla?". La respuesta técnica correcta no es exportar un Excel manual cada vez que alguien pregunta, sino construir un pipeline que lo haga de forma repetible.

## De IFC a filas

El formato IFC (Industry Foundation Classes) es un estándar abierto y, a diferencia de los formatos propietarios, se puede leer programáticamente. La librería `ifcopenshell` en Python permite recorrer un archivo IFC y extraer exactamente los atributos que interesan para reporting, sin depender de exportaciones manuales del software de modelado:

```python
import ifcopenshell

model = ifcopenshell.open("proyecto.ifc")

rows = []
for element in model.by_type("IfcBuildingElement"):
    psets = ifcopenshell.util.element.get_psets(element)
    rows.append({
        "global_id": element.GlobalId,
        "tipo": element.is_a(),
        "nombre": element.Name,
        "fase": psets.get("Pset_Construction", {}).get("Phase"),
        "material": psets.get("Pset_MaterialCommon", {}).get("Material"),
    })
```

Ese `rows` ya es tabular: cada fila es un elemento del modelo con sus propiedades estructuradas, listo para cargar a una tabla intermedia.

## El pipeline completo

El flujo que terminamos implementando tiene tres etapas, típicas de un ETL clásico pero aplicadas a un insumo poco habitual como es un modelo BIM:

1. **Extracción**: un job programado lee el último IFC exportado del proyecto (cada entrega de coordinación BIM genera una nueva versión) y produce el dataset tabular descrito arriba.
2. **Transformación**: se normalizan nombres de fase y material contra un catálogo controlado (para que "Concreto 21 MPa" y "Concreto f'c=21MPa" no aparezcan como dos materiales distintos), y se calculan métricas agregadas: cantidad de elementos por fase, avance físico estimado por comparación entre fases modeladas y fases reales de obra.
3. **Carga**: el resultado se sube a BigQuery, dentro del mismo Data Warehouse territorial donde conviven otras fuentes —presupuesto, cronograma, indicadores de gestión del riesgo— permitiendo cruces que antes eran imposibles: por ejemplo, correlacionar el avance físico del modelo BIM con la ejecución presupuestal reportada, sin depender de que alguien concilie ambas fuentes a mano.

## Por qué importa la trazabilidad

Un error común al "aplanar" un modelo BIM a tablas es perder el vínculo con el modelo de origen. Por eso cada fila conserva el `global_id` del elemento IFC: si alguien en el Data Warehouse detecta una inconsistencia —digamos, un elemento marcado como "fase 2" cuando debería estar en "fase 1"— puede volver directamente al modelo BIM y ubicar el elemento exacto, no solo un nombre genérico.

Este patrón de "de planos a pipelines" no es exclusivo de BIM: es el mismo principio que aplico con cualquier fuente de datos técnica y poco estructurada por naturaleza —expedientes de obra, reportes de campo, capas GIS— convertirla en algo consultable sin sacrificar la posibilidad de volver a la fuente original. Es, en el fondo, la misma disciplina de trazabilidad que exige un cálculo estructural, aplicada a datos en lugar de a barras de refuerzo.

El resultado práctico: un tablero de seguimiento territorial que antes tardaba días en actualizarse manualmente ahora se refresca automáticamente cada vez que se publica una nueva versión del modelo BIM, sin que el equipo de planeación tenga que abrir una sola vez el software de modelado.
