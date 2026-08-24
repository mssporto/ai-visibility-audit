// One-off build helper: rasterizes public/og-image.png from the approved
// isologo lockup. Not part of the build pipeline (no og-image dependency on
// user-submitted data), run manually whenever the brand lockup changes.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const logoSvg = readFileSync(`${root}/src/assets/isologo-horizontal.svg`, "utf8");

// Strip the lockup's own white background rect so it composites onto ours.
const logoMarkup = logoSvg
  .replace(/<rect width="1000" height="300" fill="white"\/>\n?/, "")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_WIDTH = 720;
const LOGO_HEIGHT = (LOGO_WIDTH / 1000) * 300;
const logoX = (WIDTH - LOGO_WIDTH) / 2;
const logoY = HEIGHT / 2 - LOGO_HEIGHT / 2 - 40;

const canvas = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ebebeb" />
  <g transform="translate(${logoX}, ${logoY}) scale(${LOGO_WIDTH / 1000})">
    ${logoMarkup}
  </g>
  <text x="${WIDTH / 2}" y="${logoY + LOGO_HEIGHT + 64}" text-anchor="middle"
        font-family="Menlo, Consolas, monospace" font-size="24" fill="#1f1d1e">
    Free AEO + GEO visibility audit. Paste a URL, get your score.
  </text>
</svg>
`;

await sharp(Buffer.from(canvas)).png().toFile(`${root}/public/og-image.png`);
console.log("Wrote public/og-image.png");
