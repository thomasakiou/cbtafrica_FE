// Main JavaScript file for common functionality
const NEWS_API = 'https://vmi2848672.contaboserver.net/cbt/api/v1/news';
const NEWS_PER_PAGE = 5;
let currentNewsPage = 1;

// Fallback news data in case API is not available
const FALLBACK_NEWS = [
    {
        title: "JAMB 2024 Registration Opens",
        content: "The Joint Admissions and Matriculation Board has announced the commencement of registration for the 2024 UTME. Students are advised to visit the official JAMB website to begin their registration process.",
        date: "2024-03-15",
        url: "#"
    },
    {
        title: "WAEC Releases New Syllabus",
        content: "The West African Examinations Council has updated its syllabus for various subjects effective from 2024. The new syllabus includes modern topics and updated assessment criteria.",
        date: "2024-03-10",
        url: "#"
    },
    {
        title: "NECO Announces Exam Dates",
        content: "The National Examinations Council has released the timetable for the upcoming Senior School Certificate Examination. The exams are scheduled to begin in May 2024.",
        date: "2024-03-08",
        url: "#"
    }
];

// Initialize when DOM is loaded
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
    
    // Load news feed if the container exists
    const newsContainer = document.querySelector('.news-feed, .education-news, #news-feed');
    if (newsContainer) {
        loadNewsFeed();
    }
});
// Load news feed from API or use fallback data
async function loadNewsFeed(page = 1) {
    const newsFeed = document.querySelector('.news-feed, #news-feed');
    if (!newsFeed) return;

    // Show loading state
    newsFeed.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading education news...</div>';

    try {
        // Try to fetch from API first
        const response = await fetch(`${NEWS_API}?page=${page}&limit=${NEWS_PER_PAGE}`);
        let newsItems = [];
        
        if (response.ok) {
            const data = await response.json();
            newsItems = data.posts || [];
        } else {
            // If API fails, use fallback data
            console.warn('Using fallback news data');
            newsItems = [...FALLBACK_NEWS];
        }

        // Update current page
        currentNewsPage = page;
        
        // Render news items
        if (newsItems.length > 0) {
            renderNewsItems(newsItems);
            updateNewsPaginationControls(newsItems.length);
        } else {
            newsFeed.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    No news available at the moment. Please check back later.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading news:', error);
        // On error, use fallback data
        renderNewsItems(FALLBACK_NEWS);
    }
}

// Render news items to the DOM
function renderNewsItems(newsItems) {
    const newsFeed = document.querySelector('.news-feed, #news-feed');
    if (!newsFeed) return;

    newsFeed.innerHTML = newsItems.map(item => `
        <article class="news-item" style="border-bottom: 1px solid #eee; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.5rem 0; color: #2c3e50;">
                <a href="${item.url || '#'}" style="color: inherit; text-decoration: none;">
                    ${escapeHtml(item.title)}
                </a>
            </h3>
            <p style="margin: 0.5rem 0; color: #555; line-height: 1.5;">
                ${escapeHtml(item.content)}
            </p>
            <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 0.5rem;">
                ${formatDate(item.date)}
            </div>
        </article>
    `).join('');
}

// Update pagination controls
function updateNewsPaginationControls(itemsCount) {
    const pagination = document.getElementById('news-pagination');
    const prevBtn = document.getElementById('prev-news-btn');
    const nextBtn = document.getElementById('next-news-btn');
    const pageInfo = document.getElementById('news-page-info');
    
    if (!pagination) return;
    
    // Show pagination if we have items
    pagination.style.display = itemsCount > 0 ? 'flex' : 'none';
    
    // Update page info
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentNewsPage}`;
    }
    
    // Update previous button state
    if (prevBtn) {
        prevBtn.disabled = currentNewsPage <= 1;
        prevBtn.style.opacity = currentNewsPage <= 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentNewsPage <= 1 ? 'not-allowed' : 'pointer';
    }
    
    // Update next button state
    if (nextBtn) {
        const hasMore = itemsCount >= NEWS_PER_PAGE;
        nextBtn.disabled = !hasMore;
        nextBtn.style.opacity = hasMore ? '1' : '0.5';
        nextBtn.style.cursor = hasMore ? 'pointer' : 'not-allowed';
    }
}

// Change news page
function changeNewsPage(direction) {
    const newPage = direction === 'prev' ? currentNewsPage - 1 : currentNewsPage + 1;
    if (newPage > 0) {
        loadNewsFeed(newPage);
    }
}

// Format date
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
//         case 'warning':
//             notification.style.backgroundColor = '#f39c12';
//             break;
//         default:
//             notification.style.backgroundColor = '#3498db';
//     }
    
//     document.body.appendChild(notification);
    
//     // Remove notification after 3 seconds
//     setTimeout(() => {
//         notification.style.animation = 'slideOut 0.3s ease-in';
//         setTimeout(() => {
//             document.body.removeChild(notification);
//         }, 300);
//     }, 3000);
// }

// // Add animation keyframes
// const style = document.createElement('style');
// style.textContent = `
//     @keyframes slideIn {
//         from {
//             transform: translateX(100%);
//             opacity: 0;
//         }
//         to {
//             transform: translateX(0);
//             opacity: 1;
//         }
//     }
    
//     @keyframes slideOut {
//         from {
//             transform: translateX(0);
//             opacity: 1;
//         }
//         to {
//             transform: translateX(100%);
//             opacity: 0;
//         }
//     }
// `;
// document.head.appendChild(style);

// Main JavaScript file for common functionality

// Add global styles if they don't exist
if (!document.getElementById('global-styles')) {
    const style = document.createElement('style');
    style.id = 'global-styles';
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
}

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const dropdownToggles = document.querySelectorAll('.dropdown > a');
    
    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }
    
    // Toggle dropdown on mobile
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) { // Only on mobile
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
                const content = this.nextElementSibling;
                content.classList.toggle('show');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            if (hamburger && navLinks.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        }
    });
    
    // Smooth scrolling for navigation links
    const navAnchors = document.querySelectorAll('nav a[href^="#"]');
    navAnchors.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Close mobile menu if open
                    if (hamburger && hamburger.classList.contains('active')) {
                        hamburger.classList.remove('active');
                        navLinks.classList.remove('active');
                        document.body.classList.remove('no-scroll');
                    }
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Account for fixed header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Load news feed if the element exists
    if (document.querySelector('.news-feed')) {
        loadNewsFeed();
    }
});

// Backend API configuration
const BACKEND_URL = 'https://vmi2848672.contaboserver.net';
const NEWS_API = `${BACKEND_URL}/cbt/api/v1/news/`;

// News pagination state
let currentNewsPage = 1;
const NEWS_PER_PAGE = 5; // Show 5 news items per page
let totalNewsItems = 0;

// News card creation function
function createNewsCard(news) {
    // Create the news card element
    const card = document.createElement('article');
    card.className = 'news-card';
    card.style.borderBottom = '1px solid #eee';
    card.style.paddingBottom = '1.5rem';
    card.style.marginBottom = '1.5rem';
    
    // Format the date
    const date = new Date(news.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem;">
            <a href="${news.url || '#'}" style="color: #2c3e50; text-decoration: none;">
                ${escapeHtml(news.title || '')}
            </a>
        </h3>
        <p style="margin: 0.5rem 0; color: #555; line-height: 1.5;">
            ${escapeHtml(news.content || '')}
        </p>
        <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 0.5rem;">
            ${date}
        </div>
    `;
    
    return card;
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadNewsFeed(page = 1) {
    const newsFeed = document.querySelector('.news-feed');
    const paginationControls = document.getElementById('news-pagination');
    
    if (!newsFeed) return;
    
    try {
        // Show loading state
        newsFeed.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Loading news...</p>';
        
        // Calculate skip value for pagination
        const skip = (page - 1) * NEWS_PER_PAGE;
        
        // Fetch news items from the backend with pagination
        const response = await fetch(`${NEWS_API}?skip=${skip}&limit=${NEWS_PER_PAGE}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const newsItems = await response.json();
        
        // Update current page
        currentNewsPage = page;
        
        // Display news items
        if (newsItems.length === 0) {
            newsFeed.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No news available at the moment.</p>';
            if (paginationControls) {
                paginationControls.style.display = 'none';
            }
            return;
        }
        
        // Display the news cards
        newsFeed.innerHTML = '';
        newsItems.forEach(item => {
            newsFeed.appendChild(createNewsCard(item));
        });
        
        // Update pagination controls
        updateNewsPaginationControls(newsItems.length);
        
    } catch (error) {
        console.error('Error loading news feed:', error);
        
        // Show error message with fallback
        newsFeed.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <p style="margin-bottom: 1rem;">Unable to load news feed at the moment.</p>
                <p style="font-size: 0.9rem; color: #666;">Please check your internet connection or try again later.</p>
            </div>
        `;
        
        // Hide pagination on error
        const paginationControls = document.getElementById('news-pagination');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
    }
}

function updateNewsPaginationControls(itemsOnPage) {
    const paginationControls = document.getElementById('news-pagination');
    const prevBtn = document.getElementById('prev-news-btn');
    const nextBtn = document.getElementById('next-news-btn');
    const pageInfo = document.getElementById('news-page-info');
    
    if (!paginationControls) return;
    
    // Show pagination controls
    paginationControls.style.display = 'block';
    
    // Update page info
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentNewsPage}`;
    }
    
    // Update previous button state
    if (prevBtn) {
        if (currentNewsPage === 1) {
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }
    }
    
    // Update next button state
    if (nextBtn) {
        // If we got fewer items than requested, we're on the last page
        if (itemsOnPage < NEWS_PER_PAGE) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }
}

function changeNewsPage(direction) {
    let newPage = currentNewsPage;
    
    if (direction === 'prev' && currentNewsPage > 1) {
        newPage = currentNewsPage - 1;
    } else if (direction === 'next') {
        newPage = currentNewsPage + 1;
    }
    
    if (newPage !== currentNewsPage) {
        // Scroll to news section
        const newsSection = document.getElementById('news');
        if (newsSection) {
            newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Load the new page
        loadNewsFeed(newPage);
    }
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
            notification.remove();
        }, 300);
    }, 3000);
}