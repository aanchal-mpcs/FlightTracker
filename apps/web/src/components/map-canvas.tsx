"use client";

import type { AircraftState, RegionFilter } from "@/lib/types";

type MapCanvasProps = {
  aircraft: AircraftState[];
  region: RegionFilter;
  selectedIcao24: string | null;
  onSelect: (icao24: string) => void;
};

function projectPoint(lat: number, lng: number, region: RegionFilter) {
  const { minLat, maxLat, minLng, maxLng } = region.bounds;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
  return { x, y };
}

export function MapCanvas({
  aircraft,
  region,
  selectedIcao24,
  onSelect,
}: MapCanvasProps) {
  return (
    <section className="map-shell">
      <div className="map-header">
        <div>
          <p className="eyebrow">Live Airspace</p>
          <h2>Realtime aircraft positions</h2>
        </div>
        <p className="map-meta">{aircraft.length} aircraft in view</p>
      </div>

      <div className="map-stage" role="img" aria-label={`Aircraft map for ${region.label}`}>
        <div className="map-atmosphere" />
        <svg
          className="world-map"
          viewBox="0 0 1000 500"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <g className="world-map__continents">
            <path d="M104 124l66-24 66 14 23 31-14 32-50 8-22 22 11 43-34 19-57-36-44-12-12-41 37-43z" />
            <path d="M256 281l41 20 28 50 21 62 44 34 29-16-8-41-28-41-13-46-35-46-43-20z" />
            <path d="M438 115l63-18 91 8 56 30 27 44-6 40-53 7-30 33 6 34 62 14 78-16 41 15 77-13 39 17-16 34-73 40-108 5-87-23-64 10-45-36-49-4-27-46-52-34 4-47 39-40z" />
            <path d="M727 344l39-11 40 15 27 31 62 6 39 28-26 38-62 18-57-17-45 18-40-38 8-54z" />
            <path d="M825 110l39 11 14 26-12 26-38 4-26-18 4-35z" />
          </g>
          <g className="world-map__routes">
            <path d="M150 180c130-60 250-70 390-12s240 34 330-28" />
            <path d="M220 330c120-22 220-18 318 18s178 42 280 5" />
            <path d="M480 88c20 94 56 150 122 205s121 92 211 130" />
          </g>
        </svg>
        {aircraft.map((plane) => {
          if (plane.latitude == null || plane.longitude == null) {
            return null;
          }

          const { x, y } = projectPoint(plane.latitude, plane.longitude, region);
          const isSelected = selectedIcao24 === plane.icao24;
          const drift = `${(plane.icao24.charCodeAt(0) % 7) + 5}s`;

          return (
            <button
              key={plane.icao24}
              type="button"
              className={isSelected ? "plane-marker active" : "plane-marker"}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                rotate: `${plane.true_track ?? 0}deg`,
                animationDuration: drift,
              }}
              onClick={() => onSelect(plane.icao24)}
              aria-label={`Select aircraft ${plane.callsign?.trim() || plane.icao24}`}
            >
              <span className="plane-trail" />
              <span className="plane-shape">▲</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
