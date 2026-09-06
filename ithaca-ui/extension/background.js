// Ithaca Extension - Service Worker (Manifest V3)
const DEFAULT_API_BASE = "https://ithaca.rhizan.com";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const memoryCache = new Map();

async function getApiBase() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE }, (items) => {
        resolve(items.apiBase || DEFAULT_API_BASE);
      });
    } else {
      resolve(DEFAULT_API_BASE);
    }
  });
}

async function fetchBadgeData(doi, title) {
  const cacheKey = (doi || title || "").toLowerCase();
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiBase = await getApiBase();
  const url = new URL("/api/research/extension-badge", apiBase);
  if (doi) url.searchParams.set("doi", doi);
  if (title) url.searchParams.set("title", title);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch badge: HTTP ${response.status}`);
  }

  const data = await response.json();
  memoryCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_BADGE") {
      getApiBase().then((apiBase) => {
        fetchBadgeData(message.doi, message.title)
          .then((data) => sendResponse({ success: true, data, apiBase }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
      });
      return true; // Keep message channel open for async response
    }
  });
}

// Export for Node/testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { fetchBadgeData, memoryCache, DEFAULT_API_BASE };
}
