interface AuditReport {
  url: string;
  aeoScore: number;
  geoScore: number;
  hasSitemap: boolean;
  hasLlmsTxt: boolean;
  blockedFromIndexing: boolean;
  blockedFromSnippets: boolean;
  categories: Record<string, { score: number }>;
  recommendations: { priority: "P0" | "P1"; title: string; detail: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  crawlerAccess: "Crawler Access",
  metaHygiene: "Meta Hygiene",
  structuredData: "Structured Data",
  contentQuality: "Content Quality",
  eeat: "E-E-A-T Signals",
  entityClarity: "Entity Clarity",
  sitemap: "Sitemap",
};

const CATEGORY_ORDER = [
  "crawlerAccess",
  "metaHygiene",
  "structuredData",
  "contentQuality",
  "eeat",
  "entityClarity",
  "sitemap",
];

const PASS_THRESHOLD = 60;

function mapRecommendationToCategory(title: string): string | null {
  if (/author attribution|publish \/ update date/i.test(title)) return "eeat";
  if (/faqpage|organization structured data/i.test(title)) return "structuredData";
  if (/blockquote|question-style heading|tl;dr/i.test(title)) return "contentQuality";
  if (/about page/i.test(title)) return "entityClarity";
  if (/is blocked$/i.test(title)) return "crawlerAccess";
  if (/sitemap\.xml/i.test(title)) return "sitemap";
  return null; // noindex/nosnippet and anything unmapped surface in the blocking banner or a
  // general fallback list, not attached to a specific row.
}

function verdictLine(report: AuditReport): string {
  if (report.blockedFromIndexing) {
    return "Not visible at all — noindex is blocking this page entirely.";
  }
  const avg = (report.aeoScore + report.geoScore) / 2;
  if (avg >= 80) return "Strong AI visibility across the board.";
  if (avg >= 60) return "Mostly discoverable, with some visibility gaps.";
  if (avg >= 40) return "Significant visibility gaps found.";
  return "Largely invisible to AI systems.";
}

function setProgressBar(el: HTMLElement, score: number): void {
  el.style.width = `${score}%`;
  el.dataset.status = score >= PASS_THRESHOLD ? "pass" : "fail";
}

/** Recommendation text is shown without its [P0]/[P1] tag — the flagged
 * row's icon and "Needs attention" label already carry that signal. */
function renderRecommendation(rec: AuditReport["recommendations"][number]): HTMLParagraphElement {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${rec.title}</strong> — ${rec.detail}`;
  return p;
}

function renderDataRows(container: HTMLElement, report: AuditReport): void {
  container.innerHTML = "";

  const scoresByCategory: Record<string, number> = {
    ...Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, v.score])),
    sitemap: report.hasSitemap ? 100 : 0,
  };

  const recsByCategory = new Map<string, typeof report.recommendations>();
  for (const rec of report.recommendations) {
    const cat = mapRecommendationToCategory(rec.title);
    if (!cat) continue;
    if (!recsByCategory.has(cat)) recsByCategory.set(cat, []);
    recsByCategory.get(cat)!.push(rec);
  }

  for (const key of CATEGORY_ORDER) {
    const score = scoresByCategory[key];
    if (score === undefined) continue;
    const passed = score >= PASS_THRESHOLD;

    const row = document.createElement("div");
    row.className = "data-row";

    const label = document.createElement("span");
    label.className = "data-row__label";

    const icon = document.createElement("span");
    icon.className = "data-row__icon";
    icon.dataset.status = passed ? "pass" : "fail";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = passed ? "✓" : "!";

    label.append(icon, document.createTextNode(CATEGORY_LABELS[key] ?? key));

    const value = document.createElement("span");
    value.className = "data-row__value";
    value.textContent = `${score}/100${passed ? "" : " · Needs attention"}`;

    row.append(label, value);
    container.appendChild(row);

    const recs = recsByCategory.get(key);
    if (!passed && recs?.length) {
      const detail = document.createElement("div");
      detail.className = "data-row__detail";
      for (const rec of recs) detail.appendChild(renderRecommendation(rec));
      container.appendChild(detail);
    }
  }

  // Recommendations that don't map to a specific row (currently: none by design —
  // noindex/nosnippet surface in the blocking banner instead) fall back here so
  // nothing is silently dropped if the mapping ever misses something.
  const unmapped = report.recommendations.filter((r) => !mapRecommendationToCategory(r.title));
  if (unmapped.length) {
    const fallback = document.createElement("div");
    fallback.className = "data-row__detail";
    const heading = document.createElement("p");
    heading.innerHTML = "<strong>Other findings</strong>";
    fallback.appendChild(heading);
    for (const rec of unmapped) fallback.appendChild(renderRecommendation(rec));
    container.appendChild(fallback);
  }
}

async function runAudit(targetUrl: string): Promise<void> {
  const loadingState = document.getElementById("loading-state");
  const loadingUrl = document.getElementById("loading-url");
  const errorState = document.getElementById("error-state");
  const errorMessage = document.getElementById("error-message");
  const dashboard = document.getElementById("dashboard");
  const verdictEl = document.getElementById("verdict-line");
  const aeoScoreEl = document.getElementById("aeo-score");
  const geoScoreEl = document.getElementById("geo-score");
  const aeoBar = document.getElementById("aeo-bar");
  const geoBar = document.getElementById("geo-bar");
  const dataRows = document.getElementById("lab-rows");
  const blockedBanner = document.getElementById("blocked-banner");

  if (
    !loadingState ||
    !errorState ||
    !errorMessage ||
    !dashboard ||
    !verdictEl ||
    !aeoScoreEl ||
    !geoScoreEl ||
    !aeoBar ||
    !geoBar ||
    !dataRows ||
    !blockedBanner
  ) {
    return;
  }

  if (loadingUrl) loadingUrl.textContent = targetUrl;

  try {
    const response = await fetch(`/api/audit?url=${encodeURIComponent(targetUrl)}`);
    const data: AuditReport | { error: string } = await response.json();

    if (!response.ok || "error" in data) {
      loadingState.hidden = true;
      errorState.hidden = false;
      errorMessage.textContent = "error" in data ? data.error : "Something went wrong.";
      return;
    }

    verdictEl.textContent = verdictLine(data);
    aeoScoreEl.textContent = String(data.aeoScore);
    geoScoreEl.textContent = String(data.geoScore);
    setProgressBar(aeoBar, data.aeoScore);
    setProgressBar(geoBar, data.geoScore);

    if (data.blockedFromIndexing) {
      blockedBanner.hidden = false;
      blockedBanner.textContent =
        "noindex detected — this page is excluded from Google Search and AI features entirely.";
    } else if (data.blockedFromSnippets) {
      blockedBanner.hidden = false;
      blockedBanner.textContent =
        "nosnippet detected — this page can't appear in any snippet, including AI Overviews/AI Mode.";
    } else {
      blockedBanner.hidden = true;
    }

    renderDataRows(dataRows, data);
    loadingState.hidden = true;
    dashboard.hidden = false;
  } catch {
    loadingState.hidden = true;
    errorState.hidden = false;
    errorMessage.textContent = "Network error running the audit.";
  }
}

function init(): void {
  const errorState = document.getElementById("error-state");
  const errorMessage = document.getElementById("error-message");
  const loadingState = document.getElementById("loading-state");

  const targetUrl = new URLSearchParams(window.location.search).get("url");
  if (!targetUrl) {
    if (loadingState) loadingState.hidden = true;
    if (errorState && errorMessage) {
      errorState.hidden = false;
      errorMessage.textContent = "No URL provided — go back and enter one.";
    }
    return;
  }

  void runAudit(targetUrl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
