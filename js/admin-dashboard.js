// API_BASE_URL is already declared in auth.js which loads first
// If for some reason it's not available, we'll check and log an error
if (typeof API_BASE_URL === 'undefined') {
    console.error('API_BASE_URL is not defined. Make sure auth.js loads before admin-dashboard.js');
}

// Image preview function for explanation images
function previewExplanationImage(event, previewId) {
    const file = event.target.files[0];
    const previewDiv = document.getElementById(previewId);
    
    // Clear previous preview
    previewDiv.innerHTML = '';
    
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size should not exceed 5MB', 'warning');
            event.target.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showAlert('Please select a valid image file', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            img.style.borderRadius = '4px';
            img.style.border = '1px solid #ddd';
            img.style.marginTop = '0.5rem';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image';
            removeBtn.textContent = 'Remove Image';
            removeBtn.onclick = function() {
                previewDiv.innerHTML = '';
                event.target.value = '';
            };
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
        };
        reader.readAsDataURL(file);
    }
}

// Upload explanation image to backend
async function uploadExplanationImage(questionId, imageFile) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}/upload-explanation-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Image uploaded successfully:', data.explanation_image);
            return data;
        } else if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to upload image');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Delete explanation image from backend
async function deleteExplanationImage(questionId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}/explanation-image`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            console.log('Image deleted successfully');
            return true;
        } else if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete image');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

// Image preview function for question images
function previewQuestionImage(event, previewId) {
    const file = event.target.files[0];
    const previewDiv = document.getElementById(previewId);
    
    // Clear previous preview
    previewDiv.innerHTML = '';
    
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size should not exceed 5MB', 'warning');
            event.target.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showAlert('Please select a valid image file', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            img.style.borderRadius = '4px';
            img.style.border = '1px solid #ddd';
            img.style.marginTop = '0.5rem';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image';
            removeBtn.textContent = 'Remove Image';
            removeBtn.onclick = function() {
                previewDiv.innerHTML = '';
                event.target.value = '';
            };
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
        };
        reader.readAsDataURL(file);
    }
}

// Upload question image to backend
async function uploadQuestionImage(questionId, imageFile) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', imageFile);
    
    console.log('Uploading question image for question ID:', questionId);
    console.log('Image file:', imageFile.name, 'Size:', imageFile.size);
    console.log('Upload URL:', `${API_BASE_URL}/questions/${questionId}/upload-question-image`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}/upload-question-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Upload response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Question image uploaded successfully. Full response:', data);
            console.log('Question image path:', data.question_image);
            return data;
        } else if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        } else {
            const error = await response.json();
            console.error('Upload failed with error:', error);
            throw new Error(error.detail || 'Failed to upload question image');
        }
    } catch (error) {
        console.error('Error uploading question image:', error);
        throw error;
    }
}

// Delete question image from backend
async function deleteQuestionImage(questionId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}/question-image`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            console.log('Question image deleted successfully');
            return true;
        } else if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete question image');
        }
    } catch (error) {
        console.error('Error deleting question image:', error);
        throw error;
    }
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
            allSubjects = subjects;
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
    
    if (subjects.length === 0) {
        list.innerHTML = '<p>No subjects found.</p>';
        return;
    }
    
    const totalPages = Math.ceil(subjects.length / subjectsPerPage);
    const startIndex = (currentSubjectPage - 1) * subjectsPerPage;
    const endIndex = startIndex + subjectsPerPage;
    const paginatedSubjects = subjects.slice(startIndex, endIndex);
    
    list.innerHTML = `
        <div style="margin-bottom: 1rem; color: #7f8c8d;">
            Showing ${startIndex + 1}-${Math.min(endIndex, subjects.length)} of ${subjects.length} subjects
        </div>
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Subject Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedSubjects.map(subject => `
                    <tr>
                        <td>${subject.id}</td>
                        <td>${subject.name}</td>
                        <td>${subject.description}</td>
                        <td>
                            <button onclick="deleteSubject(${subject.id})" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="pagination">
            <button onclick="changeSubjectPage(1)" ${currentSubjectPage === 1 ? 'disabled' : ''}>First</button>
            <button onclick="changeSubjectPage(${currentSubjectPage - 1})" ${currentSubjectPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentSubjectPage} of ${totalPages}</span>
            <button onclick="changeSubjectPage(${currentSubjectPage + 1})" ${currentSubjectPage === totalPages ? 'disabled' : ''}>Next</button>
            <button onclick="changeSubjectPage(${totalPages})" ${currentSubjectPage === totalPages ? 'disabled' : ''}>Last</button>
        </div>
    `;
}

window.changeSubjectPage = function(page) {
    const totalPages = Math.ceil(allSubjects.length / subjectsPerPage);
    if (page < 1 || page > totalPages) return;
    currentSubjectPage = page;
    displaySubjects(allSubjects);
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
            currentSubjectPage = 1;
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
                        <td>
                            ${question.question_text || '<span style="color: #999;">No text</span>'}
                            ${question.question_image ? '<br><span style="color: #3498db; font-size: 0.85rem;">🖼️ Has image</span>' : ''}
                        </td>
                        <td>
                            ${question.options ? `
                                A: ${question.options.A}<br>
                                B: ${question.options.B}<br>
                                C: ${question.options.C}<br>
                                D: ${question.options.D}
                            ` : 'N/A'}
                        </td>
                        <td>${question.correct_answer}</td>
                        <td>
                            ${question.explanation || 'N/A'}
                            ${question.explanation_image ? '<br><span style="color: #27ae60; font-size: 0.85rem;">📷 Has image</span>' : ''}
                        </td>
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
    const questionImageFile = document.getElementById('question-image').files[0];
    const explanationImageFile = document.getElementById('explanation-image').files[0];
    
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
            const questionData = await response.json();
            console.log('Question created:', questionData);
            
            // Upload images if provided
            let questionImageUploaded = false;
            let explanationImageUploaded = false;
            let questionImageError = null;
            let explanationImageError = null;
            
            if (questionImageFile) {
                console.log('Attempting to upload question image...');
                try {
                    const result = await uploadQuestionImage(questionData.id, questionImageFile);
                    questionImageUploaded = true;
                    console.log('Question image upload successful, result:', result);
                } catch (imgError) {
                    questionImageError = imgError.message;
                    console.error('Failed to upload question image:', imgError);
                }
            }
            
            if (explanationImageFile) {
                console.log('Attempting to upload explanation image...');
                try {
                    const result = await uploadExplanationImage(questionData.id, explanationImageFile);
                    explanationImageUploaded = true;
                    console.log('Explanation image upload successful, result:', result);
                } catch (imgError) {
                    explanationImageError = imgError.message;
                    console.error('Failed to upload explanation image:', imgError);
                }
            }
            
            // Show appropriate success message
            if (questionImageUploaded && explanationImageUploaded) {
                showAlert('Question and images added successfully!', 'success');
            } else if (questionImageUploaded || explanationImageUploaded) {
                let msg = 'Question added';
                if (questionImageUploaded) msg += ' with question image';
                if (explanationImageUploaded) msg += ' with explanation image';
                msg += '!';
                showAlert(msg, 'success');
            } else if (questionImageFile || explanationImageFile) {
                let errorMsg = 'Question added, but image upload failed: ';
                if (questionImageError) errorMsg += `Question image: ${questionImageError}. `;
                if (explanationImageError) errorMsg += `Explanation image: ${explanationImageError}.`;
                showAlert(errorMsg, 'warning');
            } else {
                showAlert('Question added successfully!', 'success');
            }
            
            event.target.reset();
            document.getElementById('question-preview').innerHTML = '';
            document.getElementById('explanation-preview').innerHTML = '';
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
let allUsers = [];
let currentPage = 1;
let currentUserPage = 1;
let currentSubjectPage = 1;
const rowsPerPage = 20;
const usersPerPage = 20;
const subjectsPerPage = 20;

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
    
    document.getElementById('edit-question-text').value = question.question_text || '';
    document.getElementById('edit-question-explanation').value = question.explanation || '';
    document.getElementById('edit-option-a').value = question.options?.A || '';
    document.getElementById('edit-option-b').value = question.options?.B || '';
    document.getElementById('edit-option-c').value = question.options?.C || '';
    document.getElementById('edit-option-d').value = question.options?.D || '';
    document.getElementById('edit-correct-answer').value = question.correct_answer;
    
    // Clear previous image previews and file inputs
    document.getElementById('edit-question-image').value = '';
    document.getElementById('edit-question-preview').innerHTML = '';
    document.getElementById('edit-explanation-image').value = '';
    document.getElementById('edit-explanation-preview').innerHTML = '';
    
    // Display current question image if exists
    const currentQuestionImageDiv = document.getElementById('edit-current-question-image');
    if (question.question_image) {
        const imageUrl = question.question_image.startsWith('http') 
            ? question.question_image 
            : `${API_BASE_URL.replace('/api/v1', '')}/${question.question_image}`;
        
        currentQuestionImageDiv.innerHTML = `
            <p style="font-size: 0.9rem; color: #666; margin: 0.5rem 0;">Current Question Image:</p>
            <img src="${imageUrl}" alt="Question" style="max-width: 100%; max-height: 200px; border-radius: 4px; border: 1px solid #ddd;">
            <div style="margin-top: 0.5rem;">
                <button type="button" onclick="removeCurrentQuestionImage(${question.id})" class="remove-image" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Delete Current Image</button>
                <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0;">Or upload a new image to replace it</p>
            </div>
        `;
    } else {
        currentQuestionImageDiv.innerHTML = '<p style="font-size: 0.9rem; color: #999;">No question image currently set</p>';
    }
    
    // Display current explanation image if exists
    const currentImageDiv = document.getElementById('edit-current-explanation-image');
    if (question.explanation_image) {
        // Construct proper image URL
        const imageUrl = question.explanation_image.startsWith('http') 
            ? question.explanation_image 
            : `${API_BASE_URL.replace('/api/v1', '')}/${question.explanation_image}`;
        
        currentImageDiv.innerHTML = `
            <p style="font-size: 0.9rem; color: #666; margin: 0.5rem 0;">Current Explanation Image:</p>
            <img src="${imageUrl}" alt="Explanation" style="max-width: 100%; max-height: 200px; border-radius: 4px; border: 1px solid #ddd;">
            <div style="margin-top: 0.5rem;">
                <button type="button" onclick="removeCurrentExplanationImage(${question.id})" class="remove-image" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Delete Current Image</button>
                <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0;">Or upload a new image to replace it</p>
            </div>
        `;
    } else {
        currentImageDiv.innerHTML = '<p style="font-size: 0.9rem; color: #999;">No explanation image currently set</p>';
    }
    
    document.getElementById('edit-question-modal').style.display = 'flex';
}

window.closeEditModal = function() {
    document.getElementById('edit-question-modal').style.display = 'none';
}

window.removeCurrentQuestionImage = async function(questionId) {
    if (!confirm('Are you sure you want to delete the current question image?')) {
        return;
    }
    
    try {
        await deleteQuestionImage(questionId);
        showAlert('Question image deleted successfully!', 'success');
        
        // Refresh the edit modal to show updated state
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            question.question_image = null;
            document.getElementById('edit-current-question-image').innerHTML = 
                '<p style="font-size: 0.9rem; color: #999;">No question image currently set</p>';
        }
    } catch (error) {
        showAlert('Failed to delete image: ' + error.message, 'error');
    }
}

window.removeCurrentExplanationImage = async function(questionId) {
    if (!confirm('Are you sure you want to delete the current explanation image?')) {
        return;
    }
    
    try {
        await deleteExplanationImage(questionId);
        showAlert('Explanation image deleted successfully!', 'success');
        
        // Refresh the edit modal to show updated state
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            question.explanation_image = null;
            document.getElementById('edit-current-explanation-image').innerHTML = 
                '<p style="font-size: 0.9rem; color: #999;">No explanation image currently set</p>';
        }
    } catch (error) {
        showAlert('Failed to delete image: ' + error.message, 'error');
    }
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
    const questionImageFile = document.getElementById('edit-question-image').files[0];
    const explanationImageFile = document.getElementById('edit-explanation-image').files[0];
    
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
            // Upload new images if provided
            let questionImageUploaded = false;
            let explanationImageUploaded = false;
            let questionImageError = null;
            let explanationImageError = null;
            
            if (questionImageFile) {
                console.log('Attempting to upload question image...');
                try {
                    const result = await uploadQuestionImage(questionId, questionImageFile);
                    questionImageUploaded = true;
                    console.log('Question image upload successful, result:', result);
                } catch (imgError) {
                    questionImageError = imgError.message;
                    console.error('Failed to upload question image:', imgError);
                }
            }
            
            if (explanationImageFile) {
                console.log('Attempting to upload explanation image...');
                try {
                    const result = await uploadExplanationImage(questionId, explanationImageFile);
                    explanationImageUploaded = true;
                    console.log('Explanation image upload successful, result:', result);
                } catch (imgError) {
                    explanationImageError = imgError.message;
                    console.error('Failed to upload explanation image:', imgError);
                }
            }
            
            // Show appropriate success message
            if (questionImageUploaded && explanationImageUploaded) {
                showAlert('Question and images updated successfully!', 'success');
            } else if (questionImageUploaded || explanationImageUploaded) {
                let msg = 'Question updated';
                if (questionImageUploaded) msg += ' with question image';
                if (explanationImageUploaded) msg += ' with explanation image';
                msg += '!';
                showAlert(msg, 'success');
            } else if (questionImageFile || explanationImageFile) {
                let errorMsg = 'Question updated, but image upload failed: ';
                if (questionImageError) errorMsg += `Question image: ${questionImageError}. `;
                if (explanationImageError) errorMsg += `Explanation image: ${explanationImageError}.`;
                showAlert(errorMsg, 'warning');
            } else {
                showAlert('Question updated successfully!', 'success');
            }
            
            document.getElementById('edit-question-preview').innerHTML = '';
            document.getElementById('edit-explanation-preview').innerHTML = '';
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
            allUsers = users;
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
    
    if (users.length === 0) {
        list.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    const totalPages = Math.ceil(users.length / usersPerPage);
    const startIndex = (currentUserPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    list.innerHTML = `
        <div style="margin-bottom: 1rem; color: #7f8c8d;">
            Showing ${startIndex + 1}-${Math.min(endIndex, users.length)} of ${users.length} users
        </div>
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
                ${paginatedUsers.map(user => `
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
        <div class="pagination">
            <button onclick="changeUserPage(1)" ${currentUserPage === 1 ? 'disabled' : ''}>First</button>
            <button onclick="changeUserPage(${currentUserPage - 1})" ${currentUserPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentUserPage} of ${totalPages}</span>
            <button onclick="changeUserPage(${currentUserPage + 1})" ${currentUserPage === totalPages ? 'disabled' : ''}>Next</button>
            <button onclick="changeUserPage(${totalPages})" ${currentUserPage === totalPages ? 'disabled' : ''}>Last</button>
        </div>
    `;
}

window.changeUserPage = function(page) {
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    currentUserPage = page;
    displayUsers(allUsers);
}

// News Management Functions
let allNews = [];
let currentNewsPage = 1;
const newsPerPage = 20;

async function loadNews() {
    const token = localStorage.getItem('token');
    console.log('Loading news with token:', token);
    
    try {
        const response = await fetch(`${API_BASE_URL}/news/?skip=0&limit=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('News response status:', response.status);
        
        if (response.ok) {
            const news = await response.json();
            console.log('News loaded:', news);
            allNews = news;
            displayNews(news);
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const errorText = await response.text();
            console.error('Failed to load news:', response.status, errorText);
            document.getElementById('news-list').innerHTML = `<p>Error loading news: ${response.status}</p>`;
        }
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('news-list').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayNews(news) {
    const list = document.getElementById('news-list');
    
    if (news.length === 0) {
        list.innerHTML = '<p>No news items found.</p>';
        return;
    }
    
    const totalPages = Math.ceil(news.length / newsPerPage);
    const startIndex = (currentNewsPage - 1) * newsPerPage;
    const endIndex = startIndex + newsPerPage;
    const paginatedNews = news.slice(startIndex, endIndex);
    
    list.innerHTML = `
        <div style="margin-bottom: 1rem; color: #7f8c8d;">
            Showing ${startIndex + 1}-${Math.min(endIndex, news.length)} of ${news.length} news items
        </div>
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Content Preview</th>
                    <th>URL</th>
                    <th>Publication Date</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedNews.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td style="max-width: 200px;">${item.title}</td>
                        <td style="max-width: 300px;">${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</td>
                        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">
                            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: #3498db; text-decoration: none;">
                                ${item.url.substring(0, 30)}${item.url.length > 30 ? '...' : ''}
                            </a>
                        </td>
                        <td>${new Date(item.date).toLocaleDateString()}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td style="white-space: nowrap;">
                            <button onclick="editNews(${item.id})" class="edit-btn" style="margin-right: 0.5rem;">Edit</button>
                            <button onclick="deleteNews(${item.id})" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="pagination">
            <button onclick="changeNewsPage(1)" ${currentNewsPage === 1 ? 'disabled' : ''}>First</button>
            <button onclick="changeNewsPage(${currentNewsPage - 1})" ${currentNewsPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentNewsPage} of ${totalPages}</span>
            <button onclick="changeNewsPage(${currentNewsPage + 1})" ${currentNewsPage === totalPages ? 'disabled' : ''}>Next</button>
            <button onclick="changeNewsPage(${totalPages})" ${currentNewsPage === totalPages ? 'disabled' : ''}>Last</button>
        </div>
    `;
}

window.changeNewsPage = function(page) {
    const totalPages = Math.ceil(allNews.length / newsPerPage);
    if (page < 1 || page > totalPages) return;
    currentNewsPage = page;
    displayNews(allNews);
}

async function addNews(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Authentication required. Please login again.', 'warning');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    const url = document.getElementById('news-url').value;
    const dateInput = document.getElementById('news-date').value;
    
    // Convert datetime-local to ISO format
    const date = new Date(dateInput).toISOString();
    
    const payload = {
        title: title,
        content: content,
        url: url,
        date: date
    };
    
    console.log('Sending news payload:', payload);
    
    try {
        const response = await fetch(`${API_BASE_URL}/news/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const newsData = await response.json();
            console.log('News created:', newsData);
            showAlert('News added successfully!', 'success');
            event.target.reset();
            currentNewsPage = 1;
            loadNews();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const error = await response.json();
            console.log('Error response:', error);
            const errorMsg = Array.isArray(error.detail) 
                ? error.detail.map(e => `${e.loc ? e.loc.join('.') + ': ' : ''}${e.msg}`).join(', ') 
                : error.detail || JSON.stringify(error);
            showAlert(`Failed to add news: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Error adding news:', error);
        if (error.message === 'Failed to fetch') {
            showAlert('Cannot connect to backend server. Please ensure backend is running and CORS is enabled.', 'error');
        } else {
            showAlert(`Error adding news: ${error.message}`, 'error');
        }
    }
}

async function editNews(newsId) {
    const newsItem = allNews.find(n => n.id === newsId);
    if (!newsItem) return;
    
    // Populate modal fields
    document.getElementById('edit-news-id').value = newsItem.id;
    document.getElementById('edit-news-title').value = newsItem.title;
    document.getElementById('edit-news-content').value = newsItem.content;
    document.getElementById('edit-news-url').value = newsItem.url;
    
    // Convert ISO date to datetime-local format
    const date = new Date(newsItem.date);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('edit-news-date').value = localDateTime;
    
    document.getElementById('edit-news-modal').style.display = 'flex';
}

window.closeEditNewsModal = function() {
    document.getElementById('edit-news-modal').style.display = 'none';
}

window.updateNews = async function(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const newsId = document.getElementById('edit-news-id').value;
    const title = document.getElementById('edit-news-title').value;
    const content = document.getElementById('edit-news-content').value;
    const url = document.getElementById('edit-news-url').value;
    const dateInput = document.getElementById('edit-news-date').value;
    
    // Convert datetime-local to ISO format
    const date = new Date(dateInput).toISOString();
    
    const payload = {
        title: title,
        content: content,
        url: url,
        date: date
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/news/${newsId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showAlert('News updated successfully!', 'success');
            closeEditNewsModal();
            currentNewsPage = 1;
            loadNews();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            const error = await response.json();
            showAlert(`Failed to update news: ${error.detail || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error updating news:', error);
        showAlert(`Error updating news: ${error.message}`, 'error');
    }
}

async function deleteNews(newsId) {
    showConfirm('Are you sure you want to delete this news item?', async () => {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`${API_BASE_URL}/news/${newsId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showAlert('News deleted successfully!', 'success');
                loadNews();
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                showAlert('Failed to delete news', 'error');
            }
        } catch (error) {
            console.error('Error deleting news:', error);
            showAlert('Error deleting news', 'error');
        }
    });
}