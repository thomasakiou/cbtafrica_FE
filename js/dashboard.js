// const API_BASE_URL = 'http://localhost:8000/api/v1';

function loadUserInfo() {
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('user-name').textContent = `Welcome, ${username}`;
    }
}

async function loadSubjects() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const subjects = await response.json();
            const select = document.getElementById('subject');
            select.innerHTML = '<option value="">Choose Subject</option>';
            subjects.forEach(subject => {
                select.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
            });
        } else if (response.status === 401) {
            showAlert('Session expired. Please login again.', 'warning');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'index.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadPreviousResults() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/results/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const results = await response.json();
            displayPreviousResults(results);
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

function displayPreviousResults(results) {
    const resultsList = document.getElementById('results-list');
    
    if (results.length === 0) {
        resultsList.innerHTML = '<p>No previous results found. Take your first test!</p>';
        return;
    }
    
    resultsList.innerHTML = results.map(result => `
        <div class="result-item">
            <h4>${result.test_title}</h4>
            <p>Score: ${result.score}% | Status: ${result.passed ? 'Passed' : 'Failed'}</p>
            <p>Date: ${new Date(result.completed_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

async function startExam(event) {
    event.preventDefault();
    
    const examType = document.getElementById('exam-type').value;
    const subjectId = document.getElementById('subject').value;
    const subjectSelect = document.getElementById('subject');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
    const duration = parseInt(document.getElementById('test-duration').value);
    const questionCount = parseInt(document.getElementById('question-count').value);
    
    if (!examType || !subjectId || !duration || !questionCount || subjectName === 'Choose Subject') {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    const examTypeMap = {
        'NECO': 1,
        'WAEC': 2,
        'JAMB': 3,
        'NABTEB': 4
    };
    
    // Store exam configuration
    localStorage.setItem('examConfig', JSON.stringify({
        examType,
        subjectId: parseInt(subjectId),
        subjectName,
        examTypeId: examTypeMap[examType],
        duration,
        questionCount,
        startTime: Date.now()
    }));
    
    window.location.href = 'exam.html';
}


// const API_BASE_URL = 'http://localhost:8000/api/v1';

// function loadUserInfo() {
//     const username = localStorage.getItem('username');
//     if (username) {
//         document.getElementById('user-name').textContent = `Welcome, ${username}`;
//     }
// }

// async function loadSubjects() {
//     const token = localStorage.getItem('token');
//     const select = document.getElementById('subject');

//     // ✅ ensure element exists
//     if (!select) {
//         console.error('Subject dropdown not found in DOM.');
//         return;
//     }

//     try {
//         // ✅ Removed trailing slash in URL — some backends treat `/subjects/` and `/subjects` differently
//         const response = await fetch(`${API_BASE_URL}/subjects`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (response.ok) {
//             const subjects = await response.json();

//             // ✅ handle both list and object responses
//             if (!Array.isArray(subjects)) {
//                 console.error('Unexpected subjects response:', subjects);
//                 return;
//             }

//             select.innerHTML = '<option value="">Choose Subject</option>';
            
//             // ✅ use DOM-safe appendChild instead of innerHTML concatenation
//             subjects.forEach(subject => {
//                 const option = document.createElement('option');
//                 option.value = subject.id;
//                 option.textContent = subject.name;
//                 select.appendChild(option);
//             });

//             console.log('✅ Subjects loaded successfully');
//         } 
//         else if (response.status === 401) {
//             alert('Session expired. Please login again.');
//             localStorage.clear();
//             window.location.href = 'index.html';
//         } 
//         else {
//             const errText = await response.text();
//             console.error('❌ Failed to load subjects:', response.status, errText);
//         }
//     } catch (error) {
//         console.error('❌ Error loading subjects:', error);
//     }
// }

// async function loadPreviousResults() {
//     const token = localStorage.getItem('token');
//     const userId = localStorage.getItem('userId');
    
//     if (!userId) return;
    
//     try {
//         const response = await fetch(`${API_BASE_URL}/results/user/${userId}`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });
        
//         if (response.ok) {
//             const results = await response.json();
//             displayPreviousResults(results);
//         }
//     } catch (error) {
//         console.error('Error loading results:', error);
//     }
// }

// function displayPreviousResults(results) {
//     const resultsList = document.getElementById('results-list');
    
//     if (results.length === 0) {
//         resultsList.innerHTML = '<p>No previous results found. Take your first test!</p>';
//         return;
//     }
    
//     resultsList.innerHTML = results.map(result => `
//         <div class="result-item">
//             <h4>${result.test_title}</h4>
//             <p>Score: ${result.score}% | Status: ${result.passed ? 'Passed' : 'Failed'}</p>
//             <p>Date: ${new Date(result.completed_at).toLocaleDateString()}</p>
//         </div>
//     `).join('');
// }

// async function startExam(event) {
//     event.preventDefault();
    
//     const examType = document.getElementById('exam-type').value;
//     const subjectId = document.getElementById('subject').value;
//     const duration = parseInt(document.getElementById('test-duration').value);
//     const questionCount = parseInt(document.getElementById('question-count').value);
    
//     if (!examType || !subjectId || !duration || !questionCount) {
//         alert('Please fill in all fields');
//         return;
//     }
    
//     try {
//         localStorage.setItem('examConfig', JSON.stringify({
//             examType,
//             subjectId: parseInt(subjectId),
//             duration,
//             questionCount,
//             startTime: Date.now()
//         }));
        
//         window.location.href = 'exam.html';
        
//     } catch (error) {
//         console.error('Error starting exam:', error);
//         alert('Failed to start exam. Please check your connection.');
//     }
// }

// // ✅ Ensure subjects load when page is ready
// document.addEventListener('DOMContentLoaded', loadSubjects);
