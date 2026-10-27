
const { addClinicAppointment } = require("../lib/calendar");
const db = require("../lib/db");

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
    // clinic staff before allowing approval.

    const [rows] = await db.execute(
      `SELECT id, service_name, appointment_date,
              start_time, end_time, status
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

    if (appointment.status !== "Pending") {
      return res.status(409).json({
        error: "Appointment is not pending"
      });
    }

    // Create the Google Calendar event.
    const result = await addClinicAppointment({
      service: appointment.service_name,
      date: String(appointment.appointment_date).slice(0, 10),
      startTime: String(appointment.start_time).slice(0, 8).slice(0, 5),
      endTime: String(appointment.end_time).slice(0, 8).slice(0, 5)
    });

    const eventId = result.data.id;

    // Save approval status and Google Calendar event ID.
    await db.execute(
      `UPDATE appointments
       SET status = ?, google_calendar_event_id = ?
       WHERE id = ? AND status = ?`,
      ["Approved", eventId, appointmentId, "Pending"]
    );

    return res.status(200).json({
      message: "Appointment approved and added to Google Calendar",
      eventId
    });

  } catch (error) {
    console.error("Approval error:", error);

    return res.status(500).json({
      error: "Could not approve appointment. Please try again."
    });
  }
};
