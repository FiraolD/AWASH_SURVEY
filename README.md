<<<<<<< HEAD
<<<<<<< HEAD
# AWASH_SURVEY
=======
# Awash Insurance — Motor Damage Survey System
=======
Awash Insurance — Motor Damage Survey System
>>>>>>> ea53a301 (added comprehensive redame file and updated the pdf report format to make it bilingual)

A comprehensive, bilingual (English / አማርኛ), role-based web application for managing motor vehicle damage assessments, spare-parts catalogues, and report generation. Built for Awash Insurance.
📖 Project Overview

The Awash Survey application digitizes the manual survey-report workflow. Surveyors can search a curated catalogue of spare parts, mark them as Replace or Repair, specify part conditions (New/Used, Genuine/Local, Salvage/ቅሪት), and generate a formatted A4 PDF that precisely matches Awash Insurance's official printed form.

The system handles multiple roles, enforces strict data integrity, maintains a comprehensive audit trail of every change, and is designed to run on-premise on a local network (LAN).
Key Features

    Bilingual UI: Full support for English and Amharic (with Afaan Oromo ready to enable).

    Smart Search: Homophone-tolerant Amharic search and typo-tolerant English search.

    Role-Based Access: Admins manage users and system settings; Supervisors manage parts and reports; Surveyors create reports.

    Dynamic Reports: Add/remove parts, bulk move, drag-to-reorder, and undo.

    Condition Tracking: Every replacement part tracks Condition (New/Used), Origin (Genuine/Local), and Recovery status (Salvage/ቅሪት).

    Auto-Generated PDF: Generates an exact replica of the Awash form, complete with a dynamic official stamp overlay on finalized reports.

    Immutable Audit Log: Database-level triggers capture who changed what and when, including diffs for every update.

    Admin SQL Console: A restricted, admin-only SQL runner for database maintenance.

    Automated Backups: Scripts provided for daily database dumps.

🛠 Tech Stack
Layer	Technology
Framework	Next.js 15 (App Router, Server Actions)
Language	TypeScript
Database	PostgreSQL 15+
ORM	Drizzle ORM
Authentication	Auth.js v5 (NextAuth)
Styling	Tailwind CSS, Radix UI (primitives)
PDF Generation	@react-pdf/renderer
File Parsing	xlsx (SheetJS)
📂 Project Structure
text

awash-survey/
├── db/
│   ├── migrations/         # Raw SQL migrations (0001_init.sql, etc.)
│   ├── seed/               # Seed data (users, branches, parts)
│   ├── client.ts           # Pure Node Postgres connection (for CLI)
│   ├── index.ts            # Next.js wrapper for DB connection
│   └── schema.ts           # Drizzle schema definitions
├── scripts/
│   ├── backup-db.ps1       # Windows backup script
│   ├── backup-db.sh        # Linux backup script
│   ├── import-branches.ts  # Import branch list from data file
│   └── import-parts.ts     # Import parts from Excel
├── src/
│   ├── app/
│   │   ├── [locale]/       # Localized routes (en, am)
│   │   │   ├── (app)/      # Authenticated routes
│   │   │   │   ├── admin/  # Parts, Users, Audit, SQL
│   │   │   │   └── reports/# Report list, editor, preview
│   │   │   └── login/      # Login page
│   │   └── api/            # API routes (PDF, health, search)
│   ├── components/         # React UI components
│   ├── pdf/                # PDF generation component
│   ├── server/             # Server-only logic
│   │   ├── actions/        # Server actions (mutations)
│   │   ├── queries/        # Read-only DB queries
│   │   ├── audit.ts        # withActor() transaction wrapper
│   │   ├── auth.ts         # NextAuth configuration
│   │   └── permissions.ts  # Role capabilities matrix
│   ├── lib/                # Utility functions (env, i18n, zod)
│   └── messages/           # JSON translation files (en, am, om)
├── public/
│   ├── logo.jpg            # Company logo
│   ├── stamp.png           # Official claims stamp
│   └── fonts/              # NotoSansEthiopic fonts for PDF
├── .env.example            # Environment variable template
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
└── tailwind.config.ts      # Tailwind configuration

🚀 Detailed Setup Guide
1. Prerequisites

Ensure you have the following installed:

    Node.js 20.x (LTS)

    PostgreSQL 15+

    Git

2. Install Dependencies
bash

git clone <repository-url>
cd awash-survey
npm install
<<<<<<< HEAD
npm run db:migrate      # applies db/migrations/0001_init.sql
npm run db:seed         # languages, branches, two demo users
npm run parts:import    # reads db/seed/parts.xlsx (falls back to sample)
npm run dev
>>>>>>> 29db77f9 (initial commit)
=======

3. Database Setup

Create a database and enable the required extensions. Open psql or your database manager:
sql

CREATE DATABASE survey_spare;
\c survey_spare
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS citext;    -- For case-insensitive emails

4. Configure Environment Variables

Copy the example file and edit it:
bash

cp .env.example .env

Update the .env file with your specific values:
env

# Database connection string
# Note: If your password contains special characters (like @), URL-encode them (e.g., @ becomes %40)
DATABASE_URL=postgres://postgres:my%40password@localhost:5432/survey_spare

# Auth.js security (Generate a new one with: openssl rand -base64 32)
AUTH_SECRET=your-super-long-random-secret-key-here

# Optional: Set this if accessing via a fixed LAN IP. 
# Leave blank to let Auth.js dynamically use the incoming Host header.
# AUTH_URL=http://10.1.12.21:3090

# Enable the Admin SQL Console (Set to 'false' or remove in production)
ALLOW_SQL_CONSOLE=true

# App Defaults
NEXT_PUBLIC_APP_NAME="Awash Survey"
DEFAULT_LOCALE=am

5. Database Migrations & Seeding

Run the migrations to build the schema, then seed the initial data.
bash

# Apply all SQL migrations
npm run db:migrate

# Seed languages, branches, and the initial admin user
npm run db:seed

# Import the parts catalogue from db/seed/parts.xlsx
# (If the Excel file is missing, it imports a small sample set)
npm run parts:import

6. Add Static Assets

You must place three files in the public/ folder for the app to function fully:

    logo.jpg — The Awash Insurance logo (used in the app header and PDF).

    stamp.png — The official circular claims stamp (transparent background recommended).

    fonts/NotoSansEthiopic-Regular.ttf and fonts/NotoSansEthiopic-Bold.ttf — Required for Amharic PDF rendering. Download from Google Fonts.

7. Start the Development Server
bash

npm run dev

Open http://localhost:3090 in your browser.
Default Admin Login: admin@awash.example / changeme
🔐 Roles & Permissions

The system uses a capability-based access control matrix defined in src/server/permissions.ts.
Capability	Admin	Supervisor	Surveyor
View Reports	✅	✅	✅
Create / Edit Reports	✅	✅	✅
Finalize Reports	✅	✅	✅
Reopen Reports	✅	✅	✅
Void Reports	✅	✅	❌
View Parts Catalogue	✅	✅	❌
Add/Edit Parts	✅	✅	❌
Manage Users	✅	❌	❌
View Audit Log	✅	❌	❌
Run Admin SQL	✅	❌	❌
🗄 Database & Auditing
Migrations

Migrations are plain SQL files located in db/migrations/. They are applied sequentially using npm run db:migrate.
Never edit an applied migration. Always create a new 000X_description.sql file.
Audit Logging

Every database write is logged. The app uses a withActor(actor, fn) wrapper in src/server/audit.ts which wraps mutations in a transaction and sets app.user_id locally. Database triggers (audit_row()) capture the exact diff of the change.

You can view the audit log in the Admin UI (/admin/audit).
Backups

The system includes backup scripts (scripts/backup-db.ps1 for Windows, scripts/backup-db.sh for Linux).
bash

# Run a manual backup
npm run db:backup

This creates a timestamped .sql file in the backups/ directory.
📄 PDF Generation & Printing

The PDF is generated on-the-fly via the API route /api/reports/[id]/pdf.

    Finalized Reports: If a report status is finalized, a transparent stamp image (public/stamp.png) is overlaid on the document.

    Salvage Parts: Parts marked as salvage have their serial numbers (ተ.ቁ) automatically populated in Notice #4 (በተራ ቁጥር 1, 2 ዕቃዎች ለኩባንያ ሪከቨሪ ይመለሳል።).

Customizing the PDF

If you need to tweak the PDF layout, the files to edit are:

    src/pdf/SurveyReportPdf.tsx (For the downloaded PDF)

    src/components/PrintSheet.tsx (For the HTML preview / browser print)

Note: The PDF uses a fixed 22-row layout per page to guarantee the notes fit on the same page. If you change row heights, you must recalculate the ROWS constant.
🐛 Troubleshooting & Known Issues

1. "Jest worker encountered 2 child process exceptions" on Windows

    Cause: Windows file locking (often antivirus) or memory limits during Next.js compilation.

    Fix: We disabled workerThreads in next.config.mjs. If it persists, delete .next, add an antivirus exclusion for the project folder, and ensure the npm run dev script uses node --max-old-space-size=4096.

2. "Failed to find Server Action... This request might be from an older deployment"

    Cause: The browser is holding onto old JavaScript, but the server has recompiled with new Action IDs.

    Fix: Delete .next, restart the server, and Hard Refresh (Ctrl+Shift+R) the browser. The next.config.mjs has been configured to prevent browsers from aggressively caching these runtime chunks.

3. Redirects go to localhost instead of the LAN IP

    Cause: AUTH_URL is explicitly set to localhost in .env.

    Fix: Remove the AUTH_URL line from .env completely. Ensure AUTH_TRUST_HOST=true is set. NextAuth will then use the incoming request's Host header.

4. Login fails / Foreign Key Violation on Report Creation

    Cause: You reset the database, but your browser still has a session cookie from the old database with a User ID that no longer exists.

    Fix: Sign out, clear your browser cookies for the site, and sign in again.

5. Special characters in Database Password

    Cause: If your PostgreSQL password contains @, :, or /, it breaks the DATABASE_URL.

    Fix: URL-encode the password in .env. (e.g., password@123 becomes password%40123). Alternatively, change the database password to alphanumeric only.

📦 Production Deployment

To run the app in production:

    Run npm run preflight to ensure there are no TypeScript or Lint errors.

    Build the app: npm run build

    Start the server: npm run start

For a Linux server, use systemd to keep the Node process alive. If deploying via Docker, use the provided docker-compose.prod.yml (ensure you set all production environment variables in the host environment, not in the git repository).
>>>>>>> ea53a301 (added comprehensive redame file and updated the pdf report format to make it bilingual)
