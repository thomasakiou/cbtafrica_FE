// forum.js - Handles loading and posting forum discussions for Mathematics page

// const FORUM_API_BASE = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/api/v1/forum/posts';
const FORUM_API_BASE = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/posts';
const postsContainer = document.getElementById('posts-container');
const paginationContainer = document.getElementById('forum-pagination');
const newPostForm = document.getElementById('new-post-form');
const newPostContainer = document.getElementById('new-post-container');
const loginPrompt = document.getElementById('login-prompt');

let currentForumPage = 1;
const postsPerPage = 3;


// Check login status and set up event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = isUserLoggedIn();
    if (newPostContainer) newPostContainer.style.display = loggedIn ? 'block' : 'none';
    if (loginPrompt) loginPrompt.style.display = loggedIn ? 'none' : 'block';
    
    // Load forum posts
    loadForumPosts();
    
    // Set up new post form submission
    if (newPostForm) {
        newPostForm.addEventListener('submit', handleNewPost);
    }
    
    // Set up event delegation for reply buttons and forms
    document.addEventListener('click', (e) => {
        if (e.target.matches('.reply-btn, .submit-reply-btn, .cancel-reply-btn')) {
            handleReplyButtonClick(e);
        }
    });
});


function getCurrentSubject() {
    // Always get the current subject from the body's data attribute
    const bodySubject = document.body.getAttribute('data-subject');
    if (bodySubject) return bodySubject.toLowerCase();

    // Fallback to URL parsing if data attribute is not found
    const url = window.location.pathname.toLowerCase();
    const subjectMatch = url.match(/\/([^\/]+)\.html$/);
    if (subjectMatch && subjectMatch[1]) {
        return subjectMatch[1].toLowerCase();
    }

    // Default subject if none found
    return 'general';
}


function isUserLoggedIn() {
    // Use the same logic as updateAuthUI: token and username in localStorage
    return !!(localStorage.getItem('token') && localStorage.getItem('username'));
}

document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = isUserLoggedIn();
    if (newPostContainer) newPostContainer.style.display = loggedIn ? 'block' : 'none';
    if (loginPrompt) loginPrompt.style.display = loggedIn ? 'none' : 'block';
    loadForumPosts();
});


async function handleNewPost(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newPostForm) return;
    
    // Manually get the form values instead of using FormData
    const title = newPostForm.querySelector('[name="title"]')?.value.trim();
    const content = newPostForm.querySelector('[name="content"]')?.value.trim();
    const subject = getCurrentSubject();
    
    // console.log('Submitting with:', { title, content, subject });
    
    if (!title || !content) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    const submitButton = newPostForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent;
    
    try {
        submitButton.disabled = true;
        if (submitButton) submitButton.textContent = 'Posting...';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('You need to be logged in to post');
        }
        
        const response = await fetch(FORUM_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                content,
                subject  // This will now be the correct subject
            })
        });
        
        const responseData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to create post');
        }
        
        newPostForm.reset();
        showNotification('Post created successfully!', 'success');
        loadForumPosts(1);
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            if (originalText) submitButton.textContent = originalText;
        }
    }
}


// Add this function to your forum.js file
function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('forum-pagination');
    if (!paginationContainer) return;

    // Clear existing pagination
    paginationContainer.innerHTML = '';

    // Only show pagination if there's more than one page
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationContainer.style.justifyContent = 'center';
    paginationContainer.style.gap = '0.5rem';
    paginationContainer.style.marginTop = '2rem';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '← Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.style.padding = '0.5rem 1rem';
    prevButton.style.border = '1px solid #ddd';
    prevButton.style.borderRadius = '4px';
    prevButton.style.cursor = 'pointer';
    prevButton.style.backgroundColor = currentPage === 1 ? '#f5f5f5' : 'white';
    prevButton.style.color = currentPage === 1 ? '#aaa' : '#333';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadForumPosts(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPage = document.createElement('button');
        firstPage.textContent = '1';
        firstPage.style.padding = '0.5rem 1rem';
        firstPage.style.border = '1px solid #ddd';
        firstPage.style.borderRadius = '4px';
        firstPage.style.cursor = 'pointer';
        firstPage.addEventListener('click', () => loadForumPosts(1));
        paginationContainer.appendChild(firstPage);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.5rem';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.style.padding = '0.5rem 1rem';
        pageButton.style.border = '1px solid #ddd';
        pageButton.style.borderRadius = '4px';
        pageButton.style.cursor = 'pointer';
        pageButton.style.backgroundColor = i === currentPage ? '#667eea' : 'white';
        pageButton.style.color = i === currentPage ? 'white' : '#333';
        pageButton.addEventListener('click', () => {
            if (i !== currentPage) {
                loadForumPosts(i);
            }
        });
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.5rem';
            paginationContainer.appendChild(ellipsis);
        }

        const lastPage = document.createElement('button');
        lastPage.textContent = totalPages;
        lastPage.style.padding = '0.5rem 1rem';
        lastPage.style.border = '1px solid #ddd';
        lastPage.style.borderRadius = '4px';
        lastPage.style.cursor = 'pointer';
        lastPage.addEventListener('click', () => loadForumPosts(totalPages));
        paginationContainer.appendChild(lastPage);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.style.padding = '0.5rem 1rem';
    nextButton.style.border = '1px solid #ddd';
    nextButton.style.borderRadius = '4px';
    nextButton.style.cursor = 'pointer';
    nextButton.style.backgroundColor = currentPage === totalPages ? '#f5f5f5' : 'white';
    nextButton.style.color = currentPage === totalPages ? '#aaa' : '#333';
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadForumPosts(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
}


async function loadForumPosts(page = 1) {
    if (!postsContainer) return;
    
    // Show loading state
    postsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#4a5568;">Loading discussions...</div>';
    
    try {
        // Update the API URL to match your endpoint
        // const response = await fetch(`${FORUM_API_BASE}?subject=mathematics&page=${page}&limit=${postsPerPage}&sort=newest`);
        // const url = `${FORUM_API_BASE}?subject=${encodeURIComponent(currentSubject)}&page=${page}&limit=${postsPerPage}&sort=newest`;
        // const response = await fetch(url);
        // const response = await fetch(`${FORUM_API_BASE}?subject=${encodeURIComponent(currentSubject)}&page=${page}&limit=${postsPerPage}&sort=newest`)
        const url = `${FORUM_API_BASE}?subject=${encodeURIComponent(getCurrentSubject())}&page=${page}&limit=${postsPerPage}&sort=newest`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        
        // Check if we have posts in the response
        if (!data.posts || !Array.isArray(data.posts)) {
            throw new Error('Invalid posts data format');
        }
        
        // Clear container
        postsContainer.innerHTML = '';
        
        if (data.posts.length === 0) {
            postsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#4a5568;">No discussions found. Be the first to post!</div>';
            return;
        }
        
        // Create and append posts
        data.posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.innerHTML = createForumPost(post);
            postsContainer.appendChild(postElement);
        });
        
        // Update pagination if needed
        if (data.totalPages > 1) {
            updatePagination(data.totalPages, page);
        } else {
            const paginationContainer = document.getElementById('forum-pagination');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error loading forum posts:', error);
        postsContainer.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#e53e3e;">
                Error loading discussions. Please try again later.
                <div style="margin-top:0.5rem;font-size:0.9rem;color:#718096;">${error.message}</div>
            </div>
        `;
    }
}


function createForumPost(post) {
    const title = escapeHtml(post.title || '');
    const content = escapeHtml(post.content || '');
    const author = post.author ? escapeHtml(post.author.name || 'Anonymous') : 'Anonymous';
    
    const date = new Date(post.createdAt || Date.now()).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let imageHtml = '';
    if (post.imageUrl) {
        imageHtml = `<div style="margin:1rem 0;"><img src="${post.imageUrl}" alt="Post image" style="max-width:100%;border-radius:6px;"></div>`;
    }

    // Generate replies HTML if they exist
    let repliesHtml = '';
    if (post.replies && post.replies.length > 0) {
        repliesHtml = `
            <div class="replies-container" style="margin-top: 1rem; padding-left: 1.5rem; border-left: 2px solid #e2e8f0;">
                <h5 style="margin: 0 0 0.5rem 0; color: #4a5568; font-size: 0.9rem;">Replies (${post.replyCount || post.replies.length}):</h5>
                ${post.replies.map(reply => {
                    const replyAuthor = reply.user ? 
                        (reply.user.name || 'Anonymous') : 
                        'Anonymous';
                        
                    const replyDate = new Date(reply.createdAt || Date.now()).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="reply" style="background: #f7fafc; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem;">
                                <strong>${escapeHtml(replyAuthor)}</strong>
                                <span style="color: #a0aec0; font-size: 0.8rem; margin-left: 0.5rem;">${replyDate}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: #2d3748; line-height: 1.5;">
                                ${escapeHtml(reply.content || '')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Show reply button only if user is logged in
    let replySection = '';
    if (isUserLoggedIn()) {
        replySection = `
            <div class="reply-action-container" style="margin-top: 1rem;">
                <button class="reply-btn" style="background:#3498db;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;transition:background-color 0.2s;" 
                    onmouseover="this.style.backgroundColor='#3182ce'" 
                    onmouseout="this.style.backgroundColor='#3498db'"
                    data-post-id="${post.id}">
                    Reply
                </button>
            </div>
        `;
    }

    return `
        <div class="forum-post" data-post-id="${post.id}" style="background:#ffffff;padding:1.5rem;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:1.5rem;border:1px solid #e2e8f0;">
            <h4 style="margin:0 0 0.5rem 0;color:#2d3748;font-size:1.25rem;">${title}</h4>
            <div style="color:#4a5568;margin-bottom:1rem;line-height:1.6;font-size:0.95rem;">${content}</div>
            ${imageHtml}
            <div style="font-size:0.85rem;color:#718096;display:flex;justify-content:space-between;align-items:center;padding-top:0.75rem;border-top:1px solid #e2e8f0;margin-top:1rem;">
                <span>By <strong>${author}</strong></span>
                <span>${date}</span>
            </div>
            ${repliesHtml}
            ${replySection}
        </div>
    `;
}



function handleReplyButtonClick(e) {
    // Handle reply button click
    if (e.target.classList.contains('reply-btn')) {
        e.preventDefault();
        const postDiv = e.target.closest('.forum-post');
        if (!postDiv) {
            console.error('Could not find parent post div');
            return;
        }
        
        const postId = postDiv.getAttribute('data-post-id');
        if (!postId) {
            console.error('No post ID found on the forum post');
            return;
        }
        
        const replyAction = postDiv.querySelector('.reply-action-container');
        if (!replyAction) {
            console.error('Could not find reply action container');
            return;
        }
        
        // Check if already showing reply form
        if (replyAction.querySelector('.reply-form')) return;
        
        // Create reply form
        const replyForm = document.createElement('div');
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <textarea class="reply-text" rows="3" placeholder="Write a reply..." style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:6px;margin-top:0.8rem;resize:vertical;min-height:80px;"></textarea>
            <div style="display:flex;justify-content:flex-end;gap:0.8rem;margin-top:0.5rem;">
                <button type="button" class="cancel-reply-btn" style="background:#e0e0e0;color:#333;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">
                    Cancel
                </button>
                <button type="button" class="submit-reply-btn" data-post-id="${postId}" style="background:#27ae60;color:white;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">
                    Post Reply
                </button>
            </div>
        `;
        
        // Add to DOM
        replyAction.appendChild(replyForm);
        
        // Focus the textarea
        const textarea = replyForm.querySelector('.reply-text');
        if (textarea) textarea.focus();
    }
    
    // Handle submit reply
    else if (e.target.classList.contains('submit-reply-btn')) {
        e.preventDefault();
        const replyForm = e.target.closest('.reply-form');
        if (!replyForm) {
            console.error('Could not find reply form');
            return;
        }
        
        const replyText = replyForm.querySelector('.reply-text')?.value.trim();
        const postId = e.target.getAttribute('data-post-id');
        
        if (!replyText) {
            showNotification('Please enter a reply.', 'warning');
            return;
        }
        
        if (!postId) {
            console.error('No post ID found for reply');
            showNotification('Error: Could not determine which post to reply to.', 'error');
            return;
        }
        
        submitReply(postId, replyText, e.target);
    }
    
    // Handle cancel reply
    else if (e.target.classList.contains('cancel-reply-btn')) {
        e.preventDefault();
        const replyForm = e.target.closest('.reply-form');
        if (replyForm?.parentNode) {
            replyForm.parentNode.removeChild(replyForm);
        }
    }
}


async function submitReply(postId, replyText, btn) {
    if (!postId) {
        showNotification('Invalid post.', 'error');
        return;
    }
    
    // Save original button state
    const originalText = btn.textContent;
    const originalDisabled = btn.disabled;
    
    try {
        // Update button state
        btn.disabled = true;
        btn.textContent = 'Posting...';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please log in to post a reply');
        }
        
        const response = await fetch(`${FORUM_API_BASE}/${postId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                content: replyText,
                subject: getCurrentSubject() // Make sure to include the subject
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to submit reply';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        // Clear the reply form
        const replyForm = btn.closest('.reply-form');
        if (replyForm) {
            const textarea = replyForm.querySelector('.reply-text');
            if (textarea) textarea.value = '';
            
            // Remove the form after a short delay to show success
            setTimeout(() => {
                if (replyForm.parentNode) {
                    replyForm.parentNode.removeChild(replyForm);
                }
            }, 500);
        }
        
        showNotification('Reply submitted successfully!', 'success');
        
        // Create and append the new reply immediately
        const replyData = await response.json();
        const replyElement = createReplyElement({
            content: replyText,
            author: { username: 'You' }, // Or get current user from your auth system
            createdAt: new Date().toISOString(),
            ...replyData
        });
        
        // Find the replies container and append the new reply
        const postDiv = btn.closest('.forum-post');
        if (postDiv) {
            let repliesContainer = postDiv.querySelector('.replies-container');
            if (!repliesContainer) {
                // Create replies container if it doesn't exist
                repliesContainer = document.createElement('div');
                repliesContainer.className = 'replies-container';
                postDiv.appendChild(repliesContainer);
            }
            repliesContainer.appendChild(replyElement);
            
            // Update reply count if it exists
            const replyCount = postDiv.querySelector('.reply-count');
            if (replyCount) {
                const currentCount = parseInt(replyCount.textContent) || 0;
                replyCount.textContent = currentCount + 1;
            }
        }
        
    } catch (error) {
        console.error('Error submitting reply:', error);
        showNotification(error.message || 'Failed to submit reply. Please try again.', 'error');
    } finally {
        // Always restore button state
        if (btn) {
            btn.disabled = originalDisabled;
            btn.textContent = originalText;
        }
    }
}


function createReplyElement(reply) {
    const content = escapeHtml(reply.content || '');
    const author = escapeHtml(reply.author?.username || 'Anonymous');
    const date = new Date(reply.createdAt || Date.now()).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const replyElement = document.createElement('div');
    replyElement.className = 'forum-reply';
    replyElement.style.marginTop = '1rem';
    replyElement.style.paddingLeft = '1.5rem';
    replyElement.style.borderLeft = '3px solid #e2e8f0';
    
    replyElement.innerHTML = `
        <div style="color: #333; margin-bottom: 0.5rem;">${content}</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #888;">
            <span>By ${author}</span>
            <span>${date}</span>
        </div>
    `;
    
    return replyElement;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateForumPaginationControls(itemsOnPage) {
    if (!paginationContainer) return;
    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentForumPage === 1;
    prevBtn.className = 'pagination-btn' + (prevBtn.disabled ? ' disabled' : '');
    prevBtn.onclick = () => changeForumPage('prev');
    paginationContainer.appendChild(prevBtn);
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentForumPage}`;
    pageInfo.style.margin = '0 0.7rem';
    paginationContainer.appendChild(pageInfo);
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = itemsOnPage < postsPerPage;
    nextBtn.className = 'pagination-btn' + (nextBtn.disabled ? ' disabled' : '');
    nextBtn.onclick = () => changeForumPage('next');
    paginationContainer.appendChild(nextBtn);
}

function changeForumPage(direction) {
    if (direction === 'prev' && currentForumPage > 1) {
        currentForumPage--;
        loadForumPosts(currentForumPage);
    } else if (direction === 'next') {
        currentForumPage++;
        loadForumPosts(currentForumPage);
    }
}

// Handle new post submission
if (newPostForm) {
    newPostForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const imageInput = document.getElementById('post-image');
        if (!title || !content) return alert('Title and content are required.');
        let formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('subject', getCurrentSubject());
        if (imageInput && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        // Debug: log all form data fields and values
        for (let pair of formData.entries()) {
            console.log('FormData:', pair[0], pair[1]);
        }
        try {
            // Add Authorization header for protected endpoint
            const token = localStorage.getItem('token') || '';
            const res = await fetch(FORUM_API_BASE, {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to post');
            newPostForm.reset();
            loadForumPosts(1);
            showNotification('Post submitted successfully!', 'success');
        } catch (err) {
            showNotification('Failed to submit post. Please try again.', 'error');
        }
    });
}

// Optional: Expose loadForumPosts for manual reloads
window.loadForumPosts = loadForumPosts;
