"use client";

import type { AircraftState } from "@/lib/types";

type FlightSidebarProps = {
  aircraft: AircraftState[];
  selected: AircraftState | null;
};

function formatAltitude(value: number | null) {
  if (value == null) {
    return "Unknown";
  }

  return `${Math.round(value * 3.28084).toLocaleString()} ft`;
}

function formatSpeed(value: number | null) {
  if (value == null) {
    return "Unknown";
  }

  return `${Math.round(value * 1.94384)} kt`;
}

function formatAge(lastContact: number | null) {
  if (!lastContact) {
    return "Unknown";
  }

  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - lastContact);
  return `${seconds}s ago`;
}

export function FlightSidebar({ aircraft, selected }: FlightSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="detail-card">
        <p className="eyebrow">Selection</p>
        {selected ? (
          <>
            <h3>{selected.callsign?.trim() || selected.icao24.toUpperCase()}</h3>
            <dl className="detail-grid">
              <div>
                <dt>ICAO24</dt>
                <dd>{selected.icao24}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{selected.origin_country ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Altitude</dt>
                <dd>{formatAltitude(selected.geo_altitude ?? selected.baro_altitude)}</dd>
              </div>
              <div>
                <dt>Speed</dt>
                <dd>{formatSpeed(selected.velocity)}</dd>
              </div>
              <div>
                <dt>Track</dt>
                <dd>{selected.true_track != null ? `${Math.round(selected.true_track)}°` : "Unknown"}</dd>
              </div>
              <div>
                <dt>Last Seen</dt>
                <dd>{formatAge(selected.last_contact)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <h3>No aircraft selected</h3>
            <p className="muted">
              Choose a marker on the map to inspect callsign, altitude, speed, and last contact.
            </p>
          </>
        )}
      </div>

      <div className="feed-card">
        <div className="feed-head">
          <p className="eyebrow">Active Feed</p>
          <span>{aircraft.length} tracked</span>
        </div>
        <ul className="feed-list">
          {aircraft.slice(0, 10).map((plane) => (
            <li key={plane.icao24}>
              <div>
                <strong>{plane.callsign?.trim() || plane.icao24.toUpperCase()}</strong>
                <p>{plane.origin_country ?? "Unknown origin"}</p>
              </div>
              <span>{formatAltitude(plane.geo_altitude ?? plane.baro_altitude)}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

