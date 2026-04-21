# FlightTracker

## Architecture

This repository is a monorepo for a live aircraft tracking product built on three services:

- `apps/web`: Next.js frontend deployed to Vercel
- `apps/worker`: background poller deployed to Railway
- `supabase`: database schema and Realtime configuration for Supabase

## Data Flow

1. The Railway worker polls the OpenSky Network `/states/all` endpoint on an interval.
2. The worker normalizes aircraft state vectors and upserts them into Supabase.
3. Supabase Realtime broadcasts row changes from `public.aircraft_states`.
4. The Next.js frontend subscribes to those row changes and updates the map without browser refresh.

## Product Shape

- The main UI is a live world map with moving aircraft markers.
- Users can filter by region and search by callsign, ICAO24, or country.
- Authentication and saved filters are planned on top of Supabase Auth.
- OpenSky provides live aircraft position data, not commercial schedules or delay feeds.

## Constraints

- The browser should not poll OpenSky directly.
- The browser should not talk to the worker directly.
- The worker uses the Supabase service role key and is trusted infrastructure.
- The frontend uses only the public Supabase URL and anon key.
- OpenSky's current docs recommend OAuth2 client-credentials for programmatic access.
- OpenSky's terms say operational REST API use requires a prior written agreement.

## Deployment

- Vercel root: `apps/web`
- Railway root: `apps/worker`
- Supabase project: enable Realtime replication on `aircraft_states`
