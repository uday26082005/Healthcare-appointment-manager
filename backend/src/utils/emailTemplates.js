// backend/src/utils/emailTemplates.js

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; color: #333333;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0ea5e9; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">HealthSync</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                Thank you for choosing HealthSync for your healthcare needs.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const detailsCard = (details) => {
  let cardHtml = '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin: 25px 0; padding: 20px;">';
  
  for (const [key, value] of Object.entries(details)) {
    if (value) {
      cardHtml += `
        <tr>
          <td width="35%" style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">${key}:</td>
          <td width="65%" style="padding: 8px 0; font-size: 15px; color: #1e293b; font-weight: 600;">${value}</td>
        </tr>
      `;
    }
  }
  
  cardHtml += '</table>';
  return cardHtml;
};

const appointmentConfirmation = ({ patientName, doctorName, specialization, date, startTime, endTime }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Appointment Confirmed</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Hello ${patientName || 'Patient'},</p>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Your appointment has been successfully booked. Here are your appointment details:</p>
    
    ${detailsCard({
      'Doctor': doctorName ? `Dr. ${doctorName}` : '',
      'Specialization': specialization || '',
      'Date': date || '',
      'Time': (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || '')
    })}
    
    <p style="font-size: 16px; line-height: 1.5; color: #475569; margin-bottom: 0;">Please arrive 10 minutes early. We look forward to seeing you.</p>
  `;
  return baseTemplate('Appointment Confirmation - HealthSync', content);
};

const appointmentRescheduled = ({ patientName, doctorName, specialization, date, startTime, endTime }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Appointment Rescheduled</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Hello ${patientName || 'Patient'},</p>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Your appointment has been successfully rescheduled. Please review your updated appointment details below:</p>
    
    ${detailsCard({
      'Doctor': doctorName ? `Dr. ${doctorName}` : '',
      'Specialization': specialization || '',
      'Date': date || '',
      'Time': (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || '')
    })}
  `;
  return baseTemplate('Appointment Rescheduled - HealthSync', content);
};

const appointmentCancelled = ({ patientName, doctorName, specialization, date, startTime, endTime }) => {
  const content = `
    <h2 style="margin-top: 0; color: #dc2626; font-size: 20px;">Appointment Cancelled</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Hello ${patientName || 'Patient'},</p>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Your upcoming appointment has been cancelled.</p>
    
    ${detailsCard({
      'Doctor': doctorName ? `Dr. ${doctorName}` : '',
      'Specialization': specialization || '',
      'Date': date || '',
      'Time': (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || '')
    })}
    
    <p style="font-size: 16px; line-height: 1.5; color: #475569; margin-bottom: 0;">If you need to rebook, please visit the HealthSync portal to schedule a new appointment.</p>
  `;
  return baseTemplate('Appointment Cancelled - HealthSync', content);
};

const appointmentReminder = ({ patientName, doctorName, specialization, date, startTime, endTime }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Appointment Reminder</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Hello ${patientName || 'Patient'},</p>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">This is a friendly reminder for your upcoming appointment.</p>
    
    ${detailsCard({
      'Doctor': doctorName ? `Dr. ${doctorName}` : '',
      'Specialization': specialization || '',
      'Date': date || '',
      'Time': (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || '')
    })}
    
    <p style="font-size: 16px; line-height: 1.5; color: #475569; margin-bottom: 0;">Please ensure you arrive on time.</p>
  `;
  return baseTemplate('Appointment Reminder - HealthSync', content);
};

const medicationReminder = ({ patientName, medication, date, time }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0ea5e9; font-size: 20px;">Medication Reminder</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">Hello ${patientName || 'Patient'},</p>
    <p style="font-size: 16px; line-height: 1.5; color: #475569;">This is your scheduled medication reminder.</p>
    
    ${detailsCard({
      'Date': date || '',
      'Time': time || '',
      'Instructions': medication ? medication.replace(/\n/g, '<br>') : ''
    })}
    
    <p style="font-size: 16px; line-height: 1.5; color: #475569; margin-bottom: 0;">Please take your medication as prescribed by your doctor.</p>
  `;
  return baseTemplate('Medication Reminder - HealthSync', content);
};

module.exports = {
  appointmentConfirmation,
  appointmentRescheduled,
  appointmentCancelled,
  appointmentReminder,
  medicationReminder
};
