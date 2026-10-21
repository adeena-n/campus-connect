# CampusConnect — University Student Freelance & Skill-Exchange Marketplace

CampusConnect is a production-grade campus marketplace for university students to exchange short-term services, peer tutoring, design, writing, and engineering support, collaborate on academic projects, and build verifiable academic reputation.

---

## 🏛️ Architecture

```text
React Frontend (Vite + Tailwind v4)
       │
       ▼ (Bearer JWT via Authorization Header)
Express REST API Backend (TypeScript / tsx)
       │
       ▼ (Official @supabase/supabase-js + Service Role)
Supabase (Auth & PostgreSQL Database)
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Lucide Icons
- **Design System**: Warm ivory background (`#FAF9F6`), Deep forest green primary (`#18392B`), Muted sage (`#A8B8A0`), Terracotta accent (`#C77755`), Charcoal text (`#202820`)
- **Typography**: Newsreader (editorial serif headings) + DM Sans (interface body)
- **Backend**: Node.js, Express, TypeScript (executed via `tsx`)
- **Authentication**: Supabase Auth as the single authentication provider (`Authorization: Bearer <access_token>`)
- **Database**: Supabase PostgreSQL with relational integrity, foreign keys, unique constraints, check constraints, Row Level Security (RLS), and atomic PostgreSQL RPC functions
- **Seeded Data**: 12 diverse student profiles across 8 university departments, 25 categorized gigs, 26 student applications, and 10 mutual peer reviews

---

## 📦 Database Schema & Tables

All database operations are backed by Supabase PostgreSQL. The schema is located in `supabase/schema.sql` and `supabase/migrations/20261021000000_init_campusconnect.sql`.

### Required Tables

1. **`users`**
   - `id`: `SERIAL PRIMARY KEY`
   - `auth_user_id`: `UUID UNIQUE REFERENCES auth.users(id)` (links authenticated students to profiles)
   - `email`: `TEXT UNIQUE`
   - `name`: `TEXT NOT NULL`
   - `major`: `TEXT NOT NULL`
   - `semester`: `INT NOT NULL CHECK (semester BETWEEN 1 AND 16)`
   - `bio`: `TEXT NOT NULL DEFAULT ''`
   - `skills`: `TEXT[] NOT NULL DEFAULT '{}'`
   - `created_at`: `TIMESTAMPTZ DEFAULT NOW()`

2. **`gigs`**
   - `id`: `SERIAL PRIMARY KEY`
   - `user_id`: `INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `title`: `TEXT NOT NULL (5-100 characters)`
   - `description`: `TEXT NOT NULL (20-2000 characters)`
   - `type`: `TEXT CHECK (type IN ('Offering', 'Requesting'))`
   - `category`: `TEXT CHECK (category IN ('Programming', 'Design', 'Writing', 'Tutoring'))`
   - `payment_type`: `TEXT CHECK (payment_type IN ('Paid', 'SkillSwap', 'Free'))`
   - `budget`: `NUMERIC NULL CHECK (budget IS NULL OR budget > 0)`
   - `deadline`: `TIMESTAMPTZ NOT NULL`
   - `status`: `TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'))`
   - `accepted_applicant_id`: `INT NULL REFERENCES applications(id)`
   - `created_at`: `TIMESTAMPTZ DEFAULT NOW()`

3. **`applications`**
   - `id`: `SERIAL PRIMARY KEY`
   - `gig_id`: `INT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE`
   - `applicant_id`: `INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `message`: `TEXT NOT NULL (10-500 characters)`
   - `status`: `TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Withdrawn'))`
   - `created_at`: `TIMESTAMPTZ DEFAULT NOW()`
   - **Constraint**: `UNIQUE (gig_id, applicant_id)` (prevents duplicate applications)

4. **`reviews`**
   - `id`: `SERIAL PRIMARY KEY`
   - `gig_id`: `INT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE`
   - `reviewer_id`: `INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `reviewee_id`: `INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `rating`: `INT NOT NULL CHECK (rating BETWEEN 1 AND 5)`
   - `comment`: `TEXT NOT NULL`
   - `created_at`: `TIMESTAMPTZ DEFAULT NOW()`
   - **Constraints**: `UNIQUE (gig_id, reviewer_id)`, `CHECK (reviewer_id <> reviewee_id)`

5. **`accept_applicant` (Atomic PostgreSQL Function / RPC)**
   - Atomically accepts one application for an Open gig.
   - Automatically marks all other Pending applications as `Rejected`.
   - Transitions the gig to `In Progress` and stores the application ID in `accepted_applicant_id`.
   - Rejects non-owners, non-Pending applications, expired gigs, and invalid transitions.

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the provided environment templates:
```bash
cp .env.example .env
```

Your `.env` file requires your Supabase project credentials:
```env
# Frontend Client (Publicly exposed in Vite React app)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-public-key"

# Backend Server (Private to Express backend - NEVER exposed to browser)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-secret-key"

# Optional: Password for seeded evaluator test accounts
EVALUATOR_PASSWORD="Evaluator2026!"
```

### 3. Apply SQL Schema to Your Supabase Project

Execute the schema migration in your Supabase project:
- Navigate to your **Supabase Dashboard** → **SQL Editor**.
- Copy and run the entire contents of `supabase/schema.sql`.
- Or run via Supabase CLI:
```bash
supabase db push
```

### 4. Seed the Database
Populate your Supabase PostgreSQL database with the complete dataset:
- **12** student profiles with academic majors, semesters, and skills
- **25** categorized gigs (8 Programming, 6 Design, 6 Writing, 5 Tutoring)
- **26** student proposals and applications
- **10** mutual peer reviews with calculated 1-5 star reputation
- **2** evaluator accounts in Supabase Auth for live testing
```bash
npm run seed
```

### 5. Start Development Server
Starts the full-stack server running Express with Vite dev middleware on port 3000:
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Acceptance Test Matrix Verification

Run the automated 24-test acceptance suite anytime to verify all 5 hackathon milestones:
```bash
npx tsx backend/verifyMatrix.ts
```

All 24 test scenarios pass with 100% compliance:
- `[01]` Create valid gig produces Open gig saved with valid constraints
- `[02]` Paid gig without positive budget rejected
- `[03]` Past deadline at creation rejected
- `[04]` Keyword search over title and description matches correctly
- `[05]` Combined category and payment filters work
- `[06]` Apply to another student's Open gig creates Pending application
- `[07]` Self-applications to own gig rejected
- `[08]` Duplicate application identified and rejected
- `[09]` Apply to expired gig rejected
- `[10]` Non-owner acceptance rejected
- `[11]` Owner accepts one: Selected marked Accepted & stored in `accepted_applicant_id`
- `[12]` Remaining Pending applications automatically Rejected
- `[13]` Gig status transitions to `In Progress`
- `[14]` Apply after acceptance rejected (gig no longer Open)
- `[15]` Direct Open to Complete transition rejected (requires In Progress)
- `[16]` Owner completes In Progress gig with accepted applicant -> `Completed`
- `[17]` Outsider reviews rejected
- `[18]` Owner reviews accepted applicant saved
- `[19]` Applicant reviews owner saved
- `[20]` Duplicate review by same reviewer rejected
- `[21]` Rating outside 1-5 integer rejected
- `[22]` Profile reputation and ratings calculated correctly
- `[23]` Data relational integrity verified across all foreign keys
- `[24]` Seed data fulfills numerical requirements (12 users, 25 gigs, 20+ apps, 8+ reviews)

---

## 🔐 Evaluator & Testing Accounts

Judges can test both sides of the marketplace (posting/accepting vs. applying/reviewing) using the two evaluator accounts created by the seed script:

- **Gig Creator / Owner Account**:
  - Email: `evaluator.owner@campus.edu`
  - Name: **Alex Morgan** (Computer Science, Semester 4)
  - Role: Post gigs, review incoming proposals, accept applicants, mark gigs complete, and review collaborators.

- **Applicant / Collaborator Account**:
  - Email: `evaluator.applicant@campus.edu`
  - Name: **Jordan Taylor** (Software Engineering, Semester 3)
  - Role: Browse marketplace gigs, apply with custom proposals, work on accepted gigs, and submit mutual reviews.

- **Default Evaluator Password**: `Evaluator2026!` (configurable via `EVALUATOR_PASSWORD` env var).
- Any student can also sign up with their university email at `/signup`.

---

## 🧭 Pages & Features

1. **Public Landing Page (`/`)**: Hero section, marketplace search, department explorer, Offering vs. Requesting breakdown, payment model explanations, and featured gigs.
2. **Explore Gigs (`/explore`)**: Keyword search, multi-facet filtering (category, type, payment, budget range, status), and sorting (newest, approaching deadline, budget).
3. **Discover Talent (`/talent`)**: Browse all university student profiles dynamically from Supabase, search by name, major, or skills, and view completed gig counts and reputation scores.
4. **Gig Details (`/gigs/:id`)**: Comprehensive listing details, applicant proposal management for owners, application submission modal for students, and mutual review submission on completion.
5. **Create Gig (`/create`)**: Validated gig publication with dynamic budget inputs and future deadline enforcement.
6. **My Gigs (`/my-gigs`)**: Dashboard for gig owners to manage listings, track proposals, complete In Progress projects, and cancel open listings.
7. **My Applications (`/my-applications`)**: Real-time status tracking for student proposals (Pending, Accepted, Declined) with direct review triggers on completed gigs.
8. **Student Profile (`/profile/:id` and `/profile`)**: Academic credentials, verified skills, posted gigs history, received reviews, and computed 1-5 star reputation.
9. **Authentication (`/login`, `/signup`)**: Supabase Auth with persistent session tokens and automatic student profile synchronization.

---

## 📄 License & Honor Code

Built for the CampusConnect University Hackathon. Code adheres to academic community standards and open-source licensing.
