# Election Hackathon

Monorepo for the Election Hackathon platform.

## Repository layout

```text
backend/        FastAPI application and its container image
infra/          Infrastructure documentation and future deployment assets
```

## Local development

1. Copy `.env.example` to `.env` and update secrets for your environment.
2. Start the API and PostGIS services:

   ```bash
   docker compose up --build
   ```

3. Check the API at <http://localhost:8000/health> and its OpenAPI docs at <http://localhost:8000/docs>.

To stop services while retaining the database volume:

```bash
docker compose down
```

To remove the local database volume as well, use `docker compose down -v` deliberately.

## Configuration

All local configuration is supplied through environment variables. `.env` is ignored by Git; use `.env.example` as the documented template. The default `DATABASE_URL` uses the Compose service name `db`, so it works from inside the API container.

The API exposes `/health` for process liveness and `/ready` for database readiness. `/ready` returns HTTP 503 until PostgreSQL is reachable.

## Database migrations

After starting the services, apply the schema with:

```bash
docker compose exec api alembic upgrade head
```

To check the currently applied revision:

```bash
docker compose exec api alembic current
```

## Git conventions

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, commit messages, and pull request expectations.
