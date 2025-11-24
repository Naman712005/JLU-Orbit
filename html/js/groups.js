// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

async function loadGroups() {
  const groupContainer = document.getElementById("groupContent");
  try {
    const res = await fetch("group.html");
    if (!res.ok) throw new Error("Failed to load groups");
    const html = await res.text();
    groupContainer.innerHTML = html;

    initGroupPage();
  } catch (err) {
    console.error(err);
    groupContainer.innerHTML =
      '<p class="text-red-500">Error loading Groups section.</p>';
  }
}

// ---------- REPLACE initGroupPage() and helpers with this ----------
function initGroupPage() {
  const rawCurrentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  // Normalize user id (backend might return `id` or `_id`)
  const currentUserId = String(rawCurrentUser.id || rawCurrentUser._id || "");
  let allGroups = [];

  fetchGroups();
  setupGroupFilters();

  async function fetchGroups() {
    try {
      const res = await fetch(`${API_BASE}/groups`);
      allGroups = await res.json();
      renderGroups(allGroups);
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }

  function renderGroups(groups) {
    const container = document.getElementById("groups-container");
    container.innerHTML = "";
    if (!groups || groups.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No groups found.</p>';
      return;
    }
    groups.forEach(addGroupCard);
  }

  function setupGroupFilters() {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        let filtered = [];

        buttons.forEach((b) => {
          b.classList.remove("bg-blue-600");
          b.classList.add("bg-gray-800", "text-white");
        });

        btn.classList.remove("bg-gray-800");
        btn.classList.add("bg-blue-600", "text-white");

        switch (filter) {
          case "public":
            filtered = allGroups.filter((g) => g.visibility === "public");
            break;
          case "private":
            filtered = allGroups.filter((g) => g.visibility === "private");
            break;
          case "mine":
            filtered = allGroups.filter((g) => String(g.createdBy?._id || g.createdBy) === currentUserId);
            break;
          default:
            filtered = allGroups;
        }

        renderGroups(filtered);
      });
    });
  }

  // Create Group handler (unchanged except update UI via addGroupCard)
  const form = document.getElementById("create-group-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("groupName").value.trim();
      const description = document.getElementById("groupDesc").value.trim();
      const category = document.getElementById("groupCategory").value;
      const visibility = document.querySelector('input[name="visibility"]:checked').value;

      if (!name || !description || !category) {
        return window.fcToast && fcToast("All fields are required", "error");
      }

      const groupData = { name, description, category, visibility };
      const token = getAuthToken();
      if (!token) return window.fcToast && fcToast("Please login first", "error");

      try {
        const res = await fetch(`${API_BASE}/groups`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(groupData),
        });

        const result = await res.json();
        if (res.ok) {
          if (window.fcToast) fcToast("Group created successfully", "success");
          document.getElementById("create-group-modal").classList.add("hidden");
          form.reset();
          // push into allGroups and render
          allGroups.unshift(result);
          addGroupCard(result);
        } else {
          if (window.fcToast) fcToast(result.message || "Failed to create group", "error");
        }
      } catch (err) {
        console.error(err);
        if (window.fcToast) fcToast("Error creating group", "error");
      }
    });
  }

  // Expose for other functions that rely on it
  window.__fastconnect_groups_state = { allGroups, currentUserId, API_BASE, refresh: fetchGroups };
}

// ---------- addGroupCard (robust) ----------
function addGroupCard(group) {
  const container = document.getElementById("groups-container");
  if (!container) return;

  // normalize current user id
  const rawCurrentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const currentUserId = String(rawCurrentUser.id || rawCurrentUser._id || "");

  // group.createdBy might be an object or id
  const createdById = String(group.createdBy?._id || group.createdBy || "");

  // members may be array of ids or populated objects
  const isMember = Array.isArray(group.members) && group.members.some(m => String(m._id || m) === currentUserId);

  const isCreator = createdById && currentUserId && (createdById === currentUserId);

  const card = document.createElement("div");
  card.className = "fc-card p-5 text-sm hover:shadow-2xl transition post-item";
  card.dataset.id = group._id;

  card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="fc-heading mb-1">${escapeHtml(group.category || "Group")}</p>
        <h3 class="text-base font-semibold text-sky-50 mb-1">${escapeHtml(group.name)}</h3>
        <p class="text-xs text-sky-100/80 mb-1">${escapeHtml(group.description)}</p>
        <p class="text-[0.7rem] text-sky-200/60">Created by: ${escapeHtml(group.createdBy?.name || group.createdBy || 'Unknown')}</p>
      </div>
      <span class="fc-chip">${escapeHtml(group.visibility || "public")}</span>
    </div>

    <div class="flex justify-between items-center mt-2">
      <div class="flex gap-2">
        <button 
          onclick="joinGroup('${group._id}')" 
          class="join-btn fc-button-primary px-3 py-1.5 text-xs ${ (isMember || isCreator) ? 'hidden' : '' }">
          <i class="fa fa-plug mr-1"></i>Join
        </button>
        <button 
          onclick="leaveGroup('${group._id}')" 
          class="leave-btn fc-button-ghost text-xs ${ !isMember ? 'hidden' : '' }">
          <i class="fa fa-right-from-bracket mr-1"></i>Leave
        </button>
      </div>

      <div class="flex gap-2 ${ isCreator ? '' : 'hidden' }">
        <button 
          onclick="editGroup('${group._id}')" 
          class="fc-button-ghost text-xs px-3 py-1.5">
          <i class="fa fa-edit mr-1"></i>Edit
        </button>
        <button 
          onclick="deleteGroup('${group._id}')" 
          class="fc-button-ghost text-xs px-3 py-1.5 border-red-400/60 text-red-300">
          <i class="fa fa-trash mr-1"></i>Delete
        </button>
      </div>
    </div>
  `;

  // Open detail modal when clicking the card background (not the buttons)
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return; // ignore clicks on action buttons
    openGroupDetail(group._id);
  });

  container.appendChild(card);
}

// ---------- GROUP DETAIL MODAL ----------
function openGroupDetail(groupId) {
  const modal = document.getElementById("group-detail-modal");
  if (!modal) return;

  const rawCurrentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const currentUserId = String(rawCurrentUser.id || rawCurrentUser._id || "");

  fetch(`${API_BASE}/groups/${groupId}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load group details");
      return res.json();
    })
    .then((group) => {
      modal.dataset.groupId = group._id;

      const createdById = String(group.createdBy?._id || group.createdBy || "");
      const isCreator = createdById && currentUserId && createdById === currentUserId;
      const isMember = Array.isArray(group.members) && group.members.some((m) => String(m._id || m) === currentUserId);

      document.getElementById("groupDetailName").textContent = group.name || "";
      document.getElementById("groupDetailDescription").textContent = group.description || "";
      document.getElementById("groupDetailCategory").textContent = group.category || "";
      document.getElementById("groupDetailVisibility").textContent = group.visibility || "";
      document.getElementById("groupDetailCreator").textContent =
        (group.createdBy && group.createdBy.name) || "Unknown";
      document.getElementById("groupDetailMemberCount").textContent = String(group.members?.length || 0);

      const list = document.getElementById("groupDetailMembersList");
      list.innerHTML = "";
      (group.members || []).forEach((m) => {
        const li = document.createElement("li");
        li.textContent = (m && m.name) || "Member";
        list.appendChild(li);
      });

      const joinBtn = document.getElementById("groupDetailJoinBtn");
      const leaveBtn = document.getElementById("groupDetailLeaveBtn");
      const ownerActions = document.getElementById("groupDetailOwnerActions");
      const editBtn = document.getElementById("groupDetailEditBtn");
      const deleteBtn = document.getElementById("groupDetailDeleteBtn");

      if (isCreator) {
        joinBtn.classList.add("hidden");
        leaveBtn.classList.add("hidden");
        ownerActions.classList.remove("hidden");
      } else {
        ownerActions.classList.add("hidden");
        if (isMember) {
          joinBtn.classList.add("hidden");
          leaveBtn.classList.remove("hidden");
        } else {
          joinBtn.classList.remove("hidden");
          leaveBtn.classList.add("hidden");
        }
      }

      joinBtn.onclick = async () => {
        await joinGroup(group._id);
        openGroupDetail(group._id);
      };

      leaveBtn.onclick = async () => {
        await leaveGroup(group._id);
        closeGroupDetail();
      };

      if (editBtn) {
        editBtn.onclick = () => editGroup(group._id);
      }
      if (deleteBtn) {
        deleteBtn.onclick = () => {
          deleteGroup(group._id);
          closeGroupDetail();
        };
      }

      modal.classList.remove("hidden");
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to load group details");
    });
}

function closeGroupDetail() {
  const modal = document.getElementById("group-detail-modal");
  if (modal) modal.classList.add("hidden");
}

// ---------- GLOBAL ACTIONS (join/leave/edit/delete) ----------
async function joinGroup(groupId) {
  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");
  try {
const res = await fetch(`${API_BASE}/groups/${groupId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return window.fcToast && fcToast(err.message || "Failed to join group", "error");
    }
    const data = await res.json();
    // update UI: replace the card or refresh groups
    document.querySelector(`[data-id="${groupId}"]`)?.remove();
    // prepend updated group for immediate feedback
    addGroupCard(data);
    // also update cached state if present
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    if (window.fcToast) fcToast("Joined the group", "success");
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Failed to join group", "error");
  }
}

async function leaveGroup(groupId) {
  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");
  try {
const res = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return window.fcToast && fcToast(err.message || "Failed to leave group", "error");
    }
    const data = await res.json();
    // update UI
    document.querySelector(`[data-id="${groupId}"]`)?.remove();
    addGroupCard(data);
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    if (window.fcToast) fcToast("Left the group", "success");
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Failed to leave group", "error");
  }
}

async function editGroup(groupId) {
  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");

  const newName = prompt("Enter new group name:");
  if (newName === null) return; // cancelled
  const newDesc = prompt("Enter new description:") || "";
  const newCategory = prompt("Enter new category:") || "";
  const newVisibility = prompt("Enter visibility (public/private):") || "";

  const body = {
    ...(newName && { name: newName }),
    ...(newDesc && { description: newDesc }),
    ...(newCategory && { category: newCategory }),
    ...(newVisibility && { visibility: newVisibility }),
  };

  try {
const res = await fetch(`${API_BASE}/groups/${groupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return window.fcToast && fcToast(err.message || "Failed to update group", "error");
    }
    const updated = await res.json();
    // reflect update in UI
    const oldCard = document.querySelector(`[data-id="${groupId}"]`);
    oldCard?.remove();
    addGroupCard(updated);
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    if (window.fcToast) fcToast("Group updated successfully", "success");
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Failed to update group", "error");
  }
}

async function deleteGroup(groupId) {
  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");
  const ok = window.fcConfirm ? await fcConfirm("Are you sure you want to delete this group?") : window.confirm("Are you sure you want to delete this group?");
  if (!ok) return;
  try {
   const res = await fetch(`${API_BASE}/groups/${groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return window.fcToast && fcToast(err.message || "Failed to delete group", "error");
    }
    document.querySelector(`[data-id="${groupId}"]`)?.remove();
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    if (window.fcToast) fcToast("Group deleted successfully", "success");
  } catch (err) {
    console.error(err);
    if (window.fcToast) fcToast("Failed to delete group", "error");
  }
}

// keep helper
function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

// small helper escape function (if not present)
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

