# EduManage

EduManage is a responsive school-administration dashboard for managing students, teachers, admissions, fees, attendance, examinations, and printable school documents.

> **Project status:** the application is currently a frontend prototype. Most operational data is deterministic demo data, and administrator changes are persisted in the browser with `localStorage`.

## Highlights

- Administrator login experience and dashboard overview
- Student directory, profiles, attendance, leave, academics, guardians, fees, and account controls
- Teacher directory, profiles, attendance, leave, class assignments, salary, and account controls
- Admissions workflow, application status updates, document uploads, and payment receipts
- Dashboard widgets for attendance, fee collection, notices, events, top performers, and recent admissions
- School modules for classes, subjects, fees, examinations, results, notices, parents, reports, events, and settings
- Print-ready tuition receipts, admission receipts, payslips, transfer certificates, and experience certificates
- Light/dark theme support and reusable accessible UI components

## Tech stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Zustand for client-side state
- Lucide icons

## Getting started

### Prerequisites

- Node.js 20.9 or later
- npm

### Installation

```bash
git clone <repository-url>
cd School-Management
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The login screen is a UI-only demo; submitting it redirects to the dashboard.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Run the production build locally. |
| `npm run lint` | Run ESLint. |

## Project structure

```text
src/
├── app/                 # Routes, layouts, and print views
├── components/          # Shared UI and dashboard shell components
├── features/            # Domain modules: admissions, students, teachers, dashboard, auth
├── hooks/               # Reusable client hooks
├── lib/                 # API helpers, IndexedDB storage, utilities, and navigation
├── Providers/           # Application providers
├── store/               # Global UI and toast state
└── types/               # Shared TypeScript declarations
```

## Data and backend integration

The student, teacher, and admission modules currently use mock data with browser-side persistence for admin edits. Backend hand-off contracts are available here:

- [Students API contract](src/features/students/BACKEND.md)
- [Teachers API contract](src/features/teachers/BACKEND.md)
- [Admissions API contract](src/features/admissions/BACKEND.md)

When connecting a backend, replace the relevant Zustand store actions and demo-data loaders with authenticated API calls. The contracts document expected endpoints, request bodies, permissions, audit logging, and business rules.

## Production checklist

- Implement real authentication and role-based access control.
- Connect stores to a secure API and database.
- Replace browser-only document/data storage with managed object storage.
- Add server-side validation, audit logging, monitoring, and automated tests.
- Configure environment variables for application URL, authentication, database, storage, and messaging providers.

## License

No license has been specified for this repository.
