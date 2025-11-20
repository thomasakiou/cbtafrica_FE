// Forum functionality for subject-specific discussions
const FORUM_API_BASE_URL = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum';

// DOM Elements
const newPostContainer = document.getElementById('new-post-container');
const loginPrompt = document.getElementById('login-prompt');
const newPostForm = document.getElementById('new-post-form');
const postsContainer = document.getElementById('posts-container');
const sortButtons = document.querySelectorAll('.sort-btn');
const paginationContainer = document.getElementById('forum-pagination');

// Forum state
let currentPage = 1;
const postsPerPage = 10;
let currentSort = 'newest';
let currentPosts = [];

// Initialize forum when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    checkAuthForForum();
    
    // Only load posts if user is authenticated
    if (localStorage.getItem('token')) {
        setupEventListeners();
        loadForumPosts();
    } else if (loginPrompt) {
        // Show login prompt with link to index.html
        loginPrompt.style.display = 'block';
        loginPrompt.innerHTML = `
            <div style="text-align: center; padding: 1.5rem;">
                <p style="margin: 0 0 1rem 0; color: #555; font-size: 1.1rem;">
                    Please <a href="index.html" style="color: #667eea; text-decoration: none; font-weight: 500;" id="forum-login-link">login</a> to participate in the forum discussion.
                </p>
                <p style="margin: 0; color: #666; font-size: 0.95rem;">
                    Don't have an account? <a href="index.html#register" style="color: #667eea; text-decoration: none; font-weight: 500;">Register here</a>
                </p>
            </div>
        `;
        
        // Add click handler to login link
        const loginLink = document.getElementById('forum-login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Store current URL to redirect back after login
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'index.html';
            });
        }
    }
});

// Check if user is authenticated and update UI
function checkAuthForForum() {
    const token = localStorage.getItem('token');
    
    if (token) {
        // User is logged in
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
        }
        if (newPostContainer) {
            newPostContainer.style.display = 'block';
        }
        // Load posts immediately since we're authenticated
        setupEventListeners();
        loadForumPosts();
    } else {
        // User is not logged in
        if (loginPrompt) {
            loginPrompt.style.display = 'block';
            loginPrompt.innerHTML = `
                <div style="text-align: center; padding: 1.5rem;">
                    <p style="margin: 0 0 1rem 0; color: #555; font-size: 1.1rem;">
                        Please <a href="#" id="forum-login-link" style="color: #667eea; text-decoration: none; font-weight: 500;">login</a> to participate in the forum discussion.
                    </p>
                    <p style="margin: 0; color: #666; font-size: 0.95rem;">
                        Don't have an account? <a href="index.html#register" style="color: #667eea; text-decoration: none; font-weight: 500;">Register here</a>
                    </p>
                </div>
            `;
            
            // Add click handler to login link
            const loginLink = document.getElementById('forum-login-link');
            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Store current URL to redirect back after login
                    localStorage.setItem('redirectAfterLogin', window.location.href);
                    window.location.href = 'index.html';
                });
            }
        }
        if (newPostContainer) {
            newPostContainer.style.display = 'none';
        }
        // Clear posts container when not authenticated
        if (postsContainer) {
            postsContainer.innerHTML = '';
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // New post form submission
    if (newPostForm) {
        newPostForm.addEventListener('submit', handleNewPost);
    }

    // Sort buttons
    sortButtons.forEach(button => {
        button.addEventListener('click', () => handleSortChange(button.dataset.sort));
    });
}

// Handle new post submission
async function handleNewPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const imageInput = document.getElementById('post-image');
    const imageFile = imageInput.files[0];
    
    if (!title || !content) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('subject', 'mathematics'); // This will be dynamic based on the subject page
    
    // Only append image if a file is actually selected
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create post');
        }

        // Reset form and reload posts
        newPostForm.reset();
        loadForumPosts();
        showAlert('Post created successfully!', 'success');
    } catch (error) {
        console.error('Error creating post:', error);
        showAlert(error.message || 'Failed to create post. Please try again.', 'error');
    }
}

// Load forum posts
async function loadForumPosts(page = 1, sort = 'newest') {
    // Ensure posts container exists
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
        console.error('Posts container not found');
        return;
    }

    try {
        const response = await fetch(
            `${FORUM_API_BASE_URL}/posts?subject=mathematics&page=${page}&limit=${postsPerPage}&sort=${sort}`
        );
        
        if (response.status === 404) {
            // Handle 404 specifically - the endpoint might not be implemented yet
            console.warn('Forum API endpoint not found (404). This might be expected if the backend is not fully implemented yet.');
            postsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    Forum feature coming soon. Check back later!
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load posts: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        currentPosts = data.posts || [];
        currentPage = page;
        currentSort = sort;
        
        renderPosts(currentPosts);
        
        // Only render pagination if we have the data for it
        if (data.totalPages !== undefined) {
            renderPagination(data.totalPages, page);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem; color: #e74c3c;">
                    ${error.message || 'Failed to load posts. Please try again later.'}
                </div>
            `;
    }
}

// Render posts to the DOM
function renderPosts(posts) {
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                No discussions yet. Be the first to start one!
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <div class="forum-post" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="padding: 1.25rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; font-size: 1.1rem; color: #2c3e50;">${escapeHtml(post.title)}</h4>
                    <span style="font-size: 0.85rem; color: #7f8c8d;">
                        ${new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${post.author.avatar ? 
                            `<img src="${post.author.avatar}" alt="${post.author.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                            `<span style="font-size: 0.8rem; color: #666;">${post.author.name.charAt(0).toUpperCase()}</span>`
                        }
                    </div>
                    <span style="font-size: 0.9rem; color: #34495e;">${escapeHtml(post.author.name)}</span>
                </div>
            </div>
            <div style="padding: 1.25rem;">
                <p style="margin: 0 0 1rem 0; line-height: 1.6; color: #2c3e50;">
                    ${formatPostContent(post.content)}
                </p>
                ${post.imageUrl ? `
                    <div style="margin: 1rem 0;">
                        <img src="${post.imageUrl}" alt="Post image" style="max-width: 100%; border-radius: 6px;">
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0;">
                    <div style="display: flex; gap: 1rem;">
                        <button class="like-btn" data-post-id="${post.id}" style="display: flex; align-items: center; gap: 0.25rem; background: none; border: none; cursor: pointer; color: #7f8c8d; font-size: 0.9rem;">
                            <span>👍</span>
                            <span>${post.likes || 0}</span>
                        </button>
                        <button class="reply-btn" data-post-id="${post.id}" style="display: flex; align-items: center; gap: 0.25rem; background: none; border: none; cursor: pointer; color: #7f8c8d; font-size: 0.9rem;">
                            <span>💬</span>
                            <span>${post.replyCount || 0} ${post.replyCount === 1 ? 'reply' : 'replies'}</span>
                        </button>
                    </div>
                    <a href="#" class="view-discussion" data-post-id="${post.id}" style="font-size: 0.9rem; color: #3498db; text-decoration: none;">
                        View discussion
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners to the new elements
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLikePost);
    });
    
    document.querySelectorAll('.reply-btn, .view-discussion').forEach(btn => {
        btn.addEventListener('click', handleViewDiscussion);
    });
}

// Handle like post
async function handleLikePost(event) {
    if (!localStorage.getItem('token')) {
        showAlert('Please login to like posts', 'error');
        return;
    }

    const postId = event.currentTarget.dataset.postId;
    
    try {
        const response = await fetch(`${FORUM_API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to like post');
        }

        // Update the like count in the UI
        const likeCountElement = event.currentTarget.querySelector('span:last-child');
        if (likeCountElement) {
            likeCountElement.textContent = data.likes;
        }
        
        showAlert('Post liked!', 'success');
    } catch (error) {
        console.error('Error liking post:', error);
        showAlert(error.message || 'Failed to like post', 'error');
    }
}

// Handle view discussion
function handleViewDiscussion(event) {
    event.preventDefault();
    const postId = event.currentTarget.dataset.postId;
    // In a real implementation, this would navigate to the post detail page
    // For now, we'll just show an alert
    showAlert(`Viewing discussion for post #${postId}`, 'info');
    // window.location.href = `post.html?id=${postId}`;
}

// Handle sort change
function handleSortChange(sortType) {
    if (sortType === currentSort) return;
    
    // Update active state of sort buttons
    sortButtons.forEach(btn => {
        if (btn.dataset.sort === sortType) {
            btn.classList.add('active');
            btn.style.background = '#f0f2f5';
        } else {
            btn.classList.remove('active');
            btn.style.background = '#fff';
        }
    });
    
    // Reload posts with new sort
    loadForumPosts(1, sortType);
}

// Render pagination
function renderPagination(totalPages, currentPage) {
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                data-page="${currentPage - 1}" 
                ${currentPage === 1 ? 'disabled' : ''}
                style="padding: 0.4rem 0.8rem; border: 1px solid #ddd; background: #fff; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
            &laquo; Prev
        </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}"
                        style="padding: 0.4rem 0.8rem; border: 1px solid #ddd; background: ${i === currentPage ? '#667eea' : '#fff'}; color: ${i === currentPage ? '#fff' : '#333'}; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                    ${i}
                </button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span style="padding: 0.4rem 0.8rem;">...</span>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                data-page="${currentPage + 1}" 
                ${currentPage === totalPages ? 'disabled' : ''}
                style="padding: 0.4rem 0.8rem; border: 1px solid #ddd; background: #fff; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
            Next &raquo;
        </button>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination buttons
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (!isNaN(page) && page !== currentPage) {
                loadForumPosts(page, currentSort);
                // Scroll to top of forum section
                document.getElementById('math-forum').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Helper function to show alerts
function showAlert(message, type = 'info') {
    // Check if alert container already exists, if not create it
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '1000';
        alertContainer.style.maxWidth = '400px';
        alertContainer.style.width = '90%';
        document.body.appendChild(alertContainer);
    }

    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.style.padding = '12px 16px';
    alertElement.style.marginBottom = '10px';
    alertElement.style.borderRadius = '6px';
    alertElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    alertElement.style.color = '#fff';
    alertElement.style.fontSize = '0.95rem';
    alertElement.style.display = 'flex';
    alertElement.style.justifyContent = 'space-between';
    alertElement.style.alignItems = 'center';
    alertElement.style.animation = 'slideIn 0.3s ease-out';
    
    // Set styles based on alert type
    switch (type) {
        case 'success':
            alertElement.style.background = '#2ecc71';
            break;
        case 'error':
            alertElement.style.background = '#e74c3c';
            break;
        case 'warning':
            alertElement.style.background = '#f39c12';
            break;
        default: // info
            alertElement.style.background = '#3498db';
    }
    
    // Add message and close button
    alertElement.innerHTML = `
        <span>${message}</span>
        <button style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; margin-left: 10px;">&times;</button>
    `;
    
    // Add close functionality
    const closeButton = alertElement.querySelector('button');
    closeButton.addEventListener('click', () => {
        alertElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    });
    
    // Add to container
    alertContainer.insertBefore(alertElement, alertContainer.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.remove();
                }
            }, 300);
        }
    }, 5000);
    
    // Add CSS for animations if not already added
    if (!document.getElementById('alert-animations')) {
        const style = document.createElement('style');
        style.id = 'alert-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to format post content (simple newline to <br>)
function formatPostContent(content) {
    if (!content) return '';
    return escapeHtml(content).replace(/\n/g, '<br>');
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuthForForum,
        handleNewPost,
        loadForumPosts,
        renderPosts,
        handleLikePost,
        handleViewDiscussion,
        handleSortChange,
        renderPagination,
        showAlert,
        escapeHtml,
        formatPostContent
    };
}
