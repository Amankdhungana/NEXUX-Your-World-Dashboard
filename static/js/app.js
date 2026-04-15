// ======================== NEXUX DASHBOARD ========================
// Single declaration - no duplicates!

console.log('🚀 NEXUX Dashboard loading...');

// Supabase Configuration
const SUPABASE_URL = 'https://kxjwbtzyouzvdhaunmldw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S7MPbN1E0AiI8BQPRJGA';

// Create Supabase client (ONCE)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase initialized');

// Global variables
let currentUser = null;
let currentNewsTab = 'nepal';
let clockInterval = null;

// Weather codes
const weatherIcons = {
    0: '☀️ Clear', 1: '🌤 Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Cloudy',
    45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '❄️ Snow', 95: '⛈ Thunderstorm'
};

// ======================== PAGE NAVIGATION ========================
window.showPage = function(pageName) {
    console.log('📱 Switching to page:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const activePage = document.getElementById(`page-${pageName}`);
    if (activePage) activePage.classList.add('active');
    
    // Update nav active states
    document.querySelectorAll('.nav-links a, .mob-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const navLink = document.getElementById(`nav-${pageName}`);
    const mobLink = document.getElementById(`mob-${pageName}`);
    if (navLink) navLink.classList.add('active');
    if (mobLink) mobLink.classList.add('active');
    
    // Load page-specific data
    if (pageName === 'news') loadNews(currentNewsTab);
    if (pageName === 'community') loadPosts();
};

// ======================== WEATHER ========================
async function loadWeather() {
    console.log('🌤 Loading weather...');
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7');
        const data = await response.json();
        
        // Current weather
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const wind = data.current.wind_speed_10m;
        const weatherCode = data.current.weather_code;
        
        document.getElementById('weather-temp').textContent = `${temp}°C`;
        document.getElementById('weather-desc').textContent = weatherIcons[weatherCode] || 'Clear';
        document.getElementById('w-humidity').textContent = humidity;
        document.getElementById('w-wind').textContent = wind;
        document.getElementById('weather-location').textContent = '📍 Kathmandu, Nepal';
        
        // High/Low
        if (data.daily.temperature_2m_max) {
            document.getElementById('w-high').textContent = Math.round(data.daily.temperature_2m_max[0]) + '°C';
            document.getElementById('w-low').textContent = Math.round(data.daily.temperature_2m_min[0]) + '°C';
            document.getElementById('weather-stats').style.display = 'grid';
        }
        
        // Forecast
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let forecastHtml = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const icon = weatherIcons[data.daily.weather_code?.[i]] || '🌡';
            const high = Math.round(data.daily.temperature_2m_max?.[i] || 25);
            const low = Math.round(data.daily.temperature_2m_min?.[i] || 15);
            forecastHtml += `
                <div class="glass-card forecast-day">
                    <div class="day-name">${i === 0 ? 'Today' : days[date.getDay()]}</div>
                    <div class="day-icon">${icon.split(' ')[0]}</div>
                    <div class="day-max">${high}°</div>
                    <div class="day-min">${low}°</div>
                </div>
            `;
        }
        document.getElementById('forecast-grid').innerHTML = forecastHtml;
        
        // Start clock
        updateClock();
        setInterval(updateClock, 1000);
        
        console.log('✅ Weather loaded');
    } catch (error) {
        console.error('❌ Weather error:', error);
        document.getElementById('weather-temp').textContent = '22°C';
        document.getElementById('weather-location').textContent = '📍 Kathmandu, Nepal';
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById('weather-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('weather-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ======================== NEWS ========================
window.loadNews = async function(type, button) {
    console.log('📰 Loading news:', type);
    currentNewsTab = type;
    
    // Update active tab
    if (button) {
        document.querySelectorAll('.news-tab').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`/api/news?type=${type}`);
        const articles = await response.json();
        
        if (!articles || articles.length === 0) {
            grid.innerHTML = '<div class="empty-state">No news available</div>';
            return;
        }
        
        grid.innerHTML = articles.map(article => `
            <a class="glass-card news-card" href="${article.url}" target="_blank">
                ${article.img ? `<img src="${article.img}" class="news-img" onerror="this.style.display='none'">` : ''}
                <span class="news-source src-${article.source?.toLowerCase().replace(' ', '') || 'bbc'}">${article.source || 'News'}</span>
                <h3>${escapeHtml(article.title)}</h3>
                ${article.desc ? `<p>${escapeHtml(article.desc)}</p>` : ''}
                <div class="read-more">Read article →</div>
            </a>
        `).join('');
        
        console.log('✅ News loaded');
    } catch (error) {
        console.error('❌ News error:', error);
        grid.innerHTML = '<div class="empty-state">Failed to load news. Please try again.</div>';
    }
};

window.refreshNews = function() {
    loadNews(currentNewsTab);
};

// ======================== COMMUNITY ========================
async function loadPosts() {
    console.log('💬 Loading posts...');
    const container = document.getElementById('public-posts');
    if (!container) return;
    
    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="empty-state">No posts yet. Be the first! 🎉</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="public-post">
                <div class="post-anon-badge">
                    <span class="anon-dot"></span> 
                    ${post.is_anonymous ? 'Anonymous' : (currentUser ? 'User' : 'Community Member')}
                </div>
                <div class="post-message">${escapeHtml(post.content)}</div>
                <div class="post-footer">
                    <span class="post-time">${formatTime(post.created_at)}</span>
                    <button class="btn-like">❤ ${post.likes_count || 0}</button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Posts loaded');
    } catch (error) {
        console.error('❌ Posts error:', error);
        container.innerHTML = '<div class="empty-state">Error loading posts. Please refresh.</div>';
    }
}

window.submitPost = async function() {
    if (!currentUser) {
        alert('Please sign in to post');
        showAuth();
        return;
    }
    
    const message = document.getElementById('post-message')?.value.trim();
    if (!message || message.length < 5) {
        alert('Message must be at least 5 characters');
        return;
    }
    
    const isAnonymous = document.querySelector('input[name="post-visibility"]:checked')?.value === 'anonymous';
    
    try {
        const { error } = await supabaseClient.from('posts').insert({
            user_id: currentUser.id,
            content: message,
            is_anonymous: isAnonymous
        });
        
        if (error) throw error;
        
        document.getElementById('post-message').value = '';
        alert('Post created successfully!');
        loadPosts();
    } catch (error) {
        console.error('❌ Submit error:', error);
        alert('Error creating post: ' + error.message);
    }
};

// ======================== AUTHENTICATION ========================
window.doLogin = async function() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-pass')?.value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        currentUser = data.user;
        updateAuthUI();
        hideAuth();
        loadPosts();
        alert('Login successful!');
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
};

window.doSignup = async function() {
    const username = document.getElementById('signup-user')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-pass')?.value;
    
    if (!username || !email || !password) {
        alert('All fields are required');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        
        // Create profile
        if (data.user) {
            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                username: username,
                email: email
            });
        }
        
        currentUser = data.user;
        updateAuthUI();
        hideAuth();
        alert('Account created! Please check your email to confirm.');
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
};

window.doLogout = async function() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateAuthUI();
    loadPosts();
    alert('Logged out successfully');
};

window.sendPasswordReset = async function() {
    const email = document.getElementById('forgot-email')?.value;
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) throw error;
        alert('Password reset email sent! Check your inbox.');
        hideAuth();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

function updateAuthUI() {
    const userBadge = document.getElementById('user-badge');
    const usernameDisplay = document.getElementById('username-display');
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const postForm = document.getElementById('post-form');
    const postLoginPrompt = document.getElementById('post-login-prompt');
    
    if (currentUser) {
        if (userBadge) userBadge.style.display = 'block';
        if (usernameDisplay) usernameDisplay.textContent = currentUser.email?.split('@')[0] || 'User';
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (postForm) postForm.style.display = 'block';
        if (postLoginPrompt) postLoginPrompt.style.display = 'none';
    } else {
        if (userBadge) userBadge.style.display = 'none';
        if (authBtn) authBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (postForm) postForm.style.display = 'none';
        if (postLoginPrompt) postLoginPrompt.style.display = 'block';
    }
}

// ======================== AUTH UI ========================
window.showAuth = function() {
    const authPage = document.getElementById('page-auth');
    if (authPage) authPage.classList.add('active');
};

window.hideAuth = function() {
    const authPage = document.getElementById('page-auth');
    if (authPage) authPage.classList.remove('active');
};

window.switchAuthTab = function(tab) {
    const loginDiv = document.getElementById('auth-login');
    const signupDiv = document.getElementById('auth-signup');
    const forgotDiv = document.getElementById('auth-forgot');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    
    if (loginDiv) loginDiv.style.display = tab === 'login' ? 'block' : 'none';
    if (signupDiv) signupDiv.style.display = tab === 'signup' ? 'block' : 'none';
    if (forgotDiv) forgotDiv.style.display = 'none';
    if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
    if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');
};

window.showForgotPassword = function() {
    const loginDiv = document.getElementById('auth-login');
    const signupDiv = document.getElementById('auth-signup');
    const forgotDiv = document.getElementById('auth-forgot');
    
    if (loginDiv) loginDiv.style.display = 'none';
    if (signupDiv) signupDiv.style.display = 'none';
    if (forgotDiv) forgotDiv.style.display = 'block';
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
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

// Check session on load
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        updateAuthUI();
    }
}

// ======================== INITIALIZATION ========================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 NEXUX Dashboard initialized');
    await checkSession();
    await loadWeather();
    await loadNews('nepal');
    updateAuthUI();
    console.log('✅ All systems ready!');
});
