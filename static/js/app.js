// ======================== Supabase Initialization ========================
const SUPABASE_URL = 'https://your-project.supabase.co';      // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'your-anon-key';                   // Replace with your anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================== Global Variables ========================
let currentUser = null;
let currentNewsTab = "nepal";
let selectedImageBase64 = null;
let clockInterval = null;
let postsSubscription = null;

const WMO = {
    0: "☀️ Clear", 1: "🌤 Mostly Clear", 2: "⛅ Partly Cloudy", 3: "☁️ Cloudy",
    45: "🌫 Foggy", 51: "🌦 Drizzle", 61: "🌧 Rain", 71: "❄️ Snow", 95: "⛈ Thunderstorm"
};

// ======================== UI Helpers ========================
function showPage(name) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
    document.querySelectorAll(".mob-link").forEach(a => a.classList.remove("active"));
    document.getElementById("page-" + name).classList.add("active");
    document.getElementById("nav-" + name).classList.add("active");
    document.getElementById("mob-" + name).classList.add("active");
    if (name === "news") loadNews(currentNewsTab);
    if (name === "community") {
        loadPosts();
        subscribeToPosts();
    } else {
        if (postsSubscription) postsSubscription.unsubscribe();
    }
}

function escapeHtml(s) {
    return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatTime(ts) {
    try {
        const diff = (Date.now() - new Date(ts)) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(ts).toLocaleDateString();
    } catch { return ""; }
}

// ======================== Weather (unchanged) ========================
function initWeather() {
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(27.7172, 85.324)
    );
}

async function fetchWeather(lat, lon) {
    try {
        const [wRes, gRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`),
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`, { headers: { 'User-Agent': 'NexuxDashboard/1.0' } })
        ]);
        const w = await wRes.json();
        const g = await gRes.json();
        renderWeather(w, g);
    } catch (e) { console.error(e); }
}

function renderWeather(w, g) {
    const c = w.current || {};
    const d = w.daily || {};
    const city = g.address?.city || g.address?.town || g.address?.village || "Kathmandu";
    const country = g.address?.country || "Nepal";
    document.getElementById("weather-location").textContent = `📍 ${city}, ${country}`;
    document.getElementById("weather-temp").textContent = `${Math.round(c.temperature_2m || 22)}°C`;
    document.getElementById("weather-desc").textContent = WMO[c.weather_code] || "Clear";
    document.getElementById("w-humidity").textContent = Math.round(c.relative_humidity_2m || 65);
    document.getElementById("w-wind").textContent = Math.round(c.wind_speed_10m || 12);
    document.getElementById("w-feels").textContent = Math.round(c.apparent_temperature || 23);
    if (d.temperature_2m_max) {
        document.getElementById("w-high").textContent = Math.round(d.temperature_2m_max[0]) + "°C";
        document.getElementById("w-low").textContent = Math.round(d.temperature_2m_min[0]) + "°C";
        document.getElementById("weather-stats").style.display = "grid";
    }
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let html = "";
    for (let i = 0; i < 7; i++) {
        const dt = new Date(); dt.setDate(dt.getDate() + i);
        const icon = (WMO[d.weather_code?.[i]] || "🌡").split(" ")[0];
        html += `<div class="glass-card forecast-day"><div class="day-name">${i === 0 ? "Today" : days[dt.getDay()]}</div><div class="day-icon">${icon}</div><div class="day-max">${Math.round(d.temperature_2m_max?.[i] || 25)}°</div><div class="day-min">${Math.round(d.temperature_2m_min?.[i] || 15)}°</div></div>`;
    }
    document.getElementById("forecast-grid").innerHTML = html;
    startClock();
}

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    function update() {
        const now = new Date();
        document.getElementById("weather-time").textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        document.getElementById("weather-date").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    }
    update();
    clockInterval = setInterval(update, 1000);
}

// ======================== News (via Vercel proxy) ========================
async function loadNews(type, btn) {
    if (btn) {
        document.querySelectorAll(".news-tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        currentNewsTab = type;
    }
    const grid = document.getElementById("news-grid");
    grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    try {
        const res = await fetch(`/api/news?type=${type}`);
        const articles = await res.json();
        const srcClass = {
            Ekantipur: "src-ekantipur", "Online Khabar": "src-onlinekhabar",
            "Nepal Press": "src-nepalpress", Setopati: "src-setopati", "BBC News": "src-bbc"
        };
        grid.innerHTML = articles.map(a => `
            <a class="glass-card news-card" href="${a.url}" target="_blank">
                ${a.img ? `<img src="${a.img}" class="news-img" onerror="this.style.display='none'">` : ""}
                <span class="news-source ${srcClass[a.source] || "src-bbc"}">${a.source}</span>
                <h3>${a.title}</h3>
                ${a.desc ? `<p>${a.desc}</p>` : ""}
                <div class="read-more">Read article →</div>
            </a>
        `).join("");
    } catch (e) {
        grid.innerHTML = '<div class="empty-state">Failed to load news</div>';
    }
}
function refreshNews() { loadNews(currentNewsTab); }

// ======================== Community: Posts, Comments, Likes ========================
async function loadPosts() {
    const container = document.getElementById("public-posts");
    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*, comments(*), likes(count)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!posts.length) {
            container.innerHTML = '<div class="empty-state">No posts yet. Be the first! 🎉</div>';
            return;
        }
        container.innerHTML = posts.map(p => {
            const isOwner = currentUser && p.user_id === currentUser.id;
            const displayAuthor = p.is_anonymous ? "Anonymous" : (p.profiles?.username || "User");
            const likeCount = p.likes?.[0]?.count || 0;
            const userLiked = currentUser && p.likes?.some(l => l.user_id === currentUser.id);
            return `
                <div class="public-post" id="post-${p.id}" data-post-id="${p.id}">
                    <div class="post-anon-badge">
                        <span class="anon-dot"></span> ${displayAuthor}
                        ${isOwner ? `<span class="post-actions"><button class="post-action-btn" onclick="editPost('${p.id}')">✏️</button><button class="post-action-btn" onclick="deletePost('${p.id}')">🗑️</button></span>` : ""}
                    </div>
                    <div class="post-message">${escapeHtml(p.content)}</div>
                    ${p.image_url ? `<img src="${p.image_url}" style="max-width:100%; border-radius:12px; margin:0.5rem 0;">` : ""}
                    <div class="post-footer">
                        <span class="post-time">${formatTime(p.created_at)}</span>
                        <button class="btn-like" onclick="toggleLike('${p.id}', this)">❤ <span class="like-count">${likeCount}</span></button>
                    </div>
                    <div class="comment-section">
                        ${(p.comments || []).map(c => `<div class="comment"><span class="comment-author">${c.is_anonymous ? "Anonymous" : (c.profiles?.username || "User")}</span> ${escapeHtml(c.content)}</div>`).join("")}
                        ${currentUser ? `
                            <div style="display:flex; gap:0.5rem; margin-top:0.5rem; align-items:center;">
                                <input id="comment-${p.id}" placeholder="Add comment..." style="flex:1; background:rgba(255,255,255,0.1); border:1px solid var(--border-glass); border-radius:20px; padding:6px 12px; color:white;">
                                <label style="display:flex; align-items:center; gap:4px; color:var(--text-dim); font-size:0.7rem; white-space:nowrap;">
                                    <input type="checkbox" id="anon-comment-${p.id}"> 👻 Anon
                                </label>
                                <button class="btn-nav" onclick="addComment('${p.id}')">Post</button>
                            </div>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="empty-state">Error loading posts</div>';
    }
}

function subscribeToPosts() {
    if (postsSubscription) postsSubscription.unsubscribe();
    postsSubscription = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => loadPosts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => loadPosts())
        .subscribe();
}

async function submitPost() {
    const msg = document.getElementById("post-message").value.trim();
    const errDiv = document.getElementById("post-error");
    if (msg.length < 5) { errDiv.textContent = "Message too short"; return; }
    const isAnonymous = document.querySelector('input[name="post-visibility"]:checked').value === "anonymous";
    let imageUrl = null;
    if (selectedImageBase64) {
        // Upload image to Supabase Storage
        const fileName = `${currentUser.id}_${Date.now()}.png`;
        const { data, error } = await supabase.storage.from('post-images').upload(fileName, base64ToBlob(selectedImageBase64));
        if (!error) imageUrl = supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
    }
    const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: msg,
        is_anonymous: isAnonymous,
        image_url: imageUrl
    });
    if (error) { errDiv.textContent = error.message; return; }
    document.getElementById("post-message").value = "";
    clearImage();
    loadPosts();
}

async function toggleLike(postId, btn) {
    if (!currentUser) { showAuth(); return; }
    const { data: existing } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', currentUser.id).single();
    if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
    } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
    }
    // Like count updates automatically via subscription, but we optimistically update UI
    const countSpan = btn.querySelector('.like-count');
    const currentCount = parseInt(countSpan.textContent);
    countSpan.textContent = existing ? currentCount - 1 : currentCount + 1;
}

async function addComment(postId) {
    const input = document.getElementById(`comment-${postId}`);
    const anonCheck = document.getElementById(`anon-comment-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text,
        is_anonymous: anonCheck?.checked || false
    });
    input.value = "";
    loadPosts();
}

async function editPost(postId) {
    const newMsg = prompt("Edit your post:");
    if (!newMsg) return;
    await supabase.from('posts').update({ content: newMsg }).eq('id', postId).eq('user_id', currentUser.id);
    loadPosts();
}

async function deletePost(postId) {
    if (!confirm("Delete this post permanently?")) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
    loadPosts();
}

function handleImageSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        document.getElementById("image-preview").src = e.target.result;
        document.getElementById("image-preview").style.display = "block";
        document.getElementById("remove-image-btn").style.display = "inline-block";
    };
    reader.readAsDataURL(file);
}
function clearImage() {
    selectedImageBase64 = null;
    document.getElementById("image-preview").style.display = "none";
    document.getElementById("remove-image-btn").style.display = "none";
    document.getElementById("post-image-input").value = "";
}
function base64ToBlob(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    return new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
}

// ======================== Authentication (Supabase Auth) ========================
async function doLogin() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-pass").value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { document.getElementById("login-error").textContent = error.message; return; }
    await fetchUserProfile(data.user);
    hideAuth();
}
async function doSignup() {
    const username = document.getElementById("signup-user").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-pass").value;
    if (!username || !email || !password) { document.getElementById("signup-error").textContent = "All fields required"; return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { document.getElementById("signup-error").textContent = error.message; return; }
    // Create profile entry
    await supabase.from('profiles').insert({ id: data.user.id, username, email });
    await fetchUserProfile(data.user);
    hideAuth();
}
async function doLogout() {
    await supabase.auth.signOut();
    setUser(null);
    loadPosts();
}
async function sendPasswordReset() {
    const email = document.getElementById("forgot-email").value;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { document.getElementById("forgot-error").textContent = error.message; return; }
    alert("Password reset email sent! Check your inbox.");
    hideAuth();
}
async function fetchUserProfile(user) {
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    setUser({ id: user.id, username: data?.username || user.email });
}
function setUser(user) {
    currentUser = user;
    document.getElementById("user-badge").style.display = user ? "block" : "none";
    document.getElementById("username-display").textContent = user?.username || "";
    document.getElementById("auth-btn").style.display = user ? "none" : "block";
    document.getElementById("logout-btn").style.display = user ? "block" : "none";
    document.getElementById("post-form").style.display = user ? "block" : "none";
    document.getElementById("post-login-prompt").style.display = user ? "none" : "block";
    if (document.getElementById("page-community").classList.contains("active")) loadPosts();
}
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await fetchUserProfile(session.user);
    else setUser(null);
}
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) await fetchUserProfile(session.user);
    else setUser(null);
});

// ======================== Auth UI Helpers ========================
function showAuth() { document.getElementById("page-auth").classList.add("active"); }
function hideAuth() { document.getElementById("page-auth").classList.remove("active"); resetAuthForms(); }
function resetAuthForms() {
    document.getElementById("auth-login").style.display = "block";
    document.getElementById("auth-signup").style.display = "none";
    document.getElementById("auth-forgot").style.display = "none";
    document.getElementById("login-error").textContent = "";
    document.getElementById("signup-error").textContent = "";
    document.getElementById("forgot-error").textContent = "";
}
function switchAuthTab(tab) {
    document.getElementById("auth-login").style.display = tab === "login" ? "block" : "none";
    document.getElementById("auth-signup").style.display = tab === "signup" ? "block" : "none";
    document.getElementById("tab-login").classList.toggle("active", tab === "login");
    document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
}
function showForgotPassword() {
    document.getElementById("auth-login").style.display = "none";
    document.getElementById("auth-signup").style.display = "none";
    document.getElementById("auth-forgot").style.display = "block";
}

// ======================== Initialization ========================
window.onload = () => {
    checkSession();
    initWeather();
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideAuth(); });
};
