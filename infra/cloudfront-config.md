# CloudFront Distribution Configuration

This document describes the recommended CloudFront distribution settings for serving the UV Tattoo Tracker app.

## Origin

| Setting | Value |
|---|---|
| Origin domain | `YOUR_BUCKET_NAME.s3-website-YOUR_REGION.amazonaws.com` |
| Origin type | S3 static website endpoint (HTTP, not S3 REST endpoint) |
| Protocol | HTTP only (CloudFront handles HTTPS termination) |

> **Note:** Use the S3 *website* endpoint (e.g. `bucket.s3-website-us-east-1.amazonaws.com`), not the S3 REST endpoint. This ensures S3 serves `index.html` as the root document correctly.

## Default Root Object

```
index.html
```

## Viewer Protocol Policy (HTTPS Redirect)

Set **Viewer Protocol Policy** to `Redirect HTTP to HTTPS` on the default cache behavior. This enforces HTTPS for all traffic (Requirement 7.3).

## Cache Behavior (Default)

| Setting | Value |
|---|---|
| Path pattern | `*` (default) |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Allowed HTTP methods | GET, HEAD |
| Cache policy | CachingOptimized (AWS managed) |

## Custom Error Responses (SPA Routing)

Configure a custom error response so that 404s are handled gracefully by the app (good practice for single-page applications):

| HTTP error code | Response page path | HTTP response code |
|---|---|---|
| 404 | `/index.html` | 200 |

## Price Class

Use **PriceClass_100** — serves from edge locations in the US, Canada, and Europe. This is the cheapest option and qualifies for AWS Free Tier usage.

## HTTPS / SSL Certificate

Use the default **CloudFront certificate** (`*.cloudfront.net`) for the free CloudFront domain. If a custom domain is configured via Route 53 (Requirement 7.4), request a certificate through **AWS Certificate Manager (ACM)** in the `us-east-1` region and attach it to the distribution.

## Summary of Key Settings

| Setting | Value |
|---|---|
| Origin | S3 website endpoint |
| Default root object | `index.html` |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Custom error (404) | `/index.html` with 200 |
| Price class | PriceClass_100 |
| SSL certificate | Default CloudFront cert (or ACM for custom domain) |
