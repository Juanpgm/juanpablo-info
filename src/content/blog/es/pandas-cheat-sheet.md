---
title: "Pandas de memoria: el cheat sheet que uso todos los días"
description: "Selección, limpieza, agrupación, merges, fechas y rendimiento: la referencia completa de Pandas que consulto en cada proyecto de datos real."
pubDate: 2026-08-11
tags: ["data-engineering", "ia"]
draft: false
---

Pandas es la herramienta que más uso en cualquier pipeline de datos, y sigue siendo la que más rápido se me olvida en los detalles: ¿era `how="outer"` o `how="full"`? ¿`.query()` acepta variables externas? ¿por qué `SettingWithCopyWarning` apareció de la nada? Este post es la chuleta que armé para no perder tiempo buscando lo mismo en la documentación cada dos semanas. No es un tutorial de introducción, es una referencia densa con el código que realmente escribo.

## Import y estructuras base

La convención es universal: `import pandas as pd` y, si vas a trabajar con arrays subyacentes, `import numpy as np` al lado.

```python
import numpy as np
import pandas as pd

# Series desde una lista
s = pd.Series([10, 20, 30], index=["a", "b", "c"], name="ventas")

# DataFrame desde un dict de listas (lo más común)
df = pd.DataFrame({
    "producto": ["A", "B", "C"],
    "precio": [100, 200, 150],
    "stock": [5, 0, 12],
})

# DataFrame desde una lista de dicts (una fila por dict)
df2 = pd.DataFrame([
    {"producto": "A", "precio": 100},
    {"producto": "B", "precio": 200},
])

# DataFrame desde un array de numpy
df3 = pd.DataFrame(np.random.randn(4, 3), columns=["x", "y", "z"])
```

## Leer y escribir datos

```python
df = pd.read_csv("datos.csv", sep=",", encoding="utf-8", parse_dates=["fecha"])
df = pd.read_excel("datos.xlsx", sheet_name="Hoja1")
df = pd.read_json("datos.json")
df = pd.read_parquet("datos.parquet")  # requiere pyarrow o fastparquet instalado

df.to_csv("salida.csv", index=False)
df.to_parquet("salida.parquet", index=False)
```

Un detalle que me ha mordido más de una vez: `index=False` en `to_csv` — si no lo pones, Pandas escribe el índice como columna extra al releer el archivo.

## Inspeccionar un DataFrame

Antes de tocar nada, siempre reviso lo mismo:

```python
df.head(5)          # primeras 5 filas
df.tail(3)           # últimas 3
df.shape              # (filas, columnas)
df.columns            # Index de nombres de columna
df.dtypes             # tipo de dato por columna
df.info()             # tipos + memoria + nulos, todo junto
df.describe()         # estadísticos de columnas numéricas
df.describe(include="object")  # lo mismo para columnas categóricas/texto
```

## Selección y filtrado

`loc` selecciona por **etiqueta**, `iloc` por **posición entera**. Confundirlos es la fuente número uno de bugs silenciosos en código Pandas ajeno.

```python
df.loc[0, "precio"]           # valor en la fila etiqueta 0, columna "precio"
df.loc[0:2, ["producto", "precio"]]  # loc es inclusivo en el límite superior
df.iloc[0, 1]                  # primera fila, segunda columna, por posición
df.iloc[0:2, :]                 # iloc es exclusivo, como slicing normal de Python

# Máscara booleana
caro = df[df["precio"] > 120]

# Múltiples condiciones: paréntesis obligatorios, & y | en vez de and/or
filtrado = df[(df["precio"] > 100) & (df["stock"] > 0)]

# .query() para condiciones legibles, acepta variables externas con @
umbral = 100
filtrado = df.query("precio > @umbral and stock > 0")

# isin() para pertenencia a un conjunto
df[df["producto"].isin(["A", "C"])]
```

## Agregar, eliminar y renombrar columnas

```python
df["descuento"] = df["precio"] * 0.1          # vectorizado, evita loops
df["precio_final"] = df["precio"] - df["descuento"]

df = df.drop(columns=["stock"])                 # eliminar columna(s)
df = df.drop(index=[0, 1])                       # eliminar fila(s) por etiqueta

df = df.rename(columns={"producto": "sku"})
df.columns = df.columns.str.lower().str.strip()  # normalizar nombres en bloque
```

## Datos faltantes

```python
df.isna().sum()                    # nulos por columna
df.dropna()                         # elimina filas con al menos un nulo
df.dropna(subset=["precio"])         # solo si "precio" es nulo
df.fillna(0)                         # rellenar con un valor fijo
df.fillna({"precio": df["precio"].mean(), "stock": 0})  # valor distinto por columna
df["precio"].interpolate(method="linear")  # interpolar valores faltantes en serie ordenada
```

## Ordenar

```python
df.sort_values("precio", ascending=False)
df.sort_values(["producto", "precio"], ascending=[True, False])
df.sort_index()
```

## Agrupar y agregar

`groupby` es probablemente el método que más valor concentra en toda la librería.

```python
df.groupby("producto")["precio"].mean()

df.groupby("producto").agg(
    precio_prom=("precio", "mean"),
    precio_max=("precio", "max"),
    n=("precio", "count"),
)

# Pivot table: agrupación en dos dimensiones
pd.pivot_table(df, values="precio", index="producto", columns="stock", aggfunc="sum", fill_value=0)

# Crosstab: frecuencias cruzadas entre dos columnas categóricas
pd.crosstab(df["producto"], df["stock"] > 0)
```

## Combinar DataFrames: merge, concat, join

```python
# merge, equivalente a un JOIN de SQL
pd.merge(df1, df2, on="id", how="inner")   # solo coincidencias en ambos
pd.merge(df1, df2, on="id", how="left")     # todo df1 + coincidencias de df2
pd.merge(df1, df2, on="id", how="right")     # todo df2 + coincidencias de df1
pd.merge(df1, df2, on="id", how="outer")      # unión de ambos, con NaN donde falte

# concat: apilar por filas o columnas
pd.concat([df1, df2], axis=0, ignore_index=True)  # apilar filas
pd.concat([df1, df2], axis=1)                        # pegar columnas lado a lado

# join: como merge pero usando el índice por defecto
df1.join(df2, how="left")
```

## Métodos de texto: el accessor `.str`

```python
df["producto"].str.contains("A", case=False, na=False)
df["producto"].str.replace("A", "Alpha", regex=False)
df["producto"].str.lower().str.strip()
df["fecha_texto"].str.split("-", expand=True)      # divide en columnas
df["codigo"].str.extract(r"(?P<prefijo>[A-Z]+)(?P<numero>\d+)")  # regex con grupos nombrados
```

## Fechas y series de tiempo

```python
df["fecha"] = pd.to_datetime(df["fecha"], format="%Y-%m-%d", errors="coerce")

df["anio"] = df["fecha"].dt.year
df["mes"] = df["fecha"].dt.month
df["dia_semana"] = df["fecha"].dt.day_name()

rango = pd.date_range(start="2026-01-01", end="2026-01-31", freq="D")

# resample: reagrupar por frecuencia temporal (requiere índice datetime)
serie = df.set_index("fecha")["precio"]
serie.resample("ME").mean()   # promedio mensual ("ME" = month end en pandas 2.2+)
serie.resample("W").sum()      # suma semanal
```

## `apply`, `map`, `applymap` vs. operaciones vectorizadas

La regla que sigo siempre: si existe una operación vectorizada nativa, úsala. `apply` es el último recurso, no el primero.

```python
df["precio"].map({100: "bajo", 200: "alto"})       # Series: sustitución elemento a elemento

df["categoria"] = df["precio"].apply(lambda p: "caro" if p > 150 else "barato")  # lógica custom en una Series

df.apply(lambda fila: fila["precio"] - fila["descuento"], axis=1)  # fila completa, axis=1 = por fila

df[["precio", "stock"]].map(lambda x: x * 2)  # element-wise en todo el DataFrame (antes .applymap, deprecado desde pandas 2.1)
```

Casi siempre `df["precio"] * 2` es más rápido y más claro que cualquiera de los anteriores. `apply` sigue siendo un loop de Python por debajo; solo lo justifico cuando la lógica no se puede expresar como operación vectorizada.

## Estilo de encadenamiento de métodos

Encadenar métodos hace el flujo de transformación legible de arriba hacia abajo, en vez de reasignar la misma variable diez veces:

```python
resultado = (
    df
    .query("stock > 0")
    .assign(precio_final=lambda d: d["precio"] * 0.9)
    .groupby("producto", as_index=False)
    .agg(total=("precio_final", "sum"))
    .sort_values("total", ascending=False)
)
```

`.assign()` es clave acá porque permite crear columnas dentro de la cadena sin romperla con una asignación intermedia.

## Rendimiento: lo que realmente mueve la aguja

- **Nunca uses `iterrows()`** para transformar datos. Es órdenes de magnitud más lento que una operación vectorizada porque reconstruye una Series por cada fila.
- Prefiere operaciones vectorizadas (`df["a"] + df["b"]`) sobre `apply`, y `apply` sobre loops explícitos.
- Reduce el tipo de dato cuando puedas: `df["id"] = df["id"].astype("int32")` en vez de `int64` por defecto ahorra memoria real en datasets grandes.
- Convierte columnas de texto con pocos valores únicos a `category`: `df["producto"] = df["producto"].astype("category")` reduce memoria y acelera `groupby`.
- Para archivos grandes, `read_csv(..., usecols=[...], dtype={...})` evita cargar columnas que no vas a usar y evita que Pandas infiera tipos costosos.

## Errores comunes (pitfalls)

- **`SettingWithCopyWarning`**: aparece cuando modificas un DataFrame que podría ser una vista o una copia de otro, y Pandas no puede garantizar cuál. La solución es usar `.loc` explícitamente o forzar la copia con `.copy()` cuando sabes que estás trabajando sobre un subconjunto independiente: `df_filtrado = df[df["precio"] > 100].copy()`.
- **Indexado encadenado** (`df[df["precio"] > 100]["stock"] = 0`): esto casi nunca hace lo que esperas, porque la primera selección puede devolver una copia, no una vista. Usa siempre `df.loc[df["precio"] > 100, "stock"] = 0` en una sola operación.
- **Coerción implícita de tipos**: si una columna numérica tiene un solo `NaN`, Pandas la convierte silenciosamente a `float64` porque el `int64` clásico no admite nulos. Si necesitas mantener enteros con nulos, usa el tipo nullable `Int64` (con mayúscula) en vez de `int64`.

Con esto cubro el 90% de lo que toco en el día a día con Pandas. Si querés bajar un nivel y entender el motor vectorizado detrás de Pandas, NumPy es el punto de partida: array strides, broadcasting y por qué las operaciones vectorizadas son tan rápidas están un post más abajo, en [el cheat sheet de NumPy](/es/blog/numpy-cheat-sheet/).
