// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';
/* ---------------- PROFILE TAB ---------------- */
async function loadProfilePage() {
  try {
    console.log("✅ Loading profile.html dynamically...");
    const res = await fetch("../html/profile.html");
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
  if (!token) return alert("Please login first");

  try {
    // 🔹 Fetch combined profile from backend (User + Profile)
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

    const editBtn = document.getElementById("editProfileBtn");
    const modal = document.getElementById("editProfileModal");
    const editName = document.getElementById("editProfileName");
    const editBio = document.getElementById("editProfileBio");
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
    if (currentUser.profileImage) profileImage.src = currentUser.profileImage;

    // --- Modal Controls ---
    editBtn.addEventListener("click", () => {
      editName.value = currentUser.name || "";
      editBio.value = currentUser.bio || "";
      modal.classList.remove("hidden");
    });

    cancelBtn?.addEventListener("click", () => modal.classList.add("hidden"));

    saveBtn?.addEventListener("click", async () => {
      const updatedBio = editBio.value.trim();
      const file = editImage.files[0];

      let updatedProfileImage = currentUser.profileImage;

      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          updatedProfileImage = e.target.result;
          await saveProfileToBackend({ bio: updatedBio, profileImage: updatedProfileImage });
          profileImage.src = updatedProfileImage;
          profileBio.textContent = updatedBio;
          modal.classList.add("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        await saveProfileToBackend({ bio: updatedBio, profileImage: updatedProfileImage });
        profileBio.textContent = updatedBio;
        modal.classList.add("hidden");
      }
    });

    console.log("✅ Profile page initialized and filled.");
  } catch (err) {
    console.error("❌ Error loading profile:", err);
  }
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
      // Merge updated profile with current user
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
