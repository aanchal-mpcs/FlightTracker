# Flight Tracker

Flight Tracker is a live aircraft monitoring website built with Next.js, Supabase Realtime, and an OpenSky-powered background worker. The frontend renders a live map and aircraft detail feed, while the worker polls OpenSky and writes normalized aircraft state vectors into Supabase.

## Required Links

1. Vercel URL — https://flight-tracker-web-ten.vercel.app
2. GitHub URL — https://github.com/aanchal-mpcs/FlightTracker
3. Video URL — https://design-build-ship.slack.com/files/U0ANL120022/F0AV7TRGAD6/aanchalsinghweek4.mov

## Current Status

- The frontend is live on Vercel.
- The repository includes multiple commits showing iteration on UI, auth, and deployment work.
- Sign-in and sign-up routes are implemented in the frontend.
- The Railway worker and OpenSky integration were set up, but live polling from Railway to OpenSky is still unstable due to repeated token-request timeout failures.
- Supabase Realtime wiring exists in the frontend, but fully working live updates depend on a stable worker deployment.
- Personalized saved user preferences are not fully implemented yet.

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
OPENSKY_REQUEST_TIMEOUT_MS=20000
OPENSKY_CONNECT_TIMEOUT_MS=30000
OPENSKY_MAX_RETRIES=3
OPENSKY_BOUNDS=-90,-180,90,180
```

## Deployment Notes

- Deploy `apps/web` to Vercel
- Deploy `apps/worker` to Railway
- Enable Supabase Realtime on `public.aircraft_states`
- Add the deployed Vercel URL to the Required Links section above
