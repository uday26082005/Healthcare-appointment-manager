CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  specialization VARCHAR(255) NOT NULL,
  working_start TIME NOT NULL, -- e.g., '09:00:00'
  working_end TIME NOT NULL,   -- e.g., '17:00:00'
  slot_duration INT NOT NULL,  -- in minutes, e.g., 30
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  leave_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE(doctor_id, leave_date)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('BOOKED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'BOOKED',
  symptoms TEXT,
  ai_previsit_summary TEXT,
  urgency_level ENUM('Low', 'Medium', 'High'),
  chief_complaint VARCHAR(255),
  suggested_questions TEXT, -- Stored as JSON array string
  doctor_notes TEXT,
  prescription TEXT,
  ai_postvisit_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  -- Double booking prevention constraint
  UNIQUE(doctor_id, appointment_date, start_time)
);

CREATE TABLE IF NOT EXISTS slot_holds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  hold_date DATE NOT NULL,
  start_time TIME NOT NULL,
  patient_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(doctor_id, hold_date, start_time)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_event_id VARCHAR(255),
  doctor_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  recipient_id INT NOT NULL,
  notification_type ENUM('BOOKING', 'REMINDER', 'CANCELLATION') NOT NULL,
  status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  last_error TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medication_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  medication VARCHAR(255) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  next_reminder TIMESTAMP NOT NULL,
  status ENUM('ACTIVE', 'STOPPED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);
