// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';
/* ---------------- PROFILE TAB ---------------- */
async function loadProfilePage() {
  try {
    console.log("✅ Loading profile.html dynamically...");

    const res = await fetch("profile.html");
    const html = await res.text();

    const profileSection = document.getElementById("profile");
    profileSection.innerHTML = html;

    await initProfilePage();

    console.log("✅ Profile HTML loaded and listeners attached.");
  } catch (err) {
    console.error("❌ Failed to load profile.html:", err);
  }
}

/* ---------------- INIT PROFILE PAGE ---------------- */
async function initProfilePage() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login first");
    return;
  }

  try {

    const res = await fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to load profile");

    const currentUser = data.profile;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Elements
    const profileName = document.getElementById("profileName");
    const profileBio = document.getElementById("profileBio");
    const profileImage = document.getElementById("profileImage");
    const profileEmail = document.getElementById("profileEmail");
    const profileCourse = document.getElementById("profileCourse");
    const profileSpecialization = document.getElementById("profileSpecialization");
    const profileSemester = document.getElementById("profileSemester");
    const profileJluid = document.getElementById("profileJluid");
    const profilePhone = document.getElementById("profilePhone");
    const profileLocation = document.getElementById("profileLocation");
    const profileLinkedin = document.getElementById("profileLinkedin");
    const profileGithub = document.getElementById("profileGithub");

    const editBtn = document.getElementById("editProfileBtn");
    const modal = document.getElementById("editProfileModal");
    const editName = document.getElementById("editProfileName");
    const editBio = document.getElementById("editProfileBio");
    const editPhone = document.getElementById("editProfilePhone");
    const editLocation = document.getElementById("editProfileLocation");
    const editLinkedin = document.getElementById("editProfileLinkedin");
    const editGithub = document.getElementById("editProfileGithub");
    const editImage = document.getElementById("editProfileImage");
    const saveBtn = document.getElementById("saveProfileBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");

    if (!editBtn || !modal) {
      console.warn("⚠️ Profile modal or edit button not found in DOM yet.");
      return;
    }

    // Fill profile info
    profileName.textContent = currentUser.name || "You";
    profileEmail.textContent = currentUser.email || "";
    profileCourse.textContent = currentUser.course || "N/A";
    profileSpecialization.textContent = currentUser.specialization || "N/A";
    profileSemester.textContent = currentUser.semester || "N/A";
    profileJluid.textContent = currentUser.jluid || "N/A";
    profileBio.textContent = currentUser.bio || "Student | Enthusiast";
    if (profilePhone) profilePhone.textContent = currentUser.phone || "Not added";
    if (profileLocation)
      profileLocation.textContent = currentUser.location || "Not added";
    if (profileLinkedin)
      profileLinkedin.textContent = currentUser.linkedin || "Not added";
    if (profileGithub)
      profileGithub.textContent = currentUser.github || "Not added";
    if (currentUser.profileImage) profileImage.src = currentUser.profileImage;

    // --- Modal Controls ---
    editBtn.addEventListener("click", () => {
      editName.value = currentUser.name || "";
      editBio.value = currentUser.bio || "";
      if (editPhone) editPhone.value = currentUser.phone || "";
      if (editLocation) editLocation.value = currentUser.location || "";
      if (editLinkedin) editLinkedin.value = currentUser.linkedin || "";
      if (editGithub) editGithub.value = currentUser.github || "";
      modal.classList.remove("hidden");
    });

    cancelBtn?.addEventListener("click", () => modal.classList.add("hidden"));

    saveBtn?.addEventListener("click", async () => {
      const updatedBio = editBio.value.trim();
      const file = editImage.files[0];

      const payload = {
        bio: updatedBio,
        phone: editPhone ? editPhone.value.trim() : undefined,
        location: editLocation ? editLocation.value.trim() : undefined,
        linkedin: editLinkedin ? editLinkedin.value.trim() : undefined,
        github: editGithub ? editGithub.value.trim() : undefined,
      };

      let updatedProfileImage = currentUser.profileImage;

      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          updatedProfileImage = e.target.result;
          payload.profileImage = updatedProfileImage;
          await saveProfileToBackend(payload);
          profileImage.src = updatedProfileImage;
          profileBio.textContent = updatedBio;
          if (profilePhone && payload.phone)
            profilePhone.textContent = payload.phone;
          if (profileLocation && payload.location)
            profileLocation.textContent = payload.location;
          if (profileLinkedin && payload.linkedin)
            profileLinkedin.textContent = payload.linkedin;
          if (profileGithub && payload.github)
            profileGithub.textContent = payload.github;
          modal.classList.add("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        await saveProfileToBackend(payload);
        profileBio.textContent = updatedBio;
        if (profilePhone && payload.phone)
          profilePhone.textContent = payload.phone;
        if (profileLocation && payload.location)
          profileLocation.textContent = payload.location;
        if (profileLinkedin && payload.linkedin)
          profileLinkedin.textContent = payload.linkedin;
        if (profileGithub && payload.github)
          profileGithub.textContent = payload.github;
        modal.classList.add("hidden");
      }
    });


    await loadProfileTabContent();

    console.log("✅ Profile page initialized and filled.");
  } catch (err) {
    console.error("❌ Error loading profile:", err);
  }
}

async function loadProfileTabContent() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const [postsRes, researchRes] = await Promise.all([
      fetch(`${API_BASE}/posts/my-posts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/research/my-research`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const posts = postsRes.ok ? await postsRes.json() : [];
    const research = researchRes.ok ? await researchRes.json() : [];

    renderProfilePosts(posts);
    renderProfileResearch(research);
  } catch (err) {
    console.error("❌ Error loading profile tab content:", err);
  }
}

function renderProfilePosts(posts) {
  const list = document.getElementById("profilePostsList");
  if (!list) return;

  if (!posts || posts.length === 0) {
    list.innerHTML =
      '<p class="text-[var(--orbit-muted)]">You have not posted anything yet.</p>';
    return;
  }

  list.innerHTML = posts
    .map(
      (p) => `
      <article class="orbit-card p-3 md:p-4">
        <h3 class="font-semibold mb-1 text-sm md:text-base">${escapeHtml(
          p.title || "Untitled post"
        )}</h3>
        <p class="text-[11px] md:text-xs text-[var(--orbit-muted)] mb-1">
          Type: ${escapeHtml(p.type || "Post")} · ${new Date(
        p.createdAt
      ).toLocaleDateString()}
        </p>
        <p class="text-xs md:text-[13px] text-[var(--orbit-muted)] line-clamp-3">
          ${escapeHtml((p.content || "").slice(0, 220))}
        </p>
      </article>
    `
    )
    .join("");
}

function renderProfileResearch(items) {
  const list = document.getElementById("profileResearchList");
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML =
      '<p class="text-[var(--orbit-muted)]">No research has been added yet.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (r) => `
      <article class="orbit-card p-3 md:p-4">
        <h3 class="font-semibold mb-1 text-sm md:text-base">${escapeHtml(
          r.title || "Untitled research"
        )}</h3>
        <p class="text-[11px] md:text-xs text-[var(--orbit-muted)] mb-1">
          ${new Date(r.createdAt).toLocaleDateString()} · ${escapeHtml(
        (r.keywords || []).join(", ")
      )}
        </p>
        <p class="text-xs md:text-[13px] text-[var(--orbit-muted)] line-clamp-3">
          ${escapeHtml((r.abstract || "").slice(0, 220))}
        </p>
      </article>
    `
    )
    .join("");
}

/* ---------------- HELPER: Save Profile to Backend ---------------- */
async function saveProfileToBackend(updateData) {
  const token = localStorage.getItem("authToken");
  if (!token) return alert("Please login first");

  try {
    const res = await fetch(`${API_BASE}/profile/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await res.json();

    if (res.ok && data.profile) {

      const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};
      const updatedUser = { ...storedUser, ...data.profile };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      alert("✅ Profile updated successfully!");
    } else {
      alert(data.message || "❌ Error updating profile");
    }
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    alert("❌ Failed to save profile");
  }
}
