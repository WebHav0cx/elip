# ELIP — Electoral Logistics Intelligence Platform

Monorepo for the Election Logistics Intelligence Platform.

## Repository layout

```text
backend/        FastAPI application, database models and migrations
simulation/     Synthetic operations, scenarios and replay engine
ml/             Predictive modelling, evaluation and packaging
src/            React, TypeScript and Vite dashboard
infra/          Infrastructure documentation and deployment assets
```

## Backend development

Copy `.env.example` to `.env`, then start the API and PostGIS services:

```bash
docker compose up --build
docker compose exec api alembic upgrade head
```

The API is available at <http://localhost:8000>. Check <http://localhost:8000/health>
and open the API documentation at <http://localhost:8000/docs>.

To stop services while retaining the database volume:

```bash
docker compose down
```

Use `docker compose down -v` only when deliberately removing the local database volume.

## Frontend development

```bash
npm install
npm run dev
```

Other useful commands are `npm run build`, `npm run lint` and `npm run preview`.

The dashboard is built with React, TypeScript, Vite and Tailwind CSS. Vercel configuration
lives in `vercel.json`; static hosts must provide an SPA fallback to `index.html`.

Application URL patterns live in `src/routes.ts`, and `src/app/router.ts` configures the
browser router. API calls remain in feature service modules.

## Configuration

Local configuration is supplied through environment variables. `.env` is ignored by Git;
use `.env.example` as the documented template. The default database URL uses the Compose
service name `db` from inside the API container.

The API exposes `/health` for process liveness and `/ready` for database readiness.

## Git conventions

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, commit messages and pull-request
expectations.
