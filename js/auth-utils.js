// Auth utility functions

// Check if user is logged in and update UI accordingly
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userInfoElement = document.getElementById('user-info');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const registerButton = document.getElementById('register-button');
    const newPostContainer = document.getElementById('new-post-container');
    const loginPrompt = document.getElementById('login-prompt');

    if (token && username) {
        // User is logged in
        if (userInfoElement) {
            userInfoElement.style.display = 'flex';
            document.getElementById('username-display').textContent = username;
        }
        if (loginButton) loginButton.style.display = 'none';
        if (registerButton) registerButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'block';
        if (newPostContainer) newPostContainer.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';
    } else {
        // User is not logged in
        if (userInfoElement) userInfoElement.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
        if (registerButton) registerButton.style.display = 'block';
        if (logoutButton) logoutButton.style.display = 'none';
        if (newPostContainer) newPostContainer.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
    }
}

// Handle navigation with authentication check
function navigateTo(page) {
    const token = localStorage.getItem('token');
    const publicPages = [
        'index.html', 
        'neco.html',
        'waec.html',
        'jamb.html',
        'classroom.html'
    ];
    
    // If the page is public or user is logged in, allow navigation
    if (publicPages.includes(page) || token) {
        window.location.href = page;
    } else {
        // Store the intended page in sessionStorage to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', page);
        window.location.href = 'index.html';
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('refreshToken');
    window.location.href = 'index.html';
}

// Check authentication and redirect if not logged in
function requireAuth(redirectUrl = 'index.html') {
    const token = localStorage.getItem('token');
    if (!token) {
        // Store the current URL to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Initialize authentication state when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // Add logout button event listener if it exists
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Check for redirect after login
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin && window.location.pathname.includes('index.html')) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectAfterLogin;
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateAuthUI,
        handleLogout,
        requireAuth
    };
}
