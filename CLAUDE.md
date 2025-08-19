# BuzzLine Project - Marketing Communication Platform

## Project Overview
BuzzLine is a marketing communication platform that wraps Twilio SMS and Mailgun email APIs to send unified marketing campaigns. It's designed as an internal tool and B2B service for managing multi-channel marketing communications.

## Core Features (MVP)
1. **Organization-based multi-tenancy** - Each user belongs to an organization
2. **Campaign management** - Create, edit, send, and track campaigns
3. **Contact management** - CSV upload with field mapping
4. **Unified messaging** - Send both SMS and email from one campaign
5. **Basic analytics** - Track sent, delivered, opened, clicked rates
6. **Compliance** - Handle opt-outs, STOP responses (Twilio built-in)

## Data Models
- **Organization**: Multi-tenant container
- **User**: Clerk-authenticated users tied to organizations
- **ContactList**: Groups of contacts for campaigns
- **Contact**: Individual recipients with metadata (name, email, phone, industry-specific data)
- **Campaign**: Marketing campaigns with email/SMS templates
- **CampaignDelivery**: Individual delivery tracking records
- **CampaignAnalytics**: Aggregated campaign performance metrics

## Key Integrations
- **Clerk**: Authentication with organization support
- **CSV Parser**: Contact list uploads with field mapping

## Environment Variables
```
CLERK_PUBLISHABLE_KEY=pk_test_ZGVlcC1tb3NxdWl0by02MC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_4Cj9U7ewdXZjElwfNxa39rMFzuUVrND4HeNLWSdaVP
TWILIO_ACCOUNT_SID=AC47a352bf4dc3265e74e1bb481fb8a845
TWILIO_AUTH_TOKEN=ffdb404cded3ada739ac80d555ddc086
EMAILING_ENDPOINT=bm-emailing-middleware.benchmetrics.workers.dev
SMS_ENDPOINT=bm-benchmetrics-sms-service.benchmetrics.workers.dev
```

## Compliance Requirements
- **North American (USA/Canada)** compliance
- **Email**: Opt-out links in templates pointing to opt-out forms
- **SMS**: Twilio's built-in STOP response handling
- **Data**: Store opt-out preferences per contact

## Notes
- Focus on MVP over feature-rich version for faster testing
- Users will provide their own Twilio/Mailgun credentials
- CSV template will be provided for contact uploads
- Industry-specific metadata fields for contacts (e.g., automotive: make, model, year)
- Organization-scoped data access for multi-tenancy


# Cloudflare Pages Configuration
name = "buzzline"
compatibility_date = "2024-10-15"
pages_build_output_dir = "./build/client"
compatibility_flags = ["nodejs_compat"]

# KV Namespaces for Pages
[[kv_namespaces]]
binding = "BUZZLINE_MAIN"
id = "365db24eb7d647acb6e3fc39d38acd25"
preview_id = "fa6543997a044e459690a1798bff62be"

[[kv_namespaces]]
binding = "BUZZLINE_ANALYTICS"
id = "45f26618ca3042ee8c90df3ac3b5ff2b"
preview_id = "0c5d091149a74d4bbac8941b678a6caa"

[[kv_namespaces]]
binding = "BUZZLINE_CACHE"
id = "951b33a733c446378409d0825256c060"
preview_id = "9082b80ad91d4e5f9b2da6a086871817"