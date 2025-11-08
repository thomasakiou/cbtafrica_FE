const API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1'; 

// Helper function to get CSRF token from cookies
function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

function showLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (tabBtns.length > 0) {
        tabBtns[0]?.classList.add('active');
        if (tabBtns[1]) tabBtns[1].classList.remove('active');
    }
}

function showRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (registerForm) registerForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
    if (tabBtns.length > 1) {
        tabBtns[1]?.classList.add('active');
        if (tabBtns[0]) tabBtns[0].classList.remove('active');
    }
}

// Check authentication status
async function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // If user is already logged in and on auth pages, redirect to appropriate dashboard
    if (token && (currentPath.endsWith('index.html') || currentPath === '/')) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log('User data from /users/me:', userData);
                
                if (!userData) {
                    throw new Error('No user data received');
                }
                
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Check for admin role in different possible formats
                const isAdmin = (userData.role && Array.isArray(userData.role) && userData.role.includes('admin')) 
                            //  || (userData.role && userData.role.toLowerCase() === 'admin') ||
                            //   (userData.role_id && userData.role_id === 1); // Assuming 1 is admin ID
                
                console.log('Is admin?', isAdmin);
                
                // Redirect based on user role
                if (isAdmin) {
                    // If already on admin dashboard, don't redirect
                    if (!currentPath.endsWith('admin-dashboard.html')) {
                        window.location.href = 'admin-dashboard.html';
                    }
                } else if (!currentPath.endsWith('dashboard.html')) {
                    // If not admin and not on dashboard, redirect to dashboard
                    window.location.href = 'dashboard.html';
                }
            } else {
                // If we get an unauthorized response, clear the token and redirect to login
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    if (!currentPath.endsWith('index.html')) {
                        window.location.href = 'index.html';
                    }
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Clear invalid token and redirect to login
            localStorage.removeItem('token');
            if (!currentPath.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    }
    // If user is not logged in and on protected pages, redirect to login
    else if (!token && !currentPath.endsWith('index.html') && currentPath !== '/') {
        window.location.href = 'index.html';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        console.log('Sending login request to:', `${API_BASE_URL}/users/login`);
        
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': getCSRFToken() || ''
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        console.log('Login response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        console.log('Login successful:', data);
        
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            
            // Get user data from the response or fetch it if not available
            if (data.user) {
                // Store user data
                const userData = data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('username', userData.username || '');
                
                if (userData.full_name) {
                    localStorage.setItem('full_name', userData.full_name);
                }
                
                // Check for admin role (handle both 'roles' array and 'role' string)
                const isAdmin = (userData.role && userData.role.includes('admin')) || 
                              (userData.role && userData.role.toLowerCase() === 'admin');
                
                // Redirect based on admin status
                if (isAdmin) {
                    console.log('Admin user detected, redirecting to admin dashboard');
                    window.location.href = 'admin-dashboard.html';
                } else {
                    console.log('Regular user, redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                }
            } else {
                // If user data isn't in the login response, fetch it
                try {
                    const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`,
                            'Accept': 'application/json'
                        },
                        credentials: 'include'
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        localStorage.setItem('user', JSON.stringify(userData));
                        
                        // Check for admin role in the fetched user data
                        if ((userData.role && userData.role.includes('admin')) || 
                            (userData.role && userData.role.toLowerCase() === 'admin')) {
                            window.location.href = 'admin-dashboard.html';
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
                
                // Default to regular dashboard if we can't determine admin status
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Failed to login. Please try again.', 'error');
    }
}

// Handle user registration
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        full_name: formData.get('fullname')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': getCSRFToken() || ''
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        console.log('Register response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Registration failed');
        }

        const data = await response.json();
        console.log('Registration successful:', data);
        
        showAlert('Registration successful! Please login.', 'success');
        showLogin();
        form.reset();
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Failed to register. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('full_name');
    window.location.href = 'index.html';
}

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for login/register forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Add logout button event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Check authentication status on page load
    checkAuth();
});
