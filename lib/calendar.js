
const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      ?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
  ],
});

async function addClinicAppointment({
  service,
  date,
  startTime,
  endTime,
}) {
  const authClient = await auth.getClient();

  const calendar = google.calendar({
    version: "v3",
    auth: authClient,
  });

  return calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `Clinic Appointment: ${service}`,
      description: "Approved appointment from the Clinic Appointment System",
      start: {
        dateTime: `${date}T${startTime}:00+08:00`,
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: `${date}T${endTime}:00+08:00`,
        timeZone: "Asia/Manila",
      },
    },
  });
}

module.exports = { addClinicAppointment };
