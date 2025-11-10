const API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1'; 

// Check if running on file:// protocol
if (window.location.protocol === 'file:') {
    console.warn('⚠️ WARNING: Running on file:// protocol. localStorage may not persist across pages.');
    console.warn('⚠️ Please use a local web server (e.g., Live Server in VS Code, python -m http.server, or npx serve)');
}

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
    
    console.log('=== AUTH CHECK START ===');
    console.log('1. Auth check - Token exists:', !!token);
    console.log('1.1 Token value:', token ? token.substring(0, 50) + '...' : 'null');
    console.log('1.2 All localStorage keys:', Object.keys(localStorage));
    console.log('1.3 All localStorage data:', {
        token: localStorage.getItem('token') ? 'exists' : 'missing',
        username: localStorage.getItem('username'),
        userRole: localStorage.getItem('userRole'),
        user: localStorage.getItem('user') ? 'exists' : 'missing'
    });
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
            return true;
        }
        
        // If on admin-dashboard.html, don't interfere (admin-dashboard.js handles its own auth)
        if (currentPath.endsWith('admin-dashboard.html')) {
            console.log('6. On admin dashboard page, skipping redirect checks');
            return true;
        }
        
        // If on regular dashboard.html, ensure user is not trying to access with no token
        if (currentPath.endsWith('dashboard.html')) {
            console.log('6. On dashboard page, auth verified');
            return true;
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
        // Test localStorage availability
        console.log('0. Testing localStorage availability...');
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            console.log('0a. localStorage test PASSED:', retrieved === 'test');
            
            if (retrieved !== 'test') {
                throw new Error('localStorage is not working properly on this browser/device');
            }
        } catch (e) {
            console.error('0a. localStorage test FAILED:', e);
            showAlert('Your browser is blocking data storage. Please check your browser settings or try a different browser.', 'error');
            return;
        }
        
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
        console.log('5. Raw response text:', responseText);
        
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
            console.log('6. Parsed response data:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            console.error('7. Login failed with status:', response.status);
            console.log('7a. Error data:', data);
            
            // Handle FastAPI validation errors (422) or other structured errors
            if (response.status === 422 && data.detail) {
                if (Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map(err => {
                        const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
                        return `${field}: ${err.msg}`;
                    }).join('\n');
                    throw new Error(errorMessages);
                } else if (typeof data.detail === 'string') {
                    throw new Error(data.detail);
                }
            }
            
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
        
        console.log('8. Storing token in localStorage (length:', token.length, ')');
        console.log('8a. Token preview:', token.substring(0, 30) + '...');
        
        // Try to store token with multiple attempts
        let attempts = 0;
        let storedToken = null;
        
        while (attempts < 3 && !storedToken) {
            attempts++;
            console.log(`8b. Attempt ${attempts} to store token...`);
            
            try {
                localStorage.setItem('token', token);
                storedToken = localStorage.getItem('token');
                
                if (storedToken && storedToken === token) {
                    console.log(`8c. Attempt ${attempts} SUCCESS - token stored and verified`);
                    break;
                } else {
                    console.error(`8c. Attempt ${attempts} FAILED - stored token doesn't match`);
                    console.error('Expected:', token.substring(0, 50));
                    console.error('Got:', storedToken ? storedToken.substring(0, 50) : 'null');
                }
            } catch (e) {
                console.error(`8c. Attempt ${attempts} ERROR:`, e);
            }
        }
        
        // Final verification
        console.log('9. Final token verification - stored successfully:', !!storedToken);
        console.log('9a. Stored token matches original:', storedToken === token);
        
        if (!storedToken) {
            console.error('CRITICAL: Failed to store token after 3 attempts');
            console.error('localStorage available:', typeof Storage !== 'undefined');
            console.error('localStorage.length:', localStorage.length);
            showAlert('Failed to save login session. Please check your browser settings and try again.', 'error');
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
            console.log('11. User data received from API:', JSON.stringify(userData, null, 2));
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Check for role in userData first
            if (userData.role) {
                userRole = userData.role.toLowerCase();
                console.log('12. User role from API response:', userRole);
                
                // IMPORTANT: Map backend roles to frontend roles
                // Backend might return 'admin', 'student', 'teacher', etc.
                // We need to handle all of them
                if (userRole === 'admin') {
                    console.log('12a. Confirmed admin role');
                } else if (userRole === 'student' || userRole === 'user') {
                    userRole = 'user';
                    console.log('12b. Mapped to user role');
                } else {
                    console.log('12c. Unknown role, keeping as:', userRole);
                }
            } else if (userData.is_admin || userData.isAdmin) {
                userRole = 'admin';
                console.log('12. User is admin based on is_admin flag');
            } else if (username.toLowerCase() === 'admin') {
                userRole = 'admin';
                console.log('12. User is admin based on username');
            }
        } else {
            // No user data, check username
            console.log('11. No user data in API response');
            if (username.toLowerCase() === 'admin') {
                userRole = 'admin';
                console.log('11a. User is admin based on username (no user data)');
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
        
        // Verify all data is stored before redirect
        const finalToken = localStorage.getItem('token');
        const finalUsername = localStorage.getItem('username');
        const finalUserRole = localStorage.getItem('userRole');
        
        console.log('15. Pre-redirect verification:', {
            token: finalToken ? 'EXISTS (length: ' + finalToken.length + ')' : 'MISSING',
            username: finalUsername || 'MISSING',
            userRole: finalUserRole || 'MISSING'
        });
        
        if (!finalToken) {
            console.error('15. CRITICAL: Token missing before redirect!');
            throw new Error('Token was not stored properly');
        }
        
        if (!finalUserRole) {
            console.error('15. CRITICAL: UserRole missing before redirect!');
            throw new Error('UserRole was not stored properly');
        }
        
        // Redirect based on role with a small delay to ensure localStorage is written
        const targetPage = userRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
        console.log(`16. Redirecting to: ${targetPage}`);
        console.log('16a. Final localStorage state:', {
            allKeys: Object.keys(localStorage),
            token: localStorage.getItem('token') ? 'exists' : 'missing',
            username: localStorage.getItem('username'),
            userRole: localStorage.getItem('userRole'),
            user: localStorage.getItem('user') ? 'exists' : 'missing'
        });
        
        // Use setTimeout to ensure localStorage operations complete
        setTimeout(() => {
            console.log('17. About to redirect NOW - checking localStorage one more time:');
            console.log('17a. Token still exists?', !!localStorage.getItem('token'));
            console.log('17b. UserRole still exists?', localStorage.getItem('userRole'));
            window.location.href = targetPage;
        }, 150);
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
            console.log('Registration error data:', errorData);
            
            // Handle FastAPI validation errors (422)
            if (response.status === 422 && errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    // FastAPI validation errors are an array of objects
                    const errorMessages = errorData.detail.map(err => {
                        const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
                        return `${field}: ${err.msg}`;
                    }).join('\n');
                    throw new Error(errorMessages);
                } else if (typeof errorData.detail === 'string') {
                    throw new Error(errorData.detail);
                } else {
                    throw new Error('Validation failed. Please check your input.');
                }
            }
            
            // Handle duplicate user errors (400)
            if (response.status === 400 && errorData.detail) {
                const errorDetail = errorData.detail.toLowerCase();
                
                // Check for duplicate email
                if (errorDetail.includes('duplicate') && errorDetail.includes('email')) {
                    throw new Error('This email address is already registered. Please use a different email or try logging in.');
                }
                
                // Check for duplicate username
                if (errorDetail.includes('duplicate') && errorDetail.includes('username')) {
                    throw new Error('This username is already taken. Please choose a different username.');
                }
                
                // Generic duplicate error
                if (errorDetail.includes('duplicate') || errorDetail.includes('unique')) {
                    throw new Error('An account with these details already exists. Please try different credentials or login.');
                }
            }
            
            // Handle other error formats
            throw new Error(errorData.detail || errorData.message || 'Registration failed');
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


