/**
 * Google Apps Script — Session Availability API
 *
 * This script reads data from the "Sessions" sheet
 * and returns it as JSON via a Web App endpoint.
 *
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire file into Code.gs
 * 4. Save and deploy as a Web App
 */

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

    // Skip completely empty rows
    const isEmpty = row.every(function (cell) {
      return cell === "" || cell === null || cell === undefined;
    });
    if (isEmpty) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }

    sessions.push({
      session: obj["Session"] || i,
      date: String(obj["Date"] || ""),
      time: String(obj["Time"] || ""),
      available: obj["Available"] === true || String(obj["Available"]).toUpperCase() === "TRUE",
      contact: String(obj["ContactPerson"] || ""),
      whatsapp: String(obj["WhatsAppNumber"] || ""),
      notes: String(obj["Notes"] || ""),
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(sessions))
    .setMimeType(ContentService.MimeType.JSON);
}
