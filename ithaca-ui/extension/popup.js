// Ithaca Extension Popup Logic
document.addEventListener("DOMContentLoaded", async () => {
  const titleEl = document.getElementById("paper-title");
  const supportEl = document.getElementById("count-support");
  const contradictEl = document.getElementById("count-contradict");
  const extendEl = document.getElementById("count-extend");
  const sovereignEl = document.getElementById("badge-sovereign");
  const exploreBtn = document.getElementById("btn-explore");

  if (typeof chrome === "undefined" || !chrome.tabs) {
    titleEl.textContent = "Ithaca Active Tab Inspector";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    titleEl.textContent = "No active academic article detected.";
    return;
  }

  // Query background worker for current tab paper data
  chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_METADATA" }, (meta) => {
    if (chrome.runtime.lastError || !meta) {
      // Fallback: extract from tab URL if arXiv
      const arxivMatch = tab.url.match(/arxiv\.org\/abs\/([0-9]+\.[0-9]+)/);
      const doi = arxivMatch ? `10.48550/arXiv.${arxivMatch[1]}` : null;
      if (doi) {
        fetchBadge(doi, null);
      } else {
        titleEl.textContent =
          "Navigate to an arXiv, PubMed, or Nature article to view stances.";
      }
      return;
    }
    fetchBadge(meta.doi, meta.title);
  });

  function fetchBadge(doi, title) {
    chrome.runtime.sendMessage(
      { type: "GET_BADGE", doi, title },
      (response) => {
        if (!response || !response.success || !response.data) {
          titleEl.textContent = "No debate recorded yet for this paper.";
          return;
        }

        const data = response.data;
        titleEl.textContent = data.title || doi || "Academic Article";
        supportEl.textContent = data.supports || 0;
        contradictEl.textContent = data.contradicts || 0;
        extendEl.textContent = data.extends || 0;

        if (data.isSovereignIndex) {
          sovereignEl.style.display = "inline-block";
        }

        if (data.canonicalUrl) {
          const fullUrl = data.canonicalUrl.startsWith("http")
            ? data.canonicalUrl
            : `http://localhost:3000${data.canonicalUrl}`;
          exploreBtn.href = fullUrl;
        }
      },
    );
  }
});
