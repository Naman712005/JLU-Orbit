// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
const navUserEl = document.getElementById("navUser");
if (navUserEl) {
  navUserEl.textContent = (currentUser.username || currentUser.name || "U")
    .slice(0, 2)
    .toUpperCase();
}

// ---------- THEME TOGGLE ----------
(function initTheme() {
  const stored = localStorage.getItem("fc-theme");
  const root = document.documentElement;
  const initial = stored === "dark" || stored === "light" ? stored : "light";
  root.setAttribute("data-theme", initial);
  const body = document.body;
  if (!body.classList.contains("fc-body")) body.classList.add("fc-body");

  const btn = document.getElementById("themeToggleBtn");
  const mobileBtn = document.getElementById("mobileThemeToggleBtn");

  function syncIcon(theme) {
    const iconClass = theme === "dark" ? "fa-sun" : "fa-moon";
    const oppositeClass = theme === "dark" ? "fa-moon" : "fa-sun";
    [btn, mobileBtn].forEach((el) => {
      if (!el) return;
      const i = el.querySelector("i");
      if (!i) return;
      i.classList.remove(oppositeClass);
      i.classList.add(iconClass);
    });
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("fc-theme", next);
    syncIcon(next);
  }

  syncIcon(initial);
  btn && btn.addEventListener("click", toggleTheme);
  mobileBtn && mobileBtn.addEventListener("click", toggleTheme);
})();

// ---------- TOAST & CONFIRM HELPERS ----------
window.fcToast = function fcToast(message, type = "info") {
  const container = document.getElementById("fc-toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "fc-toast " + (type === "success" ? "fc-toast--success" : type === "error" ? "fc-toast--error" : "");
  const icon = type === "success" ? "fa-check-circle" : type === "error" ? "fa-circle-xmark" : "fa-circle-info";
  el.innerHTML = `<i class="fa ${icon} mt-0.5 text-sky-300"></i><div>${escapeHtml(String(message))}</div>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px) scale(0.97)";
    setTimeout(() => el.remove(), 180);
  }, 2600);
};

window.fcConfirm = function fcConfirm(message) {
  return new Promise((resolve) => {
    const backdrop = document.getElementById("fc-confirm-backdrop");
    const msgEl = document.getElementById("fc-confirm-message");
    const okBtn = document.getElementById("fc-confirm-ok");
    const cancelBtn = document.getElementById("fc-confirm-cancel");
    if (!backdrop || !msgEl || !okBtn || !cancelBtn) {
      const fallback = window.confirm(message);
      return resolve(!!fallback);
    }
    msgEl.textContent = message;
    backdrop.classList.add("active");

    function cleanup(result) {
      backdrop.classList.remove("active");
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      backdrop.removeEventListener("click", onBackdrop);
      resolve(result);
    }

    function onOk(e) {
      e.stopPropagation();
      cleanup(true);
    }
    function onCancel(e) {
      e.stopPropagation();
      cleanup(false);
    }
    function onBackdrop(e) {
      if (e.target === backdrop) cleanup(false);
    }

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onBackdrop);
  });
};

/* ---------------- HELPER: GET VALID AUTH TOKEN ---------------- */
function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

function showTab(tab) {
  ["feed", "profile", "groups", "research", "search"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(tab).classList.remove("hidden");

  if (tab === "groups") loadGroups();
  if (tab === "research") loadResearchPage();
  if (tab === "profile") loadProfilePage(); // ✅ load profile dynamically
}

showTab("feed");

function openPostModal() {
  document.getElementById("postModal").classList.remove("hidden");
}
function closePostModal() {
  document.getElementById("postModal").classList.add("hidden");
}


function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "auth.html";
}

// Mobile Menu Toggle Functions
function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}

function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.classList.add("hidden");
  }
}


function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Hook navbar click
document
  .querySelector("li[onclick*='research']")
  .addEventListener("click", () => {
    showTab("research");
    loadResearchPage();
  });


  // Wait for DOM to load before attaching listeners
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      // Switch to profile tab (the tab where profile.html is loaded dynamically)
      showTab("profile");
      loadProfilePage(); // fetch and display profile.html
    });
  }
});

// Connect socket.io to same origin if the client library is loaded.
// This avoids runtime errors when /socket.io/socket.io.js is not included.
let socket = null;
if (typeof io !== 'undefined') {
  const socketOrigin = (window.__CONFIG__ && window.__CONFIG__.API_BASE)
    ? window.__CONFIG__.API_BASE.replace(/\/api\/?$/, '')
    : '';
  socket = socketOrigin ? io(socketOrigin) : io(); // io() => same origin

  socket.on("connect", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    socket.emit("register", currentUser?.id);
  });

  socket.on("notification", payload => {
    // Refresh notifications list and update badge in realtime
    console.log("notification", payload);
    if (typeof loadNotifications === "function") {
      loadNotifications();
    }
    const badge = document.getElementById("notifBadge");
    if (badge) {
      // If badge is hidden or empty, set to 1; otherwise increment
      const current = parseInt(badge.textContent || "0", 10) || 0;
      badge.textContent = String(current + 1);
      badge.classList.remove("hidden");
    }
  });

  socket.on("postUpdated", post => { /* update feed DOM if desired */ });
  socket.on("likeUpdate", data => { /* update like count if desired */ });
} else {
  console.warn('Socket.io client not loaded; realtime features disabled.');
}
