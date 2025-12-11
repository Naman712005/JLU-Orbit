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


  const form = document.getElementById("create-group-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("groupName").value.trim();
      const description = document.getElementById("groupDesc").value.trim();
      const category = document.getElementById("groupCategory").value;
      const visibility = document.querySelector('input[name="visibility"]:checked').value;

      if (!name || !description || !category) return alert("All fields are required!");

      const groupData = { name, description, category, visibility };
      const token = getAuthToken();
      if (!token) return alert("Login first");

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
          alert("✅ Group created successfully!");
          document.getElementById("create-group-modal").classList.add("hidden");
          form.reset();
        
          allGroups.unshift(result);
          addGroupCard(result);
        } else {
          alert(result.message || "❌ Failed to create group");
        }
      } catch (err) {
        console.error(err);
        alert("Error creating group");
      }
    });
  }


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
  card.className = "bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition";
  card.dataset.id = group._id;

  card.innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800 mb-2">${escapeHtml(group.name)}</h3>
    <p class="text-sm text-gray-600 mb-2">${escapeHtml(group.description)}</p>
    <p class="text-xs text-gray-500 mb-1">Category: ${escapeHtml(group.category)}</p>
    <p class="text-xs text-gray-500 mb-4">Visibility: ${escapeHtml(group.visibility)}</p>
    <p class="text-xs text-gray-400 mb-4">Created by: ${escapeHtml(group.createdBy?.name || group.createdBy || 'Unknown')}</p>

    <div class="flex justify-between items-center">
      <div class="flex gap-2">
        <button 
          onclick="joinGroup('${group._id}')" 
          class="join-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm ${ (isMember || isCreator) ? 'hidden' : '' }">
          Join
        </button>
        <button 
          onclick="leaveGroup('${group._id}')" 
          class="leave-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm ${ !isMember ? 'hidden' : '' }">
          Leave
        </button>
      </div>

      <div class="flex gap-2 ${ isCreator ? '' : 'hidden' }">
        <button 
          onclick="editGroup('${group._id}')" 
          class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm">
          <i class="fa fa-edit mr-1"></i>Edit
        </button>
        <button 
          onclick="deleteGroup('${group._id}')" 
          class="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded-md text-sm">
          <i class="fa fa-trash mr-1"></i>Delete
        </button>
      </div>
    </div>
  `;


  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return; 
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
  if (!token) return alert("Please login first");
  try {
const res = await fetch(`${API_BASE}/groups/${groupId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(err.message || "❌ Failed to join group");
    }
    const data = await res.json();
   
    document.querySelector(`[data-id="${groupId}"]`)?.remove();

    addGroupCard(data);

    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    alert("✅ Joined the group!");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to join group");
  }
}

async function leaveGroup(groupId) {
  const token = getAuthToken();
  if (!token) return alert("Please login first");
  try {
const res = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(err.message || "❌ Failed to leave group");
    }
    const data = await res.json();
    // update UI
    document.querySelector(`[data-id="${groupId}"]`)?.remove();
    addGroupCard(data);
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    alert("🚪 Left the group");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to leave group");
  }
}

async function editGroup(groupId) {
  const token = getAuthToken();
  if (!token) return alert("Please login first");

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
      return alert(err.message || "❌ Failed to update group");
    }
    const updated = await res.json();
    // reflect update in UI
    const oldCard = document.querySelector(`[data-id="${groupId}"]`);
    oldCard?.remove();
    addGroupCard(updated);
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    alert("✅ Group updated successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to update group");
  }
}

async function deleteGroup(groupId) {
  const token = getAuthToken();
  if (!token) return alert("Please login first");
  if (!confirm("Are you sure you want to delete this group?")) return;
  try {
   const res = await fetch(`${API_BASE}/groups/${groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(err.message || "❌ Failed to delete group");
    }
    document.querySelector(`[data-id="${groupId}"]`)?.remove();
    if (window.__fastconnect_groups_state) window.__fastconnect_groups_state.refresh();
    alert("🗑️ Group deleted successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete group");
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

