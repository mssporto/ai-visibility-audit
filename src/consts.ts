/** Site name. Used in page titles and meta tags. */
export const SITE_NAME = "AI Visibility Audit";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
	"A free, instant AEO + GEO visibility audit — paste a URL, get your score.";
/** Canonical origin. Resolves canonical URLs and social images in BaseHead. */
export const SITE_URL = "https://ai-visibility-audit.dahiana.work";
/** BCP 47 locale tag used to format dates and numbers. */
export const SITE_LOCALE = "en-US";
/**
 * Routes kept out of search results. Each is served with a
 * `robots: noindex, nofollow` tag via BaseHead.
 *
 * Surrounding slashes are optional: `"/thanks"`, `"thanks"` and `"/thanks/"`
 * all match the same route.
 */
export const NOINDEX_ROUTES: string[] = [];
