# Infrastructure

Local infrastructure is currently defined in the root `docker-compose.yml`:

- `api`: FastAPI application on port 8000
- `db`: PostGIS 16 on port 5432

Both services have health checks. The API waits for the database health check before starting. Persistent PostGIS data is stored in the named `postgres-data` Docker volume.
