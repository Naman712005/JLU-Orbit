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

    if (!original) return alert("Please confirm originality!");
    const token = getAuthToken();
    if (!token) return alert("Login first");

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
        alert("Research added successfully!");
        researchModal.classList.add("hidden");
        researchForm.reset();
        loadResearchList();
      } else {
        alert(data.message || "Error adding research.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
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
        <div class="bg-white p-4 rounded-lg shadow mb-4">
          <h3 class="font-bold text-lg">${r.title}</h3>
          <p class="text-gray-600 italic">${r.abstract}</p>
          <p class="text-gray-700 mt-2">${r.content}</p>
          <p class="text-sm text-gray-500 mt-2">Keywords: ${r.keywords.join(
            ", "
          )}</p>
          <p class="text-xs text-gray-400 mt-2">Submitted by: ${
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
                class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Edit</button>
              <button onclick="deleteResearch('${r._id}')" 
                class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
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
  if (!token) return alert("Login first");

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
      alert("Research updated successfully!");
      loadResearchList();
    } else {
      alert(data.error || "Error updating research.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error while updating research.");
  }
}

/* ---------------- DELETE RESEARCH ---------------- */
async function deleteResearch(id) {
  if (!confirm("Are you sure you want to delete this research?")) return;

  const token = getAuthToken();
  if (!token) return alert("Login first");

  try {
    const res = await fetch(`${API_BASE}/research/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Research deleted successfully!");
      loadResearchList();
    } else {
      alert(data.error || "Error deleting research.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error while deleting research.");
  }
}
