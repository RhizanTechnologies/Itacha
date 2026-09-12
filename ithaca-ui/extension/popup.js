// Ithaca Extension Popup Logic
document.addEventListener("DOMContentLoaded", async () => {
  const titleEl = document.getElementById("paper-title");
  const supportEl = document.getElementById("count-support");
  const contradictEl = document.getElementById("count-contradict");
  const extendEl = document.getElementById("count-extend");
  const sovereignEl = document.getElementById("badge-sovereign");
  const exploreBtn = document.getElementById("btn-explore");
  const btnSettings = document.getElementById("btn-settings");
  const disputeCard = document.getElementById("dispute-preview-card");
  const disputeQuote = document.getElementById("dispute-quote");

  if (btnSettings) {
    btnSettings.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
        window.open(chrome.runtime.getURL("options.html"));
      }
    });
  }

  if (typeof chrome === "undefined" || !chrome.tabs) {
    titleEl.textContent = "Ithaca Active Tab Inspector";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    titleEl.textContent = "No active academic article detected.";
    return;
  }

  function parseAcademicUrl(url) {
    // arXiv (abstract or PDF)
    const arxivMatch = url.match(
      /arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+)(?:\.pdf)?/i,
    );
    if (arxivMatch) {
      return { doi: `10.48550/arXiv.${arxivMatch[1]}`, title: null };
    }

    // Nature articles
    const natureMatch = url.match(/nature\.com\/articles\/([a-zA-Z0-9._-]+)/i);
    if (natureMatch) {
      return { doi: `10.1038/${natureMatch[1]}`, title: null };
    }

    // Google Scholar query fallback
    if (url.includes("scholar.google")) {
      const qMatch = url.match(/[?&]q=([^&]+)/);
      if (qMatch) {
        return {
          doi: null,
          title: decodeURIComponent(qMatch[1].replace(/\+/g, " ")),
        };
      }
    }

    return null;
  }

  // Query background worker for current tab paper data
  chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_METADATA" }, (meta) => {
    if (chrome.runtime.lastError || !meta) {
      // Direct URL fallback (handles arXiv PDFs, Nature, etc.)
      const parsed = parseAcademicUrl(tab.url);
      if (parsed && (parsed.doi || parsed.title)) {
        fetchBadge(parsed.doi, parsed.title);
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
          if (response?.error) {
            titleEl.textContent = `Backend connection error (${response.error}). Ensure local server is running on localhost:3000.`;
          } else {
            titleEl.textContent = "No debate recorded yet for this paper.";
          }
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

        if (disputeCard && disputeQuote) {
          if (data.topDisputeSnippet && (data.contradicts || 0) > 0) {
            disputeQuote.textContent = `"${data.topDisputeSnippet}"`;
            disputeCard.style.display = "block";
          } else {
            disputeCard.style.display = "none";
          }
        }

        if (data.canonicalUrl) {
          const apiBase = response.apiBase || "http://localhost:3000";
          const fullUrl = data.canonicalUrl.startsWith("http")
            ? data.canonicalUrl
            : `${apiBase}${data.canonicalUrl}`;
          exploreBtn.href = fullUrl;
        }
      },
    );
  }
});
