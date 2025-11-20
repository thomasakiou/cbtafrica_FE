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

// Check login status (assumes auth-utils.js provides isLoggedIn)
document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    if (newPostContainer) newPostContainer.style.display = loggedIn ? 'block' : 'none';
    if (loginPrompt) loginPrompt.style.display = loggedIn ? 'none' : 'block';
    loadForumPosts();
});
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
            <button class="reply-btn" style="margin-top:0.7rem;background:#3498db;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">Reply</button>
            <div class="reply-box" style="display:none;margin-top:0.7rem;">
                <textarea class="reply-text" rows="2" placeholder="Write a reply..." style="width:100%;padding:0.5rem;border:1px solid #ccc;border-radius:4px;"></textarea>
                <button class="submit-reply-btn" style="margin-top:0.4rem;background:#27ae60;color:white;border:none;padding:0.4rem 1rem;border-radius:4px;cursor:pointer;font-size:0.9rem;">Submit Reply</button>
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


// Event delegation for reply button and submit reply
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('reply-btn')) {
        console.log('Reply button clicked:', e.target);
        const postDiv = e.target.closest('.forum-post');
        if (!postDiv) {
            console.warn('No .forum-post ancestor found for reply button');
            return;
        }
        const replyBox = postDiv.querySelector('.reply-box');
        if (!replyBox) {
            console.warn('No .reply-box found inside .forum-post');
            return;
        }
        console.log('Toggling reply box. Current display:', replyBox.style.display);
        replyBox.style.display = replyBox.style.display === 'none' ? 'block' : 'none';
    }
    if (e.target.classList.contains('submit-reply-btn')) {
        const postDiv = e.target.closest('.forum-post');
        const replyText = postDiv.querySelector('.reply-text').value.trim();
        const postId = postDiv.getAttribute('data-post-id');
        if (!replyText) {
            showNotification('Reply cannot be empty.', 'warning');
            return;
        }
        submitReply(postId, replyText, e.target);
    }
});

async function submitReply(postId, replyText, btn) {
    if (!postId) {
        showNotification('Invalid post.', 'error');
        return;
    }
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    console.log('Submitting reply:', { postId, replyText });
    try {
        const res = await fetch(FORUM_API_BASE + `/${postId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ content: replyText })
        });
        let responseText = await res.text();
        console.log('Reply response status:', res.status, 'body:', responseText);
        if (!res.ok) throw new Error('Failed to submit reply: ' + responseText);
        showNotification('Reply submitted!', 'success');
        loadForumPosts(currentForumPage);
    } catch (err) {
        console.error('Reply error:', err);
        showNotification('Failed to submit reply.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Reply';
    }
}
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
