// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

/* ---------------- LOAD POSTS ---------------- */
async function loadPosts(type = null) {
  try {
    const q = type ? `?type=${encodeURIComponent(type)}` : "";
    const res = await fetch(`${API_BASE}/posts${q}`);
    if (!res.ok) return console.error("Failed to load posts", res.status);
    const posts = await res.json();
    document.getElementById("postsContainer").innerHTML = "";
    posts.forEach((p) => addPostToFeedFromAPI(p));
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- RENDER POST ---------------- */
function addPostToFeedFromAPI(post) {
  const author = post.author && post.author.name ? post.author.name : "User";
  const dataType = post.type || "General";
  const title = escapeHtml(post.title || "");
  const content = escapeHtml(post.content || "");
  const tags = post.tags && post.tags.length ? post.tags.join(", ") : "";
  const imageHTML = post.image
    ? `<img src="${escapeHtml(post.image)}" class="rounded-lg mb-3">`
    : "";

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const currentUserId = String(currentUser.id || currentUser._id || "");
  const postAuthorId = String(post.author?._id || post.author || "");
  const isPostOwner = currentUserId && postAuthorId && currentUserId === postAuthorId;

  const commentsHTML = (post.comments || [])
    .map((c) => {
      const isOwner = String(c.user?._id || c.user || "") === currentUserId; // comment owner only
      return `
      <div class="border-t pt-2 mt-2 flex justify-between items-center">
        <p class="text-sm">
          <span class="font-bold">${escapeHtml(c.user?.name || "Anon")}:</span> 
          ${escapeHtml(c.text)}
        </p>
        ${
          isOwner
            ? `<button onclick="deleteComment(event, '${post._id}', '${c._id}')"
                class="text-red-500 hover:text-red-700 text-xs ml-3">
                🗑️
              </button>`
            : ""
        }
      </div>`;
    })
    .join("");

  const ownerMenuHTML = isPostOwner
    ? `
    <!-- 🔸 Dropdown Menu Trigger (only for post owner) -->
    <div class="relative">
      <button onclick="toggleDropdown(this)" class="text-gray-500 hover:text-gray-800 focus:outline-none">
        <i class="fas fa-ellipsis-h"></i>
      </button>

      <!-- 🔽 Dropdown Menu -->
      <div class="hidden absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50 dropdown-menu">
        <button onclick="editPost('${post._id}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
          <i class="fas fa-edit mr-2"></i>Edit
        </button>
        <button onclick="deletePost('${post._id}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
          <i class="fas fa-trash mr-2"></i>Delete
        </button>
      </div>
    </div>`
    : "";

  const postHTML = `
      <div class="fc-card p-4 mb-6 post-item text-sm" data-id="${post._id}">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-lg shadow-sky-900/60">
            ${escapeHtml((author[0] || "U").toUpperCase())}
          </div>
          <div>
            <p class="fc-heading">${escapeHtml(dataType)}</p>
            <h3 class="text-base font-semibold text-sky-100 tracking-wide">${escapeHtml(author)}</h3>
          </div>
        </div>
        <h4 class="font-semibold text-sky-50 mb-1 text-base">${title}</h4>
        <p class="text-sky-100/90 mb-2 leading-relaxed">${content}</p>
        ${imageHTML}
        ${
          tags
            ? `<div class="flex flex-wrap gap-1.5 mb-2">${escapeHtml(tags)
                .split(',')
                .filter(Boolean)
                .map(t => `<span class=\"fc-chip\">#${t.trim()}</span>`)
                .join('')}</div>`
            : ""
        }

        <!-- Action Buttons + optional owner menu -->
        <div class="flex items-center justify-between text-gray-600 text-sm mt-3">
          <div class="flex space-x-4">
            <button onclick="likePost('${post._id}')" class="hover:text-blue-600">
              <i class="fa fa-thumbs-up"></i> Like (${post.likes?.length || 0})
            </button>
            <button onclick="toggleCommentBox('${post._id}')" class="hover:text-green-600">
              <i class="fa fa-comment"></i> Comment
            </button>
            <button onclick="sharePost('${post._id}')" class="hover:text-purple-600">
              <i class="fa fa-share"></i> Share (${post.shares || 0})
            </button>
          </div>
          ${ownerMenuHTML}
        </div>

        <!-- Comments Section -->
        <div id="comments-${post._id}" class="hidden mt-3">
          <form onsubmit="commentPost(event,'${
            post._id
          }')" class="flex space-x-2 mb-2">
            <input type="text" id="comment-input-${
              post._id
            }" placeholder="Write a comment..."
              class="flex-1 px-3 py-1 border rounded-lg text-sm">
            <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">Post</button>
          </form>
          <div id="comment-list-${post._id}" class="text-gray-700">
            ${commentsHTML}
          </div>
        </div>
      </div>
    `;
  document
    .getElementById("postsContainer")
    .insertAdjacentHTML("afterbegin", postHTML);
}

/* ---------------- CREATE POST ---------------- */
async function createPostHandler(e) {
  e.preventDefault();

  const token = await getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login to create a post.", "error");

  const type = document.getElementById("postType").value.trim();
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();
  const tags = document.getElementById("postTags").value.trim();
  const imageUrl = document.getElementById("postImage").value.trim();
  const fileInput = document.getElementById("postImageFile");
  const file = fileInput?.files?.[0] || null;

  try {
    let res;

    if (file) {
      // --- Multipart upload ---
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("type", type);
      formData.append("tags", tags);
      formData.append("image", file);

 res = await fetch(`${API_BASE}/posts/create`, {

        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      // --- JSON upload ---
      const name = currentUser.name || "User";
      const body = { type, title, content, tags, image: imageUrl, name };

res = await fetch(`${API_BASE}/posts/create`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Create failed" }));
      if (window.fcToast) fcToast(err.error || "Failed to create post", "error");
      return;
    }

    const created = await res.json();
    addPostToFeedFromAPI(created);
    closePostModal();
    e.target.reset();
    if (fileInput) fileInput.value = "";

    if (window.fcToast) fcToast("Post created successfully", "success");
  } catch (err) {
    console.error("❌ Error creating post:", err);
    if (window.fcToast) fcToast("Network error while creating post.", "error");
  }
}

/* ---------------- POST ACTIONS ---------------- */
async function likePost(postId) {
  const token = await getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");
  await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  loadPosts();
}

function toggleCommentBox(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (box) box.classList.toggle("hidden");
}

async function commentPost(e, postId) {
  e.preventDefault();
  const token = await getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ text }),
  });
  if (res.ok) {
    const updated = await res.json();
    const list = document.getElementById(`comment-list-${postId}`);
    list.insertAdjacentHTML(
      "beforeend",
      `<div class="border-t pt-2 mt-2">
        <p class="text-sm"><span class="font-bold">${escapeHtml(
          currentUser.name || "You"
        )}:</span> ${escapeHtml(text)}</p>
      </div>`
    );
    input.value = "";
  }
}

/* ---------------- DELETE COMMENT ---------------- */
async function deleteComment(event, postId, commentId) {
  event.stopPropagation(); // stop bubbling in case it's inside other clickable elements

  const ok = window.fcConfirm ? await fcConfirm("Delete this comment?") : window.confirm("Delete this comment?");
  if (!ok) return;

  const token = await getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (res.ok) {
      const commentElement = event.target.closest("div.border-t");
      if (commentElement) commentElement.remove();
      if (window.fcToast) fcToast("Comment deleted", "success");
    } else {
      const err = await res.json().catch(() => ({}));
      if (window.fcToast) fcToast("Failed to delete comment: " + (err.error || "Unknown error"), "error");
    }
  } catch (err) {
    console.error("Error deleting comment:", err);
    if (window.fcToast) fcToast("Network error while deleting comment.", "error");
  }
}


/* ---------------- SHARE POST ---------------- */
let currentSharePostId = null;

function sharePost(postId) {
  currentSharePostId = postId;
  openShareModal();
}

function openShareModal() {
  document.getElementById("shareModal").classList.remove("hidden");
}

function closeShareModal() {
  document.getElementById("shareModal").classList.add("hidden");
}

function shareToPlatform(platform) {
  if (!currentSharePostId) return;

  const shareUrl = `${window.location.origin}/posts/${currentSharePostId}`;
  const shareText = encodeURIComponent("Check out this post on FAST-Connect!");
  let url = "";

  switch (platform) {
    case "whatsapp":
      url = `https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(
        shareUrl
      )}`;
      break;
    case "linkedin":
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`;
      break;
    case "facebook":
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`;
      break;
    case "instagram":
      if (window.fcToast) fcToast("Instagram doesn’t support direct web sharing — copy the link instead!", "info");
      return;
  }

  window.open(url, "_blank");
  closeShareModal();
  recordShare(currentSharePostId);
}

function copyShareLink() {
  if (!currentSharePostId) return;
  const shareUrl = `${window.location.origin}/posts/${currentSharePostId}`;
  navigator.clipboard.writeText(shareUrl);
  if (window.fcToast) fcToast("Post link copied to clipboard!", "success");
  recordShare(currentSharePostId);
  closeShareModal();
}

async function recordShare(postId) {
  const token = await getAuthToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/posts/${postId}/share`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
    loadPosts();
  } catch (err) {
    console.error("Failed to record share", err);
  }
}


// Toggle dropdown visibility
function toggleDropdown(button) {
  const menu = button.nextElementSibling;
  document.querySelectorAll(".dropdown-menu").forEach(m => {
    if (m !== menu) m.classList.add("hidden");
  });
  menu.classList.toggle("hidden");
}

// Handle outside click to close dropdowns
document.addEventListener("click", (e) => {
  if (!e.target.closest(".relative")) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.classList.add("hidden"));
  }
});


/* ---------------- POST MENU (EDIT / DELETE) ---------------- */
function togglePostMenu(postId) {
  const menu = document.getElementById(`menu-${postId}`);
  if (menu) menu.classList.toggle("hidden");
  // Close other menus
  document.querySelectorAll(`[id^="menu-"]`).forEach((el) => {
    if (el.id !== `menu-${postId}`) el.classList.add("hidden");
  });
}

/* ---------------- EDIT POST ---------------- */
async function editPost(postId) {
  const postElement = document.querySelector(`[data-id="${postId}"]`);
  const title = postElement.querySelector("h4").textContent;
  const content = postElement.querySelector("p.text-gray-700").textContent;

  // Try to extract existing tags (if any)
  const tagsEl = postElement.querySelector("p.text-sm.text-gray-500");
  const currentTags = tagsEl ? tagsEl.textContent.replace("Tags:", "").trim() : "";

  // Prompt user for updated values
  const newTitle = prompt("Edit title:", title);
  if (newTitle === null) return;

  const newContent = prompt("Edit content:", content);
  if (newContent === null) return;

  const newTags = prompt("Edit tags (comma-separated):", currentTags);
  if (newTags === null) return;

  const newImage = prompt("Enter new image URL (leave blank to keep current):", "");

  const token = getAuthToken();
  if (!token) return window.fcToast && fcToast("Please login first", "error");

  const body = { title: newTitle, content: newContent, tags: newTags };
  if (newImage.trim()) body.image = newImage.trim();

  const res = await fetch(`${API_BASE}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    if (window.fcToast) fcToast("Post updated successfully", "success");
    loadPosts(); // reload posts to reflect changes
  } else {
    const err = await res.json().catch(() => ({}));
    if (window.fcToast) fcToast("Failed to update post. " + (err.error || ""), "error");
  }
}


/* ---------------- DELETE POST ---------------- */
async function deletePost(postId) {
  const ok = window.fcConfirm ? await fcConfirm("Are you sure you want to delete this post?") : window.confirm("Are you sure you want to delete this post?");
  if (!ok) return;
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });

  if (res.ok) {
    if (window.fcToast) fcToast("Post deleted", "success");
    loadPosts();
  } else {
    if (window.fcToast) fcToast("Failed to delete post.", "error");
  }
}

/* ---------------- HELPERS ---------------- */
document
  .getElementById("postForm")
  .addEventListener("submit", createPostHandler);

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const type = button.getAttribute("data-type");
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white");
      btn.classList.add("bg-gray-800", "text-white");
    });
    button.classList.remove("bg-gray-800");
    button.classList.add("bg-blue-600", "text-white");
    await loadPosts(type === "All" ? null : type);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // Make sure "feed" tab is visible
  showTab("feed");

  // Mark "All" filter as active
  const allBtn = document.querySelector('.filter-btn[data-type="All"]');
  if (allBtn) {
    allBtn.classList.remove("bg-gray-800");
    allBtn.classList.add("bg-blue-600", "text-white");
  }

  // ✅ Finally load all posts after DOM + scripts ready
  loadPosts(null);
});