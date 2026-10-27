# Campus Clinic

Campus Clinic is a Flask application with a SQLite database, server-side sessions, and role-protected appointment workflows.

## Run locally on Windows

From the project folder in PowerShell, configure and trust a localhost development certificate once:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-https.ps1
```

Then start Campus Clinic with:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

The launcher creates the Python virtual environment and installs dependencies on its first run. Keep the PowerShell window open. Browse to **https://localhost:3000/**. The one-time setup adds a local development certificate authority to the current Windows user's trust store so the browser can validate the localhost certificate. The certificate files are stored under the ignored `instance` folder and are not committed.

If you need to use HTTP temporarily, start the server with `powershell -ExecutionPolicy Bypass -File .\run-local.ps1 -Http` and open `http://localhost:3000/`. HTTP does not encrypt traffic and disables Secure cookies; prefer HTTPS.

Create the initial administrator once, using a second PowerShell window in the project folder:

```powershell
.\.venv\Scripts\python.exe -m flask --app app create-admin
```

The command prompts for the initial administrator's name, school email, employee ID, and password. Usernames are generated internally; sign in with the school email. The password is entered without being echoed and must contain at least 8 characters, including a number and a symbol. It refuses to create a second initial administrator. If you already created an administrator, skip this step.

The SQLite database is created at `instance/campus_clinic.sqlite3`. All six offered services are visible to users. Default weekday schedules repeat Monday through Friday and are generated for the next 90 days, with the schedule continuing to roll forward:

| Service | Time | Slots per weekday |
| --- | --- | ---: |
| General Consultation | 8:00 AM–12:00 PM | 10 |
| Basic Health Screening | 8:00 AM–12:00 PM | 20 |
| Dental Cleaning | 1:00 PM–5:00 PM | 20 |
| Dental Consultation and Checkup | 1:00 PM–5:00 PM | 10 |
| Tooth Extraction (bunot) | 3:00 PM–5:00 PM | 10 |
| Medical Certificate / Health Assessment Request | 10:00 AM–12:00 PM | 10 |

The number of remaining slots updates as appointments are requested. Clinic Staff or Administrators can still add dated schedules from **Clinic Schedules**. An administrator can assign the Clinic Staff role under **User Management**. Public registration only permits Student and Faculty accounts.

Existing schedules for services no longer offered are deactivated at startup; existing appointment records are retained.

Clinic Personnel can check in today's approved appointments and complete visits. Completed visits remain visible in the personnel appointment queue for the rest of the day. Past time slots are not offered or bookable, and a user cannot submit duplicate active requests for the same schedule.

## Deploy to Vercel

Import the project into Vercel with the project root as the Root Directory. Vercel detects the Flask application in `app.py`; the included `vercel.json` bundles the home page, static assets, and database schema it needs. Vercel installs the Python dependencies from `requirements.txt`.

Set `CAMPUS_CLINIC_SECRET_KEY` in the Vercel project's Environment Variables to a long, random, private value before deploying. Keep it unchanged across deployments so user sessions remain valid.

**Vercel is suitable for a temporary preview of this app, not for storing real clinic data as currently implemented.** The app uses SQLite, and the Vercel function's `/tmp` database is temporary and not shared reliably between function instances. Accounts, appointments, and schedules can disappear or differ between requests. For a real deployment, first migrate the app to a persistent managed database and configure its connection; do not use the Vercel `/tmp` database for clinic records.

## Account access

- The first administrator is created through `flask --app app create-admin`, never through public registration.
- Administrators can create Clinic Staff, Clinic Personnel, and additional Administrator accounts in **User Management**, or assign roles to existing accounts there. Public registration only permits Student and Faculty accounts.
- Clinic Staff can create schedules and review pending appointments. Rejection requires a reason.
- Clinic Personnel can check in and complete today's approved visits.
- Students and Faculty can book and view only their own appointments.
- An administrator cannot accidentally deactivate or demote the last active administrator.

## Security configuration

Set `CAMPUS_CLINIC_SECRET_KEY` to a long, random, private value and keep it stable across restarts and application workers. Do not commit it to source control. The HTTPS launcher sets `CAMPUS_CLINIC_COOKIE_SECURE=1`. Use a production WSGI server and a certificate from a trusted public certificate authority for deployment; the local development certificate and Flask server are for local use only.

Passwords must contain at least 8 characters, including a number and a symbol, and are stored as Werkzeug password hashes, not plaintext. Mutating API requests require a session CSRF token. Sessions use HttpOnly and SameSite=Lax cookies. Sign-in is rate-limited after repeated failed attempts. The application does not send email verification or password-reset messages; connect a trusted campus identity/email service before using it as a public production service.

## Tests

Run the backend regression suite from the project folder:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```
