# BuzzLine Project - Marketing Communication Platform

## Project Overview
BuzzLine is a marketing communication platform that wraps Twilio SMS and Mailgun email APIs to send unified marketing campaigns. It's designed as an internal tool and B2B service for managing multi-channel marketing communications.

## Tech Stack
- **Frontend**: Remix + React + TypeScript + Tailwind CSS
- **Database**: SQLite (development) → Cloudflare KV/D1 (production)
- **Authentication**: Clerk (with organizations)
- **Integrations**: Twilio SMS + Mailgun Email
- **Monorepo**: npm workspaces
- **State Management**: Built-in Remix

## Project Structure
```
buzzline/
├── package.json (workspace root)
├── apps/
│   └── web/ (Remix frontend)
└── packages/
    ├── database/ (Prisma schemas)
    ├── integrations/ (Twilio/Mailgun)
    └── types/ (shared TypeScript types)
```

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
- **Twilio**: SMS sending with built-in STOP handling
- **Mailgun**: Email sending with tracking (opens, clicks, bounces)
- **CSV Parser**: Contact list uploads with field mapping

## Environment Variables
```
DATABASE_URL="file:./dev.db"
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain.com
MAILGUN_FROM_EMAIL=noreply@your_domain.com
```

## Compliance Requirements
- **North American (USA/Canada)** compliance
- **Email**: Opt-out links in templates pointing to opt-out forms
- **SMS**: Twilio's built-in STOP response handling
- **Data**: Store opt-out preferences per contact

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
cd packages/database
npx prisma generate
npx prisma db push
npx prisma studio

# Type checking
npm run type-check

# Linting
npm run lint
```

## Current Progress
✅ Monorepo structure with npm workspaces
✅ Remix app with TypeScript and Tailwind CSS  
✅ Core data models and Prisma schema
🔄 Database setup (in progress)
⏳ Clerk authentication configuration
⏳ Campaign management UI
⏳ CSV upload functionality
⏳ Twilio/Mailgun integrations
⏳ Analytics and tracking
⏳ Compliance features

## Next Steps
1. Complete database setup and migrations
2. Configure Clerk authentication with organizations
3. Build basic campaign CRUD UI
4. Implement CSV contact upload
5. Set up Twilio and Mailgun integrations
6. Create unified campaign sending functionality
7. Add analytics dashboard
8. Implement compliance features (opt-outs)

## Notes
- Focus on MVP over feature-rich version for faster testing
- Users will provide their own Twilio/Mailgun credentials
- CSV template will be provided for contact uploads
- Industry-specific metadata fields for contacts (e.g., automotive: make, model, year)
- Organization-scoped data access for multi-tenancy