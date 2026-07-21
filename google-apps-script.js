/**
 * Google Apps Script - Session Availability API
 *
 * Reads data from the "Sessions" sheet and returns JSON.
 *
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this into Code.gs
 * 4. Save and deploy as Web App
 *
 * Required columns (row 1 headers):
 *   Session No | Date | TimeSlot | Available | Notes
 *
 * You may add extra columns for internal records - they are ignored.
 * Column name matching is case-insensitive and ignores extra spaces.
 */

function formatDate(value) {
  if (value === "" || value === null || value === undefined) return "";
  if (value instanceof Date) {
    return (value.getMonth() + 1) + "/" + value.getDate() + "/" + value.getFullYear();
  }
  return String(value).trim();
}

function findHeader(headers, name) {
  var normalised = name.toLowerCase().replace(/\s+/g, "");
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().replace(/\s+/g, "") === normalised) {
      return headers[i];
    }
  }
  return null;
}

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sessions");

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Sheet 'Sessions' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rawHeaders = data[0].map(function (h) {
    return String(h).trim();
  });

  var hSessionNo = findHeader(rawHeaders, "Session No") || findHeader(rawHeaders, "SessionNo");
  var hDate = findHeader(rawHeaders, "Date");
  var hTimeSlot = findHeader(rawHeaders, "TimeSlot") || findHeader(rawHeaders, "Time Slot");
  var hAvailable = findHeader(rawHeaders, "Available");
  var hNotes = findHeader(rawHeaders, "Notes");

  var sessions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    var isEmpty = row.every(function (cell) {
      return cell === "" || cell === null || cell === undefined;
    });
    if (isEmpty) continue;

    var session = {
      sessionNo: String(hSessionNo ? row[rawHeaders.indexOf(hSessionNo)] : (i)),
      date: hDate ? formatDate(row[rawHeaders.indexOf(hDate)]) : "",
      timeSlot: hTimeSlot ? String(row[rawHeaders.indexOf(hTimeSlot)] || "").trim() : "",
      available: hAvailable ? (row[rawHeaders.indexOf(hAvailable)] === true || String(row[rawHeaders.indexOf(hAvailable)]).toUpperCase() === "TRUE") : false,
      notes: hNotes ? String(row[rawHeaders.indexOf(hNotes)] || "").trim() : "",
    };

    sessions.push(session);
  }

  return ContentService
    .createTextOutput(JSON.stringify(sessions))
    .setMimeType(ContentService.MimeType.JSON);
}
