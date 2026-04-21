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

  const gameStats = useMemo(() => {
    const inAirCount = filteredAircraft.filter((plane) => !plane.on_ground).length;
    const fastMovers = filteredAircraft.filter((plane) => (plane.velocity ?? 0) > 220).length;
    const countries = new Set(filteredAircraft.map((plane) => plane.origin_country).filter(Boolean)).size;
    const scoutScore = Math.min(999, inAirCount * 6 + fastMovers * 9 + countries * 4);
    const level = Math.max(1, Math.floor(scoutScore / 120) + 1);
    const progress = scoutScore % 120;

    return {
      scoutScore,
      level,
      progress,
      inAirCount,
      fastMovers,
      countries,
    };
  }, [filteredAircraft]);

  const missionCards = useMemo(
    () => [
      {
        title: "Spot 12 active aircraft",
        progress: Math.min(100, Math.round((gameStats.inAirCount / 12) * 100)),
        label: `${gameStats.inAirCount}/12 tracked`,
      },
      {
        title: "Find 5 fast movers",
        progress: Math.min(100, Math.round((gameStats.fastMovers / 5) * 100)),
        label: `${gameStats.fastMovers}/5 over cruise pace`,
      },
      {
        title: "Unlock 8 countries",
        progress: Math.min(100, Math.round((gameStats.countries / 8) * 100)),
        label: `${gameStats.countries}/8 origins found`,
      },
    ],
    [gameStats.countries, gameStats.fastMovers, gameStats.inAirCount],
  );

  const badges = useMemo(() => {
    const nextBadges = [];

    if (gameStats.inAirCount >= 10) {
      nextBadges.push("Sky Scanner");
    }

    if (gameStats.fastMovers >= 3) {
      nextBadges.push("Speed Hunter");
    }

    if (gameStats.countries >= 5) {
      nextBadges.push("World Watcher");
    }

    if (selectedAircraft?.velocity && selectedAircraft.velocity > 240) {
      nextBadges.push("Jet Lock");
    }

    return nextBadges.length ? nextBadges : ["Runway Rookie"];
  }, [gameStats.countries, gameStats.fastMovers, gameStats.inAirCount, selectedAircraft]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">flight tracker arcade</p>
          <h1>track flights</h1>
          <p className="hero-copy">
            Scan the globe, rack up scout points, and complete live airspace missions as aircraft move.
          </p>

          <div className="game-strip">
            <div className="game-chip">
              <span>scout score</span>
              <strong>{gameStats.scoutScore}</strong>
            </div>
            <div className="game-chip">
              <span>level</span>
              <strong>{gameStats.level}</strong>
            </div>
            <div className="game-chip">
              <span>badges</span>
              <strong>{badges.length}</strong>
            </div>
          </div>
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

      <section className="scoreboard-row">
        <article className="score-card">
          <p className="eyebrow">live mission board</p>
          <h2>airspace streak</h2>
          <div className="score-card__value">{gameStats.inAirCount}</div>
          <p className="score-card__copy">active aircraft currently in your scan zone</p>
        </article>

        <article className="score-card">
          <p className="eyebrow">speed run</p>
          <h2>fast movers</h2>
          <div className="score-card__value">{gameStats.fastMovers}</div>
          <p className="score-card__copy">targets exceeding high cruise pace</p>
        </article>

        <article className="score-card">
          <p className="eyebrow">world unlocks</p>
          <h2>countries</h2>
          <div className="score-card__value">{gameStats.countries}</div>
          <p className="score-card__copy">unique origin countries discovered in this view</p>
        </article>

        <article className="score-card score-card--progress">
          <p className="eyebrow">level progress</p>
          <h2>next unlock</h2>
          <div className="progress-bar">
            <span style={{ width: `${Math.max(8, Math.min(100, (gameStats.progress / 120) * 100))}%` }} />
          </div>
          <p className="score-card__copy">{120 - gameStats.progress} more points to the next level</p>
        </article>
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

      <section className="missions-row">
        <div className="mission-panel">
          <div className="mission-panel__head">
            <div>
              <p className="eyebrow">missions</p>
              <h2>daily flight challenges</h2>
            </div>
            <span>{missionCards.length} active</span>
          </div>

          <div className="mission-list">
            {missionCards.map((mission) => (
              <article key={mission.title} className="mission-card">
                <div className="mission-card__top">
                  <h3>{mission.title}</h3>
                  <span>{mission.progress}%</span>
                </div>
                <div className="progress-bar progress-bar--thin">
                  <span style={{ width: `${Math.max(6, mission.progress)}%` }} />
                </div>
                <p>{mission.label}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="badge-panel">
          <div className="mission-panel__head">
            <div>
              <p className="eyebrow">badge case</p>
              <h2>earned unlocks</h2>
            </div>
          </div>
          <div className="badge-grid">
            {badges.map((badge) => (
              <div key={badge} className="badge-token">
                <span>★</span>
                <strong>{badge}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
