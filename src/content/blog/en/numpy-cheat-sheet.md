---
title: "The NumPy reference sheet I actually keep open while working"
description: "Array creation, indexing, broadcasting, axis-aware aggregations, linear algebra, and random generation: a practical NumPy reference for real data work."
pubDate: 2026-08-11
tags: ["data-engineering", "ia"]
draft: false
---

Every time I start a new notebook or review a data pipeline, I end up with a NumPy reference open in another tab. Not because I don't know the API, but because a handful of details — which axis actually collapses in an aggregation, whether a slice returns a view or a copy, the exact broadcasting rules — are worth double-checking rather than assuming. This is that reference, compiled into one place. It's not a "what is an array" tutorial; it's what I actually reach for day to day working with numerical data in Python.

## Import convention

```python
import numpy as np
```

Always, no exceptions, in anything you'll share or maintain.

## Array creation

```python
np.array([1, 2, 3])                    # from a list
np.array([[1, 2], [3, 4]])              # 2D, from a list of lists
np.zeros((2, 3))                        # array of zeros, shape (2, 3)
np.ones((3, 3))                         # array of ones
np.full((2, 2), 7)                      # array filled with a constant
np.arange(0, 10, 2)                     # [0, 2, 4, 6, 8], like range()
np.linspace(0, 1, 5)                    # 5 evenly spaced values between 0 and 1
np.eye(3)                               # 3x3 identity matrix
np.identity(3)                          # equivalent to np.eye(3)

rng = np.random.default_rng(seed=42)
rng.random((2, 3))                      # uniform floats in [0, 1)
```

`arange` behaves like `range` but accepts fractional steps; `linspace` instead guarantees an exact number of points, including the endpoint by default — exactly what you want when generating an axis for plotting or sampling.

## Array attributes

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

a.shape       # (2, 3)
a.dtype       # dtype('int64')
a.ndim        # 2
a.size        # 6, total number of elements
a.itemsize    # 8, bytes per element
```

`size` is the total element count (the product of `shape`) — don't confuse it with `len(a)`, which only returns the length of the first axis.

## Indexing and slicing

```python
a = np.array([10, 20, 30, 40, 50])

a[1:4]                     # basic slicing: [20, 30, 40]
a[a > 25]                  # boolean mask: [30, 40, 50]
a[[0, 2, 4]]                # fancy indexing: [10, 30, 50]

np.where(a > 25)            # (array([2, 3, 4]),) -> indices where true
np.where(a > 25, a, 0)      # vectorized if/else: [0, 0, 30, 40, 50]
```

`np.where` with a single condition returns the indices where it holds; with three arguments it acts as a vectorized `if/else`. It's one of the functions I reach for most to avoid conditional loops.

In 2D the pattern is `a[row, column]`:

```python
m = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
m[0, :]        # first row: [1, 2, 3]
m[:, 1]        # second column: [2, 5, 8]
m[1:, :2]      # sub-matrix: rows from 1 on, columns up to 2
```

## Reshaping and combining arrays

```python
a = np.arange(12)

a.reshape(3, 4)        # new shape, shares memory when possible
a.reshape(3, -1)        # -1 tells NumPy to infer that dimension
a.ravel()               # flatten to 1D, returns a view when it can
a.flatten()              # flatten to 1D, always returns a copy

m = np.array([[1, 2], [3, 4]])
m.T                      # transpose
m.transpose()            # explicit equivalent

x = np.array([1, 2])
y = np.array([3, 4])
np.concatenate([x, y])              # [1, 2, 3, 4]
np.vstack([x, y])                   # stack as rows: shape (2, 2)
np.hstack([x, y])                   # concatenate horizontally: [1, 2, 3, 4]
np.stack([x, y], axis=0)            # create a new axis: shape (2, 2)

np.split(np.arange(9), 3)           # 3 equal-sized arrays
```

The difference between `ravel` and `flatten` matters when memory is a concern: `ravel` avoids copying if the array is already contiguous, while `flatten` always copies to guarantee independence from the original.

## Broadcasting

Broadcasting is the rule that lets NumPy operate on arrays of different shapes without you manually reshaping them. Comparing shapes from right to left, two dimensions are compatible when they're equal, or when one of them is 1.

```python
# Subtract each column's mean: a (3, 4) matrix minus a (4,) vector
data = np.array([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
])
col_mean = data.mean(axis=0)   # shape (4,)
centered = data - col_mean     # (3, 4) - (4,) -> broadcast to (3, 4)
```

Here `col_mean`, with shape `(4,)`, is implicitly "stretched" to subtract from each of the 3 rows, without ever materializing an intermediate (3, 4) copy. This is the foundation of nearly every vectorized normalization, and understanding it well is what separates idiomatic NumPy code from loops disguised as vectors.

## Vectorized math and ufuncs

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b, a - b, a * b, a / b     # element-wise
a ** 2                          # power
np.sqrt(a)                      # square root
np.exp(a)                       # exponential
np.log(a)                       # natural log

a > 2                           # comparison: [False, False, True]
np.array_equal(a, b)            # compares whole arrays
```

These are "ufuncs" (universal functions): they operate element-wise and are implemented in C, so they're orders of magnitude faster than iterating with a plain Python `for` loop.

## Aggregations and the `axis` parameter

```python
m = np.array([[1, 2, 3], [4, 5, 6]])

m.sum()          # 21, sum over the whole array
m.mean()         # 3.5
m.std()           # standard deviation
m.var()           # variance
m.min(), m.max()  # 1, 6
m.argmin(), m.argmax()  # flat index of the min and max
m.cumsum()        # cumulative sum, flattened: [1, 3, 6, 10, 15, 21]
```

`axis` trips up almost everyone at first, and the simplest way to remember it: `axis` names the axis that **collapses**.

```python
m.sum(axis=0)   # collapses rows -> one sum per column: [5, 7, 9]
m.sum(axis=1)   # collapses columns -> one sum per row: [6, 15]
```

With `axis=0` you're reducing down the rows and get one result per column; with `axis=1` you're reducing across the columns and get one result per row. If your output has the wrong shape, you've almost certainly flipped the axis.

## Linear algebra essentials

```python
A = np.array([[2, 0], [0, 2]])
B = np.array([[1, 2], [3, 4]])

A @ B                     # matrix multiplication
np.matmul(A, B)            # explicit equivalent

np.linalg.inv(A)           # inverse of A
np.linalg.solve(A, np.array([2, 4]))   # solves Ax = b, without explicitly inverting A
np.linalg.norm(np.array([3, 4]))       # Euclidean norm: 5.0
```

Prefer `np.linalg.solve` over computing the inverse and multiplying whenever the goal is solving a linear system — it's both more numerically stable and faster.

## `np.random`: the Generator API

NumPy has recommended the `Generator`-based API (`np.random.default_rng`) over the legacy functions like `np.random.rand` for a while now, since it offers better statistical properties and reproducibility guarantees:

```python
rng = np.random.default_rng(seed=42)

rng.random(5)                     # 5 uniform floats in [0, 1)
rng.integers(0, 10, size=5)       # 5 integers in [0, 10)
rng.normal(loc=0, scale=1, size=5)    # normal distribution
rng.choice([1, 2, 3, 4], size=3, replace=False)   # sampling without replacement
```

Fixing `seed` is what makes an experiment or a synthetic-data pipeline reproducible; without it, every run produces different results.

## Saving and loading data

```python
np.save("data.npy", a)          # NumPy's native binary format
b = np.load("data.npy")

np.savetxt("data.csv", m, delimiter=",")     # plain text
m2 = np.loadtxt("data.csv", delimiter=",")
```

`save`/`load` are faster and preserve the exact dtype; `savetxt`/`loadtxt` are human-readable and interoperable with other tools, but slower and can lose precision if you don't control the format.

## Views vs. copies: why it matters

```python
a = np.arange(10)
view = a[2:5]          # basic slicing -> view, shares memory
view[0] = 999
print(a[2])              # 999, the original changed

copy = a[[2, 3, 4]]     # fancy indexing -> copy, independent memory
copy[0] = 0
print(a[2])               # still 999, unchanged

print(np.shares_memory(a, view))   # True
print(np.shares_memory(a, copy))   # False
```

Basic slicing (`a[2:5]`) always returns a view; fancy indexing (`a[[0, 2, 4]]`) and boolean masks always return a copy. This isn't an academic detail — mutating a view while thinking you're working on independent data silently corrupts the original array, and it's one of the harder bugs to track down in a long pipeline.

## Vectorization vs. Python loops: why NumPy is fast

A plain Python `for` loop over an array re-enters the interpreter on every iteration; a vectorized operation hands the entire loop off to compiled C code, with no per-element interpreter overhead. On moderate-to-large arrays the difference is one to two orders of magnitude. The practical rule: if you're writing a `for` loop to walk a NumPy array element by element, there's almost certainly a ufunc, a boolean mask, or a broadcasting operation that does the same thing without the loop.

## Common pitfalls

- **Mutating a view without realizing it**: as in the example above, modifying a slice's result modifies the original. If you need independence, call `.copy()` explicitly.
- **Silent dtype upcasting**: `np.array([1, 2, 3]) / 2` returns a `float64` array even though the input is integers — mixing an `int` array with a `float` in an operation silently upcasts the result's dtype. Check `.dtype` if the exact type matters to you.
- **Comparing floats with `==`**: due to floating-point rounding, `0.1 + 0.2 == 0.3` evaluates to `False`. Use `np.isclose(a, b)` or `np.allclose(a, b)` for numeric comparisons, never exact equality.

This reference covers what I use daily, but NumPy rarely works alone — it's almost always running underneath Pandas for tabular analysis. If you also work with tabular data, Pandas is the natural next step: continue with [the Pandas cheat sheet](/en/blog/pandas-cheat-sheet/).
