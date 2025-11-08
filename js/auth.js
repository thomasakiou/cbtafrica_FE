const API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1'; 

// Helper function to get CSRF token from cookies
function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

// Helper function to decode JWT token
function decodeJWT(token) {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding token:', e);
        return null;
    }
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
    
    console.log('1. Auth check - Token exists:', !!token);
    console.log('2. Current path:', currentPath);
    
    // If no token and not on login page, redirect to login
    if (!token) {
        if (!currentPath.endsWith('index.html') && currentPath !== '/') {
            console.log('3. No token found, redirecting to login');
            window.location.href = 'index.html';
        }
        return false;
    }

    try {
        // Decode the token to check expiration and get username
        const decodedToken = decodeJWT(token);
        console.log('3. Decoded token:', decodedToken);
        
        if (!decodedToken) {
            console.error('4. Invalid token format');
            throw new Error('Invalid token format');
        }

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < currentTime) {
            console.error('4. Token expired');
            throw new Error('Session expired');
        }

        const username = decodedToken.sub;
        if (!username) {
            console.error('4. No username in token');
            throw new Error('Invalid token: No username');
        }

        console.log('4. Token is valid for user:', username);
        
        // Store username if not already set
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', username);
        }

        // Determine if user is admin
        const userRole = localStorage.getItem('userRole') || 
                        (username.toLowerCase() === 'admin' ? 'admin' : 'user');
        
        if (!localStorage.getItem('userRole')) {
            localStorage.setItem('userRole', userRole);
        }

        console.log('5. User role:', userRole);
        
        // Handle redirects based on path and role
        if (currentPath.endsWith('index.html') || currentPath === '/') {
            const targetPath = userRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
            console.log(`6. Redirecting to ${targetPath}`);
            window.location.href = targetPath;
        }
        
        return true;

    } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthData();
        
        if (!currentPath.endsWith('index.html') && currentPath !== '/') {
            window.location.href = 'index.html';
        }
        return false;
    }
}

// Helper function to clear authentication data
function clearAuthData() {
    console.log('Clearing authentication data');
    const authItems = ['token', 'userRole', 'username', 'user'];
    authItems.forEach(item => {
        localStorage.removeItem(item);
        console.log(`Removed ${item} from localStorage`);
    });
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Clear any existing auth data
    clearAuthData();
    
    try {
        console.log('1. Starting login process for user:', username);
        console.log('2. Sending login request to:', `${API_BASE_URL}/users/login`);
        
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': getCSRFToken() || ''
            },
            credentials: 'include',
            body: JSON.stringify({ 
                username: username,
                password: password 
            })
        });

        console.log('3. Login response status:', response.status);
        
        // Get the response text first
        const responseText = await response.text();
        console.log('4. Raw response text (first 200 chars):', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        // Try to parse the response as JSON
        let data = {};
        try {
            data = responseText ? JSON.parse(responseText) : {};
            console.log('5. Parsed response data:', data);
        } catch (e) {
            console.error('6. Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }
        
        // Check for error response
        if (!response.ok) {
            console.error('7. Login failed with status:', response.status);
            const errorMsg = data.detail || data.message || 'Login failed';
            console.error('8. Error details:', errorMsg);
            throw new Error(errorMsg);
        }

        // Check for token in the response data structure
        // The backend should return { access_token, token_type, user: {...} }
        const token = data.access_token || data.token;
        console.log('7. Token found in response:', token ? 'Yes' : 'No');
        
        if (!token) {
            console.error('8. No token found in response data. Full response:', data);
            throw new Error('Authentication failed: No token received in response');
        }
        
        // Store the token and user data
        console.log('9. Storing authentication data...');
        localStorage.setItem('token', token);
        console.log('10. Token stored in localStorage');
        
        // Store username
        localStorage.setItem('username', username);
        
        // Store user data if available
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.role) {
                localStorage.setItem('userRole', data.user.role.toLowerCase());
            } else {
                // Default role based on username if not provided
                const defaultRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';
                localStorage.setItem('userRole', defaultRole);
            }
        } else {
            // If no user data, set default role based on username
            const defaultRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';
            localStorage.setItem('userRole', defaultRole);
        }
        
        console.log('11. Authentication data stored successfully');
        console.log('12. Current auth state:', {
            token: localStorage.getItem('token') ? '***' : 'missing',
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole'),
            userData: localStorage.getItem('user') ? 'exists' : 'missing'
        });
        
        // Redirect based on role
        const userRole = localStorage.getItem('userRole');
        const targetPath = userRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
        console.log(`13. Authentication successful, redirecting to: ${targetPath}`);
        window.location.href = targetPath;
        
        console.log('8. Storing token in localStorage');
        localStorage.setItem('token', token);
        
        // Verify token was stored
        const storedToken = localStorage.getItem('token');
        console.log('9. Token stored successfully:', storedToken ? 'Yes' : 'No');
        
        if (!storedToken) {
            console.error('Failed to store token in localStorage');
            throw new Error('Failed to store authentication token');
        }
        
        // Store username in localStorage for role checking
        console.log('10. Storing username in localStorage:', username);
        localStorage.setItem('username', username);
        
        // Store user data if available (check both data.user and data.data.user)
        const userData = data.user || data.data?.user;
        if (userData) {
            console.log('11. Storing user data:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Store role if available, otherwise default based on username
            if (userData.role) {
                console.log('12. Storing user role from response:', userData.role);
                localStorage.setItem('userRole', userData.role.toLowerCase());
            } else {
                const defaultRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';
                console.log('12. No role in response, setting default role:', defaultRole);
                localStorage.setItem('userRole', defaultRole);
            }
        } else {
            // If no user data at all, set default role based on username
            const defaultRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';
            console.log('11. No user data in response, setting default role:', defaultRole);
            localStorage.setItem('userRole', defaultRole);
        }
        
        // Set default role based on username if not set
        if (!localStorage.getItem('userRole')) {
            const defaultRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';
            console.log('15. No role in response, setting default role:', defaultRole);
            localStorage.setItem('userRole', defaultRole);
        }
        
        // Log current auth state
        console.log('16. Current auth state:', {
            token: localStorage.getItem('token') ? '***' : 'missing',
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole'),
            userData: localStorage.getItem('user') ? 'exists' : 'missing'
        });
        
        // Check if user is admin (case-insensitive check)
        const isAdmin = localStorage.getItem('userRole') === 'admin';
        console.log('17. User is admin?', isAdmin);
        
        // Redirect based on role
        const targetPage = isAdmin ? 'admin-dashboard.html' : 'dashboard.html';
        console.log(`18. Redirecting to: ${targetPage}`);
        window.location.href = targetPage;
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



// const API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1';

// // ===== Helper =====
// function getCSRFToken() {
//     return document.cookie.split('; ')
//         .find(row => row.startsWith('csrftoken='))?.split('=')[1];
// }

// function showLogin() {
//     document.getElementById('login-form')?.classList.add('active');
//     document.getElementById('register-form')?.classList.remove('active');
//     const tabBtns = document.querySelectorAll('.tab-btn');
//     if (tabBtns.length > 0) {
//         tabBtns[0].classList.add('active');
//         tabBtns[1]?.classList.remove('active');
//     }
// }

// function showRegister() {
//     document.getElementById('register-form')?.classList.add('active');
//     document.getElementById('login-form')?.classList.remove('active');
//     const tabBtns = document.querySelectorAll('.tab-btn');
//     if (tabBtns.length > 1) {
//         tabBtns[1].classList.add('active');
//         tabBtns[0]?.classList.remove('active');
//     }
// }

// // ===== Role Check =====
// function isAdminUser(user) {
//     return user?.role?.toLowerCase() === 'admin';
// }

// // ===== Check Authentication =====
// async function checkAuth() {
//     const token = localStorage.getItem('token');
//     const currentPath = window.location.pathname;

//     if (token && (currentPath.endsWith('index.html') || currentPath === '/')) {
//         try {
//             const response = await fetch(`${API_BASE_URL}/users/me`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Accept': 'application/json'
//                 },
//                 credentials: 'include'
//             });

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     localStorage.clear();
//                     if (!currentPath.endsWith('index.html')) window.location.href = 'index.html';
//                 }
//                 return;
//             }

//             const userData = await response.json();
//             if (!userData) throw new Error('No user data received');

//             localStorage.setItem('user', JSON.stringify(userData));

//             // Redirect based on role
//             if (isAdminUser(userData)) {
//                 if (!currentPath.endsWith('admin-dashboard.html')) {
//                     window.location.href = 'admin-dashboard.html';
//                 }
//             } else if (!currentPath.endsWith('dashboard.html')) {
//                 window.location.href = 'dashboard.html';
//             }

//         } catch (error) {
//             console.error('Auth check failed:', error);
//             localStorage.clear();
//             if (!currentPath.endsWith('index.html')) window.location.href = 'index.html';
//         }
//     } else if (!token && !currentPath.endsWith('index.html') && currentPath !== '/') {
//         window.location.href = 'index.html';
//     }
// }

// // ===== Handle Login =====
// async function handleLogin(event) {
//     event.preventDefault();
//     const username = document.getElementById('login-username').value;
//     const password = document.getElementById('login-password').value;

//     try {
//         const response = await fetch(`${API_BASE_URL}/users/login`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json',
//                 'X-CSRFToken': getCSRFToken() || ''
//             },
//             credentials: 'include',
//             body: JSON.stringify({ username, password })
//         });

//         if (!response.ok) {
//             const errorData = await response.json().catch(() => ({}));
//             throw new Error(errorData.detail || 'Login failed');
//         }

//         const data = await response.json();
//         if (!data.access_token) throw new Error('No access token received');

//         localStorage.setItem('token', data.access_token);

//         const userData = data.user || (await fetch(`${API_BASE_URL}/users/me`, {
//             headers: { 'Authorization': `Bearer ${data.access_token}` }
//         }).then(res => res.json()));

//         if (!userData) throw new Error('Unable to retrieve user data');

//         localStorage.setItem('user', JSON.stringify(userData));
//         localStorage.setItem('username', userData.username || '');
//         if (userData.full_name) localStorage.setItem('full_name', userData.full_name);

//         if (isAdminUser(userData)) {
//             window.location.href = 'admin-dashboard.html';
//         } else {
//             window.location.href = 'dashboard.html';
//         }

//     } catch (error) {
//         console.error('Login error:', error);
//         showAlert(error.message || 'Failed to login. Please try again.', 'error');
//     }
// }

// // ===== Handle Register =====
// async function handleRegister(event) {
//     event.preventDefault();
//     const formData = new FormData(event.target);

//     const userData = {
//         username: formData.get('username'),
//         email: formData.get('email'),
//         password: formData.get('password'),
//         full_name: formData.get('fullname')
//     };

//     try {
//         const response = await fetch(`${API_BASE_URL}/users/register`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json',
//                 'X-CSRFToken': getCSRFToken() || ''
//             },
//             credentials: 'include',
//             body: JSON.stringify(userData)
//         });

//         if (!response.ok) {
//             const errorData = await response.json().catch(() => ({}));
//             throw new Error(errorData.detail || 'Registration failed');
//         }

//         showAlert('Registration successful! Please login.', 'success');
//         showLogin();
//         event.target.reset();

//     } catch (error) {
//         console.error('Registration error:', error);
//         showAlert(error.message || 'Failed to register. Please try again.', 'error');
//     }
// }

// // ===== Logout =====
// function logout() {
//     localStorage.clear();
//     window.location.href = 'index.html';
// }

// // ===== Initialize =====
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('login-form')?.addEventListener('submit', handleLogin);
//     document.getElementById('register-form')?.addEventListener('submit', handleRegister);
//     document.getElementById('logout-btn')?.addEventListener('click', logout);
//     checkAuth();
// });
