// const API_BASE_URL = 'http://localhost:8000/api/v1';

let examResult = {};
let currentReviewPage = 1;
const REVIEW_PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadResults();
});

function loadResults() {
    examResult = JSON.parse(localStorage.getItem('examResult'));
    
    if (!examResult) {
        showAlert('No exam results found. Redirecting to dashboard.', 'warning');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
    }
    
    displayResults();
}

function displayResults() {
    // Update score display
    document.getElementById('percentage-score').textContent = `${examResult.score}%`;
    document.getElementById('total-score').textContent = `${examResult.correctCount}/${examResult.totalQuestions}`;
    document.getElementById('exam-type-result').textContent = examResult.examType;
    
    // Update pass/fail status
    const statusElement = document.getElementById('pass-status');
    if (examResult.passed) {
        statusElement.textContent = 'Passed';
        statusElement.className = 'status passed';
        document.querySelector('.score-circle').style.background = '#27ae60';
    } else {
        statusElement.textContent = 'Failed';
        statusElement.className = 'status failed';
        document.querySelector('.score-circle').style.background = '#e74c3c';
    }
    
    // Calculate time taken
    const timeTaken = examResult.timeTaken;
    const hours = Math.floor(timeTaken / 3600);
    const minutes = Math.floor((timeTaken % 3600) / 60);
    const seconds = timeTaken % 60;
    document.getElementById('time-taken').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update performance stats
    const unansweredCount = examResult.results.filter(r => r.userAnswer === 'Not answered').length;
    const wrongCount = examResult.totalQuestions - examResult.correctCount - unansweredCount;
    
    document.getElementById('correct-count').textContent = examResult.correctCount;
    document.getElementById('wrong-count').textContent = wrongCount;
    document.getElementById('unanswered-count').textContent = unansweredCount;
    document.getElementById('accuracy-rate').textContent = `${examResult.score}%`;
    
    // Load answer review
    loadAnswerReview();
}

function loadAnswerReview() {
    currentReviewPage = 1;
    renderReviewPage();
}

function renderReviewPage() {
    const reviewContainer = document.getElementById('questions-review');
    const paginationContainer = document.getElementById('review-pagination');

    if (!examResult.results || examResult.results.length === 0) {
        reviewContainer.innerHTML = '<p>No answer details available.</p>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = examResult.results.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / REVIEW_PAGE_SIZE));
    if (currentReviewPage > totalPages) currentReviewPage = totalPages;

    const startIndex = (currentReviewPage - 1) * REVIEW_PAGE_SIZE;
    const pageItems = examResult.results.slice(startIndex, startIndex + REVIEW_PAGE_SIZE);

    reviewContainer.innerHTML = pageItems.map((result, idx) => {
        const displayIndex = startIndex + idx + 1;
        let optionsHTML = '';
        if (result.options) {
            optionsHTML = Object.keys(result.options).map(key => {
                const isUserAnswer = key === result.userAnswer;
                const isCorrectAnswer = key === result.correctAnswer;
                let optionClass = '';
                let icon = '';

                if (isCorrectAnswer) {
                    optionClass = 'correct-answer';
                    icon = ' ✓';
                } else if (isUserAnswer && !result.isCorrect) {
                    optionClass = 'wrong-answer';
                    icon = ' ✗';
                }

                return `<p class="${optionClass}"><strong>${key}:</strong> ${result.options[key]}${icon}</p>`;
            }).join('');
        }

        return `
            <div class="question-review-item ${result.isCorrect ? 'correct' : 'wrong'}">
                <div class="question-header">
                    <h4>Question ${displayIndex}</h4>
                </div>
                <div class="question-content">
                    <p><strong>Question:</strong> ${result.question}</p>
                    <div class="options-review">
                        ${optionsHTML}
                    </div>
                    <div class="result-indicator">
                        ${result.isCorrect ?
                            '<span class="correct-icon">✓ Correct</span>' :
                            '<span class="wrong-icon">✗ Incorrect - Your answer: ' + (result.userAnswer || 'Not answered') + '</span>'}
                        ${result.explanation ? '<p class="explanation"><strong>Explanation:</strong> ' + result.explanation + '</p>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (paginationContainer) {
        const buttons = [];
        buttons.push(`<button ${currentReviewPage === 1 ? 'disabled' : ''} onclick="window.changeReviewPage(${currentReviewPage - 1})">Prev</button>`);

        // Show up to 5 page buttons centered around current
        const windowSize = 5;
        let start = Math.max(1, currentReviewPage - Math.floor(windowSize / 2));
        let end = Math.min(totalPages, start + windowSize - 1);
        start = Math.max(1, Math.min(start, end - windowSize + 1));

        for (let p = start; p <= end; p++) {
            buttons.push(`<button ${p === currentReviewPage ? 'class="active"' : ''} onclick="window.changeReviewPage(${p})">${p}</button>`);
        }

        buttons.push(`<button ${currentReviewPage === totalPages ? 'disabled' : ''} onclick="window.changeReviewPage(${currentReviewPage + 1})">Next</button>`);
        paginationContainer.innerHTML = buttons.join('');
    }
}

window.changeReviewPage = function(page) {
    const totalPages = Math.max(1, Math.ceil((examResult.results?.length || 0) / REVIEW_PAGE_SIZE));
    if (page < 1 || page > totalPages) return;
    currentReviewPage = page;
    renderReviewPage();
}

window.showTab = function(tabName, event) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

window.retakeExam = function() {
    showConfirm('Are you sure you want to retake this exam?', () => {
        // Clear all exam-related data from localStorage
        localStorage.removeItem('examInProgress');
        localStorage.removeItem('timeRemaining');
        localStorage.removeItem('userAnswers');
        localStorage.removeItem('currentQuestionIndex');
        localStorage.removeItem('examResult');
        
        // Store new exam config
        const examConfig = {
            examTypeId: examResult.examTypeId,
            examType: examResult.examType,
            subjectId: examResult.subjectId,
            subjectName: examResult.subjectName,
            duration: examResult.duration,
            questionCount: examResult.totalQuestions,
            // Reset start time to now for the new attempt
            startTime: Date.now()
        };
        
        localStorage.setItem('examConfig', JSON.stringify(examConfig));
        
        // Go to exam page with a cache-busting parameter
        window.location.href = 'exam.html?retake=' + Date.now();
    });
}

window.goToDashboard = function() {
    localStorage.removeItem('examResult');
    window.location.href = 'dashboard.html';
}

// Add CSS for answer review styling
const resultsStyle = document.createElement('style');
resultsStyle.textContent = `
    .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .marks {
        font-weight: bold;
        color: #7f8c8d;
    }
    
    .question-content p {
        margin-bottom: 0.8rem;
    }
    
    .options-review p {
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 4px;
        background: #f8f9fa;
    }
    
    .options-review .correct-answer {
        background: #d4edda;
        color: #27ae60;
        font-weight: bold;
        border-left: 4px solid #27ae60;
    }
    
    .options-review .wrong-answer {
        background: #f8d7da;
        color: #e74c3c;
        font-weight: bold;
        border-left: 4px solid #e74c3c;
    }
    
    .result-indicator {
        margin-top: 1rem;
        padding-top: 0.5rem;
        border-top: 1px solid #ecf0f1;
    }
    
    .correct-icon {
        color: #27ae60;
        font-weight: bold;
    }
    
    .wrong-icon {
        color: #e74c3c;
        font-weight: bold;
    }
    
    .explanation {
        margin-top: 0.8rem;
        padding: 0.8rem;
        background: #e8f4f8;
        border-left: 4px solid #17a2b8;
        border-radius: 4px;
        color: #0c5460;
    }
`;
document.head.appendChild(resultsStyle);