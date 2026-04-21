"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { FlightSidebar } from "@/components/flight-sidebar";
import { MapCanvas } from "@/components/map-canvas";
import { REGION_FILTERS, SAMPLE_AIRCRAFT } from "@/lib/constants";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";
import type { AircraftState } from "@/lib/types";

function inRegion(plane: AircraftState, regionId: string) {
  const region = REGION_FILTERS.find((item) => item.id === regionId) ?? REGION_FILTERS[0];

  if (plane.latitude == null || plane.longitude == null) {
    return false;
  }

  return (
    plane.latitude >= region.bounds.minLat &&
    plane.latitude <= region.bounds.maxLat &&
    plane.longitude >= region.bounds.minLng &&
    plane.longitude <= region.bounds.maxLng
  );
}

export default function HomePage() {
  const [regionId, setRegionId] = useState("world");
  const [query, setQuery] = useState("");
  const [aircraft, setAircraft] = useState<AircraftState[]>(SAMPLE_AIRCRAFT);
  const [selectedIcao24, setSelectedIcao24] = useState<string | null>(SAMPLE_AIRCRAFT[0]?.icao24 ?? null);
  const [status, setStatus] = useState(hasSupabaseEnv ? "Connecting to Supabase…" : "Showing seeded demo aircraft");
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("Sign in or create an account right from the home page.");
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    async function loadInitialFeed() {
      const { data, error } = await supabase
        .from("aircraft_states")
        .select("*")
        .order("last_contact", { ascending: false })
        .limit(500);

      if (error) {
        setStatus("Supabase connected, but initial aircraft query failed");
        return;
      }

      setAircraft(data);
      setSelectedIcao24((current) => current ?? data[0]?.icao24 ?? null);
      setStatus(`Realtime connected: ${data.length} aircraft loaded`);
    }

    loadInitialFeed();

    const channel = supabase
      .channel("aircraft-states")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "aircraft_states" },
        (payload) => {
          const row = payload.new as AircraftState;
          if (!row?.icao24) {
            return;
          }

          setAircraft((current) => {
            const next = current.filter((item) => item.icao24 !== row.icao24);
            next.unshift(row);
            return next.slice(0, 1000);
          });
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setStatus("Realtime subscribed to aircraft_states");
        }
      });

    return () => {
      authSubscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, []);

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseEnv) {
      setAuthMessage("Add Supabase env vars before using sign in.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setAuthPending(true);
    setAuthMessage(authMode === "sign-up" ? "Creating your account..." : "Signing you in...");

    const response =
      authMode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setAuthPending(false);

    if (response.error) {
      setAuthMessage(response.error.message);
      return;
    }

    if (authMode === "sign-up") {
      setAuthMessage("Account created. Check your email if confirmation is enabled, then sign in.");
    } else {
      setAuthMessage("Signed in.");
    }
  }

  async function handleSignOut() {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setAuthPending(true);
    const { error } = await supabase.auth.signOut();
    setAuthPending(false);
    setAuthMessage(error ? error.message : "Signed out.");
  }

  const region = REGION_FILTERS.find((item) => item.id === regionId) ?? REGION_FILTERS[0];
  const normalizedQuery = query.trim().toLowerCase();

  const filteredAircraft = useMemo(() => {
    return aircraft.filter((plane) => {
      if (!inRegion(plane, region.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [plane.callsign, plane.icao24, plane.origin_country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [aircraft, normalizedQuery, region.id]);

  const selectedAircraft =
    filteredAircraft.find((plane) => plane.icao24 === selectedIcao24) ?? filteredAircraft[0] ?? null;

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <h1>track flights</h1>
          <p className="hero-copy">
            Filter by region, search by callsign, and watch planes move across the map from a realtime
            feed pushed through Supabase.
          </p>
        </div>

        <div className="hero-stack">
          <div className="hero-status">
            <span className="status-dot" />
            <p>{status}</p>
          </div>

          <section className="auth-card">
            <div className="auth-card__top">
              <div>
                <p className="eyebrow">account</p>
                <h2>{session ? "you are signed in" : "sign in on the home page"}</h2>
              </div>
              {session ? (
                <button type="button" className="auth-switch" onClick={handleSignOut} disabled={authPending}>
                  sign out
                </button>
              ) : null}
            </div>

            {session ? (
              <div className="auth-signed-in">
                <p>{session.user.email}</p>
                <span>{authMessage}</span>
              </div>
            ) : (
              <>
                <div className="auth-tabs">
                  <button
                    type="button"
                    className={authMode === "sign-in" ? "auth-tab active" : "auth-tab"}
                    onClick={() => setAuthMode("sign-in")}
                  >
                    sign in
                  </button>
                  <button
                    type="button"
                    className={authMode === "sign-up" ? "auth-tab active" : "auth-tab"}
                    onClick={() => setAuthMode("sign-up")}
                  >
                    sign up
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                  </label>

                  <button type="submit" className="auth-submit" disabled={authPending}>
                    {authPending ? "working..." : authMode}
                  </button>
                </form>

                <p className="auth-message">{authMessage}</p>
              </>
            )}
          </section>
        </div>
      </section>

      <section className="toolbar">
        <div className="pill-group">
          {REGION_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === region.id ? "pill active" : "pill"}
              onClick={() => setRegionId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="search-shell">
          <span className="sr-only">Search aircraft</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search callsign, ICAO24, country"
          />
        </label>
      </section>

      <section className="dashboard">
        <MapCanvas
          aircraft={filteredAircraft}
          region={region}
          selectedIcao24={selectedAircraft?.icao24 ?? null}
          onSelect={setSelectedIcao24}
        />
        <FlightSidebar aircraft={filteredAircraft} selected={selectedAircraft} />
      </section>
    </main>
  );
}
