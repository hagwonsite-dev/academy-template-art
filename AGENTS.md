# Standalone academy sample

- Preserve existing migrations; add a migration for schema changes.
- Never write to remote databases on startup.
- Keep authentication and read-only guards on every mutation.
- SQL identifiers come from config; bind all user values.
- Keep conditional status updates and capacity/session guards atomic.
- Do not claim real payments or notifications without an actual integration.
- Run npm run lint, npm run typecheck, npm test and npm run build.
