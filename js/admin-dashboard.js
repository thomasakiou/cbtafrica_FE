// API_BASE_URL is already declared in auth.js which loads first
// If for some reason it's not available, we'll check and log an error
if (typeof API_BASE_URL === 'undefined') {
    console.error('API_BASE_URL is not defined. Make sure auth.js loads before admin-dashboard.js');
}

// Check if user is authenticated and has admin privileges
async function checkAdminAuth() {
    console.log('=== ADMIN AUTH CHECK START ===');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    console.log('Admin check - Token exists:', !!token);
    console.log('Admin check - Stored user role:', userRole);
    console.log('Admin check - Stored username:', username);
    
    if (!token || !username) {
        console.log('Admin check - No token or username found, redirecting to login');
        handleUnauthorized();
        return false;
    }

    // Check if user role is admin
    if (userRole && userRole === 'admin') {
        console.log('Admin check - User is authenticated as admin');
        return true;
    }
    
    // If role is not admin, redirect to regular dashboard
    if (userRole && userRole !== 'admin') {
        console.log('Admin check - User is not an admin (role:', userRole, '), redirecting to dashboard');
        showAlert('Access denied. Admin privileges required.', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return false;
    }
    
    // If no role set yet, check username as fallback
    console.log('Admin check - No role in localStorage, checking username');
    const isAdmin = username.toLowerCase() === 'admin';
    
    if (isAdmin) {
        localStorage.setItem('userRole', 'admin');
        console.log('Admin check - Set role to admin based on username');
        return true;
    } else {
        localStorage.setItem('userRole', 'user');
        console.log('Admin check - User is not admin, redirecting to dashboard');
        showAlert('Access denied. Admin privileges required.', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return false;
    }
}

function handleUnauthorized() {
    console.log('Handling unauthorized access...');
    
    // Log current authentication state
    const authState = {
        token: localStorage.getItem('token') ? '***token exists***' : 'no token',
        userRole: localStorage.getItem('userRole') || 'no role',
        username: localStorage.getItem('username') || 'no username',
        userData: localStorage.getItem('user') ? 'exists' : 'no user data'
    };
    console.log('Current authentication state:', authState);
    
    // Show user feedback
    showAlert('Your session has expired. Please log in again.', 'warning');
    
    // Clear all authentication-related data
    const authItems = ['token', 'userRole', 'username', 'user', 'full_name'];
    authItems.forEach(item => {
        console.log(`Removing ${item} from localStorage`);
        localStorage.removeItem(item);
    });
    
    // Redirect to login page after a short delay
    const redirectDelay = 1500; // 1.5 seconds
    console.log(`Redirecting to login page in ${redirectDelay}ms...`);
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, redirectDelay);
}

// Initialize the dashboard
async function initDashboard() {
    try {
        console.log('Initializing admin dashboard...');
        const isAuthenticated = await checkAdminAuth();
        console.log('Admin authentication check result:', isAuthenticated);
        
        if (isAuthenticated) {
            console.log('User is authenticated, loading dashboard data...');
            loadUserInfo();
            loadUsers();
            loadSubjects();
            loadSubjectOptions();
        } else {
            console.log('User is not authenticated or not an admin');
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('An error occurred while initializing the dashboard', 'error');
    }
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting dashboard initialization');
    initDashboard().catch(error => {
        console.error('Unhandled error in dashboard initialization:', error);
    });
});

function loadUserInfo() {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('user-name').textContent = `Welcome, ${username}`;
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Find and activate the clicked button
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    if (tabName === 'questions') {
        loadSubjectOptions();
        loadQuestions();
    } else if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'subjects') {
        loadSubjects();
    }
}

async function loadSubjects() {
    const token = localStorage.getItem('token');
    console.log('Loading subjects with token:', token);
    
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Subjects response status:', response.status);
        
        if (response.ok) {
            const subjects = await response.json();
            console.log('Subjects loaded:', subjects);
            displaySubjects(subjects);
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const errorText = await response.text();
            console.error('Failed to load subjects:', response.status, errorText);
            document.getElementById('subjects-list').innerHTML = `<p>Error loading subjects: ${response.status}</p>`;
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        document.getElementById('subjects-list').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

async function loadSubjectOptions() {
    const token = localStorage.getItem('token');
    console.log('Loading subject options with token:', token);
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Subject options response status:', response.status);
        if (response.ok) {
            const subjects = await response.json();
            console.log('Subject options loaded:', subjects);
            const select = document.getElementById('question-subject');
            if (select) {
                select.innerHTML = '<option value="">Select Subject</option>';
                subjects.forEach(subject => {
                    select.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
                });
                console.log('Subject dropdown populated');
            } else {
                console.error('Subject dropdown element not found');
            }
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            console.error('Failed to load subject options:', response.status);
        }
    } catch (error) {
        console.error('Error loading subject options:', error);
    }
}

function displaySubjects(subjects) {
    const list = document.getElementById('subjects-list');
    list.innerHTML = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>Subject Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map(subject => `
                    <tr>
                        <td>${subject.name}</td>
                        <td>${subject.description}</td>
                        <td>
                            <button onclick="deleteSubject(${subject.id})" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function addSubject(event) {
    event.preventDefault();
    
    const name = document.getElementById('subject-name').value;
    const description = document.getElementById('subject-description').value;
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });
        
        if (response.ok) {
            showAlert('Subject added successfully!', 'success');
            event.target.reset();
            loadSubjects();
            loadSubjectOptions();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Failed to add subject', 'error');
        }
    } catch (error) {
        console.error('Error adding subject:', error);
        showAlert('Error adding subject', 'error');
    }
}

async function deleteSubject(subjectId) {
    showConfirm('Are you sure you want to delete this subject?', async () => {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('Subject deleted successfully!', 'success');
            loadSubjects();
            loadSubjectOptions();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Failed to delete subject', 'error');
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        showAlert('Error deleting subject', 'error');
    }
    });
}

async function loadQuestions() {
    const token = localStorage.getItem('token');
    try {
        // Load subjects first
        const subjectsResponse = await fetch(`${API_BASE_URL}/subjects/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subjectsResponse.ok) {
            allSubjects = await subjectsResponse.json();
        }
        
        // Load questions
        const response = await fetch(`${API_BASE_URL}/questions/?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const questions = await response.json();
            allQuestions = questions;
            filteredQuestions = questions;
            displayQuestions(filteredQuestions);
        } else if (response.status === 401) {
            handleUnauthorized();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

window.filterQuestions = function() {
    const examTypeFilter = document.getElementById('filter-exam-type').value;
    const subjectFilter = document.getElementById('filter-subject').value;
    
    filteredQuestions = allQuestions.filter(q => {
        const examTypeMatch = !examTypeFilter || q.exam_type_id == examTypeFilter;
        const subjectMatch = !subjectFilter || q.subject_id == subjectFilter;
        return examTypeMatch && subjectMatch;
    });
    
    currentPage = 1;
    displayQuestions(filteredQuestions);
}

window.resetFilters = function() {
    document.getElementById('filter-exam-type').value = '';
    document.getElementById('filter-subject').value = '';
    filteredQuestions = allQuestions;
    currentPage = 1;
    displayQuestions(filteredQuestions);
}

function displayQuestions(questions) {
    const list = document.getElementById('questions-list');
    if (questions.length === 0) {
        list.innerHTML = '<p>No questions found.</p>';
        return;
    }
    
    const totalPages = Math.ceil(questions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedQuestions = questions.slice(startIndex, endIndex);
    
    list.innerHTML = `
        <div class="search-filters" style="margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center; background: white; padding: 1rem; border-radius: 8px;">
            <select id="filter-exam-type" onchange="filterQuestions()" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">All Exam Types</option>
                <option value="1">NECO</option>
                <option value="2">WAEC</option>
                <option value="3">JAMB</option>
                <option value="4">NABTEB</option>
            </select>
            <select id="filter-subject" onchange="filterQuestions()" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">All Subjects</option>
                ${allSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
            <button onclick="resetFilters()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
        </div>
        <div style="margin-bottom: 1rem; color: #7f8c8d;">
            Showing ${startIndex + 1}-${Math.min(endIndex, questions.length)} of ${questions.length} questions
        </div>
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Exam Type</th>
                    <th>Subject</th>
                    <th>Question</th>
                    <th>Options</th>
                    <th>Correct Answer</th>
                    <th>Explanation</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedQuestions.map(question => {
                    const subject = allSubjects.find(s => s.id === question.subject_id);
                    return `
                    <tr>
                        <td>${question.id}</td>
                        <td>${examTypeMap[question.exam_type_id] || 'N/A'}</td>
                        <td>${subject ? subject.name : 'N/A'}</td>
                        <td>${question.question_text}</td>
                        <td>
                            ${question.options ? `
                                A: ${question.options.A}<br>
                                B: ${question.options.B}<br>
                                C: ${question.options.C}<br>
                                D: ${question.options.D}
                            ` : 'N/A'}
                        </td>
                        <td>${question.correct_answer}</td>
                        <td>${question.explanation || 'N/A'}</td>
                        <td style="white-space: nowrap;">
                            <button onclick="editQuestion(${question.id})" class="edit-btn" style="margin-right: 0.5rem;">Edit</button>
                            <button onclick="deleteQuestion(${question.id})" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
        <div class="pagination">
            <button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>First</button>
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            <button onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Last</button>
        </div>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayQuestions(filteredQuestions);
}

async function addQuestion(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Authentication required. Please login again.', 'warning');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    const examType = document.getElementById('question-exam-type').value;
    const subjectId = document.getElementById('question-subject').value;
    const questionText = document.getElementById('question-text').value;
    const explanation = document.getElementById('question-explanation').value;
    const questionType = document.getElementById('question-type').value;
    const optionA = document.getElementById('option-a').value;
    const optionB = document.getElementById('option-b').value;
    const optionC = document.getElementById('option-c').value;
    const optionD = document.getElementById('option-d').value;
    const correctAnswer = document.getElementById('correct-answer').value;
    
    const examTypeMap = {
        'NECO': 1,
        'WAEC': 2,
        'JAMB': 3,
        'NABTEB': 4
    };
    
    const payload = {
        exam_type_id: examTypeMap[examType],
        subject_id: parseInt(subjectId),
        question_text: questionText,
        explanation: explanation || null,
        question_type: questionType,
        options: {
            A: optionA,
            B: optionB,
            C: optionC,
            D: optionD
        },
        correct_answer: correctAnswer
    };
    
    console.log('Sending question payload:', payload);
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showAlert('Question added successfully!', 'success');
            event.target.reset();
            currentPage = 1;
            loadQuestions();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const error = await response.json();
            console.log('Error response:', error);
            const errorMsg = Array.isArray(error.detail) 
                ? error.detail.map(e => `${e.loc ? e.loc.join('.') + ': ' : ''}${e.msg}`).join(', ') 
                : error.detail || JSON.stringify(error);
            showAlert(`Failed to add question: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Error adding question:', error);
        if (error.message === 'Failed to fetch') {
            showAlert('Cannot connect to backend server. Please ensure backend is running and CORS is enabled.', 'error');
        } else {
            showAlert(`Error adding question: ${error.message}`, 'error');
        }
    }
}

let allQuestions = [];
let filteredQuestions = [];
let allSubjects = [];
let currentPage = 1;
const rowsPerPage = 20;

const examTypeMap = { 1: 'NECO', 2: 'WAEC', 3: 'JAMB', 4: 'NABTEB' };

async function editQuestion(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    // Populate modal fields
    document.getElementById('edit-question-id').value = question.id;
    
    const examTypeMap = { 1: 'NECO', 2: 'WAEC', 3: 'JAMB', 4: 'NABTEB' };
    document.getElementById('edit-question-exam-type').value = examTypeMap[question.exam_type_id];
    
    // Load subjects for edit modal
    await loadEditSubjectOptions();
    document.getElementById('edit-question-subject').value = question.subject_id;
    
    document.getElementById('edit-question-text').value = question.question_text;
    document.getElementById('edit-question-explanation').value = question.explanation || '';
    document.getElementById('edit-option-a').value = question.options?.A || '';
    document.getElementById('edit-option-b').value = question.options?.B || '';
    document.getElementById('edit-option-c').value = question.options?.C || '';
    document.getElementById('edit-option-d').value = question.options?.D || '';
    document.getElementById('edit-correct-answer').value = question.correct_answer;
    
    document.getElementById('edit-question-modal').style.display = 'flex';
}

window.closeEditModal = function() {
    document.getElementById('edit-question-modal').style.display = 'none';
}

async function loadEditSubjectOptions() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const subjects = await response.json();
            const select = document.getElementById('edit-question-subject');
            select.innerHTML = '<option value="">Select Subject</option>';
            subjects.forEach(subject => {
                select.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

window.updateQuestion = async function(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const questionId = document.getElementById('edit-question-id').value;
    const examType = document.getElementById('edit-question-exam-type').value;
    const subjectId = document.getElementById('edit-question-subject').value;
    const questionText = document.getElementById('edit-question-text').value;
    const explanation = document.getElementById('edit-question-explanation').value;
    const optionA = document.getElementById('edit-option-a').value;
    const optionB = document.getElementById('edit-option-b').value;
    const optionC = document.getElementById('edit-option-c').value;
    const optionD = document.getElementById('edit-option-d').value;
    const correctAnswer = document.getElementById('edit-correct-answer').value;
    
    const examTypeMap = { 'NECO': 1, 'WAEC': 2, 'JAMB': 3, 'NABTEB': 4 };
    
    const payload = {
        exam_type_id: examTypeMap[examType],
        subject_id: parseInt(subjectId),
        question_text: questionText,
        explanation: explanation || null,
        question_type: 'multiple_choice',
        options: { A: optionA, B: optionB, C: optionC, D: optionD },
        correct_answer: correctAnswer
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showAlert('Question updated successfully!', 'success');
            closeEditModal();
            currentPage = 1;
            loadQuestions();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const error = await response.json();
            showAlert(`Failed to update question: ${error.detail || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error updating question:', error);
        showAlert(`Error updating question: ${error.message}`, 'error');
    }
}

async function deleteQuestion(questionId) {
    showConfirm('Are you sure you want to delete this question?', async () => {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('Question deleted successfully!', 'success');
            loadQuestions();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Failed to delete question', 'error');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        showAlert('Error deleting question', 'error');
    }
    });
}

async function loadUsers() {
    const token = localStorage.getItem('token');
    console.log('Loading users with token:', token);
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/?skip=0&limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const users = await response.json();
            console.log('Users loaded:', users);
            displayUsers(users);
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const errorText = await response.text();
            console.error('Failed to load users:', response.status, errorText);
            document.getElementById('users-list').innerHTML = `<p>Error loading users: ${response.status}</p>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

async function deleteUser(userId) {
    showConfirm('Are you sure you want to delete this user?', async () => {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('User deleted successfully!', 'success');
            loadUsers();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user', 'error');
    }
    });
}

function displayUsers(users) {
    const list = document.getElementById('users-list');
    list.innerHTML = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.is_active ? 'Active' : 'Inactive'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                            <button onclick="deleteUser(${user.id})" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}