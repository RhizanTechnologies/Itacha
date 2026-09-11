// Ithaca Extension - Service Worker (Manifest V3)
const DEFAULT_API_BASE = "http://localhost:3000";
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

  const preferredBase = await getApiBase();
  const candidateBases = [preferredBase];
  if (!candidateBases.includes("http://localhost:3000")) {
    candidateBases.push("http://localhost:3000");
  }
  if (!candidateBases.includes("http://127.0.0.1:3000")) {
    candidateBases.push("http://127.0.0.1:3000");
  }
  if (!candidateBases.includes("https://ithaca.rhizan.com")) {
    candidateBases.push("https://ithaca.rhizan.com");
  }

  let lastError = null;
  for (const base of candidateBases) {
    try {
      const url = new URL("/api/research/extension-badge", base);
      if (doi) url.searchParams.set("doi", doi);
      if (title) url.searchParams.set("title", title);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        memoryCache.set(cacheKey, {
          timestamp: Date.now(),
          data,
          apiBase: base,
        });
        return data;
      } else {
        lastError = new Error(`HTTP ${response.status} from ${base}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error("Failed to fetch badge from all API candidate endpoints")
  );
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_BADGE") {
      getApiBase().then((preferredBase) => {
        fetchBadgeData(message.doi, message.title)
          .then((data) => {
            const cacheKey = (message.doi || message.title || "").toLowerCase();
            const cached = memoryCache.get(cacheKey);
            const apiBase =
              cached?.apiBase || preferredBase || DEFAULT_API_BASE;
            sendResponse({ success: true, data, apiBase });
          })
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
