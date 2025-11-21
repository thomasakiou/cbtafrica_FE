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

// Store the current subject
const currentSubject = getCurrentSubject();


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
    // Try to get subject from the body's data attribute
    const bodySubject = document.body.getAttribute('data-subject');
    if (bodySubject) return bodySubject;

    // Fallback: Try to get from URL
    const url = window.location.pathname.toLowerCase();
    if (url.includes('mathematics')) return 'mathematics';
    if (url.includes('english')) return 'english';
    if (url.includes('crs')) return 'crs';
    if (url.includes('agricultural-science')) return 'agricultural-science';
    if (url.includes('biology')) return 'biology';
    if (url.includes('chemistry')) return 'chemistry';
    if (url.includes('civic-education')) return 'civic-education';
    if (url.includes('accounting')) return 'accounting';
    if (url.includes('economics')) return 'economics';
    if (url.includes('physics')) return 'physics';
    if (url.includes('computer-science')) return 'computer-science';
    if (url.includes('irs')) return 'irs';
    if (url.includes('further-mathematics')) return 'further-mathematics';
    if (url.includes('literature')) return 'literature';
    if (url.includes('history')) return 'history';
    if (url.includes('government')) return 'government';
    if (url.includes('geography')) return 'geography';
        
    // Default subject if none found
    return 'general';
}
// document.addEventListener('DOMContentLoaded', () => {
//     const loggedIn = isUserLoggedIn();
//     if (newPostContainer) newPostContainer.style.display = loggedIn ? 'block' : 'none';
//     if (loginPrompt) loginPrompt.style.display = loggedIn ? 'none' : 'block';
    
//     // Load forum posts
//     loadForumPosts();
    
//     // Set up new post form submission
//     if (newPostForm) {
//         newPostForm.addEventListener('submit', handleNewPost);
//     }
    
//     // Set up reply button click handler using event delegation
//     document.addEventListener('click', (e) => handleReplyButtonClick(e));
// });

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
    if (!newPostForm) return;
    
    const formData = new FormData(newPostForm);
    const title = formData.get('title');
    const content = formData.get('content');
    
    if (!title || !content) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(FORUM_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                content,
                subject: currentSubject  
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        
        newPostForm.reset();
        showNotification('Post created successfully!', 'success');
        loadForumPosts(currentForumPage);
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification('Error creating post. Please try again.', 'error');
    }
}

async function loadForumPosts(page = 1) {
    if (!postsContainer) return;
    
    // Show loading state
    postsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#4a5568;">Loading discussions...</div>';
    
    try {
        // Update the API URL to match your endpoint
        // const response = await fetch(`${FORUM_API_BASE}?subject=mathematics&page=${page}&limit=${postsPerPage}&sort=newest`);
        const url = `${FORUM_API_BASE}?subject=${encodeURIComponent(currentSubject)}&page=${page}&limit=${postsPerPage}&sort=newest`;
        const response = await fetch(url);
        // const response = await fetch(`${FORUM_API_BASE}?subject=${encodeURIComponent(currentSubject)}&page=${page}&limit=${postsPerPage}&sort=newest`)
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

// async function loadForumPosts(page = 1) {
//     if (!postsContainer) return;
//     postsContainer.innerHTML = '<div class="loading-spinner" style="text-align:center;padding:2rem;color:#666;">Loading discussions...</div>';
//     try {
//         const url = `${FORUM_API_BASE}?subject=mathematics&page=${page}&limit=${postsPerPage}&sort=newest`;
//         const res = await fetch(url);
//         if (!res.ok) throw new Error('Failed to load forum posts');
//         const result = await res.json();
//         // Expecting result to be { posts: [...], total: n } or just an array
//         const data = Array.isArray(result) ? result : (result.posts || []);
//         if (!Array.isArray(data) || data.length === 0) {
//             postsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No discussions yet. Be the first to post!</div>';
//             paginationContainer.style.display = 'none';
//             return;
//         }
//         postsContainer.innerHTML = data.map(post => createForumPost(post)).join('');
//         updateForumPaginationControls(data.length);
//     } catch (err) {
//         postsContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:#e74c3c;">Unable to load discussions.<br><span style='color:#666;font-size:0.9rem;'>Please try again later.</span></div>`;
//         paginationContainer.style.display = 'none';
//     }
// }

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

// function createForumPost(post) {
//     const title = escapeHtml(post.title || '');
//     const content = escapeHtml(post.content || '');
//     let author = 'Anonymous';
//     if (post.author) {
//         if (typeof post.author === 'object' && post.author !== null) {
//             author = post.author.username || post.author.name || JSON.stringify(post.author);
//         } else {
//             author = post.author;
//         }
//     }
//     author = escapeHtml(author);
//     const date = new Date(post.date || post.createdAt || Date.now()).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
//     let imageHtml = '';
//     if (post.imageUrl) {
//         imageHtml = `<div style="margin:1rem 0;"><img src="${post.imageUrl}" alt="Post image" style="max-width:100%;border-radius:6px;"></div>`;
//     }
//         // Show reply button only if user is logged in
//     let replySection = '';
//     if (isUserLoggedIn()) {
//         replySection = `
//             <div class="reply-action-container" style="margin-top:0.7rem;">
//                 <button class="reply-btn" style="background:#3498db;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">Reply</button>
//             </div>
//         `;
//     }
//     return `<div class="forum-post" data-post-id="${post._id || ''}" style="background:#f8f9fa;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
//         <h4 style="margin:0 0 0.5rem 0;color:#667eea;">${title}</h4>
//         <div style="color:#333;margin-bottom:0.7rem;">${content}</div>
//         ${imageHtml}
//         <div style="font-size:0.9rem;color:#888;display:flex;justify-content:space-between;align-items:center;">
//             <span>By ${author}</span>
//             <span>${date}</span>
//         </div>
//         ${replySection}
//     </div>`;
// }

// // Notification utility (imported from main.js or fallback)
// if (typeof showNotification !== 'function') {
//     window.showNotification = function(message, type = 'info') {
//         alert(message);
//     };
// }


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

// Handle reply button clicks and form submissions
// function handleReplyButtonClick(e) {
//     // Handle reply button click
//     if (e.target.classList.contains('reply-btn')) {
//         e.preventDefault();
//         const postDiv = e.target.closest('.forum-post');
//         if (!postDiv) return;
        
//         const replyAction = postDiv.querySelector('.reply-action-container');
//         if (!replyAction) return;
        
//         // Check if already showing reply form
//         if (replyAction.querySelector('.reply-form')) return;
        
//         // Create reply form
//         const replyForm = document.createElement('div');
//         replyForm.className = 'reply-form';
//         replyForm.innerHTML = `
//             <textarea class="reply-text" rows="3" placeholder="Write a reply..." style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:6px;margin-top:0.8rem;resize:vertical;min-height:80px;"></textarea>
//             <div style="display:flex;justify-content:flex-end;gap:0.8rem;margin-top:0.5rem;">
//                 <button type="button" class="cancel-reply-btn" style="background:#e0e0e0;color:#333;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">
//                     Cancel
//                 </button>
//                 <button type="button" class="submit-reply-btn" style="background:#27ae60;color:white;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">
//                     Post Reply
//                 </button>
//             </div>
//         `;
        
//         // Add to DOM
//         replyAction.appendChild(replyForm);
        
//         // Focus the textarea
//         const textarea = replyForm.querySelector('.reply-text');
//         if (textarea) textarea.focus();
//     }
    
//     // Handle submit reply
//     else if (e.target.classList.contains('submit-reply-btn')) {
//         e.preventDefault();
//         const replyForm = e.target.closest('.reply-form');
//         if (!replyForm) return;
        
//         const postDiv = e.target.closest('.forum-post');
//         const replyText = replyForm.querySelector('.reply-text').value.trim();
//         const postId = postDiv.getAttribute('data-post-id');
        
//         if (!replyText) {
//             showNotification('Please enter a reply.', 'warning');
//             return;
//         }
        
//         submitReply(postId, replyText, e.target);
//     }
    
//     // Handle cancel reply
//     else if (e.target.classList.contains('cancel-reply-btn')) {
//         e.preventDefault();
//         const replyForm = e.target.closest('.reply-form');
//         if (replyForm && replyForm.parentNode) {
//             replyForm.parentNode.removeChild(replyForm);
//         }
//     }
// }

async function submitReply(postId, replyText, btn) {
    if (!postId) {
        showNotification('Invalid post.', 'error');
        return;
    }
    
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Posting...';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${FORUM_API_BASE}/${postId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                content: replyText 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit reply');
        }
        
        // Remove the reply form
        const replyForm = btn.closest('.reply-form');
        if (replyForm?.parentNode) {
            replyForm.parentNode.removeChild(replyForm);
        }
        
        showNotification('Reply submitted successfully!', 'success');
        // Reload the posts to show the new reply
        loadForumPosts(currentForumPage);
    } catch (error) {
        console.error('Error submitting reply:', error);
        showNotification(`Error: ${error.message || 'Failed to submit reply'}`, 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// async function submitReply(postId, replyText, btn) {
//     if (!postId) {
//         showNotification('Invalid post.', 'error');
//         return;
//     }
//     btn.disabled = true;
//     btn.textContent = 'Submitting...';
//     console.log('Submitting reply:', { postId, replyText });
//     try {
//         // Use the correct backend endpoint for replies
//         const replyUrl = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/posts/' + postId + '/reply';
//         const token = localStorage.getItem('token') || '';
//         // Send as JSON (adjust if backend expects FormData)
//         const res = await fetch(replyUrl, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ content: replyText })
//         });
//         let responseText = await res.text();
//         console.log('Reply response status:', res.status, 'body:', responseText);
//         if (!res.ok) throw new Error('Failed to submit reply: ' + responseText);
//         showNotification('Reply submitted!', 'success');
//         loadForumPosts(currentForumPage);
//     } catch (err) {
//         console.error('Reply error:', err);
//         showNotification('Failed to submit reply.', 'error');
//     } finally {
//         btn.disabled = false;
//         btn.textContent = 'Reply';
//     }
// }


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
        formData.append('subject', 'mathematics');
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
