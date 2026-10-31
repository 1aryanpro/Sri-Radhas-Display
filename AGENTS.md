# AGENTS.md

## Commands
- Use npm with the committed lockfile: `npm ci`, then `npm run dev`.
- Verify changes with `npm run build`; use `npm run preview` to serve the production build.
- No test, lint, formatter, or typecheck commands are configured.
- Builds currently succeed despite a non-fatal `adapter-auto` production-environment notice outside supported hosts.

## Runtime and backend
- Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` in `.env`; `src/lib/supabase.js` reads both through `$env/static/public`. Env files are gitignored.
- The app has two client-side routes: `/` is the timed display and `/admin` handles auth and content management. Both call Supabase directly through `$lib/supabase`; there are no server routes or local backend mocks, so manual upload/delete checks affect the configured live project.
- Keep the `carousel` Storage bucket and `Carousel` table in sync by storage object `id`. Table fields `order`, `star`, and `time` control ordering, starred-slide repetition, and per-slide duration in seconds; both routes depend on these names and semantics.
- The display only appears after clicking **Start the Display**, which enables the wake lock.
- The admin UI accepts only `jpg`, `jpeg`, and `png` uploads and rejects PDFs, despite the README mentioning PDFs.
