// — dynamic API base that gets set by the server via /config.js — fallback to relative path
var API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

// Replace "globalSearchInput" with "navSearchInput"
const searchInput = document.getElementById('navSearchInput');
const searchBtn = document.getElementById('navSearchBtn');
const resultsContainer = document.getElementById('searchResults');

async function performSearch(query) {
  if (!query || query.trim().length === 0) {
    resultsContainer.innerHTML = '<li class="text-gray-400">Enter a search term</li>';
    return;
  }

  resultsContainer.innerHTML = `<li class="text-gray-400">Searching for "${query}"...</li>`;

  try {

    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      resultsContainer.innerHTML = `<li class="text-gray-500">No results found for "${query}".</li>`;
      return;
    }

    resultsContainer.innerHTML = data.results
      .map(
        (post) => `
      <li class="border-b pb-2 last:border-b-0">
        <button type="button" data-post-id="${post._id}"
          class="w-full text-left -mx-2 px-2 py-1.5 rounded-md hover:bg-slate-900/10">
          <h4 class="font-semibold">${post.title}</h4>
          <p class="text-sm text-gray-500">by ${post.author?.name || 'Unknown'}</p>
          <p class="text-xs text-gray-400 mt-1">${(post.tags || []).map(t => `#${t}`).join(' ')}</p>
        </button>
      </li>
    `
      )
      .join('');

    wireSearchResultClicks();
  } catch (err) {
    console.error('Search error:', err);
    resultsContainer.innerHTML = `<li class="text-red-500">Error while searching</li>`;
  }
}



if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    performSearch(query);
  });
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch(e.target.value);
  });
}

function wireSearchResultClicks() {
  if (!resultsContainer) return;
  const buttons = resultsContainer.querySelectorAll('[data-post-id]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const postId = btn.getAttribute('data-post-id');
      if (postId) goToPostFromSearch(postId);
    });
  });
}

function goToPostFromSearch(postId) {
  if (!postId) return;

  if (typeof showTab === 'function') {
    showTab('feed');
  }

  if (typeof loadPosts === 'function') {

    loadPosts(null).then(() => {
      const el = document.querySelector(`[data-id="${postId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-[#1f6feb]');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#1f6feb]');
        }, 2000);
      }
    });
  }
}
