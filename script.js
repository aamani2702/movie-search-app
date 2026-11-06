const movieInput = document.getElementById('movieInput');
const searchBtn = document.getElementById('searchBtn');
const moviesGrid = document.getElementById('moviesGrid');
const statusMsg = document.getElementById('statusMsg');
const favCountEl = document.getElementById('favCount');
const allTab = document.getElementById('allTab');
const favTab = document.getElementById('favTab');
const quickChips = document.getElementById('quickChips');
const detailModal = document.getElementById('detailModal');
const modalContent = document.getElementById('modalContent');

let currentShows = [];
let currentView = 'all';
let favorites = JSON.parse(localStorage.getItem('cine_favorites')) || [];

updateFavCount();

async function searchMovies(query) {
    try {
        currentView = 'all';
        setActiveTab('all');
        statusMsg.textContent = "Querying global film database...";
        statusMsg.classList.remove('hidden');
        moviesGrid.innerHTML = "";

        const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data || data.length === 0) {
            statusMsg.textContent = "No shows found. Try searching for another keyword!";
            statusMsg.classList.remove('hidden');
            return;
        }

        statusMsg.classList.add('hidden');
        currentShows = data.map(item => item.show);
        renderShows(currentShows);

    } catch (error) {
        statusMsg.textContent = "Network error. Please check your internet connection.";
        statusMsg.classList.remove('hidden');
    }
}

function renderShows(shows) {
    moviesGrid.innerHTML = "";

    if (shows.length === 0) {
        statusMsg.textContent = currentView === 'favorites' ? "Your saved favorites list is empty. Click the heart icon on any card to save it!" : "No results available.";
        statusMsg.classList.remove('hidden');
        return;
    }

    statusMsg.classList.add('hidden');

    shows.forEach(show => {
        const isFav = favorites.some(fav => fav.id === show.id);
        const imageUrl = show.image ? show.image.medium : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&auto=format&fit=crop&q=60';
        const rating = show.rating && show.rating.average ? show.rating.average : 'N/A';
        const genres = show.genres && show.genres.length > 0 ? show.genres.join(' • ') : 'General';
        const runtime = show.runtime ? `${show.runtime} min` : 'N/A';
        const status = show.status || 'Released';
        const summary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '').substring(0, 85) + '...' : 'No summary available.';

        const card = document.createElement('div');
        card.className = "bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition shadow-xl group";

        card.innerHTML = `
            <div>
                <div class="relative overflow-hidden h-64 bg-slate-950">
                    <img src="${imageUrl}" alt="${show.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <button onclick="toggleFavorite(event, ${show.id})" class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 text-sm hover:scale-110 transition shadow-lg">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                    <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-cyan-400 text-xs font-bold px-3 py-1 rounded-xl border border-slate-800">
                        ⭐ ${rating}
                    </div>
                </div>
                <div class="p-5">
                    <h3 class="font-extrabold text-base text-slate-100 tracking-tight mb-1 truncate">${show.name}</h3>
                    <p class="text-xs text-cyan-400 font-medium mb-2 truncate">${genres}</p>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${summary}</p>
                </div>
            </div>
            <div class="p-5 pt-0">
                <button onclick="openModal(${show.id})" class="w-full bg-slate-950 hover:bg-slate-800 text-cyan-400 font-bold text-xs py-3 rounded-xl border border-slate-800 transition shadow">Quick View 🔍</button>
            </div>
        `;

        moviesGrid.appendChild(card);
    });
}

function openModal(showId) {
    const show = currentShows.find(s => s.id === showId) || favorites.find(s => s.id === showId);
    if (!show) return;

    const imageUrl = show.image ? show.image.original || show.image.medium : 'https://images.unsplash.com/photo-1485846234645-a62644f84728';
    const fullSummary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : 'No description available.';
    const network = show.network ? show.network.name : (show.webChannel ? show.webChannel.name : 'Streaming Platform');

    modalContent.innerHTML = `
        <div class="flex gap-4 mb-4 items-center">
            <img src="${imageUrl}" class="w-24 h-32 object-cover rounded-2xl border border-slate-800 shadow-lg">
            <div>
                <h2 class="text-xl font-black text-white mb-1">${show.name}</h2>
                <p class="text-xs text-cyan-400 font-semibold mb-2">${show.genres ? show.genres.join(', ') : 'Entertainment'}</p>
                <p class="text-xs text-slate-400">Network: <span class="text-slate-200 font-medium">${network}</span></p>
                <p class="text-xs text-slate-400 mt-1">Language: <span class="text-slate-200 font-medium">${show.language || 'English'}</span></p>
            </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">${fullSummary}</p>
        <a href="${show.url}" target="_blank" class="block text-center bg-cyan-400 text-slate-950 font-bold text-xs py-3 rounded-xl hover:bg-cyan-300 transition shadow-lg">View Official Page ↗</a>
    `;

    detailModal.classList.remove('hidden');
}

function closeModal() {
    detailModal.classList.add('hidden');
}

function toggleFavorite(event, showId) {
    event.stopPropagation();
    const show = currentShows.find(s => s.id === showId) || favorites.find(s => s.id === showId);
    if (!show) return;

    const index = favorites.findIndex(f => f.id === showId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(show);
    }

    localStorage.setItem('cine_favorites', JSON.stringify(favorites));
    updateFavCount();

    if (currentView === 'favorites') {
        renderShows(favorites);
    } else {
        renderShows(currentShows);
    }
}

function filterView(view) {
    currentView = view;
    setActiveTab(view);
    if (view === 'favorites') {
        quickChips.classList.add('hidden');
        renderShows(favorites);
    } else {
        quickChips.classList.remove('hidden');
        renderShows(currentShows);
    }
}

function setActiveTab(view) {
    if (view === 'favorites') {
        favTab.className = "bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20";
        allTab.className = "bg-slate-900 text-slate-300 hover:text-cyan-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 transition";
    } else {
        allTab.className = "bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20";
        favTab.className = "bg-slate-900 text-slate-300 hover:text-cyan-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 transition";
    }
}

function updateFavCount() {
    favCountEl.textContent = favorites.length;
}

function quickSearch(query) {
    movieInput.value = query;
    searchMovies(query);
}

searchBtn.addEventListener('click', () => {
    const query = movieInput.value.trim();
    if (query) searchMovies(query);
});

movieInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = movieInput.value.trim();
        if (query) searchMovies(query);
    }
});

// Initial default search
searchMovies('Interstellar');