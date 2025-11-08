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
        if (!token) {
            console.warn('decodeJWT: No token provided');
            return null;
        }
        
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('decodeJWT: Invalid token format - expected 3 parts, got', parts.length);
            return null;
        }
        
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        console.log('decodeJWT: Successfully decoded token');
        return decoded;
    } catch (e) {
        console.error('decodeJWT: Error decoding token:', e);
        console.error('decodeJWT: Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'null');
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
        // Try to decode the token to check expiration and get username
        const decodedToken = decodeJWT(token);
        console.log('3. Decoded token:', decodedToken);
        
        // Get username from decoded token or from localStorage
        let username = decodedToken?.sub || localStorage.getItem('username');
        
        if (decodedToken) {
            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decodedToken.exp && decodedToken.exp < currentTime) {
                console.error('4. Token expired');
                throw new Error('Session expired');
            }

            if (decodedToken.sub) {
                username = decodedToken.sub;
                console.log('4. Token is valid for user:', username);
                
                // Store username if not already set
                if (!localStorage.getItem('username')) {
                    localStorage.setItem('username', username);
                }
            }
        } else {
            // Token couldn't be decoded, but we have a token and username stored
            // This might be an opaque token or non-JWT token
            console.warn('4. Could not decode token as JWT, using stored username');
            
            if (!username) {
                console.error('4. No username available');
                throw new Error('No username available');
            }
        }

        // Determine if user is admin - check stored role or default to username check
        let userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
            // If no role stored, determine from username
            userRole = (username.toLowerCase() === 'admin') ? 'admin' : 'user';
            localStorage.setItem('userRole', userRole);
            console.log('5. User role determined from username:', userRole);
        } else {
            console.log('5. User role from localStorage:', userRole);
        }
        
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
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
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
            body: JSON.stringify({ username, password })
        });

        console.log('3. Login response status:', response.status);
        console.log('4. Response headers:', [...response.headers.entries()]);
        
        // Check for token in response headers
        const authHeader = response.headers.get('Authorization');
        if (authHeader) {
            console.log('4.1 Found Authorization header');
            const token = authHeader.replace('Bearer ', '').trim();
            if (token) {
                console.log('4.2 Extracted token from Authorization header');
                localStorage.setItem('token', token);
            }
        }
        
        const responseText = await response.text();
        console.log('5. Raw response text (first 200 chars):', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
            console.log('6. Parsed response data:', data);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            console.error('7. Login failed with status:', response.status);
            throw new Error(data.detail || data.message || 'Login failed');
        }

        // Check for token in the response data structure
        // The backend returns { access_token, token_type, user: {...} }
        const token = data.access_token || data.token;
        
        console.log('7. Token found in response:', token ? 'Yes' : 'No');
        
        if (!token) {
            console.error('8. No token found in response data');
            throw new Error('Authentication failed: No token received');
        }
        
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
        
        // Determine user role
        let userRole = 'user'; // default role
        
        if (userData) {
            console.log('11. Storing user data:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Check for role in userData first
            if (userData.role) {
                userRole = userData.role.toLowerCase();
                console.log('12. User role from API response:', userRole);
            } else if (userData.is_admin || userData.isAdmin) {
                userRole = 'admin';
                console.log('12. User is admin based on is_admin flag');
            } else if (username.toLowerCase() === 'admin') {
                userRole = 'admin';
                console.log('12. User is admin based on username');
            }
        } else {
            // No user data, check username
            if (username.toLowerCase() === 'admin') {
                userRole = 'admin';
                console.log('11. User is admin based on username (no user data)');
            }
        }
        
        // Store the determined role
        localStorage.setItem('userRole', userRole);
        console.log('13. Final user role stored:', userRole);
        
        // Log current auth state before redirect
        console.log('14. Current auth state before redirect:', {
            token: localStorage.getItem('token') ? '***exists***' : 'missing',
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole'),
            userData: localStorage.getItem('user') ? 'exists' : 'missing'
        });
        
        // Verify token one more time before redirect
        const finalToken = localStorage.getItem('token');
        if (!finalToken) {
            console.error('15. CRITICAL: Token missing before redirect!');
            throw new Error('Token was not stored properly');
        }
        
        // Redirect based on role with a small delay to ensure localStorage is written
        const targetPage = userRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
        console.log(`16. Redirecting to: ${targetPage}`);
        
        // Use setTimeout to ensure localStorage operations complete
        setTimeout(() => {
            window.location.href = targetPage;
        }, 100);
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
