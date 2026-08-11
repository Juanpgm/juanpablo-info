---
title: "PDF Presupuestos Civil: extracción automática de APUs desde PDF a Excel"
description: "Herramienta en Python que extrae análisis de precios unitarios (APUs) de presupuestos de obra civil en PDF y los estructura en Excel, con scripts de verificación."
projectId: "civil-budget-pdf-extractor"
pubDate: 2026-08-11
draft: false
---

## Resumen

En la industria de la construcción colombiana, todo presupuesto de obra civil se sustenta en los Análisis de Precios Unitarios (APU): una ficha por cada ítem del presupuesto que desglosa su costo en cuatro componentes — equipo, materiales en obra, transportes y mano de obra — hasta llegar a un "Total Costo Directo" por unidad de medida. El problema es que estos análisis casi siempre existen únicamente como PDF: el resultado de exportar una hoja de cálculo de interventoría o de un software de presupuestos a un documento estático, con cientos de páginas por proyecto.

Cuando un ingeniero o un equipo de interventoría necesita auditar, comparar o consolidar esos precios unitarios, la práctica habitual es reescribirlos a mano en Excel, ítem por ítem. Para un presupuesto de obra vial o de urbanismo con varios cientos de páginas de APUs, esto significa días de trabajo repetitivo y propenso a errores de transcripción, en un tipo de documento donde un error de dígito tiene implicaciones contractuales y financieras.

PDF Presupuestos Civil nace directamente de esa fricción. Juan Pablo Guzmán Martínez, antes de su tránsito hacia la ingeniería de datos y software, trabajó del lado de la ingeniería civil analizando presupuestos de obra, y conoce de primera mano el formato en que los APU se presentan en Colombia: la codificación por ítem (`ITEM: 1.1`), las cuatro secciones romanas fijas (`I. EQUIPO`, `II. MATERIALES EN OBRA`, `III. TRANSPORTES`, `IV. MANO DE OBRA`), los subtotales por sección y el formato numérico colombiano (coma decimal, punto de miles). Esa familiaridad es lo que permite tratar el PDF no como texto genérico, sino como un documento con una gramática conocida que se puede parsear de forma confiable.

## Arquitectura

El proyecto sigue un pipeline lineal de tres etapas, sin backend ni base de datos: todo corre como scripts de Python sobre archivos locales.

1. **Ingesta y parsing del PDF.** Cada archivo PDF de origen (agrupado por frente de obra — construcción, urbanismo, vías) se recorre página por página. Por cada página se extrae el texto plano y se detecta si contiene un APU mediante la presencia del marcador `ITEM:`. Sobre ese texto se aplican expresiones regulares para capturar el número de ítem, la descripción, la unidad y el total de costo directo.
2. **Extracción estructurada de las líneas de APU.** El texto de cada página se divide en las cuatro secciones fijas del formato APU colombiano usando el propio encabezado de sección como separador. Dentro de cada sección se aplican patrones de regex específicos por tipo de insumo (equipo, materiales, transporte, mano de obra), porque cada una tiene una disposición de columnas distinta en el PDF original. El resultado es una estructura de datos en memoria por APU, con sus insumos y subtotales ya tipados.
3. **Exportación a Excel.** Los APU extraídos se escriben en un libro de Excel con una hoja por archivo fuente, una hoja de resumen con estadísticas de extracción y una hoja adicional de insumos consolidados que agrupa equipo, materiales y mano de obra únicos a través de todos los APU, con su precio promedio, mínimo y máximo — útil para detectar inconsistencias de precio del mismo insumo entre distintos ítems.
4. **Verificación posterior.** Un conjunto de scripts separados recorre el Excel generado para confirmar que el número de ítems extraídos coincide con lo esperado, inspecciona las primeras filas de cada hoja como muestra de control y genera un reporte en Markdown con el resumen ejecutivo de la extracción (total de APU por categoría, archivos fuente procesados, notas sobre fidelidad de datos).

Esta separación entre "extraer" y "verificar" es deliberada: el script de extracción prioriza rendimiento y cobertura, mientras que los scripts de verificación existen exclusivamente para dar confianza en que ningún dato se perdió o se corrompió en el camino.

## Stack técnico

| Tecnología | Rol en el proyecto |
|---|---|
| Python | Lenguaje base de todo el pipeline; ecosistema maduro para procesamiento de texto y datos tabulares |
| pdfplumber | Extracción de texto por página del PDF, preservando el orden de lectura necesario para que los patrones de regex funcionen |
| Expresiones regulares (`re`) | Reconocimiento de la gramática fija del formato APU colombiano: ítems, secciones, subtotales y líneas de insumo |
| pandas | Manipulación intermedia de datos tabulares antes y durante la consolidación de insumos |
| openpyxl | Generación del libro de Excel con formato visual (colores por sección, bordes, alineación) y múltiples hojas |

No hay dependencias de infraestructura: no se requiere base de datos, servidor ni servicio en la nube. Es una herramienta de línea de comandos pensada para correr en el equipo del analista, sobre PDF que probablemente contienen información contractual sensible que no debería salir de su máquina.

## Instalación

El flujo de uso es el estándar de cualquier script de Python con dependencias de terceros:

```bash
git clone https://github.com/Juanpgm/pdf_pptos_civil.git
cd pdf_pptos_civil
python -m venv env
source env/bin/activate  # en Windows: env\Scripts\activate
pip install pdfplumber pandas openpyxl
```

Los PDF de origen se colocan en una carpeta `context/` en la raíz del proyecto, y el script principal itera sobre los nombres de archivo esperados dentro de esa carpeta. Con las dependencias instaladas y los PDF en su lugar, la extracción se ejecuta con:

```bash
python pdf2Excel.py
```

El script imprime el progreso página por página y, al finalizar, deja un archivo `APUs_Extraidos.xlsx` en la raíz del proyecto. Los scripts de verificación se corren después, sobre ese mismo archivo:

```bash
python verificar_excel.py
python verificar_extraccion.py
```

## Decisiones de diseño

**Excel como formato de salida, no una app propia.** La alternativa obvia para un ingeniero de software sería construir una interfaz web o un visor propio de datos. Se descartó a propósito: los equipos de presupuestos e interventoría de obra civil ya viven en Excel — ahí hacen sus propios cruces, fórmulas y reportes para el cliente. Entregar un `.xlsx` bien formateado, con hojas separadas por frente de obra y una hoja de insumos consolidados, significa que el resultado se integra al flujo de trabajo existente en lugar de forzar a los analistas a aprender una herramienta nueva.

**Regex en vez de un parser de PDF genérico o un modelo de lenguaje.** El formato APU colombiano tiene una estructura suficientemente rígida (secciones romanas fijas, encabezados de columna constantes) como para que expresiones regulares bien dirigidas sean más rápidas, más baratas y más auditables que integrar un LLM o una librería de extracción de tablas más pesada. La contrapartida asumida es la fragilidad ante variaciones de formato entre distintas fuentes de PDF: un cambio en cómo un software de presupuestos exporta el documento puede romper un patrón de regex, y ese es el costo real de optimizar por precisión sobre un formato conocido en vez de por generalidad.

**Scripts de verificación como parte del entregable, no un extra.** En un dominio donde los números tienen peso contractual, extraer datos sin poder demostrar que la extracción fue completa y fiel no resuelve el problema real. Por eso `verificar_excel.py` y `verificar_extraccion.py` existen como ciudadanos de primera clase del repositorio: cuentan ítems por hoja, muestrean los primeros registros como control de calidad y generan un reporte legible en Markdown que un analista puede revisar sin abrir el Excel completo. Es la aplicación práctica de una regla que cualquier persona que haya trabajado con presupuestos de obra conoce bien — un número sin trazabilidad no es confiable.

**Aceptar la heterogeneidad de plantillas como limitación conocida, no ocultarla.** No todos los presupuestos de obra civil usan exactamente el mismo diseño de PDF; incluso dentro de un mismo proyecto, secciones como "III. Transportes" pueden estar vacías o tener un número variable de columnas. En vez de prometer una solución universal, el proyecto asume ese límite: está calibrado sobre la estructura de un formato específico y ampliamente usado, y su valor está en automatizar ese caso bien, no en intentar cubrir cualquier variante posible de presupuesto de obra.

## Aprendizajes

Este proyecto es, ante todo, la traducción de una frustración real y vivida en obra a una herramienta concreta: horas de retipeo manual de análisis de precios unitarios convertidas en minutos de ejecución de un script. Lo que lo hace funcionar no es sofisticación técnica — es el conocimiento exacto de cómo luce, sección por sección, un APU colombiano, y la disciplina de no confiar en la extracción sin antes verificarla. Para alguien que hizo la transición de la ingeniería civil al software, es también una prueba de que el dominio de origen no se abandona: se convierte en la ventaja que permite construir herramientas que realmente calzan con cómo trabaja un equipo de presupuestos de obra, en vez de imponerle un flujo ajeno.
