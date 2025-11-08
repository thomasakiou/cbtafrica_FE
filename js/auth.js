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
    const username = localStorage.getItem('username');
    const currentPath = window.location.pathname;
    
    console.log('Auth check - Token exists:', !!token);
    console.log('Auth check - Username:', username);
    console.log('Current path:', currentPath);
    
    // If user is not logged in and not on the login page, redirect to login
    if (!token && !currentPath.endsWith('index.html') && currentPath !== '/') {
        window.location.href = 'index.html';
        return;
    }
    
    // If user is logged in and on the login page, redirect to appropriate dashboard
    if (token && username && (currentPath.endsWith('index.html') || currentPath === '/')) {
        try {
            // Check if user is admin based on username (temporary solution)
            const isAdmin = username.toLowerCase() === 'admin';
            
            console.log('User is admin?', isAdmin);
            
            // Store the role in localStorage for future checks
            const userRole = isAdmin ? 'admin' : 'user';
            localStorage.setItem('userRole', userRole);
            
            // Redirect based on user role
            if (isAdmin) {
                if (!currentPath.endsWith('admin-dashboard.html')) {
                    console.log('Redirecting to admin dashboard...');
                    window.location.href = 'admin-dashboard.html';
                }
            } else if (!currentPath.endsWith('dashboard.html')) {
                console.log('Redirecting to user dashboard...');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Error during auth check:', error);
            // If there's an error, clear auth data and stay on login page
            clearAuthData();
            
            if (!currentPath.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    }
}

// Helper function to clear authentication data
function clearAuthData() {
    const authItems = ['token', 'userRole', 'username', 'user', 'full_name'];
    authItems.forEach(item => {
        console.log(`Removing ${item} from localStorage`);
        localStorage.removeItem(item);
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
        
        const responseText = await response.text();
        console.log('5. Raw response text:', responseText);
        
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

        // Check for token in different possible locations
        const token = data.access_token || data.token || 
                     (data.data && (data.data.access_token || data.data.token));
        
        console.log('7. Token found in response:', token ? 'Yes' : 'No');
        
        if (token) {
            console.log('8. Storing token in localStorage');
            localStorage.setItem('token', token);
            
            // Verify token was stored
            const storedToken = localStorage.getItem('token');
            console.log('9. Token stored successfully:', storedToken ? 'Yes' : 'No');
            
            if (!storedToken) {
                console.error('Failed to store token in localStorage');
                throw new Error('Failed to store authentication token');
            }
        } else {
            console.warn('10. No token found in login response');
            // Check if we have a session cookie instead
            const hasSessionCookie = document.cookie.includes('sessionid') || 
                                   document.cookie.includes('auth_token');
            console.log('11. Session cookie found:', hasSessionCookie);
            
            if (!hasSessionCookie) {
                throw new Error('No authentication token or session found in response');
            }
        }
        
        // Store username in localStorage for role checking
        console.log('12. Storing username in localStorage:', username);
        localStorage.setItem('username', username);
        
        // Store user data if available
        const userData = data.user || data.data?.user;
        if (userData) {
            console.log('13. Storing user data:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Store role if available
            if (userData.role) {
                console.log('14. Storing user role:', userData.role);
                localStorage.setItem('userRole', userData.role.toLowerCase());
            }
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
