// ======================== THEME MANAGER ========================
const defaultTheme = {
    primaryColor: '#e8c96a',
    secondaryColor: '#6ab0e8',
    glassOpacity: 0.12,
    fontFamily: 'DM Sans',
    darkMode: false,
    backgroundGradient: 'default'
};

const backgrounds = {
    default: 'linear-gradient(135deg, #0d1b3e 0%, #1a3a6e 25%, #2a5a9e 45%, #3d7bc4 55%, #b8860b 75%, #d4a017 88%, #f0c040 100%)',
    sunset: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 50%, #ff6b6b 100%)',
    ocean: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    midnight: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    aurora: 'linear-gradient(135deg, #00b4db 0%, #0083b0 50%, #00d2ff 100%)',
    cherry: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fbc2eb 100%)',
    neon: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #f093fb 100%)'
};

const fonts = {
    'DM Sans': "'DM Sans', sans-serif",
    'Syne': "'Syne', sans-serif",
    'Cormorant Garamond': "'Cormorant Garamond', serif",
    'Inter': "'Inter', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Playfair Display': "'Playfair Display', serif"
};

function applyTheme(theme) {
    const root = document.documentElement;
    
    // Apply colors
    root.style.setProperty('--gold-mid', theme.primaryColor);
    root.style.setProperty('--blue-mid', theme.secondaryColor);
    
    // Apply glass opacity
    root.style.setProperty('--bg-glass', `rgba(255, 255, 255, ${theme.glassOpacity})`);
    
    // Apply font
    document.body.style.fontFamily = fonts[theme.fontFamily] || fonts['DM Sans'];
    
    // Apply background
    if (theme.backgroundGradient && backgrounds[theme.backgroundGradient]) {
        document.body.style.background = backgrounds[theme.backgroundGradient];
        document.body.style.backgroundSize = '400% 400%';
    } else {
        document.body.style.background = backgrounds.default;
    }
    
    // Apply dark mode
    if (theme.darkMode) {
        document.body.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)';
        root.style.setProperty('--text-bright', '#fff');
        root.style.setProperty('--text-muted', 'rgba(255,255,255,0.7)');
    }
}

function saveTheme(themeName, themeData) {
    const themes = JSON.parse(localStorage.getItem('userThemes') || '{}');
    themes[themeName] = themeData;
    localStorage.setItem('userThemes', JSON.stringify(themes));
    applyTheme(themeData);
    return themeName;
}

function loadTheme(themeName) {
    const themes = JSON.parse(localStorage.getItem('userThemes') || '{}');
    if (themes[themeName]) {
        applyTheme(themes[themeName]);
        return themes[themeName];
    }
    return null;
}

function deleteTheme(themeName) {
    const themes = JSON.parse(localStorage.getItem('userThemes') || '{}');
    delete themes[themeName];
    localStorage.setItem('userThemes', JSON.stringify(themes));
}

function shareTheme(themeData) {
    const shareCode = btoa(JSON.stringify(themeData));
    navigator.clipboard.writeText(shareCode);
    alert('Theme code copied! Share it with others.');
    return shareCode;
}

function importTheme(shareCode) {
    try {
        const themeData = JSON.parse(atob(shareCode));
        applyTheme(themeData);
        return themeData;
    } catch(e) {
        alert('Invalid theme code');
        return null;
    }
}

function resetTheme() {
    applyTheme(defaultTheme);
    localStorage.removeItem('userThemes');
}

window.themeManager = {
    applyTheme,
    saveTheme,
    loadTheme,
    deleteTheme,
    shareTheme,
    importTheme,
    resetTheme,
    backgrounds,
    fonts,
    defaultTheme
};
