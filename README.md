# HealthSync — Modern Healthcare Appointment & Consultation Platform

HealthSync is a modern Healthcare SaaS application designed to streamline clinic workflows, empower patients with intelligent scheduling, and assist healthcare providers with clinical documentation and automated patient follow-ups.

---

## 🌟 Key Features

### 👤 Patient Portal
- **Specialization & Doctor Discovery**: Filter doctors by clinical specialization and view available schedules.
- **Smart Appointment Booking**: Real-time slot availability with database-level double-booking protection.
- **Appointment Management**: View upcoming, completed, and past visits; reschedule or cancel with immediate notification.
- **Post-Visit Summaries**: Access AI-generated, patient-friendly consultation summaries and digital prescriptions.
- **Google Calendar Sync**: Connect Google Calendar via OAuth 2.0 to automatically sync scheduled appointments.

### 🩺 Doctor Workspace
- **Clinical Dashboard**: Real-time overview of today's schedule, patient load, and appointment statuses.
- **AI Pre-Visit Triage**: Instant AI analysis of patient symptoms with structured urgency level (Low / Medium / High), chief complaint extraction, and 3 suggested clinical questions.
- **Consultation Workspace**: Unified interface to review patient context, record clinical notes, write digital prescriptions, and complete visits.

### 🛡️ Admin Management
- **Doctor Directory**: Manage doctor profiles, specializations, working hours, and appointment slot durations.
- **Leave Scheduling**: Mark doctor leave dates with automatic schedule protection and patient notification safeguards.

### 🤖 AI-Powered Clinical Workflows (Groq / Qwen)
- **Pre-Visit Analysis**: Structured JSON extraction for rapid triage before patient enters the clinic.
- **Post-Visit Follow-Up**: Synthesizes doctor findings and prescribed medications into a clear, jargon-free summary (with reasoning and `<think>` tags automatically stripped for patient safety).

### 📧 Automated Notifications & Resilient Email Queue (Brevo / Nodemailer)
- **Immediate Triggers**: Instant email dispatch for booking confirmations, cancellations, and reschedules.
- **Automated Cron Reminders**: 24-hour appointment reminders and medication frequency reminders.
- **Resilient Retry Queue**: Failed email deliveries are tracked with status logs and automatically retried by background cron jobs.

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS v4 (Design System Tokens)
- **Routing**: React Router v6 (Role-Based Route Protection)
- **Icons**: Lucide React
- **HTTP Client**: Axios (with JWT interceptors)

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MySQL2 (Connection Pool with Promise Support)
- **Authentication**: JWT (Stateless Bearer Tokens) & Bcrypt
- **AI Service**: Groq API (`qwen/qwen3.6-27b`)
- **Email Service**: Nodemailer with Brevo SMTP
- **Calendar Service**: Google APIs (`googleapis` OAuth 2.0)
- **Task Scheduling**: `node-cron`

---

## 📁 Architecture Overview

```
Healthcare-appointment-manager/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers (auth, patient, doctor, admin, calendar)
│   │   ├── db/               # MySQL connection pool and schema
│   │   ├── jobs/             # Scheduled cron jobs (reminders, retry queue)
│   │   ├── middleware/       # Auth JWT verification & role authorization
│   │   ├── routes/           # REST API route declarations
│   │   ├── services/         # LLM service (Groq), email service, notification service
│   │   └── utils/            # HTML email templates and helpers
│   ├── .env.example          # Environment variables template
│   └── server.js             # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── components/       # Shared UI primitives (Button, Card, Badge, Alert, etc.)
│   │   ├── context/          # AuthContext for session management
│   │   ├── pages/            # Role-isolated views (Public, Patient, Doctor, Admin)
│   │   ├── services/         # API client configuration
│   │   └── index.css         # Tailwind v4 semantic design tokens
│   ├── .env.example          # Frontend environment variables template
│   └── vite.config.js        # Vite configuration
└── README.md
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8+)
- Git

### 1. Database Setup
1. Start your local MySQL server.
2. Create the database:
   ```sql
   CREATE DATABASE healthcare_db;
   ```
3. Import the initial schema located at `backend/src/db/schema.sql`:
   ```bash
   mysql -u root -p healthcare_db < backend/src/db/schema.sql
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Configure your local `.env` values:
   ```env
   PORT=5000
   DATABASE_HOST=localhost
   DATABASE_USER=root
   DATABASE_PASSWORD=your_mysql_password
   DATABASE_NAME=healthcare_db
   JWT_SECRET=your_secret_key_here
   GROQ_API_KEY=your_groq_api_key
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=your_smtp_user
   EMAIL_PASSWORD=your_smtp_password
   EMAIL_FROM=noreply@healthsync.com
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/calendar/callback
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   node server.js
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Ensure the API URL matches your backend:
   ```env
   VITE_BACKEND_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 🔒 Security & Best Practices
- **Secret Isolation**: All API keys, credentials, and tokens are stored in `.env` and strictly excluded from version control via `.gitignore`.
- **Role Isolation**: Express middleware verifies JWT signature and validates user role (`PATIENT`, `DOCTOR`, `ADMIN`) on all protected routes.
- **SQL Injection Prevention**: All database queries utilize parameterized prepared statements via `mysql2/promise`.
- **Patient Privacy**: Post-visit summaries are strictly scoped to the doctor's recorded notes without hallucinated diagnoses.

---

## 📜 License
This project is open source and available under the [MIT License](LICENSE).
