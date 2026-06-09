# assets/

Brand + coin art for the site.

## Coins (the "Attios")
- `coin.png` (bronze), `coin-gold.png`, `coin-silver.png` - the full-resolution **masters**.
- `coin-{gold,silver,bronze}-sm.png` / `-lg.png` - web-sized versions the site actually loads (small for the leaderboard + hauls, large for the lightbox). Regenerate from the masters with the trim+resize step in the project history if you swap the art.

## Logo
- `coin-logo.png` - a small coin used as the header logo (generated from `coin.png`).
- The wordmark beside it ("The Daily Socrattio") is **Manrope**, the closest free match to Attio's geometric type. If `coin-logo.png` is missing, a faithful Attio-style SVG mark stands in.

## Favicons
- `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png` (coin), wired up in both pages + `site.webmanifest`.
