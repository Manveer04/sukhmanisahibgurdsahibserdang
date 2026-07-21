/**
 * Session Availability - Frontend Logic
 *
 * Fetches session data from a Google Apps Script endpoint,
 * renders session cards with filters, and handles WhatsApp redirect
 * via a contact chooser modal.
 */

(function () {
  "use strict";

  // ========================================
  // CONFIGURATION
  // ========================================

  const API_URL = "https://script.google.com/macros/s/AKfycbxwV9ANji2j-Aq2wckCl0nWYRQgzT-Mywa0PL-5XdZzBK4wa6LBnQscYdaWeTZNpU4r/exec";
  const REFRESH_INTERVAL = 30000;

  const CONTACTS = [
    {
      name: "Balwant Singh",
      role: "President",
      phone: "60162471757",
      display: "+6016-2471757",
    },
    {
      name: "Giani Sajanpreet Singh",
      role: "Giani",
      phone: "601121324796",
      display: "+6011-21324796",
    },
  ];

  const WHATSAPP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  // ========================================
  // DOM REFERENCES
  // ========================================

  const $loading = document.getElementById("loading");
  const $error = document.getElementById("error");
  const $noSessions = document.getElementById("no-sessions");
  const $grid = document.getElementById("sessions-grid");
  const $lastUpdated = document.getElementById("last-updated");
  const $themeToggle = document.getElementById("theme-toggle");
  const $filterDate = document.getElementById("filter-date");
  const $filterTime = document.getElementById("filter-time");
  const $filterAvailable = document.getElementById("filter-available");
  const $modal = document.getElementById("whatsapp-modal");
  const $modalClose = document.getElementById("modal-close");
  const $modalInfo = document.getElementById("modal-session-info");
  const $qrModal = document.getElementById("qr-modal");
  const $qrModalClose = document.getElementById("qr-modal-close");
  const $btnShowQr = document.getElementById("btn-show-qr");

  // ========================================
  // STATE
  // ========================================

  let allSessions = [];
  let previousData = null;
  let currentSession = null;

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
  // DATE SORTING
  // ========================================

  const TIME_ORDER = { "9-11am": 0, "12-2pm": 1, "3-5pm": 2 };
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"];

  function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    var s = String(dateStr).trim();
    // Handle ISO format (from JSON.stringify of Date objects)
    if (s.indexOf("T") !== -1 || s.match(/^\d{4}-\d{2}-\d{2}/)) {
      var d = new Date(s);
      return isNaN(d.getTime()) ? new Date(0) : d;
    }
    // Handle M/D/YYYY
    var parts = s.split("/");
    if (parts.length === 3) {
      var month = parseInt(parts[0], 10) - 1;
      var day = parseInt(parts[1], 10);
      var year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return new Date(0);
  }

  function formatDisplayDate(dateStr) {
    var d = parseDate(dateStr);
    if (d.getTime() === 0) return dateStr || "";
    var day = d.getDate();
    var suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    return DAYS[d.getDay()] + " " + day + suffix + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function formatFilterDate(dateStr) {
    var d = parseDate(dateStr);
    if (d.getTime() === 0) return dateStr || "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function sortSessions(sessions) {
    return [...sessions].sort(function (a, b) {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = TIME_ORDER[a.timeSlot] !== undefined ? TIME_ORDER[a.timeSlot] : 99;
      const timeB = TIME_ORDER[b.timeSlot] !== undefined ? TIME_ORDER[b.timeSlot] : 99;
      return timeA - timeB;
    });
  }

  // ========================================
  // FILTERS
  // ========================================

  function populateDateFilter(sessions) {
    const dates = [];
    const seen = {};
    sessions.forEach(function (s) {
      if (!seen[s.date]) {
        seen[s.date] = true;
        dates.push(s.date);
      }
    });

    dates.sort(function (a, b) {
      return parseDate(a).getTime() - parseDate(b).getTime();
    });

    const current = $filterDate.value;
    $filterDate.innerHTML = '<option value="all">All Dates</option>';
    dates.forEach(function (d) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = formatFilterDate(d);
      $filterDate.appendChild(opt);
    });

    // Restore previous selection if still valid
    if (current && current !== "all") {
      const stillExists = dates.indexOf(current) !== -1;
      $filterDate.value = stillExists ? current : "all";
    }
  }

  function getFilteredSessions() {
    const dateVal = $filterDate.value;
    const timeVal = $filterTime.value;
    const availOnly = $filterAvailable.checked;

    return sortSessions(allSessions).filter(function (s) {
      if (dateVal !== "all" && s.date !== dateVal) return false;
      if (timeVal !== "all" && s.timeSlot !== timeVal) return false;
      if (availOnly && !s.available) return false;
      return true;
    });
  }

  // ========================================
  // WHATSAPP
  // ========================================

  var TIME_DISPLAY = {
    "9-11am": "9:00\u201311:00 a.m.",
    "12-2pm": "12:00\u20132:00 p.m.",
    "3-5pm": "3:00\u20135:00 p.m.",
  };

  function formatMessageDate(dateStr) {
    var d = parseDate(dateStr);
    if (d.getTime() === 0) return dateStr || "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function buildWhatsAppUrl(phone, message) {
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }

  function buildBookingMessage(session) {
    var displayTime = TIME_DISPLAY[session.timeSlot] || session.timeSlot;
    return [
      "WJKK, WJKF",
      "",
      "I would like to book the following Sukhmani Sahib session:",
      "",
      "Session No.: " + session.sessionNo,
      "Date: " + formatMessageDate(session.date),
      "Time: " + displayTime,
      "",
      "Please let me know whether this slot is still available. Thank you.",
    ].join("\n");
  }

  // ========================================
  // MODAL
  // ========================================

  function openModal(session) {
    currentSession = session;
    $modalInfo.innerHTML =
      "<strong>Session " + escapeHtml(session.sessionNo) + "</strong><br>" +
      escapeHtml(formatDisplayDate(session.date)) + " &middot; " + escapeHtml(session.timeSlot);
    $modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $modal.hidden = true;
    document.body.style.overflow = "";
    currentSession = null;
  }

  function openQrModal() {
    $qrModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeQrModal() {
    $qrModal.hidden = true;
    document.body.style.overflow = "";
  }

  function handleContactClick(contact) {
    if (!currentSession) return;
    const msg = buildBookingMessage(currentSession);
    const url = buildWhatsAppUrl(contact.phone, msg);
    window.open(url, "_blank", "noopener noreferrer");
    closeModal();
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

  function createSessionCard(session) {
    const card = document.createElement("div");
    card.className = "session-card fade-in";
    card.setAttribute("data-session", session.sessionNo);

    const isAvailable = session.available;
    const badgeClass = isAvailable ? "badge-available" : "badge-booked";
    const badgeText = isAvailable ? "\u{1F7E2} Available" : "\u{1F534} Booked";

    let notesHtml = "";
    if (session.notes && session.notes.trim() !== "") {
      notesHtml = '<div class="notes-row">' + escapeHtml(session.notes) + "</div>";
    }

    let actionsHtml;
    if (isAvailable) {
      actionsHtml =
        '<button class="btn-whatsapp" data-session-id="' + escapeHtml(String(session.sessionNo)) + '">' +
        WHATSAPP_SVG +
        "    Book via WhatsApp" +
        "  </button>";
    } else {
      actionsHtml = '<div class="booked-label">This session is fully booked</div>';
    }

    card.innerHTML =
      '<div class="card-header">' +
      '  <span class="session-number">Session ' + escapeHtml(session.sessionNo) + "</span>" +
      '  <span class="badge ' + badgeClass + '">' + badgeText + "</span>" +
      "</div>" +
      '<div class="card-details">' +
      '  <div class="detail-row">' +
      '    <span class="detail-label">Date</span>' +
      '    <span class="detail-value">' + escapeHtml(formatDisplayDate(session.date)) + "</span>" +
      "  </div>" +
      '  <div class="detail-row">' +
      '    <span class="detail-label">Time</span>' +
      '    <span class="detail-value">' + escapeHtml(session.timeSlot || "Not set") + "</span>" +
      "  </div>" +
      notesHtml +
      "</div>" +
      '<div class="card-actions">' +
      actionsHtml +
      "</div>";

    return card;
  }

  function renderSessions() {
    $grid.innerHTML = "";
    const filtered = getFilteredSessions();

    if (filtered.length === 0) {
      showView("no-sessions");
      return;
    }

    filtered.forEach(function (session) {
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

      if (data.error) {
        throw new Error(data.error);
      }

      allSessions = data.map(function (item) {
        return {
          sessionNo: String(item.sessionNo || ""),
          date: item.date || "",
          timeSlot: item.timeSlot || "",
          available:
            item.available === true ||
            item.available === "TRUE" ||
            item.available === "true",
          notes: item.notes || "",
        };
      });

      if (dataHasChanged(allSessions)) {
        populateDateFilter(allSessions);
        renderSessions();
        previousData = allSessions;
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

    // Theme toggle
    $themeToggle.addEventListener("click", toggleTheme);

    // Filter listeners
    $filterDate.addEventListener("change", renderSessions);
    $filterTime.addEventListener("change", renderSessions);
    $filterAvailable.addEventListener("change", renderSessions);

    // Modal close
    $modalClose.addEventListener("click", closeModal);
    $modal.addEventListener("click", function (e) {
      if (e.target === $modal) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (!$qrModal.hidden) closeQrModal();
        else if (!$modal.hidden) closeModal();
      }
    });

    // QR modal
    $btnShowQr.addEventListener("click", openQrModal);
    $qrModalClose.addEventListener("click", closeQrModal);
    $qrModal.addEventListener("click", function (e) {
      if (e.target === $qrModal) closeQrModal();
    });

    // Contact buttons
    document.getElementById("contact-balwant").addEventListener("click", function () {
      handleContactClick(CONTACTS[0]);
    });
    document.getElementById("contact-sajanpreet").addEventListener("click", function () {
      handleContactClick(CONTACTS[1]);
    });

    // WhatsApp button delegation
    $grid.addEventListener("click", function (e) {
      const btn = e.target.closest(".btn-whatsapp");
      if (!btn) return;
      const sessionNo = btn.getAttribute("data-session-id");
      const session = allSessions.find(function (s) {
        return s.sessionNo === sessionNo;
      });
      if (session && session.available) {
        openModal(session);
      }
    });

    // Initial fetch + auto-refresh
    fetchSessions();
    setInterval(fetchSessions, REFRESH_INTERVAL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
