// ======================== NEXUX DASHBOARD - COMPLETE VERSION ========================
console.log('🚀 NEXUX Dashboard loading...');

// ======================== SUPABASE CONFIGURATION ========================
const SUPABASE_URL = 'https://kxjwbtyzouvdhaunmldw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S7MPbN1EOAiP8BQPRJGAPQ_vuZxkl7w';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase initialized');

// ======================== GLOBAL VARIABLES ========================
let currentUser = null;
let currentNewsTab = 'nepal';
let selectedImageBase64 = null;
let clockInterval = null;
let postsSubscription = null;

const weatherIcons = {
    0: '☀️ Clear', 1: '🌤 Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Cloudy',
    45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '❄️ Snow', 95: '⛈ Thunderstorm'
};

// ======================== HELPER FUNCTIONS ========================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    if (!timestamp) return 'recently';
    const diff = (Date.now() - new Date(timestamp)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

// ======================== PAGE NAVIGATION ========================
window.showPage = function(pageName) {
    console.log('📱 Switching to:', pageName);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    if (pageName === 'news') loadNews(currentNewsTab);
    if (pageName === 'community') {
        loadPosts();
        subscribeToPosts();
    } else {
        if (postsSubscription) postsSubscription?.unsubscribe();
    }
};

// ======================== WEATHER ========================
async function loadWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7');
        const data = await res.json();
        
        document.getElementById('weather-temp').textContent = `${Math.round(data.current.temperature_2m)}°C`;
        document.getElementById('weather-desc').textContent = weatherIcons[data.current.weather_code] || 'Clear';
        document.getElementById('w-humidity').textContent = data.current.relative_humidity_2m;
        document.getElementById('w-wind').textContent = data.current.wind_speed_10m;
        document.getElementById('weather-location').textContent = '📍 Kathmandu, Nepal';
        
        if (data.daily.temperature_2m_max) {
            document.getElementById('w-high').textContent = Math.round(data.daily.temperature_2m_max[0]) + '°C';
            document.getElementById('w-low').textContent = Math.round(data.daily.temperature_2m_min[0]) + '°C';
            document.getElementById('weather-stats').style.display = 'grid';
        }
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let forecastHtml = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const icon = weatherIcons[data.daily.weather_code?.[i]] || '🌡';
            forecastHtml += `
                <div class="glass-card forecast-day">
                    <div class="day-name">${i === 0 ? 'Today' : days[date.getDay()]}</div>
                    <div class="day-icon">${icon.split(' ')[0]}</div>
                    <div class="day-max">${Math.round(data.daily.temperature_2m_max?.[i] || 25)}°</div>
                    <div class="day-min">${Math.round(data.daily.temperature_2m_min?.[i] || 15)}°</div>
                </div>
            `;
        }
        document.getElementById('forecast-grid').innerHTML = forecastHtml;
        startClock();
    } catch (error) {
        console.error('Weather error:', error);
    }
}

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    function update() {
        const now = new Date();
        document.getElementById('weather-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('weather-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    update();
    clockInterval = setInterval(update, 1000);
}

// ======================== NEWS ========================
window.loadNews = async function(type, btn) {
    if (btn) {
        document.querySelectorAll('.news-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentNewsTab = type;
    }
    
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    try {
        const res = await fetch(`/api/news?type=${type}`);
        const articles = await res.json();
        grid.innerHTML = articles.slice(0, 6).map(a => `
            <a class="glass-card news-card" href="${a.url}" target="_blank">
                <span class="news-source">${a.source || 'News'}</span>
                <h3>${escapeHtml(a.title)}</h3>
                ${a.desc ? `<p>${escapeHtml(a.desc.substring(0, 100))}</p>` : ''}
                <div class="read-more">Read →</div>
            </a>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<div class="empty-state">Failed to load news</div>';
    }
};

window.refreshNews = () => loadNews(currentNewsTab);

// ======================== IMAGE UPLOAD ========================
window.handleImageSelect = function(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('remove-image-btn').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
};

window.clearImage = function() {
    selectedImageBase64 = null;
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('remove-image-btn').style.display = 'none';
    document.getElementById('post-image-input').value = '';
};

async function uploadImage(base64Data, userId) {
    try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        const fileName = `${userId}_${Date.now()}.jpg`;
        
        const { error } = await supabase.storage.from('post-images').upload(fileName, blob);
        if (error) throw error;
        
        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// ======================== COMMUNITY POSTS ========================
async function loadPosts() {
    const container = document.getElementById('public-posts');
    if (!container) return;
    
    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="empty-state">No posts yet. Be the first! 🎉</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const isOwner = currentUser && post.user_id === currentUser.id;
            const displayAuthor = post.is_anonymous ? '👻 Anonymous' : (post.user_email?.split('@')[0] || '👤 User');
            const hasContent = post.content && post.content.trim().length > 0;
            const hasImage = post.image_url && post.image_url.trim().length > 0;
            
            return `
                <div class="public-post" id="post-${post.id}">
                    <div class="post-anon-badge" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${displayAuthor}</span>
                        ${isOwner ? `
                            <div class="post-actions">
                                ${hasContent ? `<button class="post-action-btn" onclick="editPost('${post.id}', '${escapeHtml(post.content).replace(/'/g, "\\'")}')" title="Edit">✏️ Edit</button>` : ''}
                                <button class="post-action-btn" onclick="deletePost('${post.id}')" title="Delete">🗑️ Delete</button>
                            </div>
                        ` : ''}
                    </div>
                    ${hasContent ? `<div class="post-message">${escapeHtml(post.content)}</div>` : ''}
                    ${hasImage ? `<img src="${post.image_url}" class="post-image" style="max-width:100%; border-radius:12px; margin-top:10px; max-height:400px; object-fit:cover;">` : ''}
                    <div class="post-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span class="post-time">${formatTime(post.created_at)}</span>
                        <button class="btn-like" onclick="likePost('${post.id}', this)">❤️ <span class="like-count">${post.likes_count || 0}</span></button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Posts error:', error);
        container.innerHTML = '<div class="empty-state">Error loading posts</div>';
    }
}

function subscribeToPosts() {
    if (postsSubscription) postsSubscription.unsubscribe();
    postsSubscription = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts())
        .subscribe();
}

// ======================== POST CRUD ========================
window.submitPost = async function() {
    if (!currentUser) {
        alert('Please sign in to post');
        showAuth();
        return;
    }
    
    const msg = document.getElementById('post-message')?.value.trim();
    const hasImage = selectedImageBase64 !== null;
    
    // Allow post if: has text OR has image
    if (!msg && !hasImage) {
        alert('Please add a message or an image to post');
        return;
    }
    
    const isAnonymous = document.querySelector('input[name="post-visibility"]:checked')?.value === 'anonymous';
    
    let imageUrl = null;
    if (hasImage) {
        const uploadResult = await uploadImage(selectedImageBase64, currentUser.id);
        if (uploadResult) imageUrl = uploadResult;
    }
    
    const postData = {
        content: msg || null,
        is_anonymous: isAnonymous,
        image_url: imageUrl,
        likes_count: 0,
        user_id: currentUser.id,
        user_email: currentUser.email,
        created_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) throw error;
        
        document.getElementById('post-message').value = '';
        clearImage();
        alert('Post created successfully! 🎉');
        loadPosts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.editPost = async function(postId, currentContent) {
    if (!currentUser) {
        alert('Please login to edit posts');
        return;
    }
    
    const newContent = prompt('Edit your post:', currentContent);
    if (newContent === null) return;
    if (newContent.trim().length === 0) {
        alert('Post cannot be empty');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('posts')
            .update({ content: newContent.trim() })
            .eq('id', postId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        alert('Post updated!');
        loadPosts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.deletePost = async function(postId) {
    if (!currentUser) {
        alert('Please login to delete posts');
        return;
    }
    
    if (!confirm('Delete this post permanently?')) return;
    
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        alert('Post deleted!');
        loadPosts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.likePost = async function(postId, button) {
    if (!currentUser) {
        alert('Please login to like posts');
        showAuth();
        return;
    }
    
    const likeSpan = button.querySelector('.like-count');
    const currentLikes = parseInt(likeSpan.textContent);
    
    try {
        likeSpan.textContent = currentLikes + 1;
        const { error } = await supabase
            .from('posts')
            .update({ likes_count: currentLikes + 1 })
            .eq('id', postId);
        if (error) throw error;
    } catch (error) {
        likeSpan.textContent = currentLikes;
        alert('Error: ' + error.message);
    }
};

// ======================== AUTHENTICATION ========================
window.doSignup = async function() {
    const username = document.getElementById('signup-user')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-pass')?.value;
    
    if (!username || !email || !password) {
        alert('All fields are required');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { username } }
        });
        if (error) throw error;
        
        if (data.user) {
            await supabase.from('profiles').insert({ id: data.user.id, username, email });
            currentUser = data.user;
            updateAuthUI();
            hideAuth();
            alert('Account created! You are now logged in.');
            loadPosts();
        }
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
};

window.doLogin = async function() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-pass')?.value;
    
    if (!email || !password) {
        alert('Enter email and password');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        updateAuthUI();
        hideAuth();
        alert('Welcome back!');
        loadPosts();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
};

window.doLogout = async function() {
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
    alert('Logged out');
    loadPosts();
};

window.sendPasswordReset = async function() {
    const email = document.getElementById('forgot-email')?.value;
    if (!email) { alert('Enter email'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert('Error: ' + error.message);
    else alert('Reset email sent!');
};

function updateAuthUI() {
    const userBadge = document.getElementById('user-badge');
    const usernameSpan = document.getElementById('username-display');
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const postForm = document.getElementById('post-form');
    const postPrompt = document.getElementById('post-login-prompt');
    
    if (currentUser) {
        if (userBadge) userBadge.style.display = 'block';
        if (usernameSpan) usernameSpan.textContent = currentUser.email?.split('@')[0] || 'User';
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (postForm) postForm.style.display = 'block';
        if (postPrompt) postPrompt.style.display = 'none';
    } else {
        if (userBadge) userBadge.style.display = 'none';
        if (authBtn) authBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (postForm) postForm.style.display = 'none';
        if (postPrompt) postPrompt.style.display = 'block';
    }
}

// ======================== AUTH UI ========================
window.showAuth = () => document.getElementById('page-auth')?.classList.add('active');
window.hideAuth = () => document.getElementById('page-auth')?.classList.remove('active');
window.switchAuthTab = (tab) => {
    document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-signup').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('auth-forgot').style.display = 'none';
};
window.showForgotPassword = () => {
    document.getElementById('auth-login').style.display = 'none';
    document.getElementById('auth-signup').style.display = 'none';
    document.getElementById('auth-forgot').style.display = 'block';
};

// ======================== SESSION CHECK ========================
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) currentUser = session.user;
    updateAuthUI();
}

supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
});

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
    loadWeather();
    loadNews('nepal');
    updateAuthUI();
    console.log('✅ NEXUX Ready!');
});
