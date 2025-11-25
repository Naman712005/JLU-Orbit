// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

/* ---------------- RESEARCH TAB ---------------- */
async function loadResearchPage() {
  const researchSection = document.getElementById("research");

  try {
    const res = await fetch("research.html");
    if (!res.ok) throw new Error("Failed to load research.html");
    researchSection.innerHTML = await res.text();
    initResearchPage();
  } catch (err) {
    console.error(err);
    researchSection.innerHTML =
      '<p class="text-red-500">Error loading Research section.</p>';
  }
}

function initResearchPage() {
  const addResearchBtn = document.getElementById("addResearchBtn");
  const researchModal = document.getElementById("researchModal");
  const cancelResearchBtn = document.getElementById("cancelResearchBtn");
  const researchForm = document.getElementById("researchForm");

  addResearchBtn?.addEventListener("click", () =>
    researchModal.classList.remove("hidden")
  );
  cancelResearchBtn?.addEventListener("click", () =>
    researchModal.classList.add("hidden")
  );

  researchForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("researchTitle").value;
    const abstract = document.getElementById("researchAbstract").value;
    const content = document.getElementById("researchContent").value;
    const keywords = document
      .getElementById("researchKeywords")
      .value.split(",")
      .map((k) => k.trim());
    const original = document.getElementById("researchOriginal").checked;

    if (!original) return window.fcToast && fcToast("Please confirm originality", "error");
    const token = getAuthToken();
    if (!token) return window.fcToast && fcToast("Please login first", "error");

    try {
      const res = await fetch(`${API_BASE}/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          abstract,
          content,
          keywords,
          confirmOriginal: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (window.fcToast) fcToast("Research added successfully", "success");
        researchModal.classList.add("hidden");
        researchForm.reset();
        loadResearchList();
      } else {
        if (window.fcToast) fcToast(data.message || "Error adding research.", "error");
      }
    } catch (err) {
      console.error(err);
      if (window.fcToast) fcToast("Server error while adding research", "error");
    }
  });

  loadResearchList();
}

async function loadResearchList() {
  const researchContainer = document.getElementById("researchContainer");
  const token = getAuthToken();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  try {
    const res = await fetch(`${API_BASE}/research`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await res.json();
    researchContainer.innerHTML = "";

    if (!list.length)
      return (researchContainer.innerHTML =
        '<p class="text-gray-500">No research found.</p>');

    list.forEach((r) => {
      const isOwner = r.author?._id === currentUser.id;
      researchContainer.innerHTML += `
        <div class="fc-card p-4 mb-3 text-sm">
          <p class="fc-heading mb-1">${(r.keywords || []).slice(0, 3).map(k => `#${k}`).join("  ")}</p>
          <h3 class="font-semibold text-sky-50 text-base mb-1">${r.title}</h3>
          <p class="text-xs text-sky-100/80 italic mb-2">${r.abstract}</p>
          <p class="text-sky-100/90 text-xs leading-relaxed mb-2">${r.content}</p>
          <p class="text-[0.7rem] text-sky-200/70">Submitted by: ${
            r.author?.name || "User"
          }</p>

          ${
            isOwner
              ? `
            <div class="flex gap-2 mt-3">
              <button onclick="editResearch('${r._id}', '${r.title.replace(
                /'/g,
                "\\'"
              )}', '${r.abstract.replace(/'/g, "\\'")}', '${r.content.replace(
                  /'/g,
                  "\\'"
                )}', '${r.keywords.join(", ")}')" 
                class="fc-button-ghost text-xs px-3 py-1.5">Edit</button>
              <button onclick="deleteResearch('${r._id}')" 
class=\"fc-button-ghost text-xs px-3 py-1.5\"
            </div>`
              : ""
          }
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    researchContainer.innerHTML =
      '<p class="text-red-500">Failed to load research posts.</p>';
  }
}

/* ---------------- EDIT RESEARCH ---------------- */
async function editResearch(id, title, abstract, content, keywords) {
  const newTitle = prompt("Edit Title:", title);
  if (newTitle === null) return;

  const newAbstract = prompt("Edit Abstract:", abstract);
  if (newAbstract === null) return;

  const newContent = prompt("Edit Content:", content);
  if (newContent === null) return;

  const newKeywords = prompt("Edit Keywords (comma separated):", keywords);
  if (newKeywords === null) return;

  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");

  try {
    const res = await fetch(`${API_BASE}/research/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newTitle,
        abstract: newAbstract,
        content: newContent,
        keywords: newKeywords.split(",").map((k) => k.trim()),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      if (window.fcToast) fcToast("Research updated successfully", "success");
      loadResearchList();
    } else {
      if (window.fcToast) fcToast(data.error || "Error updating research.", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Server error while updating research.", "error");
  }
}

/* ---------------- DELETE RESEARCH ---------------- */
async function deleteResearch(id) {
  const ok = window.fcConfirm ? await fcConfirm("Are you sure you want to delete this research?") : window.confirm("Are you sure you want to delete this research?");
  if (!ok) return;

  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");

  try {
    const res = await fetch(`${API_BASE}/research/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      if (window.fcToast) fcToast("Research deleted successfully", "success");
      loadResearchList();
    } else {
      if (window.fcToast) fcToast(data.error || "Error deleting research.", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Server error while deleting research.", "error");
  }
}
