// Simple localStorage-based authentication
// In production, use proper backend authentication

class SimpleAuth {
    constructor() {
        this.storageKey = 'fip_user_logged_in';
        this.userKey = 'fip_user_data';
    }

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem(this.storageKey) === 'true';
    }

    // Login user
    login(username) {
        localStorage.setItem(this.storageKey, 'true');
        localStorage.setItem(this.userKey, JSON.stringify({ username: username }));
        this.updateUIForAuth();
    }

    // Logout user
    logout() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.userKey);
        this.updateUIForAuth();
    }

    // Get current user
    getCurrentUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // Update UI based on auth status
    updateUIForAuth() {
        const downloadBtn = document.getElementById('btn-download-data');
        const authBtn = document.getElementById('btn-auth');
        
        if (!downloadBtn || !authBtn) return;

        if (this.isLoggedIn()) {
            downloadBtn.style.display = 'inline-block';
            authBtn.textContent = 'Ցուցակից ելնել';
            authBtn.className = 'btn btn-logout';
        } else {
            downloadBtn.style.display = 'none';
            authBtn.textContent = 'Մուտք';
            authBtn.className = 'btn btn-login';
        }
    }
}

// Create global auth instance
const auth = new SimpleAuth();
