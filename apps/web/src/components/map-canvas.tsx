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
        <div className="map-grid" />
        {aircraft.map((plane) => {
          if (plane.latitude == null || plane.longitude == null) {
            return null;
          }

          const { x, y } = projectPoint(plane.latitude, plane.longitude, region);
          const isSelected = selectedIcao24 === plane.icao24;

          return (
            <button
              key={plane.icao24}
              type="button"
              className={isSelected ? "plane-marker active" : "plane-marker"}
              style={{ left: `${x}%`, top: `${y}%`, rotate: `${plane.true_track ?? 0}deg` }}
              onClick={() => onSelect(plane.icao24)}
              aria-label={`Select aircraft ${plane.callsign?.trim() || plane.icao24}`}
            >
              <span className="plane-shape">▲</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

