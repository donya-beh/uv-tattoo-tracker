# ☀️ UV Tattoo Tracker

A web app built for people with fresh tattoos who want to know when it's safe to go outside without covering up.

## What it does

You type in any location — a city, zip code, or address — and the app instantly shows you the current UV index for that location along with a plain-English recommendation on whether your tattoo needs protection.

UV data refreshes automatically every 30 minutes so you always have an up-to-date reading without needing to reload the page.

## What it shows

- **Current UV index** — the real-time UV level for your searched location, color-coded by severity (green for low, yellow for moderate, orange for high, red for very high, violet for extreme)
- **Severity label** — Low / Moderate / High / Very High / Extreme based on the WHO UV scale
- **Tattoo recommendation** — a single clear line telling you either:
  - "UV is low — safe to go outside without covering your tattoo."
  - "UV is moderate to extreme — cover your tattoo before going outside."
- **Local time** — the current time at the searched location with timezone

## Live app

[https://dz7n0r078z997.cloudfront.net](https://dz7n0r078z997.cloudfront.net)

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript — no framework, no build step
- [currentuvindex.com](https://currentuvindex.com) — free, keyless UV index API
- [Open-Meteo Geocoding API](https://open-meteo.com) — free, keyless location search
- Hosted on AWS S3 + CloudFront

