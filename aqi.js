const STORAGE_KEY = "openweather_api_key";
function getApiKey() {
  return (localStorage.getItem(STORAGE_KEY) || "").trim();
}

// State/UT -> cities (keep this list small/curated; OpenWeather will resolve coordinates)
const INDIA_STATE_CITIES = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh"],
  Bihar: ["Patna", "Gaya", "Bhagalpur"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Durg"],
  Goa: ["Panaji", "Margao"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Dharamshala"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"],
  Uttarakhand: ["Dehradun", "Haridwar", "Haldwani"],
  "West Bengal": ["Kolkata", "Siliguri", "Durgapur", "Asansol"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa"],
  Delhi: ["New Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh"],
  Lakshadweep: ["Kavaratti"],
  Puducherry: ["Puducherry"]
};

const stateSelect = document.getElementById("stateSelect");
const citySelect = document.getElementById("citySelect");
const fetchBtn = document.getElementById("fetchAqiBtn");

const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const clearKeyBtn = document.getElementById("clearKeyBtn");

const placeholderEl = document.getElementById("aqiPlaceholder");
const errorEl = document.getElementById("aqiError");
const resultEl = document.getElementById("aqiResult");
const pillEl = document.getElementById("aqiPill");
const titleEl = document.getElementById("aqiTitle");
const metaEl = document.getElementById("aqiMeta");
const pollutantsEl = document.getElementById("pollutants");

function setError(message) {
  if (!message) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
    return;
  }
  errorEl.style.display = "block";
  errorEl.textContent = message;
}

function setLoading(isLoading) {
  fetchBtn.disabled = isLoading || citySelect.disabled || !citySelect.value;
  fetchBtn.textContent = isLoading ? "Fetching..." : "Show AQI";
}

function aqiInfo(openWeatherAqiIndex) {
  // OpenWeather AQI scale: 1..5 (good..very poor)
  const map = {
    1: { label: "Good", cls: "aqi-good" },
    2: { label: "Fair", cls: "aqi-fair" },
    3: { label: "Moderate", cls: "aqi-moderate" },
    4: { label: "Poor", cls: "aqi-poor" },
    5: { label: "Very Poor", cls: "aqi-very-poor" }
  };
  return map[openWeatherAqiIndex] || { label: "Unknown", cls: "aqi-unknown" };
}

function fmt(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function renderPollutants(components) {
  const order = [
    ["pm2_5", "PM2.5"],
    ["pm10", "PM10"],
    ["no2", "NO₂"],
    ["o3", "O₃"],
    ["so2", "SO₂"],
    ["co", "CO"],
    ["nh3", "NH₃"]
  ];
  pollutantsEl.innerHTML = order
    .map(([key, label]) => {
      const val = components?.[key];
      return `<div class="pollutant">
        <div class="pollutant-label">${label}</div>
        <div class="pollutant-value">${fmt(val)} <span class="unit">µg/m³</span></div>
      </div>`;
    })
    .join("");
}

async function geoToLatLon({ city, state }) {
  const apiKey = getApiKey();
  const q = encodeURIComponent(`${city}, ${state}, IN`);
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("City not found by OpenWeather.");
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

async function fetchAirQuality({ lat, lon }) {
  const apiKey = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AQI fetch failed (${res.status})`);
  const data = await res.json();
  const first = data?.list?.[0];
  if (!first?.main?.aqi) throw new Error("AQI data unavailable for this location.");
  return first;
}

async function onFetchAqi() {
  setError("");
  placeholderEl.style.display = "none";
  resultEl.style.display = "none";

  if (!getApiKey()) {
    placeholderEl.style.display = "block";
    setError("Missing OpenWeather API key. Paste it above and click “Save Key”.");
    return;
  }

  const state = stateSelect.value;
  const city = citySelect.value;
  if (!state || !city) return;

  setLoading(true);
  try {
    const { lat, lon, name } = await geoToLatLon({ city, state });
    const air = await fetchAirQuality({ lat, lon });

    const idx = air.main.aqi;
    const info = aqiInfo(idx);
    pillEl.className = `aqi-pill ${info.cls}`;
    pillEl.textContent = `AQI ${idx}`;
    titleEl.textContent = info.label;

    const ts = air.dt ? new Date(air.dt * 1000) : null;
    const when = ts ? ts.toLocaleString() : "—";
    metaEl.textContent = `${name}, ${state} • Updated ${when}`;

    renderPollutants(air.components);
    resultEl.style.display = "block";
  } catch (e) {
    placeholderEl.style.display = "block";
    setError(e?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

function populateStates() {
  const states = Object.keys(INDIA_STATE_CITIES).sort((a, b) => a.localeCompare(b));
  stateSelect.innerHTML = `<option value="">Select state / UT</option>${states
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("")}`;
  citySelect.innerHTML = `<option value="">Select city</option>`;
  citySelect.disabled = true;
  fetchBtn.disabled = true;
}

function populateCitiesForState(state) {
  const cities = INDIA_STATE_CITIES[state] || [];
  citySelect.innerHTML = `<option value="">Select city</option>${cities
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("")}`;
  citySelect.disabled = cities.length === 0;
  fetchBtn.disabled = true;
  placeholderEl.style.display = "block";
  resultEl.style.display = "none";
  setError("");
}

stateSelect.addEventListener("change", () => {
  populateCitiesForState(stateSelect.value);
});

citySelect.addEventListener("change", () => {
  fetchBtn.disabled = citySelect.disabled || !citySelect.value;
  placeholderEl.style.display = "block";
  resultEl.style.display = "none";
  setError("");
});

fetchBtn.addEventListener("click", onFetchAqi);

function syncKeyUi() {
  const key = getApiKey();
  apiKeyInput.value = key ? "••••••••••••••••" : "";
}

saveKeyBtn.addEventListener("click", () => {
  const raw = (apiKeyInput.value || "").trim();
  if (!raw || raw.includes("•")) {
    setError("Paste your real API key, then click “Save Key”.");
    return;
  }
  localStorage.setItem(STORAGE_KEY, raw);
  setError("");
  syncKeyUi();
});

clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  apiKeyInput.value = "";
  setError("");
  placeholderEl.style.display = "block";
  resultEl.style.display = "none";
});

populateStates();
syncKeyUi();

