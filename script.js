/**
 * Session Availability - Frontend Logic
 *
 * Fetches session data from a Google Apps Script endpoint,
 * renders session cards, and handles WhatsApp redirect.
 */

(function () {
  "use strict";

  // ========================================
  // CONFIGURATION
  // ========================================

  // Replace this with your deployed Google Apps Script Web App URL
  const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

  const REFRESH_INTERVAL = 30000;

  // ========================================
  // DOM REFERENCES
  // ========================================

  const $loading = document.getElementById("loading");
  const $error = document.getElementById("error");
  const $noSessions = document.getElementById("no-sessions");
  const $grid = document.getElementById("sessions-grid");
  const $lastUpdated = document.getElementById("last-updated");
  const $themeToggle = document.getElementById("theme-toggle");

  // ========================================
  // STATE
  // ========================================

  let previousData = null;
  let refreshTimer = null;

  // ========================================
  // DARK MODE
  // ========================================

  function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.body.classList.add("dark");
    } else if (saved === "light") {
      document.body.classList.remove("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("dark");
    }
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  }

  // ========================================
  // DATE / TIME SORTING
  // ========================================

  const MONTH_MAP = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  function parseSheetDate(dateStr) {
    const parts = dateStr.trim().split(" ");
    if (parts.length !== 3) return new Date(0);
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1]];
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || month === undefined || isNaN(year)) return new Date(0);
    return new Date(year, month, day);
  }

  function parseSheetTime(timeStr) {
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  function sortSessions(sessions) {
    return [...sessions].sort((a, b) => {
      const dateA = parseSheetDate(a.date);
      const dateB = parseSheetDate(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return parseSheetTime(a.time) - parseSheetTime(b.time);
    });
  }

  // ========================================
  // WHATSAPP URL
  // ========================================

  function buildWhatsAppUrl(session) {
    const phone = session.whatsapp.replace(/[^0-9]/g, "");
    const message = [
      "Hello,",
      "",
      "I would like to book the following session.",
      "",
      "Session: " + session.session,
      "Date: " + session.date,
      "Time: " + session.time,
      "",
      "Thank you.",
    ].join("\n");

    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }

  // ========================================
  // RENDERING
  // ========================================

  function showView(view) {
    $loading.hidden = view !== "loading";
    $error.hidden = view !== "error";
    $noSessions.hidden = view !== "no-sessions";
    $grid.hidden = view !== "grid";
  }

  function updateTimestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    $lastUpdated.textContent = "Last updated: " + h + ":" + m + ":" + s;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  const WHATSAPP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  function createSessionCard(session) {
    const card = document.createElement("div");
    card.className = "session-card fade-in";
    card.setAttribute("data-session", session.session);

    const isAvailable = session.available === true;
    const badgeClass = isAvailable ? "badge-available" : "badge-booked";
    const badgeText = isAvailable ? "\u{1F7E2} Available" : "\u{1F534} Booked";

    let notesHtml = "";
    if (session.notes && session.notes.trim() !== "") {
      notesHtml = '<div class="notes-row">' + escapeHtml(session.notes) + "</div>";
    }

    const btnDisabled = isAvailable ? "" : " disabled";

    card.innerHTML =
      '<div class="card-header">' +
      '  <span class="session-number">Session ' +
         escapeHtml(String(session.session)) +
      "</span>" +
      '  <span class="badge ' + badgeClass + '">' + badgeText + "</span>" +
      "</div>" +
      '<div class="card-details">' +
      '  <div class="detail-row">' +
      '    <span class="detail-label">Date</span>' +
      '    <span class="detail-value">' + escapeHtml(session.date) + "</span>" +
      "  </div>" +
      '  <div class="detail-row">' +
      '    <span class="detail-label">Time</span>' +
      '    <span class="detail-value">' + escapeHtml(session.time) + "</span>" +
      "  </div>" +
      '  <div class="detail-row">' +
      '    <span class="detail-label">Contact</span>' +
      '    <span class="detail-value">' + escapeHtml(session.contact) + "</span>" +
      "  </div>" +
      notesHtml +
      "</div>" +
      '<div class="card-actions">' +
      '  <a class="btn-whatsapp" href="' + buildWhatsAppUrl(session) +
      '" target="_blank" rel="noopener noreferrer"' + btnDisabled + ">" +
      WHATSAPP_SVG + "    Book via WhatsApp" +
      "  </a>" +
      "</div>";

    return card;
  }

  function renderSessions(sessions) {
    $grid.innerHTML = "";

    if (sessions.length === 0) {
      showView("no-sessions");
      return;
    }

    const sorted = sortSessions(sessions);
    sorted.forEach(function (session) {
      $grid.appendChild(createSessionCard(session));
    });

    showView("grid");
  }

  function dataHasChanged(newData) {
    return JSON.stringify(newData) !== JSON.stringify(previousData);
  }

  // ========================================
  // FETCH DATA
  // ========================================

  async function fetchSessions() {
    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
      showView("error");
      $error.querySelector("p").textContent =
        "API URL not configured. Please set the Google Apps Script Web App URL in script.js.";
      return;
    }

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      const sessions = data.map(function (item) {
        return {
          session: item.session,
          date: item.date || "",
          time: item.time || "",
          available:
            item.available === true ||
            item.available === "TRUE" ||
            item.available === "true",
          contact: item.contact || item.ContactPerson || "",
          whatsapp: item.whatsapp || item.WhatsAppNumber || "",
          notes: item.notes || item.Notes || "",
        };
      });

      if (dataHasChanged(sessions)) {
        renderSessions(sessions);
        previousData = sessions;
      }

      updateTimestamp();
    } catch (err) {
      console.error("Fetch error:", err);

      if (!previousData) {
        showView("error");
      }
    }
  }

  // ========================================
  // INIT
  // ========================================

  function init() {
    initTheme();

    $themeToggle.addEventListener("click", toggleTheme);

    fetchSessions();

    refreshTimer = setInterval(fetchSessions, REFRESH_INTERVAL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
