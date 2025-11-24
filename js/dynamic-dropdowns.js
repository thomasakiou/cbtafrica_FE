// Cache DOM elements
const examTypeSelect = document.getElementById('exam-type');
const subjectSelect = document.getElementById('subject');
const yearSelect = document.getElementById('exam-year');

// Store all questions data
let allQuestions = [];
let allSubjects = [];

// Map of exam type names to their IDs
const examTypeMap = {
    'NECO': 1,
    'WAEC': 2,
    'JAMB': 3,
    'NABTEB': 4
};

// Initialize the dropdowns
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    
    // Add event listeners
    examTypeSelect.addEventListener('change', updateSubjects);
    subjectSelect.addEventListener('change', updateYears);
});

// Load all necessary data
async function loadAllData() {
    try {
        // Show loading state
        examTypeSelect.innerHTML = '<option value="">Loading exam data...</option>';
        examTypeSelect.disabled = true;
        
        // Load both questions and subjects in parallel
        const [questions, subjects] = await Promise.all([
            loadAllQuestions(),
            loadAllSubjects()
        ]);
        
        // Store the loaded data
        allQuestions = questions;
        allSubjects = subjects;
        
        console.log('All data loaded successfully');
        console.log('Total questions:', allQuestions.length);
        console.log('Total subjects:', allSubjects.length);
        
        // Update the exam type dropdown
        examTypeSelect.innerHTML = `
            <option value="">Choose Exam Type</option>
            <option value="NECO">NECO</option>
            <option value="WAEC">WAEC</option>
            <option value="JAMB">JAMB</option>
        `;
        examTypeSelect.disabled = false;
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Failed to load exam data. Please refresh the page.', 'error');
        
        // Reset the dropdown to a usable state
        examTypeSelect.innerHTML = `
            <option value="">Error loading data. Click to retry.</option>
            <option value="NECO">NECO</option>
            <option value="WAEC">WAEC</option>
            <option value="JAMB">JAMB</option>
        `;
        examTypeSelect.disabled = false;
        
        // Add retry functionality
        examTypeSelect.onclick = function() {
            if (this.value === '') {
                this.innerHTML = '<option value="">Loading...</option>';
                loadAllData();
            }
        };
    }
}

// Load all questions with pagination support
async function loadAllQuestions() {
    try {
        const token = localStorage.getItem('token');
        let allFetchedQuestions = [];
        let page = 1;
        let hasMore = true;
        const maxPages = 20; // Safety limit to prevent infinite loops

        while (hasMore && page <= maxPages) {
            const response = await fetch(`${API_BASE_URL}/questions/?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load questions (page ${page})`);
            }

            const data = await response.json();
            
            // Handle both paginated and non-paginated responses
            if (Array.isArray(data)) {
                // Non-paginated response (array of questions)
                allFetchedQuestions = [...allFetchedQuestions, ...data];
                hasMore = false; // No more pages if we got an array
            } else if (data.results) {
                // Paginated response (Django REST framework style)
                allFetchedQuestions = [...allFetchedQuestions, ...data.results];
                hasMore = !!data.next;
            } else {
                // Single question or unexpected format
                allFetchedQuestions.push(data);
                hasMore = false;
            }
            
            console.log(`Loaded page ${page}, total questions so far:`, allFetchedQuestions.length);
            page++;
        }
        
        console.log('Total questions loaded:', allFetchedQuestions.length);
        return allFetchedQuestions;
    } catch (error) {
        console.error('Error loading questions:', error);
        showAlert('Error loading questions. Some features may not work correctly.', 'error');
        throw error;
    }
}

// Load all subjects with pagination support
async function loadAllSubjects() {
    try {
        const token = localStorage.getItem('token');
        let allFetchedSubjects = [];
        let page = 1;
        let hasMore = true;
        const maxPages = 10; // Safety limit to prevent infinite loops

        while (hasMore && page <= maxPages) {
            const response = await fetch(`${API_BASE_URL}/subjects/?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load subjects (page ${page})`);
            }

            const data = await response.json();
            
            // Handle both paginated and non-paginated responses
            if (Array.isArray(data)) {
                // Non-paginated response (array of subjects)
                allFetchedSubjects = [...allFetchedSubjects, ...data];
                hasMore = false;
            } else if (data.results) {
                // Paginated response (Django REST framework style)
                allFetchedSubjects = [...allFetchedSubjects, ...data.results];
                hasMore = !!data.next;
            } else {
                // Single subject or unexpected format
                allFetchedSubjects.push(data);
                hasMore = false;
            }
            
            console.log(`Loaded subjects page ${page}, total subjects so far:`, allFetchedSubjects.length);
            page++;
        }
        
        console.log('Total subjects loaded:', allFetchedSubjects.length);
        return allFetchedSubjects;
    } catch (error) {
        console.error('Error loading subjects:', error);
        showAlert('Error loading subjects. Some features may not work correctly.', 'error');
        throw error;
    }
}

// Update subjects based on selected exam type
function updateSubjects() {
    const selectedExamType = examTypeSelect.value;
    
    // Clear current subjects and years
    subjectSelect.innerHTML = '<option value="">Choose Subject</option>';
    yearSelect.innerHTML = '<option value="">All Years</option>';
    
    if (!selectedExamType) {
        subjectSelect.disabled = true;
        yearSelect.disabled = true;
        return;
    }
    
    const examTypeId = examTypeMap[selectedExamType];
    
    // Get all questions for the selected exam type
    const examQuestions = allQuestions.filter(q => q.exam_type_id == examTypeId);
    
    console.log(`Found ${examQuestions.length} questions for ${selectedExamType} (ID: ${examTypeId})`);
    
    // Get unique subject IDs from these questions
    const subjectIds = [...new Set(
        examQuestions
            .map(q => q.subject_id)
            .filter(id => id != null) // Filter out null/undefined subject IDs
    )];
    
    console.log(`Found ${subjectIds.length} unique subjects for ${selectedExamType}:`, subjectIds);
    
    // Get the actual subject objects
    const availableSubjects = allSubjects.filter(subject => 
        subjectIds.includes(subject.id)
    );
    
    console.log(`Available subjects for ${selectedExamType}:`, availableSubjects);
    
    if (availableSubjects.length === 0) {
        subjectSelect.innerHTML += '<option value="" disabled>No subjects found for this exam type</option>';
        subjectSelect.disabled = false;
        yearSelect.disabled = true;
        
        // Debug: Log all exam types in the questions for reference
        const allExamTypes = [...new Set(allQuestions.map(q => q.exam_type_id))];
        console.log('All exam types in questions:', allExamTypes);
        
        return;
    }
    
    // Add subjects to the dropdown
    availableSubjects.forEach(subject => {
        subjectSelect.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
    });
    
    subjectSelect.disabled = false;
    yearSelect.disabled = true;
}

// Update years based on selected subject
function updateYears() {
    const selectedSubjectId = subjectSelect.value;
    const selectedExamType = examTypeSelect.value;
    
    // Clear current years
    yearSelect.innerHTML = '<option value="">All Years</option>';
    
    if (!selectedSubjectId || !selectedExamType) {
        yearSelect.disabled = true;
        return;
    }
    
    const examTypeId = examTypeMap[selectedExamType];
    
    // Get unique years for the selected subject and exam type
    const years = [...new Set(
        allQuestions
            .filter(q => q.subject_id == selectedSubjectId && q.exam_type_id == examTypeId)
            .map(q => q.year)
            .filter(year => year) // Filter out null/undefined years
            .sort((a, b) => b - a) // Sort in descending order (newest first)
    )];
    
    console.log(`Years for subject ${selectedSubjectId} and exam type ${selectedExamType}:`, years);
    
    // Add year options
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
    
    yearSelect.disabled = years.length === 0;
}

// Update the startExam function to include the selected year
function startExam(event) {
    event.preventDefault();
    
    const examType = examTypeSelect.value;
    const subjectId = subjectSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
    const duration = parseInt(document.getElementById('test-duration').value);
    const questionCount = parseInt(document.getElementById('question-count').value);
    const year = yearSelect.value || null; // Can be null if "All Years" is selected
    
    if (!examType || !subjectId || isNaN(duration) || isNaN(questionCount) || subjectName === 'Choose Subject') {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    // Store exam configuration in localStorage
    const examConfig = {
        examTypeId: examTypeMap[examType],
        examTypeName: examType,
        subjectId: parseInt(subjectId),
        subjectName: subjectName,
        duration: duration,
        questionCount: questionCount,
        year: year,
        startTime: new Date().toISOString(),
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: {},
        score: 0
    };
    
    // Save to localStorage
    localStorage.setItem('examConfig', JSON.stringify(examConfig));
    
    // Redirect to exam page
    window.location.href = 'exam.html';
}

// Make the startExam function available globally
window.startExam = startExam;
