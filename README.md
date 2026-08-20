# Healthcare Appointment & Follow-up Manager

A modern, comprehensive SaaS healthcare platform allowing patients to book appointments, doctors to manage clinical notes, and admins to manage the clinic. Featuring AI-powered clinical summaries, Google Calendar sync, and robust email notification workflows.

## Features

- **Authentication**: JWT-based role authorization (Admin, Doctor, Patient).
- **Smart Booking**: Patient appointment booking with strict database-level double-booking protection.
- **Doctor Management**: Admin controls for specializations, working hours, slot durations, and leave management.
- **AI Clinical Workflows**:
  - **Pre-visit AI**: Auto-structures patient symptoms into chief complaints, urgency levels, and suggested clinical questions.
  - **Post-visit AI**: Transforms doctor's clinical notes into a patient-friendly follow-up summary.
- **Robust Background Notifications**:
  - Booking, Rescheduling, and Cancellation emails.
  - Automated Appointment Reminders (24-hour).
  - Automated Medication Reminders (Parsed directly from prescriptions).
  - Built-in retry mechanism to prevent external SMTP failures from blocking core clinical workflows.
- **Google Calendar Sync**: Native OAuth 2.0 integration safely isolates Patient and Doctor calendar events.

## Technology Stack

### Backend
- **Node.js & Express**: Core REST API logic.
- **MySQL2**: Relational database connection with atomic transactions.
- **jsonwebtoken (JWT)**: Stateless authorization.
- **OpenAI (gpt-3.5-turbo)**: Generative AI for clinical summarization.
- **googleapis**: Google Calendar OAuth 2.0.
- **nodemailer**: Email dispatch.
- **node-cron**: Scheduled background jobs.

### Frontend
- **React & Vite**: Extremely fast presentation layer.
- **React Router**: Role-based route protection.
- **Tailwind CSS v4**: Utility-first professional healthcare UI styling.
- **Axios**: HTTP client with request interceptors for JWT.
- **Lucide React**: Clean, modern iconography.

## Installation & Local Setup

### 1. Database Setup
Ensure you have MySQL installed.
1. Connect to MySQL (e.g., via MySQL Workbench or CLI).
2. Create the database: \`CREATE DATABASE healthcare_db;\`
3. Execute the schema script located at \`backend/src/db/schema.sql\` to generate the tables.

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`

Create a \`.env\` file in the \`backend\` directory (use \`.env.example\` as a guide):
\`\`\`env
PORT=5000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=healthcare_db

JWT_SECRET=super_secret_jwt_key_here
OPENAI_API_KEY=your_openai_api_key

EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM=noreply@clinic.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
\`\`\`

Start the backend:
\`\`\`bash
npm run dev
# OR
node server.js
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd frontend
npm install
\`\`\`

Create a \`.env\` file in the \`frontend\` directory:
\`\`\`env
VITE_BACKEND_URL=http://localhost:5000/api
\`\`\`

Start the frontend:
\`\`\`bash
npm run dev
\`\`\`
The application will be accessible at \`http://localhost:5173\`.

## API Documentation

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | \`/api/auth/register\` | PUBLIC | Register a new user |
| POST | \`/api/auth/login\` | PUBLIC | Authenticate and return JWT |
| GET | \`/api/patient/doctors/search\` | PATIENT/ADMIN | List/Search doctors |
| GET | \`/api/patient/slots\` | PATIENT | Get available slots for a date |
| POST | \`/api/patient/appointments/book\` | PATIENT | Book a new appointment |
| PUT | \`/api/patient/appointments/:id/cancel\`| PATIENT | Cancel appointment |
| PUT | \`/api/patient/appointments/:id/reschedule\`| PATIENT | Reschedule appointment |
| GET | \`/api/doctor/appointments\` | DOCTOR | Get doctor's schedule |
| PUT | \`/api/doctor/appointments/:id/consultation\`| DOCTOR | Submit clinical notes/prescription |
| POST | \`/api/admin/doctors\` | ADMIN | Create a doctor profile |
| POST | \`/api/admin/doctors/leave\` | ADMIN | Mark a doctor as on leave |
| GET | \`/api/calendar/auth\` | AUTHENTICATED| Get Google OAuth URL |

## AI Prompts

**Pre-visit Summary (Patient Symptoms):**
> You are a medical assistant AI. A patient has booked an appointment with the following symptoms: "[symptoms]". Provide a JSON response with exactly these fields: "urgency_level" (Low, Medium, or High), "chief_complaint" (a concise 1-2 sentence summary), and "suggested_questions" (an array of exactly 3 relevant questions the doctor should ask the patient). Do not include any other text.

**Post-visit Summary (Doctor Notes):**
> You are a helpful medical assistant. A doctor has completed a consultation with the following clinical notes: "[notes]". Generate a patient-friendly summary of the visit. Avoid overly complex medical jargon, clearly state the diagnosis or findings, and summarize the next steps or follow-up instructions.

## Google Calendar Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Google Calendar API**.
3. Configure the OAuth consent screen.
4. Create **OAuth Client ID** credentials (Web application type).
5. Set the Authorized redirect URI to \`http://localhost:5000/api/calendar/callback\` (or your production URL).
6. Copy the Client ID and Secret to your backend \`.env\`.

## Deployment Guide
1. **Database**: Provision a managed MySQL instance (e.g., AWS RDS, DigitalOcean Managed DB). 
2. **Backend**: Deploy the Node.js server to Heroku, Render, or an EC2 instance. Update the \`.env\` file with production database and frontend URLs.
3. **Frontend**: Build the React app (\`npm run build\`) and deploy the \`dist\` folder to Vercel, Netlify, or AWS S3. Ensure \`VITE_BACKEND_URL\` points to the production backend API.
4. **CORS**: Ensure the backend \`cors()\` middleware is configured to accept requests exclusively from the production frontend domain.
