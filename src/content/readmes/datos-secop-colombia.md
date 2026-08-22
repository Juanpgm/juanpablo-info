# contratos_warehouse

MVP para extracción de datos abiertos SECOP (Socrata) con separación por dominios:

- `src/procesos`: ingesta de procesos.
- `src/contratos`: ingesta de contratos.
- `src/common`: utilidades compartidas (cliente API, DB, logging, settings).

## Estructura

- `db/migrations/001_init.sql`: tablas base con UPSERT-ready + `POSTGIS`.
- `scripts/run_mvp.py`: ejecuta 10 requests de prueba por dataset y realiza upsert.
- `requirements.txt`: dependencias del proyecto.

## Uso rápido

1. Copiar `.env.example` a `.env` y ajustar `DATABASE_URL`.
2. Aplicar migración `db/migrations/001_init.sql` en PostgreSQL.
3. Ejecutar:
   - `./.venv/Scripts/python.exe scripts/run_mvp.py`

## Bootstrap de SOCRATA_APP_TOKEN (headless)

- `scripts/bootstrap_socrata_token.py` solo corre si `SOCRATA_APP_TOKEN` no existe en `.env`.
- No persiste usuario/contraseña; las toma solo desde variables de entorno de sesión.

PowerShell:

- `$env:SOCRATA_EMAIL='tu_email'`
- `$env:SOCRATA_PASSWORD='tu_password'`
- `./.venv/Scripts/python.exe scripts/bootstrap_socrata_token.py`
