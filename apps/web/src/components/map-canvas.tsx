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
            <path d="M90 121l24-18 39-8 42 8 31 21 11 26-11 22-24 9-15 20-6 23 20 20 8 33-14 24-32-4-29-25-13-34-28-7-23-27-9-40 13-31z" />
            <path d="M236 290l26 8 28 21 19 34 15 48 31 43 37 17 25-11-6-28-23-30-14-44-31-43-17-26-31-13-27 3z" />
            <path d="M447 113l38-18 46-8 72 7 61 20 41 29 18 30-10 34-35 18-39 1-19 14 4 27 35 18 53-1 44 8 27 23 28-8 28 9 25-17 35-3 45 21 13 25-16 23-45 12-46-8-42 12-55-18-23-24-31 2-28 17-39-4-28-23-37-3-20-32-33-14-17-23-4-37 18-36z" />
            <path d="M746 330l26-13 29 3 22 19 30 3 12 24-9 24-36 12-24 20-26 2-23-18-18-33 4-23z" />
            <path d="M824 106l25-7 27 8 19 18-2 20-20 10-27-2-20-16-12-18z" />
            <path d="M352 435l60-7 78 7 93-4 84 9 70-13 88 15 44 17-23 12-104 7-104-8-107 6-109-11-79-16z" />
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
