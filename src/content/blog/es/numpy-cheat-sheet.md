---
title: "NumPy de referencia: la cheat-sheet que uso a diario para arrays en Python"
description: "Creación de arrays, indexado, broadcasting, agregaciones con axis, álgebra lineal y random: la referencia práctica de NumPy que cualquier pipeline de datos necesita."
pubDate: 2026-08-11
tags: ["data-engineering", "ia"]
draft: false
---

Cada vez que empiezo un notebook nuevo o reviso código de un pipeline de datos, termino con NumPy abierto en otra pestaña, no porque no me sepa la API, sino porque hay detalles —el eje correcto en una agregación, si una slice devuelve vista o copia, las reglas exactas de broadcasting— que vale más verificar que asumir. Esta es la cheat-sheet que arma esa referencia en un solo lugar: no es un tutorial de "qué es un array", es lo que realmente se usa todos los días trabajando con datos numéricos en Python.

## Convención de import

```python
import numpy as np
```

Así, sin excepción, en cualquier código que vayas a compartir o mantener.

## Creación de arrays

```python
np.array([1, 2, 3])                    # desde una lista
np.array([[1, 2], [3, 4]])              # 2D, desde lista de listas
np.zeros((2, 3))                        # matriz de ceros, shape (2, 3)
np.ones((3, 3))                         # matriz de unos
np.full((2, 2), 7)                      # matriz llena de un valor
np.arange(0, 10, 2)                     # [0, 2, 4, 6, 8], como range()
np.linspace(0, 1, 5)                    # 5 valores equiespaciados entre 0 y 1
np.eye(3)                               # matriz identidad 3x3
np.identity(3)                          # equivalente a np.eye(3)

rng = np.random.default_rng(seed=42)
rng.random((2, 3))                      # floats uniformes en [0, 1)
```

`arange` es análogo a `range` pero soporta pasos decimales; `linspace` en cambio garantiza un número exacto de puntos incluyendo (por defecto) el extremo final, que es justo lo que quieres al generar un eje para graficar o muestrear.

## Atributos del array

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

a.shape       # (2, 3)
a.dtype       # dtype('int64')
a.ndim        # 2
a.size        # 6, número total de elementos
a.itemsize    # 8, bytes por elemento
```

`size` es el total de elementos (el producto de `shape`), no confundir con `len(a)`, que solo devuelve el tamaño del primer eje.

## Indexado y slicing

```python
a = np.array([10, 20, 30, 40, 50])

a[1:4]                     # slicing básico: [20, 30, 40]
a[a > 25]                  # máscara booleana: [30, 40, 50]
a[[0, 2, 4]]                # fancy indexing: [10, 30, 50]

np.where(a > 25)            # (array([2, 3, 4]),) -> índices que cumplen
np.where(a > 25, a, 0)      # reemplaza donde no cumple: [0, 0, 30, 40, 50]
```

`np.where` con una sola condición devuelve los índices donde es verdadera; con tres argumentos actúa como un `if/else` vectorizado. Es una de las funciones que más uso para evitar loops con condicionales.

En 2D el patrón es `a[fila, columna]`:

```python
m = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
m[0, :]        # primera fila: [1, 2, 3]
m[:, 1]        # segunda columna: [2, 5, 8]
m[1:, :2]      # submatriz: filas desde 1, columnas hasta 2
```

## Reshape y combinación de arrays

```python
a = np.arange(12)

a.reshape(3, 4)        # nueva forma, comparte memoria si es posible
a.reshape(3, -1)        # -1 le dice a NumPy que infiera esa dimensión
a.ravel()               # aplana a 1D, devuelve vista cuando puede
a.flatten()              # aplana a 1D, siempre devuelve copia

m = np.array([[1, 2], [3, 4]])
m.T                      # transpuesta
m.transpose()            # equivalente explícito

x = np.array([1, 2])
y = np.array([3, 4])
np.concatenate([x, y])              # [1, 2, 3, 4]
np.vstack([x, y])                   # apila como filas: shape (2, 2)
np.hstack([x, y])                   # concatena horizontalmente: [1, 2, 3, 4]
np.stack([x, y], axis=0)            # crea un eje nuevo: shape (2, 2)

np.split(np.arange(9), 3)           # 3 arrays de tamaño igual
```

La diferencia entre `ravel` y `flatten` importa cuando te preocupa la memoria: `ravel` evita copiar si el array ya es contiguo, `flatten` copia siempre para garantizar independencia del original.

## Broadcasting

Broadcasting es la regla que le permite a NumPy operar entre arrays de formas distintas sin que tengas que igualarlas a mano. La regla, comparando shapes de derecha a izquierda: dos dimensiones son compatibles si son iguales, o si una de ellas es 1.

```python
# Restar la media de cada columna: matriz (3, 4) menos vector (4,)
datos = np.array([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
])
media_col = datos.mean(axis=0)   # shape (4,)
centrado = datos - media_col     # (3, 4) - (4,) -> se expande a (3, 4)
```

Acá `media_col` con shape `(4,)` se "estira" implícitamente para restarse de cada una de las 3 filas, sin crear una copia intermedia de (3, 4). Es la base de casi cualquier normalización vectorizada, y entenderlo bien es lo que separa código NumPy idiomático de código que reimplementa loops disfrazados de vectores.

## Matemática vectorizada y ufuncs

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b, a - b, a * b, a / b     # elemento a elemento
a ** 2                          # potencia
np.sqrt(a)                      # raíz cuadrada
np.exp(a)                       # exponencial
np.log(a)                       # logaritmo natural

a > 2                           # comparación: [False, False, True]
np.array_equal(a, b)            # compara arrays completos
```

Estas son "ufuncs" (universal functions): operan elemento a elemento y están implementadas en C, así que son órdenes de magnitud más rápidas que iterar con un `for` en Python puro.

## Agregaciones y el parámetro `axis`

```python
m = np.array([[1, 2, 3], [4, 5, 6]])

m.sum()          # 21, suma de todo el array
m.mean()         # 3.5
m.std()           # desviación estándar
m.var()           # varianza
m.min(), m.max()  # 1, 6
m.argmin(), m.argmax()  # índices (aplanados) del mínimo y máximo
m.cumsum()        # suma acumulada, aplanada: [1, 3, 6, 10, 15, 21]
```

`axis` es lo que confunde a casi todo el mundo al principio, y la forma más simple de recordarlo es: `axis` indica el eje que **colapsa**.

```python
m.sum(axis=0)   # colapsa filas -> suma por columna: [5, 7, 9]
m.sum(axis=1)   # colapsa columnas -> suma por fila: [6, 15]
```

Con `axis=0` recorrés hacia abajo y obtenés un resultado por columna; con `axis=1` recorrés a lo ancho y obtenés un resultado por fila. Si el resultado te queda con la forma equivocada, casi siempre es porque invertiste el eje.

## Álgebra lineal esencial

```python
A = np.array([[2, 0], [0, 2]])
B = np.array([[1, 2], [3, 4]])

A @ B                     # multiplicación de matrices
np.matmul(A, B)            # equivalente explícito

np.linalg.inv(A)           # inversa de A
np.linalg.solve(A, np.array([2, 4]))   # resuelve Ax = b, sin invertir A explícitamente
np.linalg.norm(np.array([3, 4]))       # norma euclidiana: 5.0
```

Usá siempre `np.linalg.solve` en vez de calcular la inversa y multiplicar cuando el objetivo es resolver un sistema lineal: es más estable numéricamente y más rápido.

## `np.random`: la Generator API

Desde hace varias versiones, NumPy recomienda la API basada en `Generator` (`np.random.default_rng`) en vez de las funciones legacy tipo `np.random.rand`, porque da mejores garantías estadísticas y de reproducibilidad:

```python
rng = np.random.default_rng(seed=42)

rng.random(5)                     # 5 floats uniformes en [0, 1)
rng.integers(0, 10, size=5)       # 5 enteros en [0, 10)
rng.normal(loc=0, scale=1, size=5)    # distribución normal
rng.choice([1, 2, 3, 4], size=3, replace=False)   # muestreo sin reemplazo
```

Fijar `seed` es lo que hace reproducible un experimento o un pipeline de datos sintéticos; sin él, cada corrida da resultados distintos.

## Guardar y cargar datos

```python
np.save("datos.npy", a)          # formato binario nativo de NumPy
b = np.load("datos.npy")

np.savetxt("datos.csv", m, delimiter=",")     # texto plano
m2 = np.loadtxt("datos.csv", delimiter=",")
```

`save`/`load` son más rápidos y preservan dtype exacto; `savetxt`/`loadtxt` son legibles por humanos y por otras herramientas, pero más lentos y pierden precisión si no controlás el formato.

## Vistas vs copias: por qué importa

```python
a = np.arange(10)
vista = a[2:5]        # slicing básico -> vista, comparte memoria
vista[0] = 999
print(a[2])            # 999, el original cambió

copia = a[[2, 3, 4]]   # fancy indexing -> copia, memoria independiente
copia[0] = 0
print(a[2])             # sigue siendo 999, no cambió

print(np.shares_memory(a, vista))   # True
print(np.shares_memory(a, copia))   # False
```

El slicing básico (`a[2:5]`) siempre devuelve una vista; el fancy indexing (`a[[0, 2, 4]]`) y las máscaras booleanas siempre devuelven una copia. Esto no es un detalle académico: si mutás una vista pensando que trabajás sobre datos independientes, corrompés el array original en silencio, y es uno de los bugs más difíciles de rastrear en un pipeline largo.

## Vectorización vs loops: por qué NumPy es rápido

Un `for` en Python puro sobre un array reevalúa el intérprete en cada iteración; una operación vectorizada delega el loop entero a código en C compilado, sin el overhead del intérprete por elemento. En arrays de tamaño moderado a grande la diferencia es de uno a dos órdenes de magnitud. La regla práctica: si estás escribiendo un `for` para recorrer un array de NumPy elemento por elemento, casi seguro hay una ufunc, una máscara booleana o una operación de broadcasting que hace lo mismo sin el loop.

## Errores comunes

- **Mutar una vista sin darte cuenta**: como en el ejemplo anterior, modificar el resultado de un slice modifica el original. Si necesitás independencia, usá `.copy()` explícitamente.
- **Upcasting silencioso de dtype**: `np.array([1, 2, 3]) / 2` da un array de `float64` aunque la entrada sea de enteros; mezclar un `int` con un `float` en una operación sube el dtype del resultado sin avisarte. Si te importa el tipo exacto, verificalo con `.dtype`.
- **Comparar floats con `==`**: por errores de redondeo en punto flotante, `0.1 + 0.2 == 0.3` da `False`. Usá `np.isclose(a, b)` o `np.allclose(a, b)` para comparaciones numéricas, nunca igualdad exacta.

Esta cheat-sheet cubre lo que uso a diario, pero NumPy rara vez vive solo: casi siempre trabaja debajo de Pandas para análisis tabular. Si además trabajás con datos tabulares, el siguiente paso natural es Pandas: podés seguir con [la cheat-sheet de Pandas](/es/blog/pandas-cheat-sheet/).
