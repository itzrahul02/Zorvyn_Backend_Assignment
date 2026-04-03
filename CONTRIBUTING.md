# Contributing

Thanks for taking an interest in this project. A few quick guidelines:

- Keep changes small and focused. One feature or fix per pull request.
- Run the seed script and smoke tests locally before opening a PR:
  - `cd backend && npm run seed`
  - `cd backend && npm run smoke`
- Follow the existing code style (ES modules, top-level await in backend entrypoint).
- If adding tests, keep them fast and deterministic.

If you aren't sure about a change, open an issue first and describe the problem or suggestion.
