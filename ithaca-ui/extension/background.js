// Ithaca Extension - Service Worker (Manifest V3)
const DEFAULT_API_BASE = "http://localhost:3000";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory fallback for testing / non-extension runtimes
const memoryCache = new Map();

async function getStorageSession() {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    return chrome.storage.session;
  }
  return null;
}

async function getCachedBadge(cacheKey) {
  const session = await getStorageSession();
  if (session) {
    const key = `badge:${cacheKey}`;
    const result = await session.get([key]);
    const item = result[key];
    if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
      return item;
    }
  } else {
    const item = memoryCache.get(cacheKey);
    if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
      return item;
    }
  }
  return null;
}

async function setCachedBadge(cacheKey, data, apiBase) {
  const session = await getStorageSession();
  const entry = { timestamp: Date.now(), data, apiBase };
  if (session) {
    await session.set({ [`badge:${cacheKey}`]: entry });
  }
  memoryCache.set(cacheKey, entry);
}

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

async function getActiveBase(preferredBase) {
  const session = await getStorageSession();
  if (session) {
    const res = await session.get(["activeApiBase"]);
    if (res.activeApiBase) return res.activeApiBase;
  }
  return preferredBase;
}

async function setActiveBase(base) {
  const session = await getStorageSession();
  if (session) {
    await session.set({ activeApiBase: base });
  }
}

async function probeEndpoint(base, doi, title, timeoutMs = 2000) {
  const url = new URL("/api/research/extension-badge", base);
  if (doi) url.searchParams.set("doi", doi);
  if (title) url.searchParams.set("title", title);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { base, data };
    }
    throw new Error(`HTTP ${response.status} from ${base}`);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchBadgeData(doi, title) {
  const cacheKey = (doi || title || "").toLowerCase();
  const cached = await getCachedBadge(cacheKey);
  if (cached) {
    return cached.data;
  }

  const preferredBase = await getApiBase();
  const activeBase = await getActiveBase(preferredBase);

  // 1. Try active / preferred base first
  try {
    const result = await probeEndpoint(activeBase, doi, title, 2500);
    await setCachedBadge(cacheKey, result.data, result.base);
    return result.data;
  } catch (primaryErr) {
    // 2. Fast concurrent race across alternative candidate bases
    const candidates = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://ithaca.rhizan.com",
    ].filter((b) => b !== activeBase);

    try {
      const winning = await Promise.any(
        candidates.map((candidate) =>
          probeEndpoint(candidate, doi, title, 2000),
        ),
      );
      await setActiveBase(winning.base);
      await setCachedBadge(cacheKey, winning.data, winning.base);
      return winning.data;
    } catch {
      throw new Error(
        `Failed to reach Ithaca API at ${activeBase} and candidate fallback endpoints.`,
      );
    }
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_BADGE") {
      getApiBase().then(async (preferredBase) => {
        try {
          const data = await fetchBadgeData(message.doi, message.title);
          const cacheKey = (message.doi || message.title || "").toLowerCase();
          const cached = await getCachedBadge(cacheKey);
          const apiBase = cached?.apiBase || preferredBase || DEFAULT_API_BASE;
          sendResponse({ success: true, data, apiBase });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      });
      return true; // Keep message channel open for async response
    }
  });
}

// Export for Node/testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchBadgeData,
    memoryCache,
    DEFAULT_API_BASE,
    getCachedBadge,
    setCachedBadge,
  };
}
