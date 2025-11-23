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
    // ✅ Use the API_BASE constant
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
      <li class="border-b pb-2">
        <h4 class="font-semibold">${post.title}</h4>
        <p class="text-sm text-gray-500">by ${post.author?.name || 'Unknown'}</p>
        <p class="text-xs text-gray-400 mt-1">${(post.tags || []).map(t => `#${t}`).join(' ')}</p>
      </li>
    `
      )
      .join('');
  } catch (err) {
    console.error('Search error:', err);
    resultsContainer.innerHTML = `<li class="text-red-500">Error while searching</li>`;
  }
}


// ✅ Attach event listeners safely
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





