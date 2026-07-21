/**
 * Google Apps Script — Session Availability API
 *
 * Reads data from the "Sessions" sheet and returns JSON.
 *
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this into Code.gs
 * 4. Save and deploy as Web App
 *
 * Sheet columns (row 1 headers):
 *   Session No | Date | TimeSlot | Available | Notes
 *
 * Date can be entered as M/D/YYYY (e.g. 7/25/2026).
 * You may add extra columns for internal records — they are ignored by the website.
 */

function formatDate(value) {
  if (value instanceof Date) {
    return (value.getMonth() + 1) + "/" + value.getDate() + "/" + value.getFullYear();
  }
  return String(value || "");
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sessions");

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Sheet 'Sessions' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0].map(function (h) {
    return String(h).trim();
  });

  const sessions = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const isEmpty = row.every(function (cell) {
      return cell === "" || cell === null || cell === undefined;
    });
    if (isEmpty) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }

    var session = {
      sessionNo: String(obj["Session No"] || i),
      date: formatDate(obj["Date"]),
      timeSlot: String(obj["TimeSlot"] || ""),
      available: obj["Available"] === true || String(obj["Available"]).toUpperCase() === "TRUE",
      notes: String(obj["Notes"] || ""),
    };

    sessions.push(session);
  }

  return ContentService
    .createTextOutput(JSON.stringify(sessions))
    .setMimeType(ContentService.MimeType.JSON);
}
