// const API_BASE_URL = 'http://localhost:8000/api/v1';

let examConfig = {};
let currentAttempt = {};
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timer = null;
let timeRemaining = 0;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeExam();
});

function initializeExam() {
    // Load saved state if exists
    const savedState = localStorage.getItem('examInProgress');
    
    examConfig = JSON.parse(localStorage.getItem('examConfig'));
    currentAttempt = JSON.parse(localStorage.getItem('currentAttempt'));
    
    if (!examConfig) {
        showAlert('No active exam found. Redirecting to dashboard.', 'warning');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
    }
    
    // Handle exam state initialization
    if (savedState === 'true') {
        // Resuming an existing exam - restore saved state
        const savedTime = parseInt(localStorage.getItem('timeRemaining'));
        const savedAnswers = localStorage.getItem('userAnswers');
        const savedIndex = parseInt(localStorage.getItem('currentQuestionIndex'));
        
        if (!isNaN(savedTime) && savedTime > 0) {
            timeRemaining = savedTime;
        } else {
            // Fallback if saved time is invalid
            timeRemaining = examConfig.duration * 60;
        }
        
        if (savedAnswers) userAnswers = JSON.parse(savedAnswers);
        if (!isNaN(savedIndex)) currentQuestionIndex = savedIndex;
        
        console.log('Resuming exam with saved state:', { timeRemaining, currentQuestionIndex });
    } else {
        // Starting a fresh exam
        console.log('Starting new exam with duration:', examConfig.duration, 'minutes');
        
        // Set start time for new exam
        examConfig.startTime = Date.now();
        localStorage.setItem('examConfig', JSON.stringify(examConfig));
        
        // Initialize with full duration
        timeRemaining = examConfig.duration * 60;
        userAnswers = {};
        currentQuestionIndex = 0;
        
        console.log('New exam initialized. Time remaining (seconds):', timeRemaining);
    }
    
    // Debug: Log all localStorage items
    console.log('All localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}:`, localStorage.getItem(key));
    }
    
    // Get all possible name sources from localStorage
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('full_name');
    const displayName = localStorage.getItem('display_name');
    const userData = localStorage.getItem('user');
    
    console.log('Available name data:', {
        username,
        full_name: fullName,
        display_name: displayName,
        user_data: userData ? 'present' : 'missing'
    });
    
    // Determine the best name to display
    let candidateName = fullName || displayName;
    
    // If we don't have a name yet, try to get it from the user object
    if ((!candidateName || candidateName === 'null' || candidateName === 'undefined') && userData) {
        try {
            const parsedUser = JSON.parse(userData);
            candidateName = parsedUser.full_name || parsedUser.username || username;
            console.log('Found name in user data:', candidateName);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Final fallback to username or 'User'
    if (!candidateName || candidateName === 'null' || candidateName === 'undefined') {
        candidateName = username || 'User';
    }
    
    // Clean up the name
    const cleanName = candidateName
        .toString()
        .trim()
        .split(' ')
        .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
        .join(' ');
        
    console.log('Final candidate name:', cleanName);
    
    // Update the candidate name in the info panel
    const nameElement = document.getElementById('candidate-name');
    if (nameElement) {
        nameElement.textContent = cleanName; // Use the cleaned and formatted name
        nameElement.style.fontWeight = 'bold';
        console.log('Displaying candidate name:', cleanName);
    } else {
        console.error('Could not find candidate-name element');
    }
    
    // Debug log
    console.log('User info:', { 
        full_name: localStorage.getItem('full_name'),
        username: username,
        displayName: cleanName
    });
    
    // Update exam subject from examConfig
    const subjectElement = document.getElementById('exam-subject');
    if (subjectElement && examConfig.subjectName) {
        subjectElement.textContent = examConfig.subjectName;
    } else if (subjectElement) {
        subjectElement.textContent = 'General';
    }
    
    // Update exam type
    const examTypeElement = document.getElementById('exam-type');
    if (examTypeElement && examConfig.examType) {
        examTypeElement.textContent = examConfig.examType;
    }

    document.getElementById('exam-type').textContent = examConfig.examType;
    document.getElementById('exam-subject').textContent = examConfig.subjectName || 'General';
    
    // Load questions and then update the counter after they're loaded
    loadQuestions();
}

async function loadQuestions() {
    const token = localStorage.getItem('token');
    console.log('Loading questions with config:', examConfig);
    console.log('Exam Type ID:', examConfig.examTypeId);
    console.log('Subject ID:', examConfig.subjectId);
    console.log('Question Count:', examConfig.questionCount);
    
    // Initialize the questions count display with the total number of questions
    document.getElementById('questions-count').textContent = `0/${examConfig.questionCount}`;
    
    try {
        // Try to fetch real questions from backend
        const response = await fetch(
            `${API_BASE_URL}/questions/?exam_type_id=${examConfig.examTypeId}&subject_id=${examConfig.subjectId}&limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        let allQuestions = [];
        
        if (response.ok) {
            allQuestions = await response.json();
            console.log('Loaded questions from backend:', allQuestions.length);
        } else {
            console.warn('Backend GET not supported, using sample questions');
            allQuestions = generateSampleQuestions(
                examConfig.examTypeId,
                examConfig.subjectId,
                examConfig.questionCount
            );
        }
        
        if (allQuestions.length === 0) {
            showAlert('No questions available for this exam. Please add questions in admin panel.', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }
        
        // Shuffle and limit questions
        questions = shuffleArray(allQuestions).slice(0, examConfig.questionCount);
        console.log('Questions after shuffle:', questions.length);
    } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to sample questions
        questions = shuffleArray(generateSampleQuestions(
            examConfig.examTypeId,
            examConfig.subjectId,
            examConfig.questionCount
        ));
    }
    
    // Store correct answers and explanations before removing them
    const correctAnswers = {};
    const explanations = {};
    questions.forEach(q => {
        correctAnswers[q.id] = q.correct_answer;
        explanations[q.id] = q.explanation;
    });
    localStorage.setItem('correctAnswers', JSON.stringify(correctAnswers));
    localStorage.setItem('explanations', JSON.stringify(explanations));
    
    // Remove correct answers from questions for security
    questions = questions.map(q => ({
        ...q,
        correct_answer: undefined
    }));
    
    console.log('Setting up navigator and displaying first question');
    setupQuestionNavigator();
    displayQuestion();
    updateQuestionCounter();
    
    // Start the timer after everything is loaded
    startTimer();
    console.log('Questions loaded successfully');
}

function generateSampleQuestions(examTypeId, subjectId, count) {
    const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'];
    const subjectName = subjects[subjectId - 1] || 'General';
    
    const sampleQuestions = [];
    for (let i = 1; i <= count; i++) {
        sampleQuestions.push({
            id: i,
            exam_type_id: examTypeId,
            subject_id: subjectId,
            question_text: `${subjectName} Question ${i}: What is the correct answer?`,
            question_type: 'multiple_choice',
            options: {
                A: `Option A for question ${i}`,
                B: `Option B for question ${i}`,
                C: `Option C for question ${i}`,
                D: `Option D for question ${i}`
            },
            correct_answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        });
    }
    return sampleQuestions;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function displayQuestion() {
    const question = questions[currentQuestionIndex];
    console.log('Displaying question:', currentQuestionIndex, question);
    
    if (!question) {
        console.error('No question found at index:', currentQuestionIndex);
        return;
    }
    
    const questionNumEl = document.getElementById('current-question-num');
    const questionDisplayEl = document.getElementById('question-display');
    
    if (questionNumEl) questionNumEl.textContent = currentQuestionIndex + 1;
    if (questionDisplayEl) questionDisplayEl.textContent = question.question_text;
    
    // Display options
    if (question.options && typeof question.options === 'object') {
        const optionKeys = Object.keys(question.options);
        for (let i = 0; i < 4; i++) {
            const optionElement = document.getElementById(`option-text-${i}`);
            const radioElement = document.getElementById(`option-${i}`);
            
            if (i < optionKeys.length) {
                const key = optionKeys[i];
                optionElement.textContent = `${key}. ${question.options[key]}`;
                radioElement.value = key;
                radioElement.style.display = 'inline';
                optionElement.parentElement.style.display = 'flex';
            } else {
                optionElement.parentElement.style.display = 'none';
            }
        }
    }
    
    // Restore previous answer if exists
    const savedAnswer = userAnswers[question.id];
    if (savedAnswer) {
        const radioElements = document.querySelectorAll('input[name="answer"]');
        radioElements.forEach(radio => {
            if (radio.value === savedAnswer) {
                radio.checked = true;
                radio.parentElement.classList.add('selected');
            }
        });
    } else {
        clearSelection();
    }
    
    updateNavigationButtons();
    updateQuestionNavigator();
}

function selectOption(index) {
    clearSelection();
    const radio = document.getElementById(`option-${index}`);
    const option = radio.parentElement;
    
    radio.checked = true;
    option.classList.add('selected');
    
    // Save answer
    const question = questions[currentQuestionIndex];
    userAnswers[question.id] = radio.value;
}

function clearSelection() {
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.checked = false;
    });
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateQuestionCounter();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateQuestionCounter();
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
    updateQuestionCounter();
}

function updateQuestionCounter() {
    document.getElementById('question-counter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
}

function updateNavigationButtons() {
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-block';
    } else {
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('submit-btn').style.display = 'none';
    }
}

function setupQuestionNavigator() {
    const navigator = document.getElementById('question-navigator');
    navigator.innerHTML = '';
    
    for (let i = 0; i < questions.length; i++) {
        const questionBtn = document.createElement('div');
        questionBtn.className = 'nav-question';
        questionBtn.textContent = i + 1;
        questionBtn.onclick = () => goToQuestion(i);
        navigator.appendChild(questionBtn);
    }
}

function updateQuestionNavigator() {
    const navQuestions = document.querySelectorAll('.nav-question');
    let answeredCount = 0;
    
    navQuestions.forEach((btn, index) => {
        btn.classList.remove('current', 'answered');
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }
        
        if (userAnswers[questions[index].id]) {
            btn.classList.add('answered');
            answeredCount++;
        }
    });
    
    // Update the answered questions count in info panel
    document.getElementById('questions-count').textContent = `${answeredCount}/${examConfig.questionCount}`;
}

function startTimer() {
    updateTimerDisplay();
    
    // Clear any existing timer to prevent multiple timers
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timer);
            timer = null;
            showTimeoutModal();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('time-remaining').textContent = display;
    
    // Change color when time is running low
    if (timeRemaining < 300) { // Less than 5 minutes
        document.getElementById('time-remaining').style.color = '#e74c3c';
    }
}

function submitExam() {
    document.getElementById('submit-modal').style.display = 'flex';
}

function closeModal(modalId = 'submit-modal') {
    document.getElementById(modalId).style.display = 'none';
}

function showTimeoutModal() {
    const modal = document.getElementById('timeout-modal');
    const submitButton = modal.querySelector('.btn-primary');
    
    // Reset button state
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'View Results';
        submitButton.onclick = function(e) {
            e.preventDefault();
            confirmSubmit();
        };
    }
    
    modal.style.display = 'flex';
    
    // Disable all form elements except the submit button
    document.querySelectorAll('input, button:not(#timeout-modal .btn-primary), .option').forEach(element => {
        element.disabled = true;
    });
    
    // Auto-submit after 10 seconds if user doesn't click the button
    setTimeout(() => {
        if (modal.style.display === 'flex') {
            confirmSubmit();
        }
    }, 10000);
}

async function confirmSubmit() {
    try {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        
        // Disable all form elements to prevent further interaction
        document.querySelectorAll('input, button, .option').forEach(element => {
            element.disabled = true;
        });
        
        // Show loading state
        const submitButton = document.querySelector('#timeout-modal .btn-primary');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner">Submitting...</span>';
        }
        
        // Get correct answers and explanations
        const correctAnswers = JSON.parse(localStorage.getItem('correctAnswers') || '{}');
        const explanations = JSON.parse(localStorage.getItem('explanations') || '{}');
        
        // Calculate results locally
        let correctCount = 0;
        const results = questions.map(question => {
            const userAnswer = userAnswers[question.id];
            const correctAnswer = correctAnswers[question.id];
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) correctCount++;
            
            return {
                question: question.question_text,
                options: question.options,
                userAnswer: userAnswer || 'Not answered',
                correctAnswer: correctAnswer,
                explanation: explanations[question.id],
                isCorrect: isCorrect
            };
        });
        
        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= 50;
        
        const examResult = {
            score: score,
            correctCount: correctCount,
            totalQuestions: questions.length,
            passed: passed,
            examType: examConfig.examType,
            examTypeId: examConfig.examTypeId,
            subjectId: examConfig.subjectId,
            duration: examConfig.duration,
            timeTaken: Math.floor((Date.now() - examConfig.startTime) / 1000),
            results: results
        };
        
        // Clean up saved exam state
        localStorage.removeItem('examInProgress');
        localStorage.removeItem('timeRemaining');
        localStorage.removeItem('userAnswers');
        localStorage.removeItem('currentQuestionIndex');
        
        // Save results and navigate
        localStorage.setItem('examResult', JSON.stringify(examResult));
        localStorage.removeItem('examConfig');
        localStorage.removeItem('correctAnswers');
        localStorage.removeItem('explanations');
        
        // Force navigation to results page
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('Error submitting exam:', error);
        showAlert('An error occurred while submitting your exam. Please try again.', 'error');
        
        // Re-enable the submit button if there was an error
        const submitButton = document.querySelector('#timeout-modal .btn-primary');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'View Results';
        }
    }
}

// Prevent page refresh during exam
window.addEventListener('beforeunload', function(e) {
    if (timer) {
        // Save the current state before leaving
        localStorage.setItem('examInProgress', 'true');
        localStorage.setItem('timeRemaining', timeRemaining);
        localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
        
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be saved.';
    }
});
