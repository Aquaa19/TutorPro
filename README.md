# TutorPro.OS

A dark-themed, premium personal dashboard for private tutors to handle student directories, track quick attendance, manage fee ledgers, and view student growth report cards. Custom built for **Arkadyuti Mandal**.

## Features

- **Command Center (Dashboard):** Overview of active students, today's attendance rate, monthly revenue, pending fees, and batch breakdowns.
- **Student Dossier & Batches:** Manage student enrollment details, grades, and assign them to specific time batches.
- **Roll Roster (Attendance):** Log daily attendance (Present, Absent, Late) with automatic historical statistics.
- **Finances (Fee Ledger):** Record payments, track pending/due payments, and log cash, UPI, or bank transfer payments.
- **Report Cards (Performance):** Log test names, total marks, marks obtained, and custom remarks for each student to track performance trends.
- **Settings:** Export, import, and restore database backups locally.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Styling:** CSS + Tailwind CSS (v4)
- **Bundler:** Vite
- **Storage:** LocalStorage (fully static, zero server-side database required)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`

### Build for Production
To build the static application:
```bash
npm run build
```
This generates the optimized static files in the `dist` directory.

## Deployment to Vercel

The application is completely static and can be deployed directly to Vercel:

1. Deploy via CLI:
   ```bash
   npx vercel
   ```
2. Follow the prompt instructions to complete the deployment.
