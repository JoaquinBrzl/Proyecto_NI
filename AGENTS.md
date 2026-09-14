# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **ProyectoNi** (API base `https://t4p8g4m2.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.
- **Static frontend (XAMPP):** copy `.env.example` → `.env.local`, then run `npm run ni:config` to generate `assets/js/ni/config.js` (gitignored). Bundle the browser SDK with `npm run ni:bundle-sdk` (or `npm run ni:setup` for both). Load `assets/js/ni/boot.js` as an ES module on pages.
- **Identity:** native Auth (`auth.users` + `getProfile`/`setProfile`); app tables `user_roles` (`admin`|`user`) and `memberships` (`ni_free`/0, `ni_pro`/1, `ni_elite`/2). Helpers: `is_admin()`, `membership_level()`. New users get NI Free via trigger. Do not put role/membership in profile custom fields.
- **Modules:** progressive stubs live under `assets/js/ni/modules/`; register with `registerModule` — do not rewrite `assets/js/main.js`.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
