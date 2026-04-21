import type { AircraftState, RegionFilter } from "@/lib/types";

export const REGION_FILTERS: RegionFilter[] = [
  {
    id: "world",
    label: "Worldwide",
    bounds: { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 },
  },
  {
    id: "north-america",
    label: "North America",
    bounds: { minLat: 5, maxLat: 83, minLng: -170, maxLng: -50 },
  },
  {
    id: "europe",
    label: "Europe",
    bounds: { minLat: 30, maxLat: 72, minLng: -25, maxLng: 45 },
  },
  {
    id: "asia-pacific",
    label: "Asia Pacific",
    bounds: { minLat: -45, maxLat: 60, minLng: 65, maxLng: 180 },
  },
];

export const SAMPLE_AIRCRAFT: AircraftState[] = [
  {
    icao24: "a1b2c3",
    callsign: "UAL238 ",
    origin_country: "United States",
    longitude: -87.9048,
    latitude: 41.9786,
    baro_altitude: 10972,
    geo_altitude: 11120,
    on_ground: false,
    velocity: 238,
    true_track: 274,
    vertical_rate: 0,
    last_contact: Math.floor(Date.now() / 1000) - 6,
    updated_at: new Date().toISOString(),
  },
  {
    icao24: "d4e5f6",
    callsign: "DLH4TR ",
    origin_country: "Germany",
    longitude: 8.5622,
    latitude: 50.0379,
    baro_altitude: 9450,
    geo_altitude: 9540,
    on_ground: false,
    velocity: 212,
    true_track: 121,
    vertical_rate: -2,
    last_contact: Math.floor(Date.now() / 1000) - 12,
    updated_at: new Date().toISOString(),
  },
  {
    icao24: "0f1e2d",
    callsign: "QFA12  ",
    origin_country: "Australia",
    longitude: 151.1772,
    latitude: -33.9461,
    baro_altitude: 12005,
    geo_altitude: 12100,
    on_ground: false,
    velocity: 251,
    true_track: 48,
    vertical_rate: 5,
    last_contact: Math.floor(Date.now() / 1000) - 18,
    updated_at: new Date().toISOString(),
  },
];

