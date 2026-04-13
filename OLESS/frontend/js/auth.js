document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    if (isAuthenticated()) {
        const user = getUser();
        if (user && user.role) {
            if (user.role === 'admin') {
                window.location.href = '../dashboard/admin.html';
            } else {
                window.location.href = '../dashboard/student.html';
            }
        }
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveToken(data.data.token);
            saveUser(data.data.user);
            return { success: true, user: data.data.user };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function register(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            return { success: true, message: 'Registration successful!' };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuth();
        window.location.href = '../pages/login.html';
    }
}

async function updateProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = getUser();
            saveUser({ ...user, ...profileData });
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        return { success: false, message: 'Network error.' };
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, message: 'Network error.' };
    }
}
