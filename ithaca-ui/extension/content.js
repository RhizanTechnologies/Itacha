// Ithaca Content Script - Live Stance Ingestion & Visual Badges
(function () {
  "use strict";

  // Prevent multiple injections
  if (document.getElementById("ithaca-debate-pill-container")) return;

  function extractPaperMetadata() {
    const metaDoi =
      document
        .querySelector('meta[name="citation_doi"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="dc.identifier"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="bepress_citation_doi"]')
        ?.getAttribute("content");

    const metaTitle =
      document
        .querySelector('meta[name="citation_title"]')
        ?.getAttribute("content") ||
      document.querySelector('meta[name="dc.title"]')?.getAttribute("content");

    let doi = metaDoi || null;
    let title = metaTitle || null;

    // Domain-specific extraction fallbacks
    const hostname = window.location.hostname;
    if (hostname.includes("arxiv.org")) {
      const arxivMatch = window.location.pathname.match(
        /\/abs\/([0-9]+\.[0-9]+)/,
      );
      if (arxivMatch) {
        doi = `10.48550/arXiv.${arxivMatch[1]}`;
      }
      if (!title) {
        const titleEl = document.querySelector(".title");
        if (titleEl) {
          title = titleEl.textContent.replace(/^Title:\s*/i, "").trim();
        }
      }
    } else if (hostname.includes("pubmed")) {
      const doiEl = document.querySelector(
        ".citation-doi, .identifier.doi .id-link",
      );
      if (doiEl && !doi) {
        doi = doiEl.textContent.trim().replace(/^doi:\s*/i, "");
      }
      if (!title) {
        const heading = document.querySelector(".heading-title");
        if (heading) title = heading.textContent.trim();
      }
    } else if (hostname.includes("nature.com")) {
      if (!title) {
        const titleEl = document.querySelector("h1.c-article-title");
        if (titleEl) title = titleEl.textContent.trim();
      }
    }

    return { doi, title };
  }

  function injectBadge(data, canonicalBase) {
    if (!data) return;

    const container = document.createElement("div");
    container.id = "ithaca-debate-pill-container";
    container.className = "ithaca-badge-root";

    const isSovereign = data.isSovereignIndex;
    const exploreUrl = data.canonicalUrl?.startsWith("http")
      ? data.canonicalUrl
      : `${canonicalBase || "http://localhost:3000"}${data.canonicalUrl || "/explore"}`;

    container.innerHTML = `
      <a href="${exploreUrl}" target="_blank" rel="noopener noreferrer" class="ithaca-badge-link" title="Explore Argumentation Stance Matrix on Ithaca">
        <div class="ithaca-badge-inner">
          <span class="ithaca-brand-logo">🏛️ Ithaca</span>
          ${
            isSovereign
              ? `<span class="ithaca-sovereign-tag">🏛️ ${data.institutionName || "Verified Archive"}</span>`
              : ""
          }
          <div class="ithaca-stance-pill-group">
            <span class="ithaca-pill ithaca-pill-support" title="${data.supports || 0} Supporting Citations">
              <span class="ithaca-dot dot-green"></span> ${data.supports || 0}
            </span>
            <span class="ithaca-pill ithaca-pill-contradict" title="${data.contradicts || 0} Contradicting / Disputing Citations">
              <span class="ithaca-dot dot-red"></span> ${data.contradicts || 0}
            </span>
            <span class="ithaca-pill ithaca-pill-extend" title="${data.extends || 0} Methodological Extensions">
              <span class="ithaca-dot dot-purple"></span> ${data.extends || 0}
            </span>
          </div>
          <span class="ithaca-badge-cta">Explore Graph &rarr;</span>
        </div>
      </a>
    `;

    document.body.appendChild(container);
  }

  const { doi, title } = extractPaperMetadata();
  if (!doi && !title) return;

  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_METADATA") {
        sendResponse({ doi, title });
      }
    });
  }

  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(
      { type: "GET_BADGE", doi, title },
      (response) => {
        if (response && response.success && response.data) {
          injectBadge(response.data, response.apiBase);
        }
      },
    );
  } else {
    // Direct fetch fallback in test/mock environments
    const fallbackBase =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://ithaca.rhizan.com";
    fetch(
      `${fallbackBase}/api/research/extension-badge?${doi ? `doi=${encodeURIComponent(doi)}` : `title=${encodeURIComponent(title)}`}`,
    )
      .then((res) => res.json())
      .then((data) => injectBadge(data, fallbackBase))
      .catch(() => {});
  }
})();
