
const { google } = require("googleapis");
const db = require("../lib/db");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      ?.replace(/\\n/g, "\n")
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar.events"
  ]
});

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: "Appointment ID is required"
      });
    }

    // TODO: Verify that the logged-in user is authorized
    // to cancel this appointment.

    const [rows] = await db.execute(
      `SELECT id, status, google_calendar_event_id
       FROM appointments
       WHERE id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Appointment not found"
      });
    }

    const appointment = rows[0];

    if (appointment.status === "Cancelled") {
      return res.status(409).json({
        error: "Appointment is already cancelled"
      });
    }

    // Remove the linked Google Calendar event, if one exists.
    if (appointment.google_calendar_event_id) {
      const authClient = await auth.getClient();

      const calendar = google.calendar({
        version: "v3",
        auth: authClient
      });

      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: appointment.google_calendar_event_id
      });
    }

    await db.execute(
      `UPDATE appointments
       SET status = ?
       WHERE id = ?`,
      ["Cancelled", appointmentId]
    );

    return res.status(200).json({
      message: "Appointment cancelled"
    });

  } catch (error) {
    console.error("Cancellation error:", error);

    return res.status(500).json({
      error: "Could not cancel appointment. Please try again."
    });
  }
};
