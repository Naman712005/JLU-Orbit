
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

  const socket = io("https://fastconnect-rl5y.onrender.com");
  socket.on("connect", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")||"{}");
    socket.emit("register", currentUser?.id);
  });

  socket.on("notification", payload => {
    // show toast or refresh notifications list
    console.log("notification", payload);
  });

  socket.on("postUpdated", post => { /* update feed DOM */ });
  socket.on("likeUpdate", data => { /* update like count */ });