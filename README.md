# UV Tattoo Tracker

A static web app that lets you search any location and instantly see the current UV index, an hourly UV distribution chart for the day, and a plain-English recommendation on whether to cover your tattoo before heading outside. UV data refreshes automatically every 30 minutes. No API keys required — the app calls the free [Open-Meteo](https://open-meteo.com) UV and geocoding APIs directly from the browser.

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with appropriate credentials
- [Node.js](https://nodejs.org) (v18+) — only needed to run tests locally

## Deployment

### 1. Create an S3 bucket with static website hosting

```bash
aws s3 mb s3://YOUR_BUCKET_NAME --region YOUR_REGION

aws s3 website s3://YOUR_BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

### 2. Apply the bucket policy

```bash
aws s3api put-bucket-policy \
  --bucket YOUR_BUCKET_NAME \
  --policy file://infra/s3-bucket-policy.json
```

> Replace `YOUR_BUCKET_NAME` inside `infra/s3-bucket-policy.json` with your actual bucket name before running this command.

### 3. Upload the app files

```bash
aws s3 sync . s3://YOUR_BUCKET_NAME \
  --exclude ".*" \
  --exclude "node_modules/*" \
  --exclude "tests/*" \
  --exclude "infra/*" \
  --exclude "*.md" \
  --include "index.html" \
  --include "app.js" \
  --include "style.css"
```

### 4. Create a CloudFront distribution

Follow the settings described in [`infra/cloudfront-config.md`](infra/cloudfront-config.md) to create a CloudFront distribution pointing to the S3 website endpoint. Key settings:

- Origin: `YOUR_BUCKET_NAME.s3-website-YOUR_REGION.amazonaws.com`
- Default root object: `index.html`
- Viewer protocol policy: Redirect HTTP to HTTPS
- Price class: PriceClass_100

### 5. Invalidate the CloudFront cache after updates

After re-uploading files, invalidate the cache so users get the latest version:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Running Tests Locally

```bash
npm install && npm test
```

## AWS Free Tier Notes

- **S3**: 5 GB storage, 20,000 GET requests, and 2,000 PUT requests per month free for 12 months.
- **CloudFront**: 1 TB data transfer out and 10,000,000 HTTP/HTTPS requests per month free for 12 months.
- This app makes no server-side API calls — all UV and geocoding requests go directly from the browser to Open-Meteo, so there are no Lambda or API Gateway costs.
- After the free tier period, costs for a low-traffic static site like this are typically a few cents per month.
