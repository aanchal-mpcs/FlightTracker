import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  OPENSKY_CLIENT_ID,
  OPENSKY_CLIENT_SECRET,
  OPENSKY_POLL_INTERVAL_MS = "15000",
  OPENSKY_BOUNDS = "-90,-180,90,180",
  OPENSKY_REQUEST_TIMEOUT_MS = "20000",
  OPENSKY_MAX_RETRIES = "3",
} = process.env;

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const hasOpenSkyConfig = Boolean(OPENSKY_CLIENT_ID && OPENSKY_CLIENT_SECRET);

const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function parseBounds(value) {
  const [lamin, lomin, lamax, lomax] = value.split(",").map(Number);
  return { lamin, lomin, lamax, lomax };
}

function buildStatesUrl() {
  const { lamin, lomin, lamax, lomax } = parseBounds(OPENSKY_BOUNDS);
  const search = new URLSearchParams({
    lamin: String(lamin),
    lomin: String(lomin),
    lamax: String(lamax),
    lomax: String(lomax),
  });

  return `https://opensky-network.org/api/states/all?${search.toString()}`;
}

function normalizeStateVector(state) {
  return {
    icao24: state[0],
    callsign: state[1]?.trim() || null,
    origin_country: state[2] ?? null,
    time_position: state[3] ?? null,
    last_contact: state[4] ?? null,
    longitude: state[5] ?? null,
    latitude: state[6] ?? null,
    baro_altitude: state[7] ?? null,
    on_ground: state[8] ?? null,
    velocity: state[9] ?? null,
    true_track: state[10] ?? null,
    vertical_rate: state[11] ?? null,
    geo_altitude: state[13] ?? null,
    squawk: state[14] ?? null,
    spi: state[15] ?? null,
    position_source: state[16] ?? null,
    updated_at: new Date().toISOString(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = Number(OPENSKY_REQUEST_TIMEOUT_MS);
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(url, {
    ...options,
    signal,
  });
}

async function withRetries(task, label) {
  const maxRetries = Number(OPENSKY_MAX_RETRIES);
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const backoffMs = attempt * 2000;
      console.warn(`[worker] ${label} failed on attempt ${attempt}/${maxRetries}; retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

async function getOpenSkyAccessToken() {
  if (!hasOpenSkyConfig) {
    throw new Error("Missing OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET");
  }

  const response = await withRetries(
    () =>
      fetchWithTimeout(
        "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: OPENSKY_CLIENT_ID,
            client_secret: OPENSKY_CLIENT_SECRET,
          }),
        },
      ),
    "OpenSky token request",
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenSky token request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("OpenSky token response did not include access_token");
  }

  return payload.access_token;
}

async function fetchOpenSkyStates() {
  const token = await getOpenSkyAccessToken();
  const response = await withRetries(
    () =>
      fetchWithTimeout(buildStatesUrl(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    "OpenSky states request",
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenSky request failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function syncAircraftStates() {
  if (!supabase) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const payload = await fetchOpenSkyStates();
  const normalizedStates = (payload.states ?? [])
    .map(normalizeStateVector)
    .filter((state) => state.latitude != null && state.longitude != null);

  if (!normalizedStates.length) {
    console.log(`[worker] No aircraft state vectors returned at ${new Date().toISOString()}`);
    return;
  }

  const { error } = await supabase.from("aircraft_states").upsert(normalizedStates, {
    onConflict: "icao24",
  });

  if (error) {
    throw error;
  }

  console.log(`[worker] Upserted ${normalizedStates.length} aircraft rows`);
}

async function run() {
  try {
    if (!hasSupabaseConfig || !hasOpenSkyConfig) {
      console.warn("[worker] Waiting for missing environment variables before syncing aircraft states");
    } else {
      await syncAircraftStates();
    }
  } catch (error) {
    console.error("[worker] sync failed", error);
  } finally {
    setTimeout(run, Number(OPENSKY_POLL_INTERVAL_MS));
  }
}

run();
