// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
document.getElementById("navUser").textContent = (currentUser.username || "U")
  .slice(0, 2)
  .toUpperCase();

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
