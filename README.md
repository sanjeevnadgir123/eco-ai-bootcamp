# ECO AI Bootcamp — Registration & Event Platform

An end-to-end full-stack web application and registration platform designed for the **ECO AI Bootcamp**, an intensive three-day hands-on artificial intelligence workshop organized by the Department of Electronics and Communication Engineering (ECE) at AGMRCET, Varur, in collaboration with Geminal Studio and OSCode Tech Community.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [ECO AI Bootcamp Background](#2-eco-ai-bootcamp-background)
3. [Organizing Department & Collaborators](#3-organizing-department--collaborators)
4. [Key Features](#4-key-features)
5. [Technology Stack](#5-technology-stack)
6. [Architecture Overview](#6-architecture-overview)
7. [Project Directory Structure](#7-project-directory-structure)
8. [Prerequisites](#8-prerequisites)
9. [Local Installation and Setup](#9-local-installation-and-setup)
10. [Environment Variable Configuration](#10-environment-variable-configuration)
11. [Neon PostgreSQL Setup](#11-neon-postgresql-setup)
12. [Database Schema and Migration](#12-database-schema-and-migration)
13. [Gmail SMTP and App Password Setup](#13-gmail-smtp-and-app-password-setup)
14. [Local Development Commands](#14-local-development-commands)
15. [Production Build and Start Commands](#15-production-build-and-start-commands)
16. [API Endpoint Documentation](#16-api-endpoint-documentation)
17. [Student Registration & OTP Verification Workflow](#17-student-registration--otp-verification-workflow)
18. [Payment, QR Code, UTR Submission & Admin Approval Workflow](#18-payment-qr-code-utr-submission--admin-approval-workflow)
19. [Testing Instructions](#19-testing-instructions)
20. [Troubleshooting Guide](#20-troubleshooting-guide)
21. [Vercel Frontend Deployment Instructions](#21-vercel-frontend-deployment-instructions)
22. [Google Cloud Run Backend Deployment Instructions](#22-google-cloud-run-backend-deployment-instructions)
23. [Connecting Vercel to Google Cloud Run](#23-connecting-vercel-to-google-cloud-run)
24. [Production Environment Variables & Secret Management](#24-production-environment-variables--secret-management)
25. [CORS, HTTPS, and Security Requirements](#25-cors-https-and-security-requirements)
26. [Deployment Checklist](#26-deployment-checklist)
27. [Contribution Guidelines](#27-contribution-guidelines)
28. [License Status](#28-license-status)

---

## 1. Project Overview

The **ECO AI Bootcamp Platform** is an enterprise-grade full-stack application built to manage student onboarding, multi-factor email verification, UPI payment collection, transaction verification, and administrative attendance approval for the ECO AI Bootcamp.

The application delivers a high-performance, responsive student portal paired with a secure serverless backend. Registrations are protected against fraud through cryptographic HMAC-SHA256 single-use OTP codes delivered via Gmail SMTP, server-side duplicate prevention for both email and bank UTR numbers, and manual administrative transaction reconciliation.

---

## 2. ECO AI Bootcamp Background

- **Dates:** October 22, 2026 – October 24, 2026 (3-Day Intensive Workshop)
- **Target Audience:** Engineering undergraduates, student developers, and AI enthusiasts.
- **Curriculum Outline:**
  - **Day 1 (Oct 22):** Foundations of Generative AI, LLM architectural fundamentals, AI Agent task planning, Google AI Studio API integration, VS Code environment setup, and interactive terminology challenges.
  - **Day 2 (Oct 23):** Prompt engineering frameworks, code generation with Google Antigravity, Google Stitch, end-to-end conversational AI agent development, and hands-on coding labs.
  - **Day 3 (Oct 24):** Student project presentation showcase, project debugging, version control best practices on GitHub, live cloud deployment on Vercel, and recognition awards for top demo projects.
- **Featured Speaker:** **Guneet Syan**, Software Development Engineer & Technical Community Manager at OSCode Tech Community.

---

## 3. Organizing Department & Collaborators

- **Host Institution:** **AGM Rural College of Engineering and Technology (AGMRCET)**, Varur, Hubli, Karnataka.
- **Organizing Department:** **Department of Electronics and Communication Engineering (ECE)**, led by Head of Department **Dr. Sumana Achar**.
- **Department Association:** **ECO Association** (Electronics & Communication Organization), coordinating student activities and departmental workshops.
- **Collaborating Partner:** **Geminal Studio**, creative AI and digital innovation studio providing curriculum consulting, design systems, and technical architecture.
- **Tech Community Partner:** **OSCode Tech Community** (AGMRCET Student Chapter), providing mentorship, workshop facilitation, and technical community outreach.

---

## 4. Key Features

- **Interactive Landing Experience:** Modern glassmorphic interface with particle background animations, speaker portfolio showcase, departmental event journey gallery, and detailed syllabus breakdown.
- **5-Step Onboarding Funnel:**
  1. *Student Information:* Full name, email, and 10-digit phone number with client and server-side validation.
  2. *OTP Email Verification:* Cryptographically secure 6-digit OTP dispatched to the student's email, featuring a 30-second resend cooldown timer and 10-minute expiry.
  3. *Payment QR Code Display:* Real-time UPI QR code display for the standard ₹200 participant fee tier.
  4. *UTR Transaction Submission:* Bank transaction reference submission (UTR) with instant duplicate validation against prior submissions.
  5. *Registration Confirmation:* Issue of a unique tracking ID (`ECO-AI-2026-XXXX`) with confetti celebration and clipboard copying.
- **Zero Raw OTP Persistence:** OTP codes are hashed with HMAC-SHA256 and salt before storage in Neon PostgreSQL; raw codes are never persisted or returned in API responses.
- **Rate Limiting & Abuse Defense:** IP-based and email-based rate limits protect the SMTP relay against abuse; strict single-use OTP consumption prevents replay attacks.
- **Coordinator Admin Dashboard:**
  - Secure login portal for official coordinators.
  - Live status cards showing total registrations, verified payments, pending reviews, and collected revenue.
  - Real-time search by student name, email, registration ID, or UTR number.
  - Filtering by payment status (`ALL`, `PENDING_VERIFICATION`, `APPROVED`, `REJECTED`).
  - One-click payment approval with automatic official confirmation and invitation email dispatch.
  - Payment rejection workflow with custom coordinator remarks dispatched directly to the student's inbox.
  - One-click CSV export for offline attendance tracking and official reporting.

---

## 5. Technology Stack

### Frontend
- **Framework:** React 19 (`react` & `react-dom` ^19.3.0)
- **Language:** TypeScript (~6.0.2)
- **Build Tool:** Vite (^8.3.0)
- **Styling:** TailwindCSS (^3.4.19), PostCSS, Autoprefixer
- **UI & Animation:** Lucide React icons (^1.56.0), Framer Motion (^14.2.0), Canvas Confetti (^1.9.4)

### Backend
- **Runtime:** Node.js (>= 22.0.0 with native `--experimental-strip-types`)
- **Server:** Node.js HTTP server (`server.js`) with custom modular route middleware (`src/server/neonHandler.ts`)
- **Email Service:** Nodemailer (^10.1.1) over Gmail SMTP (TLS/SSL on Port 465)
- **Database Driver:** `@neondatabase/serverless` (^1.2.0) over HTTP/WebSockets

### Database & Storage
- **Primary Database:** **Neon Serverless PostgreSQL** (PostgreSQL 16+)
- **Schema Management:** Dedicated SQL migration manifests (`neon_schema.sql`, `scripts/initNeon.mjs`)

### Hosting & Infrastructure Target
- **Frontend Hosting:** Vercel (Static Single Page Application)
- **Backend API Hosting:** Google Cloud Run (Containerized Docker microservice)
- **Containerization:** Multi-stage, non-root Alpine Linux Docker container

---

## 6. Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Client Browser"]
        SPA["Vercel SPA (React 19 + Vite)"]
    end

    subgraph Backend["Google Cloud Run (Node 22 / Express HTTP)"]
        API["REST API (/api/*)"]
        RateLimit["Rate Limiter & Validator"]
        AuthHandler["OTP & Verification Engine"]
        AdminHandler["Registration & Admin Handler"]
    end

    subgraph Database["Neon Serverless PostgreSQL"]
        RegTable[("registrations Table")]
        VerifTable[("email_verifications Table")]
    end

    subgraph External["External Services"]
        Gmail["Gmail SMTP (Port 465 SSL)"]
    end

    SPA -->|"HTTPS /api/* (Configurable Base URL)"| API
    API --> RateLimit
    RateLimit --> AuthHandler
    RateLimit --> AdminHandler
    AuthHandler -->|"Nodemailer TLS"| Gmail
    AuthHandler -->|"Parameterized SQL"| VerifTable
    AdminHandler -->|"Parameterized SQL"| RegTable
    AdminHandler -->|"Approval / Rejection Email"| Gmail
```

---

## 7. Project Directory Structure

```
eco-ai-bootcamp/
├── .dockerignore                  # Docker build exclusions
├── .env.example                   # Safe environment template with placeholders
├── .gitignore                     # Git exclusion rules (strictly ignores .env)
├── .npmrc                         # npm configuration
├── Dockerfile                     # Google Cloud Run production container build
├── index.html                     # HTML5 single page entry point
├── neon_schema.sql                # Complete Neon PostgreSQL schema and migrations
├── package.json                   # Dependencies and execution scripts
├── package-lock.json              # Deterministic dependency lockfile
├── postcss.config.js              # PostCSS configuration for Tailwind
├── server.js                      # Production Node.js HTTP server
├── supabase_schema.sql            # Optional/legacy Supabase RLS schema
├── tailwind.config.js             # Tailwind design tokens and theme extensions
├── tsconfig.json                  # TypeScript compiler options
├── vercel.json                    # Vercel SPA routing and build output configuration
├── vite.config.ts                 # Vite bundler configuration & local dev middleware
├── public/
│   ├── favicon.svg                # Application favicon
│   ├── icons.svg                  # SVG sprite definitions
│   └── payment-qr.png             # Official UPI payment QR code asset
├── scripts/
│   ├── check-db-schema.mjs        # Database schema inspection diagnostic script
│   ├── initNeon.mjs               # Neon database schema initialization & seeder
│   ├── migrate-email-verifications.mjs # Additive schema migration script
│   ├── test-otp-flow.mjs          # 12-point automated OTP & security test suite
│   └── test-smtp.mjs              # SMTP connection and credential validator
└── src/
    ├── App.tsx                    # Root React component and view routing
    ├── index.css                  # Global styles, fonts, and Tailwind directives
    ├── main.tsx                   # React DOM render entry point
    ├── vite-env.d.ts              # Vite environment type declarations
    ├── assets/                    # Static image and branding assets
    ├── components/
    │   ├── AdminDashboard.tsx     # Coordinator admin portal & review suite
    │   ├── AgendaSection.tsx      # 3-day curriculum timeline view
    │   ├── Footer.tsx             # Institutional footer & social links
    │   ├── HeroSection.tsx        # Hero banner with dynamic countdown
    │   ├── JourneySection.tsx     # Department milestones & event gallery
    │   ├── Navbar.tsx             # Navigation header with admin trigger
    │   ├── ParticleBackground.tsx # Interactive canvas particle constellation
    │   ├── PartnerLogos.tsx       # Partner & institutional badge cards
    │   ├── RegistrationFlow.tsx   # 5-step student registration workflow
    │   └── SpeakerSection.tsx     # Speaker profile & achievements
    ├── data/
    │   ├── bootcampAgenda.ts      # Structured 3-day curriculum data
    │   ├── ecoEvents.ts           # Past ECE/ECO department events data
    │   └── speakerData.ts         # Speaker biography and topic tags
    ├── server/
    │   ├── emailService.ts        # Nodemailer SMTP transporter & templates
    │   └── neonHandler.ts         # REST API router, rate limiting, and SQL queries
    ├── services/
    │   ├── authService.ts         # Coordinator session management
    │   ├── eligibilityService.ts  # Attendance eligibility verifier
    │   ├── emailVerificationService.ts # Client API bridge for OTP flows
    │   ├── neonService.ts         # Client API bridge for registrations
    │   └── supabaseClient.ts      # Optional Supabase client fallback
    ├── types/
    │   └── index.ts               # Shared TypeScript interfaces & types
    └── utils/
        └── csvExport.ts           # Client-side registration CSV generator
```

---

## 8. Prerequisites

Ensure your development environment meets the following minimum requirements:

- **Node.js:** `v22.0.0` or higher (required for native ECMAScript type stripping `--experimental-strip-types`)
- **npm:** `v10.0.0` or higher
- **Git:** `v2.40.0` or higher
- **Neon Account:** A free serverless PostgreSQL database at [neon.tech](https://neon.tech)
- **Google Account:** A Gmail account with 2-Step Verification enabled to generate a 16-character App Password

---

## 9. Local Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sanjeevnadgir123/eco-ai-bootcamp.git
   cd eco-ai-bootcamp
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Create local environment file:**
   Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```

---

## 10. Environment Variable Configuration

Open `.env` in your editor and configure the variables using the safe placeholders below:

```ini
# ==============================================================================
# BACKEND SECRETS (Server-side only — NEVER expose to frontend or browser)
# ==============================================================================

# Neon PostgreSQL connection string (include ?sslmode=require)
DATABASE_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-your-endpoint-id.region.aws.neon.tech/neondb?sslmode=require

# Gmail SMTP configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_official_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Geminal Studio <your_official_email@gmail.com>"

# Cryptographic salt for OTP HMAC-SHA256 hashing
OTP_SECRET=your-random-cryptographic-salt-change-in-production

# Allowed frontend origins for CORS (comma-separated for multiple)
FRONTEND_URL=http://localhost:5173,https://your-bootcamp-app.vercel.app

# Server network binding
PORT=8080
HOST=0.0.0.0

# ==============================================================================
# FRONTEND VARIABLES (Public build-time variables)
# ==============================================================================

# Backend API Base URL
# Leave blank for local development (uses Vite proxy / same origin)
# In production on Vercel, set to your Cloud Run URL: https://eco-ai-backend-xxxx.a.run.app
VITE_API_BASE_URL=

# Coordinator login password (optional override)
VITE_ADMIN_PASSWORD=EcoAdmin2026!
```

> [!WARNING]
> Never commit `.env` or real credentials to Git. `.gitignore` is pre-configured to strictly exclude `.env` and all `.env.*` files.

---

## 11. Neon PostgreSQL Setup

1. Sign in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g., `eco-ai-bootcamp`).
3. Select your preferred region (e.g., `ap-southeast-1` or `us-east-2`).
4. In the **Connection Details** widget, copy the pooled connection string:
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
5. Paste this connection string into your `.env` as `DATABASE_URL`.

---

## 12. Database Schema and Migration

The application includes automated table verification in `src/server/neonHandler.ts`, but you can also manually initialize the schema via the provided script or SQL Editor.

### Method A: Automated Migration Script
Run the automated initialization script from your terminal:
```bash
npm run verify-db
```
This script validates connectivity, checks table existence, applies necessary column updates, and creates indexes.

### Method B: Manual Neon SQL Editor Execution
Open the **SQL Editor** in your Neon dashboard and execute the contents of `neon_schema.sql`:

```sql
-- 1. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    fee_amount INTEGER NOT NULL DEFAULT 200,
    utr_number TEXT UNIQUE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' 
        CHECK (payment_status IN ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
    registration_status TEXT NOT NULL DEFAULT 'SUBMITTED' 
        CHECK (registration_status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- 2. Email Verifications Table (HMAC-SHA256 OTP Storage)
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    otp_hash TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verification_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_utr ON registrations(utr_number);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(LOWER(email));
```

---

## 13. Gmail SMTP and App Password Setup

To enable automated 6-digit OTP codes and coordinator approval/rejection emails via Gmail:

1. Open your Google Account at [myaccount.google.com](https://myaccount.google.com).
2. Navigate to **Security** and confirm that **2-Step Verification** is enabled.
3. Search for **App passwords** or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an application name (e.g., `ECO AI Bootcamp Mailer`) and click **Create**.
5. Google will display a 16-character password (e.g., `xxxx xxxx xxxx xxxx`).
6. Copy this string into `.env` as `SMTP_PASS` (whitespace is automatically stripped at runtime).
7. Validate your SMTP credentials by running:
   ```bash
   npm run verify-smtp
   ```

---

## 14. Local Development Commands

Start the full-stack development environment:

```bash
# Start frontend and backend middleware in development mode (Vite HMR)
npm run dev
```

The application will be available at `http://localhost:5173`. In development mode, Vite middleware intercepts `/api/*` calls and delegates them to `src/server/neonHandler.ts`.

---

## 15. Production Build and Start Commands

To validate and run the production bundle locally:

```bash
# 1. Type check TypeScript source
npm run typecheck

# 2. Build production assets (emitted to dist/)
npm run build

# 3. Launch the production Node.js HTTP server
npm start
```

The production server starts on port `8080` (or `process.env.PORT`) and binds to `0.0.0.0`. It serves static assets from `dist/` and routes `/api/*` endpoints to the Neon backend middleware.

---

## 16. API Endpoint Documentation

All backend routes are prefixed with `/api/` and return `application/json`.

| Method | Endpoint | Description | Auth / Security | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and database status | Public | None | `{ status: "connected", database: "Neon...", postgresVersion: "...", registrationsCount: 0 }` |
| `GET` | `/api/smtp-verify` | Diagnostic verification of SMTP relay | Public / Dev | None | `{ smtp: "connected", message: "..." }` |
| `POST` | `/api/send-otp` | Generate and dispatch 6-digit OTP code | Rate limited (15/IP, 5/email/10m, 30s cooldown) | `{ "email": "student@agmrcet.ac.in" }` | `{ "success": true, "message": "Verification code sent..." }` |
| `POST` | `/api/verify-otp` | Validate 6-digit OTP code | Max 5 attempts, constant-time comparison | `{ "email": "student@agmrcet.ac.in", "code": "123456" }` | `{ "success": true, "verificationToken": "..." }` |
| `GET` | `/api/eligibility` | Check if email is already registered | Public | `?email=student@agmrcet.ac.in` | `{ "alreadyRegistered": false, "feeAmount": 200 }` |
| `GET` | `/api/check-utr` | Check if transaction UTR is duplicate | Public | `?utr=429184719283` | `{ "isDuplicate": false }` |
| `GET` | `/api/registrations` | Fetch all registration records | Admin / Coordinator | None | `{ "registrations": [ ... ] }` |
| `POST` | `/api/registrations` | Create new registration record | Requires verified OTP token within 2 hours | `{ "fullName": "...", "email": "...", "phone": "...", "usn": "2AG22EC001", "semester": "5th Semester", "utrNumber": "...", "verificationToken": "..." }` | `{ "success": true, "registration": { ... } }` |
| `PATCH` | `/api/registrations/:id/status` | Approve or reject payment status | Coordinator action | `{ "paymentStatus": "APPROVED" \| "REJECTED", "rejectionReason": "..." }` | `{ "success": true, "registration": { ... } }` |
| `PATCH` | `/api/registrations/:id/details` | Update student information (USN, Semester, etc.) | Coordinator action | `{ "usn": "2AG22EC001", "semester": "5th Semester" }` | `{ "success": true, "registration": { ... } }` |

---

## 17. Student Registration & OTP Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Browser as React Frontend
    participant Server as Cloud Run Backend
    participant DB as Neon PostgreSQL
    participant SMTP as Gmail SMTP

    Student->>Browser: Enters Name, Email, Phone
    Browser->>Server: POST /api/send-otp { email }
    Server->>Server: Validate email syntax & CRLF injection check
    Server->>Server: Check IP & Email rate limits (30s cooldown)
    Server->>Server: Generate cryptographically secure 6-digit code
    Server->>Server: Compute HMAC-SHA256(email:code, OTP_SECRET)
    Server->>SMTP: Send branded HTML OTP email
    Server->>DB: INSERT / UPDATE email_verifications (store otp_hash, expires_at = NOW() + 10m)
    Server-->>Browser: 200 OK (Code sent — raw code never returned)
    Student->>Browser: Enters 6-digit OTP code from email
    Browser->>Server: POST /api/verify-otp { email, code }
    Server->>DB: SELECT otp_hash, attempts, expires_at FROM email_verifications
    Server->>Server: Check attempts < 5 and expires_at > NOW()
    Server->>Server: crypto.timingSafeEqual(storedHash, computedHash)
    Server->>DB: UPDATE email_verifications SET otp_hash = NULL, is_verified = TRUE, verification_token = TOKEN
    Server-->>Browser: 200 OK { success: true, verificationToken }
    Browser->>Student: Advance to Step 3 (Payment QR)
```

---

## 18. Payment, QR Code, UTR Submission & Admin Approval Workflow

1. **Payment QR Display:**
   - After email verification, the student sees the official UPI QR code with account details.
   - Standard fee: **₹200** per attendee.
2. **UTR Reference Submission:**
   - The student completes the UPI payment in their preferred banking application (PhonePe, Google Pay, Paytm, BHIM).
   - The student copies the 12-digit UTR / Transaction Reference number and pastes it into Step 4.
   - The frontend validates syntax and checks `/api/check-utr` to prevent duplicate reference submission.
3. **Submission & Verification Token Verification:**
   - The frontend issues `POST /api/registrations` including the `verificationToken`.
   - The backend checks `email_verifications` to guarantee the email was legitimately verified within the last 2 hours. Unverified submissions are strictly rejected with `HTTP 403 Forbidden`.
   - The record is created with `payment_status = 'PENDING_VERIFICATION'` and `registration_status = 'SUBMITTED'`.
   - The verification session is consumed and purged from `email_verifications`.
   - A unique Registration ID (`ECO-AI-2026-XXXX`) is returned.
4. **Coordinator Review & Action:**
   - Coordinators log into the Admin Dashboard (`Navbar -> Admin Portal`).
   - Registrations with `PENDING_VERIFICATION` are cross-referenced with bank account credits.
   - **On Approval:** Coordinator clicks *Approve Payment*. The record transitions to `APPROVED` / `CONFIRMED`, and an automated official invitation email with the student's registration ID is dispatched via Nodemailer.
   - **On Rejection:** Coordinator enters a reason (e.g., *UTR number not matching bank records*). The record transitions to `REJECTED`, and an update email explaining the rejection reason is dispatched to the student.

---

## 19. Testing Instructions

The project includes an end-to-end automated testing and verification suite:

```bash
# 1. Static TypeScript verification
npm run typecheck

# 2. Production build verification
npm run build

# 3. Test database connectivity and schema readiness
npm run verify-db

# 4. Test Gmail SMTP authentication and handshake
npm run verify-smtp

# 5. Execute 12-point automated OTP & registration security test suite
npm run test:otp
```

### Automated OTP Security Test Suite Coverage:
- Neon PostgreSQL connection and query verification
- Gmail SMTP authentication handshake
- Health endpoint status validation
- Malformed email syntax rejection
- CRLF and SMTP header injection defense
- Hashed OTP storage validation (verifies raw code is never in DB)
- Invalid OTP rejection and attempt counter increments
- Valid OTP acceptance and single-use atomic consumption
- Replay attack defense (verifying consumed OTP is rejected)
- Server-side block on unverified email registrations (`HTTP 403`)
- Successful registration creation for verified email
- Post-registration verification session cleanup

---

## 20. Troubleshooting Guide

### 1. Gmail SMTP Authentication Errors (`EAUTH`)
- **Cause:** Using standard Google account password instead of an App Password, or 2-Step Verification disabled.
- **Fix:** Enable 2-Step Verification on your Google account and generate a 16-character App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Ensure `SMTP_PORT=465` and `SMTP_SECURE=true`.

### 2. Neon Database Connection Errors (`ECONNREFUSED` / `ETIMEDOUT`)
- **Cause:** Missing `?sslmode=require` query parameter or network firewall blocking outbound TLS port 5432.
- **Fix:** Ensure your connection string includes `?sslmode=require`. Verify your connection with `npm run verify-db`.

### 3. Vercel SPA Routing 404 on Refresh
- **Cause:** Client-side routing not redirected to `index.html`.
- **Fix:** `vercel.json` is included in this repository to rewrite all incoming routes to `index.html`. Ensure `vercel.json` is present in your deployment root.

### 4. CORS Errors Between Vercel Frontend and Cloud Run Backend
- **Cause:** `FRONTEND_URL` on Google Cloud Run does not include the Vercel domain.
- **Fix:** In Google Cloud Run environment variables, set `FRONTEND_URL` to your Vercel URL (e.g., `https://eco-ai-bootcamp.vercel.app`).

---

## 21. Vercel Frontend Deployment Instructions

1. Push your code to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `eco-ai-bootcamp` repository.
4. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Environment Variables:**
   - Add `VITE_API_BASE_URL` with the URL of your Google Cloud Run backend service (e.g., `https://eco-ai-backend-xxxx.a.run.app`).
   - Add `VITE_ADMIN_PASSWORD` (optional custom coordinator dashboard password).
6. Click **Deploy**.

---

## 22. Google Cloud Run Backend Deployment Instructions

1. **Install Google Cloud SDK** (`gcloud`) and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```

2. **Build and submit container image via Google Cloud Build:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/eco-ai-backend:latest .
   ```

3. **Deploy container to Google Cloud Run:**
   ```bash
   gcloud run deploy eco-ai-backend \
     --image gcr.io/YOUR_GCP_PROJECT_ID/eco-ai-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars "NODE_ENV=production,HOST=0.0.0.0,PORT=8080,FRONTEND_URL=https://your-app.vercel.app"
   ```

4. **Inject Backend Secrets securely:**
   Use Google Secret Manager or the Cloud Run console to set:
   - `DATABASE_URL`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `OTP_SECRET`

---

## 23. Connecting Vercel to Google Cloud Run

To connect the separate frontend and backend hosting environments:

1. Copy the deployed Cloud Run service URL (e.g., `https://eco-ai-backend-ao4j1nl7-uc.a.run.app`).
2. Go to **Vercel Dashboard -> Project -> Settings -> Environment Variables**.
3. Add or update `VITE_API_BASE_URL`:
   ```
   VITE_API_BASE_URL=https://eco-ai-backend-ao4j1nl7-uc.a.run.app
   ```
4. Redeploy the Vercel project to bake the API base URL into the frontend build.
5. In Cloud Run, update `FRONTEND_URL` to match your Vercel domain:
   ```
   FRONTEND_URL=https://your-bootcamp-app.vercel.app
   ```

---

## 24. Production Environment Variables & Secret Management

| Variable Name | Environment | Purpose | Security Classification |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend (Cloud Run) | Neon PostgreSQL connection string | **Strict Secret** (Contains DB password) |
| `SMTP_PASS` | Backend (Cloud Run) | Gmail 16-character App Password | **Strict Secret** (Email relay authentication) |
| `OTP_SECRET` | Backend (Cloud Run) | HMAC-SHA256 cryptographic salt | **Strict Secret** (Protects OTP hashes) |
| `SMTP_USER` | Backend (Cloud Run) | Official Gmail address | Internal Server Variable |
| `SMTP_HOST` | Backend (Cloud Run) | SMTP server hostname (`smtp.gmail.com`) | Non-secret Configuration |
| `SMTP_PORT` | Backend (Cloud Run) | SMTP server port (`465`) | Non-secret Configuration |
| `SMTP_FROM` | Backend (Cloud Run) | Formatted email sender string | Non-secret Configuration |
| `FRONTEND_URL` | Backend (Cloud Run) | Allowed origin for CORS headers | Non-secret Configuration |
| `PORT` | Backend (Cloud Run) | Container listening port (`8080`) | Infrastructure Variable |
| `VITE_API_BASE_URL` | Frontend (Vercel) | Cloud Run backend service URL | **Public** (Visible in client network calls) |
| `VITE_ADMIN_PASSWORD` | Frontend (Vercel) | Coordinator login verification | Public / Protected Portal Token |

---

## 25. CORS, HTTPS, and Security Requirements

1. **Origin Restriction:** In production, `FRONTEND_URL` enforces strict CORS headers (`Access-Control-Allow-Origin: https://your-bootcamp.vercel.app`) preventing unauthorized cross-origin requests.
2. **Enforced HTTPS:** Both Vercel and Google Cloud Run enforce TLS 1.3 encryption across all public network endpoints.
3. **CRLF & Header Injection Defense:** Email addresses are sanitized with regular expressions rejecting `\r`, `\n`, semicolons, and commas to prevent SMTP header injection attacks.
4. **Constant-Time Comparison:** OTP hashes are validated using `crypto.timingSafeEqual` to prevent side-channel timing attacks.
5. **Payload Size Restrictions:** The HTTP request body parser strictly caps incoming JSON payloads at 100 KB to defend against denial-of-service memory exhaustion.
6. **SQL Parameterization:** All queries to Neon PostgreSQL use tagged template literal parameterization, neutralizing SQL injection vectors.

---

## 26. Deployment Checklist

- [ ] Confirm Neon PostgreSQL database password has been rotated if previously exposed.
- [ ] Confirm Gmail App Password is valid and verified with `npm run verify-smtp`.
- [ ] Confirm `.env` is absent from Git tracking and Git staging.
- [ ] Run `npm run typecheck` to confirm zero TypeScript compilation errors.
- [ ] Run `npm run build` to confirm clean production asset compilation.
- [ ] Run `npm run test:otp` to verify all 12 security test cases pass.
- [ ] Deploy backend to Google Cloud Run and verify `/api/health` returns HTTP 200.
- [ ] Set `VITE_API_BASE_URL` in Vercel to the Google Cloud Run URL.
- [ ] Deploy frontend to Vercel and complete an end-to-end test registration.
- [ ] Test coordinator approval email dispatch from the Admin Dashboard.

---

## 27. Contribution Guidelines

1. **Branching Strategy:** Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Code Standards:** Follow TypeScript strict typing and ESLint conventions.
3. **Commit Messages:** Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
4. **Pull Requests:** Ensure `npm run typecheck`, `npm run build`, and `npm run test:otp` pass before submitting PRs.

---

## 28. License Status

Institutional & Proprietary. All rights reserved by:
- **Department of Electronics and Communication Engineering (ECE)**, AGM Rural College of Engineering and Technology (AGMRCET), Varur, Hubli, Karnataka.
- **Geminal Studio**.

*Note: No open-source license file has been applied to this repository without explicit departmental authorization.*
