// const API_BASE_URL = 'http://localhost:8000/api/v1';
// Update the API_BASE_URL to point to your hosted backend
const API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1';

function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showRegister() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

// Helper function to log network responses
function logNetworkResponse(response) {
    const responseClone = response.clone();
    responseClone.json().then(data => {
        console.log('=== RAW NETWORK RESPONSE ===');
        console.log('Status:', response.status, response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response data:', data);
    }).catch(err => {
        console.error('Error parsing response:', err);
    });
    return response;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        console.log('Sending login request to:', `${API_BASE_URL}/users/login`);
        console.log('Request body:', { username, password });
        
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        }).then(logNetworkResponse);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log('Raw login response:', responseText);
            
            // Log all response headers
            console.log('Response headers:');
            response.headers.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });
            
            const responseData = JSON.parse(responseText);
            console.log('Parsed response data:', responseData);
            console.log('Response data keys:', Object.keys(responseData));
            
            // Debug: Check if we have a user object
            if (responseData.user) {
                console.log('User object found in response:', responseData.user);
                console.log('User object keys:', Object.keys(responseData.user));
            }
            
            // Extract the access token
            const token = responseData.access_token || responseData.token;
            console.log('Extracted token:', token ? 'present' : 'missing');
            
            // Debug: Check token content
            if (token) {
                try {
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                    console.log('Token payload:', tokenPayload);
                } catch (e) {
                    console.warn('Could not parse token:', e);
                }
            }
            
            // The user data might be in different parts of the response
            const userData = responseData.user || responseData.data || responseData;
            console.log('Extracted user data:', userData);
            console.log('User data keys:', Object.keys(userData));
            
            // Extract username - prioritize from user data, then from form
            const userUsername = userData.username || username;
            
            // Debug: Log all available name fields
            console.log('Available name fields:', {
                full_name: userData.full_name,
                fullName: userData.fullName,
                display_name: userData.display_name,
                displayName: userData.displayName,
                name: userData.name,
                username: userUsername
            });
            
            // Extract full name - check multiple possible fields
            const fullName = userData.full_name || 
                           userData.fullName ||
                           userData.display_name ||
                           userData.displayName ||
                           userData.name ||
                           userUsername;  // Fall back to username if no name is available
            
            console.log('Determined user details:', {
                username: userUsername,
                full_name: fullName,
                role: userData.role || 'student'
            });
            
            // Store all user data
            localStorage.setItem('token', token);
            localStorage.setItem('username', userUsername);
            localStorage.setItem('full_name', fullName);
            localStorage.setItem('display_name', fullName);
            
            // Store the raw user data for debugging
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Debug: Verify what's being stored
            console.log('Stored in localStorage:', {
                username: localStorage.getItem('username'),
                full_name: localStorage.getItem('full_name'),
                display_name: localStorage.getItem('display_name')
            });
            
            console.log('Stored user data in localStorage:', {
                username: localStorage.getItem('username'),
                display_name: localStorage.getItem('display_name'),
                full_name: localStorage.getItem('full_name')
            });
            
            // Log the stored values for debugging
            console.log('Stored user data:', {
                username: username,
                full_name: fullName,
                token: token ? 'present' : 'missing'
            });
            
            // Check if user is admin based on username
            if (username === 'admin') {
                localStorage.setItem('userRole', 'admin');
                window.location.href = 'admin-dashboard.html';
            } else {
                localStorage.setItem('userRole', 'student');
                window.location.href = 'dashboard.html';
            }
            
            localStorage.removeItem('tempRole'); // Clean up temp storage
                } else if (response.status === 401) {
                    showAlert('Invalid username or password. Please check your credentials.', 'error');
                } else if (response.status === 404) {
                    showAlert('User not found. Please check your username or register first.', 'error');
                } else if (response.status >= 500) {
                    showAlert('Server error. Please try again later or contact support.', 'error');
                } else {
                    showAlert('Login failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    showAlert('Cannot connect to server. Please check if the backend is running and try again.', 'error');
                } else if (error.name === 'NetworkError' || error.message.includes('network')) {
                    showAlert('Network error. Please check your internet connection.', 'error');
                } else {
                    showAlert('Login failed. Please check your connection and try again.', 'error');
                }
            }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const fullName = document.getElementById('reg-fullname').value;
    const password = document.getElementById('reg-password').value;
    
    console.log('Registration form values:', { username, email, fullName });
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                full_name: fullName,
                password,
                role: 'student'
            })
        });
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('=== REGISTRATION RESPONSE ===');
            console.log('Response status:', response.status);
            console.log('Response data:', responseData);
            
            const userData = responseData.user || responseData.data || responseData;
            console.log('Extracted user data from registration:', userData);
            
            // Get the full name from the response or use the one from the form
            const userFullName = userData.full_name || 
                              (userData.user && userData.user.full_name) || 
                              fullName || // Fall back to form value
                              'Student';
                              
            console.log('Storing display name from registration:', userFullName);
            
            // Store in both places for compatibility
            localStorage.setItem('display_name', userFullName);
            localStorage.setItem('full_name', userFullName);
            localStorage.setItem('username', userData.username || username);
            
            // Also store the username for consistency
            localStorage.setItem('username', userData.username || username);
            
            localStorage.setItem('tempRole', userData.role || 'student');
            showAlert('Account created successfully! Please login.', 'success');
            
            // Reset the form
            const form = event.target;
            if (form && form.tagName === "FORM") {
                form.reset();
            }
            
            // Show login form after a short delay
            setTimeout(() => showLogin(), 1500);
        } else if (response.status === 400) {
            const error = await response.json();
            showAlert(`Registration failed: ${error.detail || 'Invalid data provided'}`, 'error');
        } else if (response.status === 409) {
            showAlert('Username or email already exists. Please choose different credentials.', 'error');
        } else if (response.status >= 500) {
            showAlert('Server error. Please try again later or contact support.', 'error');
        } else {
            showAlert('Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('Cannot connect to server. Please check if the backend is running and try again.', 'error');
        } else if (error.name === 'NetworkError' || error.message.includes('network')) {
            showAlert('Network error. Please check your internet connection.', 'error');
        } else {
            showAlert('Registration failed. Please try again.', 'error');
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentPage = window.location.pathname;
    const fileName = currentPage.split('/').pop() || 'index.html';
    
    // Allow only index.html for unauthenticated users
    if (!token) {
        if (fileName !== 'index.html' && fileName !== '' && currentPage !== '/') {
            window.location.replace('index.html');
            return;
        }
        return;
    }
    
    // Redirect authenticated users away from index page
    if (fileName === 'index.html' || fileName === '' || currentPage === '/') {
        if (userRole === 'admin') {
            window.location.replace('admin-dashboard.html');
        } else {
            window.location.replace('dashboard.html');
        }
        return;
    }
    
    // Role-based access control
    if (fileName === 'admin-dashboard.html' && userRole !== 'admin') {
        window.location.replace('index.html');
        return;
    }
    
    if (fileName === 'dashboard.html' && userRole === 'admin') {
        window.location.replace('admin-dashboard.html');
        return;
    }
}