import type { AuditReport, Recommendation } from "@/lib/score";
import {
	CATEGORY_CONTENT,
	CONTENT_SIGNAL_CONTENT,
	LLMS_TXT_CONTENT,
	VIEWPORT_CONTENT,
	type CategoryContent,
	type CategoryLink,
} from "@/lib/category-content";

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
	return null;
}

function verdictLine(report: AuditReport): string {
	if (report.blockedFromIndexing) {
		return "Not visible at all: noindex is blocking this page entirely.";
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

/** Recommendation text is shown without its [P0]/[P1] tag: the flagged
 * row's icon and "Needs attention" label already carry that signal. */
function renderRecommendation(rec: Recommendation): HTMLParagraphElement {
	const p = document.createElement("p");
	p.className = "category-body__text";
	p.innerHTML = `<strong>${rec.title}:</strong> ${rec.detail}`;
	return p;
}

/** A concrete, plain-language fact for the "What we found" list — backs
 * each category's explanation with actual evidence, not just its score. */
interface Fact {
	label: string;
	ok: boolean;
}

function factsFor(key: string, report: AuditReport): Fact[] {
	switch (key) {
		case "crawlerAccess":
			return report.categories.crawlerAccess.bots.map((bot) => ({
				label: bot.label,
				ok: bot.allowed,
			}));
		case "metaHygiene": {
			const d = report.categories.metaHygiene;
			const descLen = d.description?.length ?? 0;
			return [
				{ label: "Page title", ok: !!d.title },
				{
					label: "Meta description (50–160 characters)",
					ok: descLen >= 50 && descLen <= 160,
				},
				{ label: "Canonical URL", ok: !!d.canonical },
				{ label: `Exactly one <h1> (found ${d.h1Count})`, ok: d.h1Count === 1 },
			];
		}
		case "structuredData": {
			const d = report.categories.structuredData;
			return [
				{ label: "Any structured data present", ok: d.typesFound.length > 0 },
				{ label: "Organization markup", ok: d.hasOrganization },
				{ label: "Article / BlogPosting markup", ok: d.hasArticle },
				{ label: "FAQPage markup", ok: d.hasFaqPage },
				{ label: "sameAs links to other profiles", ok: d.hasSameAs },
			];
		}
		case "contentQuality": {
			const d = report.categories.contentQuality;
			return [
				{ label: "Concrete numbers or stats", ok: d.hasNumbers },
				{ label: "Quoted material", ok: d.hasBlockquote },
				{ label: "Outbound citations", ok: d.hasOutboundLinks },
				{ label: "Multiple subheadings", ok: d.hasMultipleH2 },
				{ label: "A list or table", ok: d.hasListOrTable },
				{ label: "A question-style heading", ok: d.hasQuestionHeading },
				{ label: "A TL;DR / summary section", ok: d.hasTldrHeading },
			];
		}
		case "eeat": {
			const d = report.categories.eeat;
			return [
				{ label: "Author byline", ok: d.hasAuthor },
				{ label: "Publish / update date", ok: d.hasPublishDate },
				{ label: "Outbound citations", ok: d.hasOutboundCitations },
			];
		}
		case "entityClarity": {
			const d = report.categories.entityClarity;
			return [
				{ label: "Brand name in title", ok: d.brandInTitle },
				{ label: "About section", ok: d.hasAboutPage },
				{ label: "Known-entity profile links", ok: d.hasKnownEntityLinks },
			];
		}
		case "sitemap":
			return [{ label: "sitemap.xml found", ok: report.hasSitemap }];
		default:
			return [];
	}
}

function renderFacts(facts: Fact[]): HTMLUListElement {
	const ul = document.createElement("ul");
	ul.className = "category-facts";
	for (const fact of facts) {
		const li = document.createElement("li");
		li.className = "category-facts__item";
		const mark = document.createElement("span");
		mark.className = "category-facts__mark";
		mark.dataset.status = fact.ok ? "pass" : "fail";
		mark.setAttribute("aria-hidden", "true");
		mark.textContent = fact.ok ? "✓" : "✕";
		li.append(mark, document.createTextNode(fact.label));
		ul.appendChild(li);
	}
	return ul;
}

function renderSources(links: CategoryLink[]): HTMLUListElement {
	const ul = document.createElement("ul");
	ul.className = "category-sources";
	for (const link of links) {
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.href = link.url;
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		a.textContent = link.label;
		li.appendChild(a);
		ul.appendChild(li);
	}
	return ul;
}

function renderSubheading(text: string): HTMLParagraphElement {
	const p = document.createElement("p");
	p.className = "category-body__subheading";
	p.textContent = text;
	return p;
}

function renderCategorySummary(
	label: string,
	score: number | null,
	passed: boolean,
	valueText: string,
): HTMLElement {
	const summary = document.createElement("summary");
	summary.className = "category-summary";

	const labelSpan = document.createElement("span");
	labelSpan.className = "category-summary__label";
	const icon = document.createElement("span");
	icon.className = "category-summary__icon";
	icon.dataset.status = score === null ? "info" : passed ? "pass" : "fail";
	icon.setAttribute("aria-hidden", "true");
	icon.textContent = score === null ? "•" : passed ? "✓" : "!";
	labelSpan.append(icon, document.createTextNode(label));

	const value = document.createElement("span");
	value.className = "category-summary__value";
	value.textContent = valueText;

	const chevron = document.createElement("span");
	chevron.className = "category-summary__chevron";
	chevron.setAttribute("aria-hidden", "true");

	summary.append(labelSpan, value, chevron);
	return summary;
}

function renderCategoryRow(
	key: string,
	score: number,
	report: AuditReport,
	recs: Recommendation[] | undefined,
): HTMLDetailsElement {
	const passed = score >= PASS_THRESHOLD;
	const content = CATEGORY_CONTENT[key];
	const label = content?.label ?? CATEGORY_LABELS[key] ?? key;

	const details = document.createElement("details");
	details.className = "category-row";
	details.appendChild(
		renderCategorySummary(
			label,
			score,
			passed,
			`${score}/100${passed ? "" : " · Needs attention"}`,
		),
	);

	const body = document.createElement("div");
	body.className = "category-body";

	if (content) {
		const what = document.createElement("p");
		what.className = "category-body__text";
		what.innerHTML = `<strong>What this checks:</strong> ${content.what}`;
		const why = document.createElement("p");
		why.className = "category-body__text";
		why.innerHTML = `<strong>Why it matters:</strong> ${content.why}`;
		body.append(what, why);
	}

	const facts = factsFor(key, report);
	if (facts.length) {
		body.append(renderSubheading("What we found"), renderFacts(facts));
	}

	if (!passed && recs?.length) {
		body.appendChild(renderSubheading("How to fix it"));
		for (const rec of recs) body.appendChild(renderRecommendation(rec));
	}

	if (content?.links.length) {
		body.append(renderSubheading("Sources"), renderSources(content.links));
	}

	details.appendChild(body);
	return details;
}

function renderCategoryRows(container: HTMLElement, report: AuditReport): void {
	container.innerHTML = "";

	const scoresByCategory: Record<string, number> = {
		...Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, v.score])),
		sitemap: report.hasSitemap ? 100 : 0,
	};

	const recsByCategory = new Map<string, Recommendation[]>();
	for (const rec of report.recommendations) {
		const cat = mapRecommendationToCategory(rec.title);
		if (!cat) continue;
		if (!recsByCategory.has(cat)) recsByCategory.set(cat, []);
		recsByCategory.get(cat)!.push(rec);
	}

	for (const key of CATEGORY_ORDER) {
		const score = scoresByCategory[key];
		if (score === undefined) continue;
		container.appendChild(renderCategoryRow(key, score, report, recsByCategory.get(key)));
	}

	// Anything mapRecommendationToCategory doesn't map falls back here, so
	// nothing is silently dropped.
	const unmapped = report.recommendations.filter((r) => !mapRecommendationToCategory(r.title));
	if (unmapped.length) {
		const fallback = document.createElement("div");
		fallback.className = "category-body category-body--fallback";
		fallback.appendChild(renderSubheading("Other findings"));
		for (const rec of unmapped) fallback.appendChild(renderRecommendation(rec));
		container.appendChild(fallback);
	}
}

/** A row for a signal that's shown for awareness but doesn't affect either
 * score, e.g. llms.txt, the viewport tag, or the Content-Signal directive.
 * See each CATEGORY_CONTENT entry's `why` for the specific reason it isn't
 * scored: they aren't all the same reason. */
function renderInfoRow(content: CategoryContent, statusText: string): HTMLDetailsElement {
	const details = document.createElement("details");
	details.className = "category-row";
	details.appendChild(renderCategorySummary(content.label, null, false, statusText));

	const body = document.createElement("div");
	body.className = "category-body";
	const what = document.createElement("p");
	what.className = "category-body__text";
	what.innerHTML = `<strong>What this checks:</strong> ${content.what}`;
	const why = document.createElement("p");
	why.className = "category-body__text";
	why.innerHTML = `<strong>Why it's shown anyway:</strong> ${content.why}`;
	body.append(what, why, renderSubheading("Sources"), renderSources(content.links));
	details.appendChild(body);

	return details;
}

function renderAlsoChecked(container: HTMLElement, report: AuditReport): void {
	container.innerHTML = "";

	container.appendChild(
		renderInfoRow(
			LLMS_TXT_CONTENT,
			report.hasLlmsTxt ? "Found · not scored" : "Not found · not scored",
		),
	);
	container.appendChild(
		renderInfoRow(
			VIEWPORT_CONTENT,
			report.hasViewport ? "Found · not scored" : "Not found · not scored",
		),
	);
	container.appendChild(
		renderInfoRow(
			CONTENT_SIGNAL_CONTENT,
			report.contentSignal.found
				? `${report.contentSignal.raw} · not scored`
				: "Not found · not scored",
		),
	);
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
	const categoryRows = document.getElementById("category-rows");
	const alsoCheckedRows = document.getElementById("also-checked-rows");
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
		!categoryRows ||
		!alsoCheckedRows ||
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
				"noindex detected: this page is excluded from Google Search and AI features entirely.";
		} else if (data.blockedFromSnippets) {
			blockedBanner.hidden = false;
			blockedBanner.textContent =
				"nosnippet detected: this page can't appear in any snippet, including AI Overviews/AI Mode.";
		} else {
			blockedBanner.hidden = true;
		}

		renderCategoryRows(categoryRows, data);
		renderAlsoChecked(alsoCheckedRows, data);
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
			errorMessage.textContent = "No URL provided. Go back and enter one.";
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
