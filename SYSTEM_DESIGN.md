# Healthcare Appointment & Follow-up Manager
## System Design Document

### 1. Architecture Overview
The application follows a classic client-server, three-tier architecture:
- **Presentation Layer**: A single-page application (SPA) built with React and Vite. It serves as the UI for Patients, Doctors, and Admins.
- **Application Layer**: A Node.js and Express backend REST API. It handles business logic, database transactions, role-based access control, and asynchronous job queuing.
- **Data Layer**: A local MySQL relational database ensuring data integrity through strict foreign keys and transactional constraints.

### 2. Authentication & Authorization
Security is implemented via stateless JSON Web Tokens (JWT).
- **Flow**: Upon login, the backend validates credentials and issues a signed JWT containing the user's \`id\` and \`role\`. The frontend stores this token and attaches it to the \`Authorization: Bearer <token>\` header for subsequent protected requests.
- **Roles**: Routes are protected by a dual-layer middleware (\`protect\` to verify the JWT signature, and \`authorize\` to verify the \`role\` matches the endpoint requirement: \`ADMIN\`, \`DOCTOR\`, or \`PATIENT\`).

### 3. Database Design
The MySQL schema uses a normalized relational model. Key tables include:
- **users**: Stores authentication credentials, roles, and Google OAuth tokens.
- **doctors**: Links to \`users\`, storing specialization, working hours, and slot durations.
- **leave_days**: Tracks doctor unavailability.
- **appointments**: The core transactional table. Stores patient/doctor relations, time slots, status (\`BOOKED\`, \`COMPLETED\`, \`CANCELLED\`), clinical notes, and AI summaries.
- **notifications**: Acts as an outbox queue for emails.
- **calendar_events**: Maps internal \`appointment_id\` uniquely to Google Calendar \`patient_event_id\` and \`doctor_event_id\`.
- **medication_reminders**: Stores parsed prescription frequencies and calculates \`next_reminder\`.

Double-booking is prevented strictly at the database level by checking overlapping time slots per doctor within an atomic database transaction.

### 4. Asynchronous & Background Processing
To ensure core clinical workflows (e.g., booking an appointment) are fast and never roll back due to external service failures, the system uses background processing via \`node-cron\`:
- **Email Notifications**: Emails (booking, cancellation, reminders) are initially logged in the database as \`PENDING\`. The backend attempts to send them inline using Nodemailer. If the SMTP server times out, the failure is caught and logged. A cron job running every 10 minutes sweeps for \`FAILED\` emails and retries up to 3 times.
- **Medication Reminders**: A daily cron job parses prescription text (e.g., "twice daily" -> 12 hours) and saves the interval. A subsequent job sweeps for due reminders and dispatches emails.

### 5. Third-Party Integrations
- **AI Integration (LLM)**: Integrated securely in the backend. When an appointment is booked, a pre-visit summary is generated from patient symptoms. Upon completion, a post-visit summary is generated from clinical notes. The backend implements graceful degradation: if the LLM is unavailable or fails, it saves a fallback message without breaking the transaction.
- **Google Calendar (OAuth 2.0)**: Patients and doctors can independently link their Google Calendars natively. OAuth tokens are stored in the database. When an appointment is created, rescheduled, or cancelled, the backend UPSERTs the Google Event IDs into \`calendar_events\` to maintain exactly one mapping row, safely targeting the specific user's OAuth scope.

### 6. Frontend Architecture
The React frontend isolates logic by role:
- **Routing**: React Router protects route trees (e.g., \`/patient/*\`, \`/doctor/*\`) based on the authenticated context.
- **State Management**: Centralized Context API (or local state) is used to manage the JWT and user profile.
- **UI/UX**: Tailwind CSS provides a professional, responsive, healthcare-themed interface (clean white spaces, teal/blue accents). The UI provides granular error handling, empty states, and loading spinners so users are never left guessing when API calls are processing.

### 7. Key Design Decisions & Trade-offs
- **MySQL over NoSQL**: Chosen to leverage ACID transactions and strict relational constraints, which are critical for preventing double-bookings.
- **Cron Jobs over Dedicated Message Brokers**: To reduce deployment complexity and avoid over-engineering (e.g., RabbitMQ, Redis) for a fast-deadline project, standard \`node-cron\` loops polling a robust database schema safely emulate background queues.
- **Silent Failures for External APIs**: The decision to swallow external errors (LLM timeouts, SMTP failures) and rely on outbox polling ensures the primary healthcare objective—securing the doctor's time slot—always succeeds.
