#AI Survey Response Analyzer
Cloud-native survey tool and feedback analyzer built with Next.js, TypeScript,Stripe, Clerk, PostHog, and Sentry. 
Designed to collect user responses directly from websites and automaticallygenerate clear, action-oriented summaries using integrated AI analysis.Processes user feedback through automated data pipelines including structured
response aggregation, sentiment evaluation, and AI-driven summarization.
User authentication is managed safely via Clerk, monetization is handled via
Stripe billing pipelines, and the entire platform is deployed to Vercel.
---
##Features
- AI-powered automated response summarization
- Dynamic, customizable survey creation and deployment
- Complete user authentication and session sync via Clerk
- Tiered web-billing and subscription management via Stripe
- Full telemetry and user event tracking using PostHogComprehensive exception tracking and monitoring with Sentry
- Scalable, API-first route handling architecture
---
##Architecture
```text
Client (Browser)
   │
   ▼
Next.js App Router (Vercel)
   │
   ├── Core Components & Custom UI (Tailwind)
   │
   ├── Clerk (Auth & Webhook Processing)
   │
   ├── Stripe (Subscription Billing Webhooks)
   │
   └── Analytics & Telemetry (PostHog & Sentry)
```
---
##Engineering Challenges
- Synced real-time authentication records securely via Clerk backend webhooks
- Processed critical asynchronous event streams safely with Stripe webhook verification
- Dynamic path routing optimization for custom survey asset generation (survey/[surveyId])Normalized dynamic, high-throughput text data to serve reliable, structured AI summaries
- Configured modular layouts, analytics wrappers, and global error boundaries natively at the edge
---
##API Overview
###Submit Survey Response
```http
POST /api/surveys/[surveyId]
```
---
**Authentication:** Clerk Session Token
**Content-Type:** application/json
Sync Billing State
```http
POST /api/stripe/webhooks
```
**Authentication:** Stripe Signature HeaderListens to asynchronous invoice events and handles provisioning or de-provisioning user tier states.
---
##Architecture App Map
| Route | Module Description |
|---------|-------------|
| `(auth)` | Secure user registration |
| `authentication` | Session gating |
| `dashboard` | Core workspace showing overall active metrics, forms, and results |
| `survey/[surveyId]` | Dynamically targeted consumer-facing interactive data collection points |
| `api/cron` | Programmatic automated maintenance schedules or summary generation engines |
---
##Requirements
- Node.js (v18.x or newer)
- npm / yarn / pnpm
- Clerk Account Credentials
- Stripe Account Credentials
---
##Installation
###Project Setup
###Clone the repository and navigate into the folder
cd AISummaryOfSurveyResponses

### Install the necessary production and development dependencies
npm install
Verify the installation:Bashnode --version
npm --version
ConfigurationUpdate your root project directory .env.local file:Code snippet# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

### Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_signing_secret

### App Environment Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
