const API_BASE = 'http://localhost:3000/api';

const CONFIG = {
    APP_NAME: 'OLESS',
    VERSION: '1.0.0',
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    THEME_KEY: 'theme',
    DEFAULT_THEME: 'light'
};

const saveToken = (token) => {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
};

const getToken = () => {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
};

const saveUser = (user) => {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
};

const getUser = () => {
    const userStr = localStorage.getItem(CONFIG.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

const clearAuth = () => {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
};

const isAuthenticated = () => {
    return !!getToken();
};

const getUserRole = () => {
    const user = getUser();
    return user ? user.role : null;
};

const saveTheme = (theme) => {
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    document.body.setAttribute('data-theme', theme);
    updateThemeIcon();
};

const getTheme = () => {
    return localStorage.getItem(CONFIG.THEME_KEY) || CONFIG.DEFAULT_THEME;
};

const toggleTheme = () => {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    saveTheme(newTheme);
};

const updateThemeIcon = () => {
    const theme = getTheme();
    const icons = document.querySelectorAll('.theme-toggle i');
    icons.forEach(icon => {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    });
};

const logout = () => {
    clearAuth();
    window.location.href = '../pages/login.html';
};

const requireAuth = (allowedRoles = []) => {
    if (!isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return false;
    }
    
    if (allowedRoles.length > 0) {
        const role = getUserRole();
        if (!allowedRoles.includes(role)) {
            window.location.href = '../pages/login.html';
            return false;
        }
    }
    
    return true;
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
};

const showLoading = (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; padding: 2rem;">
                <div class="loading-spinner"></div>
            </div>
        `;
    }
};

const showEmptyState = (containerId, message, icon = 'inbox') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${message}</h3>
            </div>
        `;
    }
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    return password.length >= 8;
};

window.addEventListener('DOMContentLoaded', () => {
    const theme = getTheme();
    document.body.setAttribute('data-theme', theme);
    updateThemeIcon();
});
