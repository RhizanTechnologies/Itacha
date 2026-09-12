// Ithaca Content Script - Live Stance Ingestion & Visual Badges (Manifest V3)
(function () {
  "use strict";

  const ROOT_ID = "ithaca-extension-root";

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
        /\/(?:abs|pdf)\/([0-9]+\.[0-9]+)/,
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
    } else if (hostname.includes("scholar.google")) {
      const firstResult = document.querySelector(".gs_r.gs_or.gs_scl .gs_rt a");
      if (firstResult) {
        title = firstResult.textContent.trim();
      }
    }

    return { doi, title };
  }

  function createPill(type, dotClass, count, titleText) {
    const pill = document.createElement("span");
    pill.className = `ithaca-pill ithaca-pill-${type}`;
    pill.setAttribute("title", `${count} ${titleText}`);

    const dot = document.createElement("span");
    dot.className = `ithaca-dot ${dotClass}`;

    const textNode = document.createTextNode(` ${count}`);

    pill.append(dot, textNode);
    return pill;
  }

  function injectBadge(data, canonicalBase) {
    if (!data) return;

    let host = document.getElementById(ROOT_ID);
    if (host) {
      host.remove(); // Clean update on re-navigation
    }

    host = document.createElement("div");
    host.id = ROOT_ID;

    // Attach Open Shadow Root for complete style isolation
    const shadow = host.attachShadow({ mode: "open" });

    // Link stylesheet inside Shadow DOM
    const linkStyle = document.createElement("link");
    linkStyle.rel = "stylesheet";
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      linkStyle.href = chrome.runtime.getURL("content.css");
    } else {
      linkStyle.href = "/content.css";
    }
    shadow.appendChild(linkStyle);

    // Host position container
    const container = document.createElement("div");
    container.className = "ithaca-host-container";

    const isSovereign = data.isSovereignIndex;
    const rawCanonical = data.canonicalUrl || "/explore";
    const exploreUrl = rawCanonical.startsWith("http")
      ? rawCanonical
      : `${canonicalBase || "http://localhost:3000"}${rawCanonical}`;

    // Link wrapper
    const a = document.createElement("a");
    a.className = "ithaca-badge-link";
    if (exploreUrl.startsWith("http://") || exploreUrl.startsWith("https://")) {
      a.href = exploreUrl;
    } else {
      a.href = `http://localhost:3000${rawCanonical}`;
    }
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("title", "Explore Argumentation Stance Matrix on Ithaca");

    // Inner badge card
    const inner = document.createElement("div");
    inner.className = "ithaca-badge-inner";

    // Logo
    const logo = document.createElement("span");
    logo.className = "ithaca-brand-logo";
    logo.textContent = "🏛️ Ithaca";
    inner.appendChild(logo);

    // Sovereign Archive Tag
    if (isSovereign) {
      const sov = document.createElement("span");
      sov.className = "ithaca-sovereign-tag";
      sov.textContent = `🏛️ ${data.institutionName || "Verified Archive"}`;
      inner.appendChild(sov);
    }

    // Stance pill group
    const pillGroup = document.createElement("div");
    pillGroup.className = "ithaca-stance-pill-group";

    const pSupport = createPill(
      "support",
      "dot-green",
      data.supports || 0,
      "Supporting Citations",
    );
    const pContradict = createPill(
      "contradict",
      "dot-red",
      data.contradicts || 0,
      "Contradicting / Disputing Citations",
    );
    const pExtend = createPill(
      "extend",
      "dot-purple",
      data.extends || 0,
      "Methodological Extensions",
    );

    pillGroup.append(pSupport, pContradict, pExtend);
    inner.appendChild(pillGroup);

    // CTA
    const cta = document.createElement("span");
    cta.className = "ithaca-badge-cta";
    cta.textContent = "Explore Graph →";
    inner.appendChild(cta);

    a.appendChild(inner);
    container.appendChild(a);

    // Dispute Popover Preview
    if (data.topDisputeSnippet && (data.contradicts || 0) > 0) {
      const popover = document.createElement("div");
      popover.className = "ithaca-dispute-popover";

      const popHeader = document.createElement("div");
      popHeader.className = "ithaca-popover-header";
      popHeader.textContent = "⚠️ Top Disputed Finding";

      const popQuote = document.createElement("span");
      popQuote.className = "ithaca-popover-quote";
      popQuote.textContent = `"${data.topDisputeSnippet}"`;

      popover.append(popHeader, popQuote);
      container.appendChild(popover);

      // Hover triggers on the Contradict pill
      pContradict.addEventListener("mouseenter", () =>
        popover.classList.add("active"),
      );
      pContradict.addEventListener("mouseleave", () =>
        popover.classList.remove("active"),
      );
      container.addEventListener("mouseleave", () =>
        popover.classList.remove("active"),
      );
    }

    shadow.appendChild(container);
    document.body.appendChild(host);
  }

  function runLifecycle() {
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
  }

  // Initial load
  runLifecycle();

  // Lightweight SPA navigation observer
  let currentHref = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentHref) {
      currentHref = window.location.href;
      runLifecycle();
    }
  });
  observer.observe(document, { subtree: true, childList: true });
})();
