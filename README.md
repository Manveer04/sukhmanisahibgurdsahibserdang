# Serdang Booking — Session Availability

A lightweight, mobile-friendly website that displays session availability and lets users request bookings via WhatsApp. Data is managed entirely through a Google Sheet — no code changes required to update sessions.

---

## Architecture

```
User (Browser)
    |
    v
Static Website (GitHub Pages)
    |
    v  fetch()
Google Apps Script (Web App)
    |
    v
Google Sheets ("Sessions" tab)
```

- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Data Store**: Google Sheets (edited by staff)
- **API**: Google Apps Script exposing a JSON endpoint
- **Hosting**: GitHub Pages (free)

---

## Project Structure

```
booking-site/
  index.html              - Main page
  style.css               - Styles (light + dark mode)
  script.js               - Frontend logic
  google-apps-script.js   - Backend API (paste into Apps Script)
  README.md               - This file
```

---

## Deployment Guide

### Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the sheet tab (at the bottom) to **Sessions**.
3. Add these column headers in row 1:

| Session | Date | Time | Available | ContactPerson | WhatsAppNumber | Notes |
|---------|------|------|-----------|---------------|----------------|-------|
| 1 | 25 Jul 2026 | 10:00 AM | TRUE | Alice | 60123456789 | |
| 2 | 25 Jul 2026 | 2:00 PM | FALSE | Bob | 60198765432 | Reserved |

**Rules for staff:**
- `Available` must be `TRUE` or `FALSE` (not Yes/No).
- `Date` format: `DD Mon YYYY` (e.g., `25 Jul 2026`).
- `Time` format: `HH:MM AM/PM` (e.g., `10:00 AM`).
- `WhatsAppNumber` should include country code with no spaces or dashes (e.g., `60123456789`).

---

### Step 2: Create the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Paste the entire contents of `google-apps-script.js` into the editor.
4. Click the **Save** icon.

---

### Step 3: Deploy the Apps Script as a Web App

1. Click **Deploy** > **New deployment**.
2. Click the gear icon and select **Web app**.
3. Fill in:
   - **Description**: `Session Availability API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
6. Click **Done**.

> **Important**: Every time you change who has access, you must create a new deployment.

---

### Step 4: Update the Frontend with the Web App URL

1. Open `script.js` in a text editor.
2. Find this line near the top:
   ```js
   const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
   ```
3. Replace it with your actual Web App URL:
   ```js
   const API_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
   ```
4. Save the file.

---

### Step 5: Publish the Site with GitHub Pages

1. Create a new repository on GitHub (e.g., `serdang-booking`).
2. Upload all files from the `booking-site/` folder to the repository.
3. Go to **Settings** > **Pages**.
4. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**.
6. Your site will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

---

### Step 6: Verify Everything Works

1. Open the live website URL in your browser.
2. Confirm that the sessions from your Google Sheet are displayed.
3. Edit a session in the Google Sheet (change `Available` from `TRUE` to `FALSE`).
4. Wait up to 30 seconds — the site auto-refreshes.
5. Confirm the change appears on the website.
6. Click a **Book via WhatsApp** button and verify the pre-filled message opens correctly.

---

## How to Update Bookings (For Staff)

1. Open the Google Sheet.
2. Find the session row.
3. Change the `Available` column:
   - `TRUE` = session is open for booking
   - `FALSE` = session is booked/reserved
4. Optionally update the `Notes` column.
5. Changes appear on the website within 30 seconds.

That is all. No code changes. No redeployment.

---

## Customisation

### Change the Company Name

In `index.html`, edit:
```html
<h1>Serdang Booking</h1>
<span class="subtitle">Session Availability</span>
```

### Change the Logo

In `style.css`, the `.logo` class controls the logo appearance. Replace with an `<img>` tag in `index.html` if needed.

### Change the Auto-Refresh Interval

In `script.js`, change:
```js
const REFRESH_INTERVAL = 30000; // 30 seconds
```

### Change WhatsApp Message Format

In `script.js`, edit the `buildWhatsAppUrl` function.

---

## Troubleshooting

### "Unable to load latest session information"

- Open the Web App URL directly in your browser. You should see JSON data.
- If you see an error, check that the sheet is named **Sessions** (exact spelling).
- Make sure you deployed the Apps Script with access set to **Anyone**.
- Try creating a **new deployment** after any permission changes.

### Sessions not updating

- Google Apps Script may cache results for a few minutes. This is normal.
- Verify the sheet name is exactly `Sessions`.
- Check that `Available` values are `TRUE` or `FALSE` (not `True`/`False`).

### WhatsApp button not working

- Ensure `WhatsAppNumber` includes the country code (e.g., `60123456789`).
- Remove any spaces, dashes, or special characters from the number.

### Dark mode not working

- The site respects your system's dark/light preference by default.
- Click the sun/moon toggle in the header to override.

---

## Security

- The Google Sheet is **not** publicly accessible.
- Data is only served through the Apps Script Web App endpoint.
- No API keys or secrets are exposed in the frontend.
- The Apps Script runs with your Google account permissions but only reads data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6) |
| API | Google Apps Script |
| Database | Google Sheets |
| Hosting | GitHub Pages |
| Version Control | Git / GitHub |
