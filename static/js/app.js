// ======================== NEXUX DASHBOARD - COMPLETE VERSION ========================
console.log('🚀 NEXUX Dashboard loading...');

// ======================== SUPABASE CONFIGURATION ========================
const NEXUX_SUPABASE_URL = 'https://kxjwbtyzouvdhaunmldw.supabase.co';
const NEXUX_SUPABASE_KEY = 'sb_publishable_S7MPbN1EOAiP8BQPRJGAPQ_vuZxkl7w';

const nexuxSupabase = window.supabase.createClient(NEXUX_SUPABASE_URL, NEXUX_SUPABASE_KEY);
console.log('✅ Supabase ready');

// ======================== GLOBAL VARIABLES ========================
let nexuxCurrentUser = null;
let nexuxCurrentNewsTab = 'nepal';
let nexuxSelectedImage = null;
let nexuxClockInterval = null;
let nexuxUserLat = null;
let nexuxUserLon = null;
let nexuxUserCity = 'Kathmandu';
let nexuxUserCountry = 'Nepal';

// Weather icons
const nexuxWeatherIcons = {
    0: '☀️ Clear', 1: '🌤 Partly Cloudy', 2: '⛅ Cloudy', 3: '☁️ Overcast',
    45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '❄️ Snow', 95: '⛈ Thunder'
};

// Source to class mapping for news colors
const nexuxSourceClass = {
    'Ekantipur': 'source-ekantipur',
    'Online Khabar': 'source-onlinekhabar',
    'Setopati': 'source-setopati',
    'Nepal Press': 'source-nepalpress',
    'BBC News': 'source-bbc',
    'CNN': 'source-cnn',
    'Al Jazeera': 'source-aljazeera',
    'The Guardian': 'source-guardian'
};

// ======================== LOCATION DETECTION ========================
function nexuxGetUserLocation() {
    console.log('📍 Requesting location...');
    
    if (!navigator.geolocation) {
        console.log('❌ Browser does not support geolocation');
        document.getElementById('weather-location').textContent = '📍 Location not supported';
        nexuxLoadWeather(27.7172, 85.3240, 'Kathmandu', 'Nepal');
        return;
    }
    
    document.getElementById('weather-location').textContent = '📍 Detecting your location...';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            nexuxUserLat = position.coords.latitude;
            nexuxUserLon = position.coords.longitude;
            console.log(`✅ Location detected: ${nexuxUserLat}, ${nexuxUserLon}`);
            await nexuxGetCityName(nexuxUserLat, nexuxUserLon);
            await nexuxLoadWeather(nexuxUserLat, nexuxUserLon, nexuxUserCity, nexuxUserCountry);
        },
        (error) => {
            console.log('❌ Location error:', error.message);
            if (error.code === 1) {
                document.getElementById('weather-location').textContent = '📍 Location denied - showing Kathmandu';
            } else {
                document.getElementById('weather-location').textContent = '📍 Location unavailable - showing Kathmandu';
            }
            nexuxLoadWeather(27.7172, 85.3240, 'Kathmandu', 'Nepal');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function nexuxGetCityName(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`, {
            headers: { 'User-Agent': 'NEXUX-Dashboard/1.0' }
        });
        const data = await response.json();
        
        if (data && data.address) {
            nexuxUserCity = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown';
            nexuxUserCountry = data.address.country || 'Unknown';
            console.log(`📍 Location: ${nexuxUserCity}, ${nexuxUserCountry}`);
            document.getElementById('weather-location').textContent = `📍 ${nexuxUserCity}, ${nexuxUserCountry}`;
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
}

window.nexuxRefreshLocation = function() {
    alert('Getting your location... Please allow location access when prompted.');
    nexuxGetUserLocation();
};
window.refreshLocation = window.nexuxRefreshLocation;

// ======================== WEATHER ========================
async function nexuxLoadWeather(lat, lon, city, country) {
    try {
        document.getElementById('weather-temp').textContent = '--°C';
        document.getElementById('forecast-grid').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (city && country) {
            document.getElementById('weather-location').textContent = `📍 ${city}, ${country}`;
        }
        
        const currentTemp = Math.round(data.current.temperature_2m);
        const feelsLike = Math.round(data.current.apparent_temperature);
        const humidity = data.current.relative_humidity_2m;
        const windSpeed = Math.round(data.current.wind_speed_10m);
        const weatherCode = data.current.weather_code;
        
        document.getElementById('weather-temp').textContent = `${currentTemp}°C`;
        document.getElementById('weather-desc').textContent = nexuxWeatherIcons[weatherCode] || 'Clear';
        document.getElementById('w-humidity').textContent = humidity;
        document.getElementById('w-wind').textContent = windSpeed;
        document.getElementById('w-feels').textContent = `${feelsLike}°C`;
        
        if (data.daily && data.daily.temperature_2m_max) {
            const todayHigh = Math.round(data.daily.temperature_2m_max[0]);
            const todayLow = Math.round(data.daily.temperature_2m_min[0]);
            document.getElementById('w-high').textContent = `${todayHigh}°C`;
            document.getElementById('w-low').textContent = `${todayLow}°C`;
            document.getElementById('weather-stats').style.display = 'grid';
        }
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let forecastHtml = '';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const icon = nexuxWeatherIcons[data.daily.weather_code?.[i]] || '🌡';
            const high = Math.round(data.daily.temperature_2m_max?.[i] || 25);
            const low = Math.round(data.daily.temperature_2m_min?.[i] || 15);
            const precip = data.daily.precipitation_sum?.[i] || 0;
            
            forecastHtml += `
                <div class="glass-card forecast-day">
                    <div class="day-name">${i === 0 ? 'Today' : days[date.getDay()]}</div>
                    <div class="day-icon">${icon.split(' ')[0]}</div>
                    <div class="day-max">${high}°</div>
                    <div class="day-min">${low}°</div>
                    ${precip > 0 ? `<div style="font-size: 0.6rem; color: var(--blue-light);">💧 ${precip}mm</div>` : ''}
                </div>
            `;
        }
        document.getElementById('forecast-grid').innerHTML = forecastHtml;
        nexuxStartClock();
        console.log('✅ Weather loaded');
    } catch (error) {
        console.error('Weather error:', error);
        document.getElementById('weather-temp').textContent = '22°C';
        document.getElementById('weather-location').textContent = '📍 Weather unavailable';
    }
}

function nexuxStartClock() {
    if (nexuxClockInterval) clearInterval(nexuxClockInterval);
    function update() {
        const now = new Date();
        document.getElementById('weather-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('weather-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    update();
    nexuxClockInterval = setInterval(update, 1000);
}

// ======================== HELPER FUNCTIONS ========================
function nexuxEscapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function nexuxFormatTime(timestamp) {
    if (!timestamp) return 'recently';
    const diff = (Date.now() - new Date(timestamp)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

// ======================== PAGE NAVIGATION ========================
window.nexuxShowPage = function(pageName) {
    console.log('Page:', pageName);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageName).classList.add('active');
    
    if (pageName === 'news') nexuxLoadNews(nexuxCurrentNewsTab);
    if (pageName === 'community') nexuxLoadPosts();
};
window.showPage = window.nexuxShowPage;

// ======================== NEWS ========================
window.nexuxLoadNews = async function(type, btn) {
    if (btn) {
        document.querySelectorAll('.news-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        nexuxCurrentNewsTab = type;
    }
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    try {
        const res = await fetch('/api/news?type=' + type);
        const articles = await res.json();
        
        grid.innerHTML = articles.map(a => `
            <a class="glass-card news-card" href="${a.url}" target="_blank" style="text-decoration: none;">
                ${a.img ? `<img src="${a.img}" class="news-img" onerror="this.style.display='none'">` : ''}
                <span class="news-source ${nexuxSourceClass[a.source] || 'source-bbc'}">${a.source || 'News'}</span>
                <h3 style="color: var(--text-bright); margin: 0 0 8px 0; font-size: 1rem;">${nexuxEscapeHtml(a.title)}</h3>
                ${a.desc ? `<p style="color: var(--text-dim); font-size: 0.8rem; margin: 0;">${nexuxEscapeHtml(a.desc.substring(0, 100))}...</p>` : ''}
                <div class="read-more" style="margin-top: 12px; color: var(--gold-mid);">Read article →</div>
            </a>
        `).join('');
    } catch(e) { 
        console.error('News error:', e);
        grid.innerHTML = '<div class="empty-state">Failed to load news. Please try again.</div>';
    }
};
window.loadNews = window.nexuxLoadNews;
window.refreshNews = () => window.nexuxLoadNews(nexuxCurrentNewsTab);

// ======================== IMAGE HANDLING ========================
window.nexuxHandleImage = function(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        nexuxSelectedImage = e.target.result;
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('remove-image-btn').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
};
window.handleImageSelect = window.nexuxHandleImage;

window.nexuxClearImage = function() {
    nexuxSelectedImage = null;
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('remove-image-btn').style.display = 'none';
    document.getElementById('post-image-input').value = '';
};
window.clearImage = window.nexuxClearImage;

async function nexuxUploadImage(base64Data, userId) {
    try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        const fileName = userId + '_' + Date.now() + '.jpg';
        const { error } = await nexuxSupabase.storage.from('post-images').upload(fileName, blob);
        if (error) throw error;
        const { data } = nexuxSupabase.storage.from('post-images').getPublicUrl(fileName);
        return data.publicUrl;
    } catch(e) { return null; }
}

// ======================== LIKES ========================
window.nexuxToggleLike = async function(postId, btn) {
    if (!nexuxCurrentUser) { alert('Login to like'); window.nexuxShowAuth(); return; }
    
    const countSpan = btn.querySelector('.like-count');
    const currentCount = parseInt(countSpan.textContent);
    
    try {
        const { data: existing } = await nexuxSupabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', nexuxCurrentUser.id)
            .single();
        
        if (existing) {
            await nexuxSupabase.from('likes').delete().eq('post_id', postId).eq('user_id', nexuxCurrentUser.id);
            countSpan.textContent = currentCount - 1;
            await nexuxSupabase.from('posts').update({ likes_count: currentCount - 1 }).eq('id', postId);
        } else {
            await nexuxSupabase.from('likes').insert({ post_id: postId, user_id: nexuxCurrentUser.id });
            countSpan.textContent = currentCount + 1;
            await nexuxSupabase.from('posts').update({ likes_count: currentCount + 1 }).eq('id', postId);
        }
    } catch(e) { console.error('Like error:', e); }
};
window.toggleLike = window.nexuxToggleLike;

// ======================== POSTS ========================
async function nexuxLoadPosts() {
    const container = document.getElementById('public-posts');
    if (!container) return;
    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    try {
        const { data: posts, error } = await nexuxSupabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="empty-state">No posts yet. Be the first! 🎉</div>';
            return;
        }
        
        let userLikes = [];
        if (nexuxCurrentUser) {
            const { data: likes } = await nexuxSupabase.from('likes').select('post_id').eq('user_id', nexuxCurrentUser.id);
            userLikes = likes?.map(l => l.post_id) || [];
        }
        
        container.innerHTML = posts.map(post => {
            // Check ownership using user_id (works for both anonymous and public posts)
            const isOwner = nexuxCurrentUser && post.user_id === nexuxCurrentUser.id;
            
            // Display name logic: if anonymous, show "Anonymous", otherwise show email or "User"
            let displayAuthor = '👤 User';
            if (post.is_anonymous) {
                displayAuthor = '👻 Anonymous';
            } else if (post.user_email) {
                displayAuthor = post.user_email.split('@')[0];
            } else if (post.user_id) {
                displayAuthor = '👤 Member';
            }
            
            const hasContent = post.content && post.content.trim().length > 0;
            const hasImage = post.image_url && post.image_url.trim().length > 0;
            const isLiked = userLikes.includes(post.id);
            
            return `
                <div class="public-post" id="post-${post.id}">
                    <div class="post-anon-badge" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${displayAuthor}</span>
                        ${isOwner ? `
                            <div class="post-actions">
                                ${hasContent ? `<button class="post-action-btn" onclick="nexuxEditPost('${post.id}', '${nexuxEscapeHtml(post.content || '').replace(/'/g, "\\'")}')">✏️ Edit</button>` : ''}
                                <button class="post-action-btn" onclick="nexuxDeletePost('${post.id}')">🗑️ Delete</button>
                            </div>
                        ` : ''}
                    </div>
                    ${hasContent ? `<div class="post-message">${nexuxEscapeHtml(post.content)}</div>` : ''}
                    ${hasImage ? `<img src="${post.image_url}" class="post-image" style="max-width:100%; border-radius:12px; margin-top:10px; max-height:400px; object-fit:cover;" onclick="window.open(this.src)">` : ''}
                    <div class="post-footer" style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <span class="post-time">${nexuxFormatTime(post.created_at)}</span>
                        <button class="btn-like" onclick="nexuxToggleLike('${post.id}', this)" style="${isLiked ? 'color: #ff6b6b;' : ''}">
                            ❤️ <span class="like-count">${post.likes_count || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) { 
        console.error('Load posts error:', e);
        container.innerHTML = '<div class="empty-state">Error loading posts</div>'; 
    }
}
window.nexuxLoadPosts = nexuxLoadPosts;
window.loadPosts = nexuxLoadPosts;

window.nexuxSubmitPost = async function() {
    if (!nexuxCurrentUser) { alert('Please sign in'); window.nexuxShowAuth(); return; }
    
    const msg = document.getElementById('post-message')?.value.trim();
    const hasImage = nexuxSelectedImage !== null;
    
    if (!msg && !hasImage) { alert('Add a message or image'); return; }
    
    const isAnonymous = document.querySelector('input[name="post-visibility"]:checked')?.value === 'anonymous';
    let imageUrl = null;
    
    if (hasImage) {
        imageUrl = await nexuxUploadImage(nexuxSelectedImage, nexuxCurrentUser.id);
    }
    
    const postData = {
        content: msg || null,
        is_anonymous: isAnonymous,
        image_url: imageUrl,
        likes_count: 0,
        user_id: nexuxCurrentUser.id,  // ← ALWAYS store user_id for ownership
        user_email: isAnonymous ? null : nexuxCurrentUser.email,  // ← Hide email if anonymous
        created_at: new Date().toISOString()
    };
    
    try {
        const { error } = await nexuxSupabase.from('posts').insert([postData]);
        if (error) throw error;
        document.getElementById('post-message').value = '';
        window.nexuxClearImage();
        alert('Post created successfully! 🎉');
        nexuxLoadPosts();
    } catch(e) { 
        console.error('Submit error:', e);
        alert('Error: ' + e.message); 
    }
};
window.submitPost = window.nexuxSubmitPost;

window.nexuxEditPost = async function(postId, currentContent) {
    if (!nexuxCurrentUser) {
        alert('Please login to edit posts');
        return;
    }
    const newContent = prompt('Edit your post:', currentContent);
    if (newContent === null) return;
    if (!newContent || newContent.trim().length === 0) { 
        alert('Post cannot be empty'); 
        return; 
    }
    try {
        const { error } = await nexuxSupabase
            .from('posts')
            .update({ content: newContent.trim() })
            .eq('id', postId)
            .eq('user_id', nexuxCurrentUser.id);  // ← Uses user_id for ownership check
        
        if (error) throw error;
        alert('Post updated successfully!');
        nexuxLoadPosts();
    } catch(e) { 
        console.error('Edit error:', e);
        alert('Error: ' + e.message); 
    }
};
window.editPost = window.nexuxEditPost;

window.nexuxDeletePost = async function(postId) {
    if (!nexuxCurrentUser) {
        alert('Please login to delete posts');
        return;
    }
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    try {
        const { error } = await nexuxSupabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', nexuxCurrentUser.id);  // ← Uses user_id for ownership check
        
        if (error) throw error;
        alert('Post deleted successfully!');
        nexuxLoadPosts();
    } catch(e) { 
        console.error('Delete error:', e);
        alert('Error: ' + e.message); 
    }
};
window.deletePost = window.nexuxDeletePost;

// ======================== AUTHENTICATION ========================
window.nexuxDoSignup = async function() {
    const username = document.getElementById('signup-user')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-pass')?.value;
    
    if (!username || !email || !password) { alert('All fields required'); return; }
    
    try {
        const { data, error } = await nexuxSupabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) throw error;
        if (data.user) {
            await nexuxSupabase.from('profiles').insert({ id: data.user.id, username, email });
            nexuxCurrentUser = data.user;
            nexuxUpdateAuthUI();
            window.nexuxHideAuth();
            alert('Account created successfully!');
            nexuxLoadPosts();
        }
    } catch(e) { 
        console.error('Signup error:', e);
        alert('Signup failed: ' + e.message); 
    }
};
window.doSignup = window.nexuxDoSignup;

window.nexuxDoLogin = async function() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-pass')?.value;
    if (!email || !password) { alert('Enter email and password'); return; }
    try {
        const { data, error } = await nexuxSupabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nexuxCurrentUser = data.user;
        nexuxUpdateAuthUI();
        window.nexuxHideAuth();
        alert('Welcome back!');
        nexuxLoadPosts();
    } catch(e) { 
        console.error('Login error:', e);
        alert('Login failed: ' + e.message); 
    }
};
window.doLogin = window.nexuxDoLogin;

window.nexuxDoLogout = async function() {
    await nexuxSupabase.auth.signOut();
    nexuxCurrentUser = null;
    nexuxUpdateAuthUI();
    alert('Logged out successfully');
    nexuxLoadPosts();
};
window.doLogout = window.nexuxDoLogout;

window.nexuxSendReset = async function() {
    const email = document.getElementById('forgot-email')?.value;
    if (!email) { alert('Enter email'); return; }
    const { error } = await nexuxSupabase.auth.resetPasswordForEmail(email);
    if (error) alert('Error: ' + error.message);
    else alert('Password reset email sent! Check your inbox.');
};
window.sendPasswordReset = window.nexuxSendReset;

function nexuxUpdateAuthUI() {
    const userBadge = document.getElementById('user-badge');
    const usernameSpan = document.getElementById('username-display');
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const postForm = document.getElementById('post-form');
    const postPrompt = document.getElementById('post-login-prompt');
    
    if (nexuxCurrentUser) {
        if (userBadge) userBadge.style.display = 'block';
        if (usernameSpan) usernameSpan.textContent = nexuxCurrentUser.email?.split('@')[0] || 'User';
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
window.nexuxShowAuth = function() {
    document.getElementById('page-auth')?.classList.add('active');
};
window.nexuxHideAuth = function() {
    document.getElementById('page-auth')?.classList.remove('active');
    document.getElementById('auth-login').style.display = 'block';
    document.getElementById('auth-signup').style.display = 'none';
    document.getElementById('auth-forgot').style.display = 'none';
};
window.nexuxSwitchAuthTab = function(tab) {
    document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-signup').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('auth-forgot').style.display = 'none';
};
window.nexuxShowForgot = function() {
    document.getElementById('auth-login').style.display = 'none';
    document.getElementById('auth-signup').style.display = 'none';
    document.getElementById('auth-forgot').style.display = 'block';
};
window.showAuth = window.nexuxShowAuth;
window.hideAuth = window.nexuxHideAuth;
window.switchAuthTab = window.nexuxSwitchAuthTab;
window.showForgotPassword = window.nexuxShowForgot;

// ======================== SESSION CHECK ========================
async function nexuxCheckSession() {
    const { data: { session } } = await nexuxSupabase.auth.getSession();
    if (session?.user) nexuxCurrentUser = session.user;
    nexuxUpdateAuthUI();
}

nexuxSupabase.auth.onAuthStateChange((event, session) => {
    nexuxCurrentUser = session?.user || null;
    nexuxUpdateAuthUI();
});

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Starting NEXUX...');
    await nexuxCheckSession();
    nexuxGetUserLocation();
    await nexuxLoadNews('nepal');
    nexuxUpdateAuthUI();
    console.log('NEXUX Ready!');
});
