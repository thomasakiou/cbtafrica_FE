const API_BASE_URL = 'http://localhost:8000/api/v1';

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

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Login response data:', data);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', username);
            // localStorage.setItem('userRole', data.role);
            // localStorage.setItem('userId', data.user_id);
            // localStorage.setItem('fullName', data.full_name);
                
                // Store full name from the response
            // if (data.full_name) {
            //         localStorage.setItem('fullName', data.full_name);
            //         console.log('Stored full name:', data.full_name);
            //     } else if (data.name) { // Try alternative field names
            //         localStorage.setItem('fullName', data.name);
            //     } else if (data.fullName) {
            //         localStorage.setItem('fullName', data.fullName);
            //     } else {
            //         console.warn('No full name found in response');
            //         // If your backend doesn't return the full name, you can fetch it separately
            //         // or set a default value
            //         localStorage.setItem('fullName', 'Student');
            //     }
            
            // Add this line to store the full name if available in the response
            if (data.full_name) {
                localStorage.setItem('fullName', data.full_name);
            }

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
            const userData = await response.json();
            localStorage.setItem('fullName', userData.full_name);
            localStorage.setItem('tempRole', userData.role); // Store temporarily for login
            showAlert('Account created successfully! Please login.', 'success');
            setTimeout(() => showLogin(), 1500);
            // event.target.reset();

            const form = event.target;
            if (form && form.tagName === "FORM") {
                form.reset();
            }


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