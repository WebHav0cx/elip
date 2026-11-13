# Contributing

## Branches

Create focused branches from `main` using one of these prefixes:

- `feat/` for a new capability
- `fix/` for a bug fix
- `chore/` for maintenance or tooling
- `docs/` for documentation-only changes

Keep branches small and delete them after merge.

## Commits

Use imperative, concise commit subjects with a conventional prefix, for example:

```text
feat(api): add election results endpoint
fix(api): handle missing constituency
chore: pin container dependencies
```

Keep unrelated changes in separate commits. Do not commit secrets, `.env` files, generated artifacts, or local database data.

## Pull requests

Before opening a PR:

1. Run the relevant tests and checks.
2. Confirm the service starts with `docker compose up --build`.
3. Describe the change, testing performed, and any migration or configuration impact.
4. Keep the PR focused and request review from an appropriate owner.
