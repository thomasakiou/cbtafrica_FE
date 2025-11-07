// Main JavaScript file for common functionality

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Load news feed
    loadNewsFeed();
});

function loadNewsFeed() {
    // Simulate loading news from an API
    const newsItems = [
        {
            title: "JAMB 2024 Registration Opens",
            content: "The Joint Admissions and Matriculation Board has announced the commencement of registration for the 2024 UTME. Students are advised to visit the official JAMB website to begin their registration process.",
            date: "2024-03-15"
        },
        {
            title: "WAEC Releases New Syllabus",
            content: "The West African Examinations Council has updated its syllabus for various subjects effective from 2024. The new syllabus includes modern topics and updated assessment criteria.",
            date: "2024-03-10"
        },
        {
            title: "NECO Announces Exam Dates",
            content: "The National Examinations Council has released the timetable for the upcoming Senior School Certificate Examination. The exams are scheduled to begin in May 2024.",
            date: "2024-03-08"
        },
        {
            title: "New CBT Centers Approved",
            content: "The examination bodies have approved additional Computer Based Test centers across the country to accommodate more candidates and reduce congestion.",
            date: "2024-03-05"
        },
        {
            title: "Study Tips for CBT Exams",
            content: "Education experts share valuable tips for students preparing for computer-based tests, including time management strategies and practice techniques.",
            date: "2024-03-01"
        }
    ];
    
    const newsFeed = document.querySelector('.news-feed');
    if (newsFeed) {
        newsFeed.innerHTML = newsItems.map(item => `
            <article class="news-item">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <span class="date">${new Date(item.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</span>
            </article>
        `).join('');
    }
}

// Utility functions
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);