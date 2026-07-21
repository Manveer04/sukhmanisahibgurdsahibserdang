# Serdang Booking — Session Availability

A lightweight, mobile-friendly website that displays session availability and lets users request bookings via WhatsApp. Data is managed entirely through a Google Sheet.

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

| Session No | Date | TimeSlot | Available | Notes | Location |
|------------|------|----------|-----------|-------|----------|
| 1 | 7/25/2026 | 9-11am | TRUE | | Hall A |
| 2 | 7/25/2026 | 12-2pm | FALSE | Reserved | |
| 3 | 7/25/2026 | 3-5pm | TRUE | | Hall B |
| 4 | 7/28/2026 | 9-11am | TRUE | | |

**Rules for staff:**

- `Session No`: Simple number (1, 2, 3, etc.)
- `Date`: Format as `M/D/YYYY` (e.g., `7/25/2026` for 25 July 2026)
- `TimeSlot`: Must be exactly one of: `9-11am`, `12-2pm`, `3-5pm`
- `Available`: `TRUE` or `FALSE`
- `Notes`: Optional text shown on the card
- **Extra columns**: You can add any additional columns after Notes for internal records (e.g., `Location`, `Instructor`, `Price`). These will not appear on the website.

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
5. **Copy the Web App URL** -- it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
6. Click **Done**.

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
2. Confirm that sessions from your Google Sheet are displayed.
3. Edit a session in the Google Sheet (change `Available` from `TRUE` to `FALSE`).
4. Wait up to 30 seconds -- the site auto-refreshes.
5. Confirm the change appears on the website.
6. Click **Book via WhatsApp** on an available session, choose a contact, and verify the pre-filled message opens in WhatsApp.

---

## How to Update Bookings (For Staff)

1. Open the Google Sheet.
2. Find the session row.
3. Change the `Available` column:
   - `TRUE` = session is open for booking
   - `FALSE` = session is booked/reserved
4. Optionally update the `Notes` column.
5. Changes appear on the website within 30 seconds.

---

## Features

- **Filter by date** -- dropdown populates automatically from sheet data
- **Filter by time slot** -- 9-11am, 12-2pm, 3-5pm
- **Available only toggle** -- default ON, hides booked sessions
- **Contact chooser** -- user picks Balwant Singh (President) or Giani Sajanpreet Singh before WhatsApp opens
- **Dark mode** -- respects system preference, toggle in header
- **Auto-refresh** -- every 30 seconds
- **Mobile-first** -- responsive grid (1/2/3 columns)

---

## Customisation

### Change Company Name

In `index.html`, edit:
```html
<h1>Serdang Booking</h1>
<span class="subtitle">Session Availability</span>
```

### Change WhatsApp Contacts

In `script.js`, edit the `CONTACTS` array:
```js
const CONTACTS = [
  { name: "Balwant Singh", role: "President", phone: "60162471757", display: "+6016-2471757" },
  { name: "Giani Sajanpreet Singh", role: "Giani", phone: "601121324736", display: "+6011-21324736" },
];
```

### Change WhatsApp Message Format

In `script.js`, edit the `buildBookingMessage` function.

### Change Auto-Refresh Interval

In `script.js`:
```js
const REFRESH_INTERVAL = 30000; // 30 seconds
```

---

## Troubleshooting

### "Unable to load latest session information"

- Open the Web App URL directly in your browser. You should see JSON data.
- If you see an error, check that the sheet is named **Sessions** (exact spelling).
- Make sure you deployed the Apps Script with access set to **Anyone**.
- Try creating a **new deployment** after any permission changes.

### Sessions not updating

- Google Apps Script may cache results for a few minutes.
- Verify the sheet name is exactly `Sessions`.
- Check that `Available` values are `TRUE` or `FALSE`.

### WhatsApp button not working

- Ensure `TimeSlot` is one of the three valid values.
- The contact chooser should appear when clicking Book via WhatsApp.

---

## Security

- The Google Sheet is **not** publicly accessible.
- Data is only served through the Apps Script Web App endpoint.
- No API keys or secrets are exposed in the frontend.
