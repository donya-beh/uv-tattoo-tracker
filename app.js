// UV Tattoo Tracker — app logic

const UV_CATEGORIES = [
  { max: 2,        label: "Low",       color: "#4caf50" },
  { max: 5,        label: "Moderate",  color: "#ffeb3b" },
  { max: 7,        label: "High",      color: "#ff9800" },
  { max: 10,       label: "Very High", color: "#f44336" },
  { max: Infinity, label: "Extreme",   color: "#9c27b0" },
];

/**
 * Returns the UV severity category for a given UV index value.
 * @param {number} uvIndex - A UV index value in the range [0, ∞)
 * @returns {{ label: string, color: string }}
 */
function getUVCategory(uvIndex) {
  const category = UV_CATEGORIES.find((c) => uvIndex <= c.max);
  return { label: category.label, color: category.color };
}

/**
 * Returns the current UV index for the given timezone from hourly data.
 * @param {{ time: string[], uv_index: number[] }} hourlyData
 * @param {string} timezone - IANA timezone string e.g. "Europe/London"
 * @returns {number}
 */
/**
 * Returns the current UV index from uvData.
 * With currentuvindex.com, this is simply uvData.now.uvi.
 * @param {{ now: {uvi:number}, forecast: {time:string,uvi:number}[] }} uvData
 * @returns {number}
 */
function getCurrentUVIndex(uvData) {
  return uvData.now.uvi;
}

/**
 * Returns the current local time for the given timezone.
 * @param {string} timezone - IANA timezone string e.g. "America/New_York"
 * @returns {string} Formatted as "H:MM AM/PM TZ" e.g. "2:30 PM EST"
 */
function getLocalTime(timezone) {
  const now = new Date();
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const hour = timeParts.find((p) => p.type === "hour").value;
  const minute = timeParts.find((p) => p.type === "minute").value;
  const dayPeriod = timeParts.find((p) => p.type === "dayPeriod").value;

  const tzAbbr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName").value;

  return `${hour}:${minute} ${dayPeriod} ${tzAbbr}`;
}

/**
 * Returns a tattoo care recommendation based on the current UV index.
 * @param {number} uvIndex - A UV index value
 * @returns {string}
 */
function getTattooRecommendation(uvIndex) {
  if (uvIndex <= 2) {
    return "UV is low — safe to go outside without covering your tattoo.";
  }
  return "UV is moderate to extreme — cover your tattoo before going outside.";
}

/**
 * Fetches sunrise and sunset times for the given coordinates (today).
 * Uses sunrise-sunset.org free API (no key required).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ sunrise: Date, sunset: Date }|null>}
 */
async function fetchSunriseSunset(lat, lon) {
  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
    );
    if (!response.ok) throw new Error("Sunrise API failed");
    const data = await response.json();
    if (data.status !== "OK") throw new Error("Sunrise API error");
    return {
      sunrise: new Date(data.results.sunrise),
      sunset: new Date(data.results.sunset),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Searches for a location by name using the Open-Meteo Geocoding API.
 * @param {string} query - Location name to search for
 * @returns {Promise<{ name: string, lat: number, lon: number, timezone: string, country: string }>}
 */
async function searchLocation(query) {
  let response;
  try {
    response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
  } catch (e) {
    const err = new Error("Geocoding network error");
    err.type = "GEOCODING_ERROR";
    throw err;
  }

  if (!response.ok) {
    const err = new Error("Geocoding request failed");
    err.type = "GEOCODING_ERROR";
    throw err;
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    const err = new Error("Location not found");
    err.type = "LOCATION_NOT_FOUND";
    throw err;
  }

  const { name, latitude: lat, longitude: lon, timezone, country } = data.results[0];
  return { name, lat, lon, timezone, country };
}

/**
 * Fetches hourly UV index data for the given coordinates and timezone.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} timezone - IANA timezone string e.g. "Europe/London"
 * @returns {Promise<{ hourly: { time: string[], uv_index: number[] }, timezone: string }>}
 */
/**
 * Fetches UV data from currentuvindex.com for the given coordinates.
 * Returns { now: {time, uvi}, forecast: [{time, uvi}], timezone }
 * @param {number} lat
 * @param {number} lon
 * @param {string} timezone - IANA timezone string (used for display only)
 * @returns {Promise<{ now: {time:string, uvi:number}, forecast: {time:string, uvi:number}[], timezone: string }>}
 */
async function fetchUVData(lat, lon, timezone) {
  let response;
  try {
    response = await fetch(
      `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lon}`
    );
  } catch (e) {
    const err = new Error("UV API network error");
    err.type = "UV_API_ERROR";
    throw err;
  }

  if (!response.ok) {
    const err = new Error("UV API request failed");
    err.type = "UV_API_ERROR";
    throw err;
  }

  const data = await response.json();

  if (!data.ok) {
    const err = new Error(data.message || "UV API error");
    err.type = "UV_API_ERROR";
    throw err;
  }

  if (!data.forecast || data.forecast.length === 0) {
    const err = new Error("Hourly UV data is not available for this location.");
    err.type = "UV_DATA_UNAVAILABLE";
    throw err;
  }

  return { now: data.now, forecast: data.forecast, timezone };
}

/**
 * Displays an error message based on the error type.
 * AUTO_REFRESH_FAILED shows a soft inline notice; all others use #error-banner.
 * @param {string} type - One of LOCATION_NOT_FOUND | GEOCODING_ERROR | UV_API_ERROR | UV_DATA_UNAVAILABLE | AUTO_REFRESH_FAILED
 * @param {*} [context] - Optional context (unused, reserved for future use)
 */
function handleError(type, context) {
  const messages = {
    LOCATION_NOT_FOUND:   "Location not found. Please try a different search.",
    GEOCODING_ERROR:      "Unable to resolve location. Please try again.",
    UV_API_ERROR:         "Unable to retrieve UV data — the service may be busy. Please try again in a moment.",
    UV_DATA_UNAVAILABLE:  "Hourly UV data is not available for this location.",
    AUTO_REFRESH_FAILED:  "Auto-refresh failed. Showing last known data.",
  };

  const message = messages[type] || "An unexpected error occurred.";

  if (type === "AUTO_REFRESH_FAILED") {
    // Non-blocking inline notice — use a dedicated element if present, else append to #location-display
    let notice = document.getElementById("refresh-notice");
    if (!notice) {
      const locationDisplay = document.getElementById("location-display");
      if (locationDisplay) {
        notice = document.createElement("span");
        notice.id = "refresh-notice";
        locationDisplay.appendChild(notice);
      }
    }
    if (notice) {
      notice.textContent = message;
    }
  } else {
    const banner = document.getElementById("error-banner");
    if (banner) {
      banner.textContent = message;
      banner.classList.remove("hidden");
    }
  }
}

/**
 * Orchestrates all display updates after a successful data fetch.
 * @param {{ name: string, lat: number, lon: number, timezone: string, country: string }} locationData
 * @param {{ hourly: { time: string[], uv_index: number[] }, timezone: string }} uvData
 */
function updateUI(locationData, uvData) {
  const currentUV = getCurrentUVIndex(uvData);
  const category = getUVCategory(currentUV);
  const localTime = getLocalTime(uvData.timezone);
  const recommendation = getTattooRecommendation(currentUV);

  // Populate location display
  const locationDisplay = document.getElementById("location-display");
  if (locationDisplay) {
    locationDisplay.textContent = `${locationData.name}, ${locationData.country} — ${localTime}`;
  }

  // Populate current UV index with color
  const uvValueEl = document.querySelector("#uv-current .uv-value");
  const uvLabelEl = document.querySelector("#uv-current .uv-label");
  if (uvValueEl) {
    uvValueEl.textContent = currentUV !== undefined ? currentUV.toFixed(1) : "--";
    uvValueEl.style.color = category.color;
  }
  if (uvLabelEl) {
    uvLabelEl.textContent = category.label;
  }

  // Populate recommendation with safe/cover class
  const recommendationEl = document.getElementById("recommendation");
  if (recommendationEl) {
    recommendationEl.textContent = recommendation;
    recommendationEl.classList.remove("safe", "cover");
    recommendationEl.classList.add(currentUV <= 2 ? "safe" : "cover");
  }

  // Reveal results
  const results = document.getElementById("results");
  if (results) {
    results.classList.remove("hidden");
  }

  // Clear error banner
  const errorBanner = document.getElementById("error-banner");
  if (errorBanner) {
    errorBanner.classList.add("hidden");
    errorBanner.textContent = "";
  }

  // Clear refresh notice
  const refreshNotice = document.getElementById("refresh-notice");
  if (refreshNotice) {
    refreshNotice.textContent = "";
  }
}

// Module-level state
let state = {
  location: null,
  uvData: null,
  currentUV: null,
  refreshTimer: null,
  lastUpdated: null,
};

/**
 * Starts (or restarts) a 30-minute auto-refresh interval.
 * Stores the timer handle in `state.refreshTimer`.
 * @param {number} lat
 * @param {number} lon
 * @param {string} timezone
 */
function startAutoRefresh(lat, lon, timezone) {
  if (state.refreshTimer !== null) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

  state.refreshTimer = setInterval(async () => {
    try {
      const uvData = await fetchUVData(lat, lon, timezone);
      state.uvData = uvData;
      state.currentUV = getCurrentUVIndex(uvData);
      state.lastUpdated = new Date();
      updateUI(state.location, uvData);
    } catch (err) {
      handleError("AUTO_REFRESH_FAILED");
    }
  }, 30 * 60 * 1000);
}

if (typeof module !== "undefined") module.exports = { UV_CATEGORIES, getUVCategory, getTattooRecommendation, getCurrentUVIndex, getLocalTime, fetchUVData, handleError, updateUI, startAutoRefresh, state };

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const query = document.getElementById("location-input").value.trim();
      if (!query) return;

      try {
        const locationData = await searchLocation(query);
        const uvData = await fetchUVData(locationData.lat, locationData.lon, locationData.timezone);

        state.location = locationData;
        state.uvData = uvData;
        state.currentUV = getCurrentUVIndex(uvData);
        state.lastUpdated = new Date();

        updateUI(locationData, uvData);
        startAutoRefresh(locationData.lat, locationData.lon, locationData.timezone);
      } catch (err) {
        handleError(err.type || "GEOCODING_ERROR");
      }
    });
  });
}
