# Flight Tracker

Flight Tracker is a live aircraft monitoring website built with Next.js, Supabase Realtime, and an OpenSky-powered background worker. The frontend renders a live map and aircraft detail feed, while the worker polls OpenSky and writes normalized aircraft state vectors into Supabase.

## Required Links

1. Vercel URL — Add your deployed frontend URL here after deployment.
2. GitHub URL — https://github.com/aanchal-mpcs/FlightTracker

## Architecture

- `apps/web`: Next.js frontend for the live aircraft map and filters
- `apps/worker`: Railway worker that polls OpenSky and upserts aircraft data
- `supabase/schema.sql`: database schema, RLS policies, and Realtime table setup

## Local Development

Install dependencies from the repo root:

```bash
npm install
```

Run the frontend:

```bash
npm run dev:web
```

Run the worker:

```bash
npm run dev:worker
```

## Environment Variables

Frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Worker:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENSKY_CLIENT_ID=
OPENSKY_CLIENT_SECRET=
OPENSKY_POLL_INTERVAL_MS=15000
OPENSKY_BOUNDS=-90,-180,90,180
```

## Deployment Notes

- Deploy `apps/web` to Vercel
- Deploy `apps/worker` to Railway
- Enable Supabase Realtime on `public.aircraft_states`
- Add the deployed Vercel URL to the Required Links section above
