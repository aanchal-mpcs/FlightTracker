"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

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
      void supabase.removeChannel(channel);
    };
  }, []);

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
                <h2>choose how to continue</h2>
              </div>
            </div>
            <div className="auth-links">
              <Link href="/sign-in" className="auth-link-button">
                sign in
              </Link>
              <Link href="/sign-up" className="auth-link-button auth-link-button--strong">
                sign up
              </Link>
            </div>
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
