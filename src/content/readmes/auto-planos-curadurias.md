# Curaduría Plan Generator

A **pyRevit extension** that generates a draft construction-permit ("curaduría")
drawing set — floor plans, elevations, sections, roof plan, site plan, and a
cuadro de áreas (area schedule) — directly from a Revit model, following the
studio's graphic and regulatory conventions.

## Legal boundary — read this first

**This tool prepares drawings. It does not replace professional review.** Every
sheet and every exported PDF/DWG carries a visible "draft — pending professional
review" label. Output must be reviewed and signed by a licensed **CPNAA/COPNIA**
professional (arquitecto/ingeniero) before submission to a curaduría. The tool
is an interpreter of a declarative, editable catalog and configuration (not a
hardcoded document generator) so that graphic and regulatory conventions can be
corrected as data, not as code changes.

## Architecture

Hexagonal (ports-and-adapters), running on pyRevit's **CPython 3 engine**:

- `src/curaduria/domain/` and `src/curaduria/application/` — pure Python, zero
  `Autodesk.Revit` imports, fully unit-testable with `pytest` outside Revit.
- `src/curaduria/adapters/revit/` — the only code that imports the Revit API;
  implements the ports the application layer depends on.
- `src/curaduria/diagnostics/` — pure report model for the Task-0 environment
  gate (see below); no Revit imports.
- `revit/CuraduriaPlanos.extension/` — the pyRevit extension. Each
  `script.py` does nothing but build a request, wire the real adapters, call
  the application use case, and render the result.

See `openspec/changes/revit-curaduria-plan-generator/design.md` for the full
module layout, ports, data models, and architecture decisions.

## Before anything else: Task-0 verification gate

Before any pipeline code is trusted, run the **Task-0** gate inside the real
target install (pyRevit ≥ 6.4.0 on Revit 2027) to confirm the CPython engine
can reach everything this tool needs (PyYAML, `DWGExportOptions`,
`PDFExportOptions`, output-folder write access). See
[`docs/task0-verification.md`](docs/task0-verification.md).

## Dev setup

Requires Python 3.11+ (bumped from the original 3.9+ once Task-0 confirmed
the real target install's CPython engine is 3.12.3 — see
[`docs/task0-verification.md`](docs/task0-verification.md) — and Unit G1's
config loader needs stdlib `tomllib`, which requires 3.11+).

```bash
python -m pip install -e ".[dev]"
```

This installs the package in editable mode plus `pytest`, `ruff`, and
`pre-commit`.

## Running tests

```bash
python -m pytest -q
```

Configured `testpaths` are `tests/unit` and `tests/integration` — both pure
Python, no Revit and no Windows dependency required. The in-Revit contract
suite (`tests/contract/`) is excluded from this default run; it is executed
in-process from Revit via the `SmokeTest.pushbutton` command and is
test-after by design (it exercises the real Revit adapters, which cannot run
outside Revit).

## Linting

```bash
python -m ruff check .
```

`revit/` is excluded from lint: those scripts import `pyrevit` and
`Autodesk.Revit.*`, which only resolve inside the Revit process.

## Pre-commit hooks

```bash
python -m pip install pre-commit
pre-commit install
pre-commit run --all-files
```

Runs `ruff` (lint + format) and basic hygiene hooks (end-of-file, trailing
whitespace, YAML syntax, merge-conflict markers) before each commit.

## Installing the pyRevit extension

Copy or symlink `revit/CuraduriaPlanos.extension/` into pyRevit's extensions
folder (or add its parent directory as a custom extension path in pyRevit's
settings), then reload pyRevit. Each command script prepends `<repo>/src` to
`sys.path` at import time, so the extension always runs against this repo's
current `src/curaduria` — no separate install or symlink of the package
itself is required for the extension to work inside Revit.

Commands (Curaduria tab → Planos panel):

- **Generar Set** — runs a full generation against the active model.
- **Preflight** — validates the model without generating anything.
- **Smoke Test** — developer/CI tool; runs the adapter contract suite
  in-process against the fixture model.

## Project status

Greenfield, Unit A (repo bootstrap) of a 10-unit chained-PR build. See
`openspec/changes/revit-curaduria-plan-generator/tasks.md` for the full task
breakdown and `apply-progress.md` in the same folder for current progress.
