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
- **Today's UV forecast chart** — an hourly line chart showing UV levels from sunrise to sunset, so you can plan ahead and pick the safest window to head outside

## Live app

[https://dz7n0r078z997.cloudfront.net](https://dz7n0r078z997.cloudfront.net)

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript — no framework, no build step
- [currentuvindex.com](https://currentuvindex.com) — free, keyless UV index API
- [Open-Meteo Geocoding API](https://open-meteo.com) — free, keyless location search
- [sunrise-sunset.org](https://sunrise-sunset.org/api) — free, keyless sunrise/sunset times
- [Chart.js](https://www.chartjs.org) — UV forecast chart
- Hosted on AWS S3 + CloudFront

## Deployment

### 1. Create S3 bucket with static website hosting

```bash
aws s3 mb s3://YOUR_BUCKET_NAME --region YOUR_REGION
aws s3 website s3://YOUR_BUCKET_NAME --index-document index.html --error-document index.html
```

### 2. Apply the bucket policy

```bash
aws s3api put-bucket-policy \
  --bucket YOUR_BUCKET_NAME \
  --policy file://infra/s3-bucket-policy.json
```

### 3. Upload app files

```bash
aws s3 cp index.html s3://YOUR_BUCKET_NAME/ --content-type "text/html"
aws s3 cp app.js s3://YOUR_BUCKET_NAME/ --content-type "application/javascript"
aws s3 cp style.css s3://YOUR_BUCKET_NAME/ --content-type "text/css"
```

### 4. Create a CloudFront distribution

See [`infra/cloudfront-config.md`](infra/cloudfront-config.md) for settings.

### 5. Invalidate cache after updates

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Running tests locally

```bash
npm install && npm test
```

Or with Python (no Node required):

```bash
python3 tests/logic_test.py
```
