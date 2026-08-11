---
title: "The Pandas Cheat Sheet I Actually Reach For"
description: "Selection, cleaning, grouping, merges, dates, and performance: the complete Pandas reference I keep open in every real data project."
pubDate: 2026-08-11
tags: ["data-engineering", "ia"]
draft: false
---

Pandas is the tool I use most in any data pipeline, and it's also the one whose details I forget fastest: was it `how="outer"` or `how="full"`? Does `.query()` accept external variables? Why did `SettingWithCopyWarning` just show up out of nowhere? This post is the cheat sheet I put together so I stop re-searching the same documentation every couple of weeks. It's not an introductory tutorial — it's a dense reference with the code I actually write.

## Import convention and base structures

The convention is universal: `import pandas as pd`, and if you're touching the underlying arrays directly, `import numpy as np` next to it.

```python
import numpy as np
import pandas as pd

# Series from a list
s = pd.Series([10, 20, 30], index=["a", "b", "c"], name="sales")

# DataFrame from a dict of lists (the most common case)
df = pd.DataFrame({
    "product": ["A", "B", "C"],
    "price": [100, 200, 150],
    "stock": [5, 0, 12],
})

# DataFrame from a list of dicts (one row per dict)
df2 = pd.DataFrame([
    {"product": "A", "price": 100},
    {"product": "B", "price": 200},
])

# DataFrame from a numpy array
df3 = pd.DataFrame(np.random.randn(4, 3), columns=["x", "y", "z"])
```

## Reading and writing data

```python
df = pd.read_csv("data.csv", sep=",", encoding="utf-8", parse_dates=["date"])
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
df = pd.read_json("data.json")
df = pd.read_parquet("data.parquet")  # requires pyarrow or fastparquet installed

df.to_csv("output.csv", index=False)
df.to_parquet("output.parquet", index=False)
```

One detail that's bitten me more than once: `index=False` on `to_csv` — skip it and Pandas writes the index back as an extra column the next time you read the file.

## Inspecting a DataFrame

Before touching anything, I run the same checks every time:

```python
df.head(5)           # first 5 rows
df.tail(3)             # last 3
df.shape                # (rows, columns)
df.columns              # Index of column names
df.dtypes                # dtype per column
df.info()                # dtypes + memory + non-null counts, all at once
df.describe()             # summary stats for numeric columns
df.describe(include="object")  # same for categorical/text columns
```

## Selection and filtering

`loc` selects by **label**, `iloc` by **integer position**. Mixing them up is the number-one source of silent bugs in someone else's Pandas code.

```python
df.loc[0, "price"]              # value at row label 0, column "price"
df.loc[0:2, ["product", "price"]]  # loc is inclusive on the upper bound
df.iloc[0, 1]                    # first row, second column, by position
df.iloc[0:2, :]                    # iloc is exclusive, like standard Python slicing

# Boolean mask
expensive = df[df["price"] > 120]

# Multiple conditions: parentheses are required, use & and | instead of and/or
filtered = df[(df["price"] > 100) & (df["stock"] > 0)]

# .query() for readable conditions, accepts external variables via @
threshold = 100
filtered = df.query("price > @threshold and stock > 0")

# isin() for set membership
df[df["product"].isin(["A", "C"])]
```

## Adding, dropping, and renaming columns

```python
df["discount"] = df["price"] * 0.1              # vectorized, no loop needed
df["final_price"] = df["price"] - df["discount"]

df = df.drop(columns=["stock"])                    # drop column(s)
df = df.drop(index=[0, 1])                           # drop row(s) by label

df = df.rename(columns={"product": "sku"})
df.columns = df.columns.str.lower().str.strip()      # normalize column names in bulk
```

## Missing data

```python
df.isna().sum()                       # nulls per column
df.dropna()                            # drop rows with at least one null
df.dropna(subset=["price"])              # only if "price" is null
df.fillna(0)                              # fill with a fixed value
df.fillna({"price": df["price"].mean(), "stock": 0})  # different value per column
df["price"].interpolate(method="linear")  # interpolate missing values in an ordered series
```

## Sorting

```python
df.sort_values("price", ascending=False)
df.sort_values(["product", "price"], ascending=[True, False])
df.sort_index()
```

## Grouping and aggregation

`groupby` is probably the single method that packs the most value in the entire library.

```python
df.groupby("product")["price"].mean()

df.groupby("product").agg(
    avg_price=("price", "mean"),
    max_price=("price", "max"),
    n=("price", "count"),
)

# Pivot table: two-dimensional grouping
pd.pivot_table(df, values="price", index="product", columns="stock", aggfunc="sum", fill_value=0)

# Crosstab: cross-tabulated frequencies between two categorical columns
pd.crosstab(df["product"], df["stock"] > 0)
```

## Combining DataFrames: merge, concat, join

```python
# merge, the equivalent of a SQL JOIN
pd.merge(df1, df2, on="id", how="inner")   # only matches in both
pd.merge(df1, df2, on="id", how="left")     # all of df1 + matches from df2
pd.merge(df1, df2, on="id", how="right")     # all of df2 + matches from df1
pd.merge(df1, df2, on="id", how="outer")      # union of both, NaN where missing

# concat: stack by rows or columns
pd.concat([df1, df2], axis=0, ignore_index=True)  # stack rows
pd.concat([df1, df2], axis=1)                        # paste columns side by side

# join: like merge but keyed on the index by default
df1.join(df2, how="left")
```

## String methods: the `.str` accessor

```python
df["product"].str.contains("A", case=False, na=False)
df["product"].str.replace("A", "Alpha", regex=False)
df["product"].str.lower().str.strip()
df["date_text"].str.split("-", expand=True)      # split into columns
df["code"].str.extract(r"(?P<prefix>[A-Z]+)(?P<number>\d+)")  # regex with named groups
```

## Dates and time series

```python
df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")

df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["weekday"] = df["date"].dt.day_name()

date_range = pd.date_range(start="2026-01-01", end="2026-01-31", freq="D")

# resample: regroup by time frequency (requires a datetime index)
series = df.set_index("date")["price"]
series.resample("ME").mean()   # monthly average ("ME" = month end in pandas 2.2+)
series.resample("W").sum()      # weekly sum
```

## `apply`, `map`, `applymap` vs. vectorized operations

The rule I follow: if a native vectorized operation exists, use it. `apply` is the last resort, not the first.

```python
df["price"].map({100: "low", 200: "high"})       # Series: element-wise substitution

df["category"] = df["price"].apply(lambda p: "expensive" if p > 150 else "cheap")  # custom logic on a Series

df.apply(lambda row: row["price"] - row["discount"], axis=1)  # full row, axis=1 = row-wise

df[["price", "stock"]].map(lambda x: x * 2)  # element-wise over the whole DataFrame (formerly .applymap, deprecated since pandas 2.1)
```

Almost always, `df["price"] * 2` is faster and clearer than any of the above. `apply` is still a Python loop under the hood; I only reach for it when the logic genuinely can't be expressed as a vectorized operation.

## Method chaining style

Chaining methods makes the transformation flow readable top to bottom, instead of reassigning the same variable ten times:

```python
result = (
    df
    .query("stock > 0")
    .assign(final_price=lambda d: d["price"] * 0.9)
    .groupby("product", as_index=False)
    .agg(total=("final_price", "sum"))
    .sort_values("total", ascending=False)
)
```

`.assign()` matters here because it lets you create new columns inside the chain without breaking it with an intermediate assignment.

## Performance: what actually moves the needle

- **Never use `iterrows()`** to transform data. It's orders of magnitude slower than a vectorized operation because it rebuilds a Series for every row.
- Prefer vectorized operations (`df["a"] + df["b"]`) over `apply`, and `apply` over explicit loops.
- Downcast dtypes when you can: `df["id"] = df["id"].astype("int32")` instead of the default `int64` saves real memory on large datasets.
- Convert low-cardinality text columns to `category`: `df["product"] = df["product"].astype("category")` cuts memory usage and speeds up `groupby`.
- For large files, `read_csv(..., usecols=[...], dtype={...})` avoids loading columns you won't use and skips Pandas' costly type inference on them.

## Common pitfalls

- **`SettingWithCopyWarning`**: this shows up when you modify a DataFrame that might be a view or a copy of another one, and Pandas can't guarantee which. The fix is to use `.loc` explicitly, or force a copy with `.copy()` when you know you're working on an independent subset: `filtered_df = df[df["price"] > 100].copy()`.
- **Chained indexing** (`df[df["price"] > 100]["stock"] = 0`): this almost never does what you expect, because the first selection may return a copy rather than a view. Always write it as a single operation: `df.loc[df["price"] > 100, "stock"] = 0`.
- **Implicit dtype coercion**: if a numeric column picks up even one `NaN`, Pandas silently upcasts it to `float64` because classic `int64` can't hold nulls. If you need integers that allow nulls, use the nullable `Int64` dtype (capital I) instead of `int64`.

That covers about 90% of what I touch day to day in Pandas. If you want to go one level down and understand the vectorized engine behind Pandas, NumPy is the place to start: array strides, broadcasting, and why vectorized operations are so fast are one post down, in [the NumPy cheat sheet](/en/blog/numpy-cheat-sheet/).
