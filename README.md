# Stillwell

Responsive website and shared blog management portal, using Supabase Auth, Postgres and Storage, with live server-rendered public pages on Vercel.

## Development

- Node.js 24, npm ci, npm run build, npm run dev.
- npm run check verifies browser syntax.
- node --test tests/cms.test.mjs checks rendering and the configured database's anonymous access controls.
- dist/config.js contains only public Supabase configuration. No service-role key or password belongs in this repository.

## Administrator setup

Create the administrator in Supabase Authentication (email/password; confirm the email), then add their auth user UUID to public.site_admins using the SQL editor or a trusted database administrator. Client accounts cannot grant themselves access. There is no public sign-up form.

## Publishing

Open /admin and sign in. Create a story, add text with heading/bold/italic formatting, choose a category, upload a JPG/PNG/WebP up to 2 MB, and save as Draft or Published. Optional tags, image alt text, search title and search description are supported. Publication date is a display date, not scheduled publishing. Published pages and the sitemap read Supabase on each request. Unpublishing removes public access immediately on a new request. Existing browser sessions refresh content on reload. Version checks prevent overwriting another editor's changes.

Draft text is restricted by row-level security. Featured images are public editorial assets; do not upload confidential material. Replaced/deleted images are removed when unused. Abandoned uploads can be cleaned up in the Supabase Storage dashboard.

## Deployment

GitHub: https://github.com/mrmorningstar-dev/stillwell
Vercel project: stillwell. Build: npm run build; output: dist. vercel.json routes public pages to api/page.js. SITE_URL optionally sets a canonical domain; otherwise Vercel's production domain is used.

supabase/schema.sql documents the initial database setup and policies. It is not an idempotent migration; do not rerun on an existing project. supabase/seed.mjs contains sample editorial material only, not live drafts.

## Deferred by the client

Google sign-in, final branding/content/business policies and real contact delivery. Contact form remains an explicitly labelled testing preview: it validates input but sends and stores nothing. Existing service content is illustrative and does not offer appointments or clinical services.
