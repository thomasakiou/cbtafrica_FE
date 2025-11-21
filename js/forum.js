// forum.js - Handles loading and posting forum discussions for Mathematics page

const FORUM_API_BASE = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/api/v1/forum/posts';
// const FORUM_API_BASE = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/posts';
const postsContainer = document.getElementById('posts-container');
const paginationContainer = document.getElementById('forum-pagination');
const newPostForm = document.getElementById('new-post-form');
const newPostContainer = document.getElementById('new-post-container');
const loginPrompt = document.getElementById('login-prompt');

let currentForumPage = 1;
const postsPerPage = 5;

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
    if (postsContainer) {
        postsContainer.addEventListener('click', handleReplyButtonClick);
    }
});
function isUserLoggedIn() {
    // Use the same logic as updateAuthUI: token and username in localStorage
    return !!(localStorage.getItem('token') && localStorage.getItem('username'));
}

document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = isUserLoggedIn();
    if (newPostContainer) newPostContainer.style.display = loggedIn ? 'block' : 'none';
    if (loginPrompt) loginPrompt.style.display = loggedIn ? 'none' : 'block';
    
    // Add event delegation for reply buttons and forms
    if (postsContainer) {
        postsContainer.addEventListener('click', handleReplyButtonClick);
    }
    
    loadForumPosts();
});

async function loadForumPosts(page = 1) {
    if (!postsContainer) return;
    postsContainer.innerHTML = '<div class="loading-spinner" style="text-align:center;padding:2rem;color:#666;">Loading discussions...</div>';
    try {
        const url = `${FORUM_API_BASE}?subject=mathematics&page=${page}&limit=${postsPerPage}&sort=newest`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load forum posts');
        const result = await res.json();
        // Expecting result to be { posts: [...], total: n } or just an array
        const data = Array.isArray(result) ? result : (result.posts || []);
        if (!Array.isArray(data) || data.length === 0) {
            postsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No discussions yet. Be the first to post!</div>';
            paginationContainer.style.display = 'none';
            return;
        }
        postsContainer.innerHTML = data.map(post => createForumPost(post)).join('');
        updateForumPaginationControls(data.length);
    } catch (err) {
        postsContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:#e74c3c;">Unable to load discussions.<br><span style='color:#666;font-size:0.9rem;'>Please try again later.</span></div>`;
        paginationContainer.style.display = 'none';
    }
}

function createForumPost(post) {
    const title = escapeHtml(post.title || '');
    const content = escapeHtml(post.content || '');
    let author = 'Anonymous';
    if (post.author) {
        if (typeof post.author === 'object' && post.author !== null) {
            author = post.author.username || post.author.name || JSON.stringify(post.author);
        } else {
            author = post.author;
        }
    }
    author = escapeHtml(author);
    const date = new Date(post.date || post.createdAt || Date.now()).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let imageHtml = '';
    if (post.imageUrl) {
        imageHtml = `<div style="margin:1rem 0;"><img src="${post.imageUrl}" alt="Post image" style="max-width:100%;border-radius:6px;"></div>`;
    }
        // Show reply button only if user is logged in
    let replySection = '';
    if (isUserLoggedIn()) {
        replySection = `
            <div class="reply-action-container" style="margin-top:0.7rem;">
                <button class="reply-btn" style="background:#3498db;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">Reply</button>
            </div>
        `;
    }
    return `<div class="forum-post" data-post-id="${post._id || ''}" style="background:#f8f9fa;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <h4 style="margin:0 0 0.5rem 0;color:#667eea;">${title}</h4>
        <div style="color:#333;margin-bottom:0.7rem;">${content}</div>
        ${imageHtml}
        <div style="font-size:0.9rem;color:#888;display:flex;justify-content:space-between;align-items:center;">
            <span>By ${author}</span>
            <span>${date}</span>
        </div>
        ${replySection}
    </div>`;
}

// Notification utility (imported from main.js or fallback)
if (typeof showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        alert(message);
    };
}


// Handle reply button clicks and form submissions
function handleReplyButtonClick(e) {
    // Handle reply button click
if (e.target.classList.contains('reply-btn')) {
    e.preventDefault();
    const postDiv = e.target.closest('.forum-post');
    if (!postDiv) {
        console.error('Could not find parent post div');
        return;
    }
    
    // Get post ID from the closest forum-post element
    const postId = postDiv.getAttribute('data-post-id');
    console.log('Post ID when creating reply form:', postId, 'Post div:', postDiv);
    
    // Log all data attributes of the post div for debugging
    console.log('Post div attributes:');
    for (let attr of postDiv.attributes) {
        console.log(attr.name, '=', attr.value);
    }
    
    // ... rest of the code remains the same until the form creation ...
    
    // Update the form creation to include the post ID in a more reliable way
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.setAttribute('data-post-id', postId);  // Add post ID to the form itself
    replyForm.innerHTML = `
        <textarea class="reply-text" rows="3" placeholder="Write a reply..." style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:6px;margin-top:0.8rem;resize:vertical;min-height:80px;"></textarea>
        <div style="display:flex;justify-content:flex-end;gap:0.8rem;margin-top:0.5rem;">
            <button type="button" class="cancel-reply-btn" style="background:#e0e0e0;color:#333;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">
                Cancel
            </button>
            <button type="button" class="submit-reply-btn" style="background:#27ae60;color:white;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;" data-post-id="${postId}">
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
    
    const replyText = replyForm.querySelector('.reply-text').value.trim();
    
    // Try to get post ID from multiple possible locations
    let postId = e.target.getAttribute('data-post-id') || 
                replyForm.getAttribute('data-post-id') ||
                (e.target.closest('.forum-post')?.getAttribute('data-post-id'));
    
    console.log('Post ID sources:', {
        button: e.target.getAttribute('data-post-id'),
        form: replyForm.getAttribute('data-post-id'),
        closestPost: e.target.closest('.forum-post')?.getAttribute('data-post-id'),
        finalPostId: postId
    });
    
    if (!replyText) {
        showNotification('Please enter a reply.', 'warning');
        return;
    }
    
    if (!postId) {
        console.error('Could not find post ID in any expected location');
        showNotification('Error: Could not determine which post to reply to.', 'error');
        return;
    }
    
    submitReply(postId, replyText, e.target);
}


// // Handle reply button clicks and form submissions
// function handleReplyButtonClick(e) {
//     // Handle reply button click
//     if (e.target.classList.contains('reply-btn')) {
//         e.preventDefault();
//         const postDiv = e.target.closest('.forum-post');
//         if (!postDiv) {
//             console.error('Could not find parent post div');
//             return;
//         }
        
//         const postId = postDiv.getAttribute('data-post-id');
//         console.log('Post ID:', postId);
        
//         const replyAction = postDiv.querySelector('.reply-action-container');
//         if (!replyAction) {
//             console.error('Could not find reply action container');
//             return;
//         }
        
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
//                 <button type="button" class="submit-reply-btn" style="background:#27ae60;color:white;border:none;padding:0.5rem 1.2rem;border-radius:4px;cursor:pointer;font-size:0.9rem;" data-post-id="${postId}">
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
        
//         const replyText = replyForm.querySelector('.reply-text').value.trim();
//         const postId = e.target.getAttribute('data-post-id');
        
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
                subject: 'mathematics'
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

async function submitReply(postId, replyText, btn) {
    console.log('submitReply called with:', { postId, replyText });
    
    if (!postId) {
        console.error('Post ID is missing in submitReply');
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
        
        console.log('Submitting reply to post ID:', postId);
        const replyUrl = `https://vmi2848672.contaboserver.net/cbt/api/v1/forum/posts/${postId}/reply`;
        
        const res = await fetch(replyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: replyText })
        });
        
        const responseText = await res.text();
        console.log('Response status:', res.status, 'Response:', responseText);
        
        if (!res.ok) {
            throw new Error('Failed to submit reply: ' + responseText);
        }
        
        showNotification('Reply submitted!', 'success');
        loadForumPosts(currentForumPage);
    } catch (err) {
        console.error('Error in submitReply:', err);
        showNotification('Failed to submit reply: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// async function submitReply(postId, replyText, btn) {
//     if (!postId) {
//         console.error('Post ID is missing');
//         showNotification('Invalid post.', 'error');
//         return;
//     }

//     const originalText = btn.textContent;
//     btn.disabled = true;
//     btn.textContent = 'Posting...';
    
//     try {
//         const token = localStorage.getItem('token');
//         if (!token) {
//             throw new Error('Not authenticated');
//         }
        
//         console.log('Submitting reply:', { postId, replyText });
//         // Use the correct backend endpoint for replies
//         const replyUrl = `https://vmi2848672.contaboserver.net/cbt/api/v1/forum/posts/${postId}/reply`;
        
//         // Send as JSON
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
