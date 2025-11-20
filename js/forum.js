// forum.js - Handles loading and posting forum discussions for Mathematics page

const FORUM_API = 'https://vmi2848672.contaboserver.net/cbt/api/v1/forum/mathematics'; // Adjust endpoint if needed
const postsContainer = document.getElementById('posts-container');
const paginationContainer = document.getElementById('forum-pagination');
const newPostForm = document.getElementById('new-post-form');
const newPostContainer = document.getElementById('new-post-container');
const loginPrompt = document.getElementById('login-prompt');

let currentForumPage = 1;
const postsPerPage = 5;

// Check login status (assumes auth-utils.js provides isLoggedIn)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        newPostContainer.style.display = 'block';
        loginPrompt.style.display = 'none';
    } else {
        newPostContainer.style.display = 'none';
        loginPrompt.style.display = 'block';
    }
    loadForumPosts();
});

async function loadForumPosts(page = 1) {
    if (!postsContainer) return;
    postsContainer.innerHTML = '<div class="loading-spinner" style="text-align:center;padding:2rem;color:#666;">Loading discussions...</div>';
    try {
        const skip = (page - 1) * postsPerPage;
        const res = await fetch(`${FORUM_API}?skip=${skip}&limit=${postsPerPage}`);
        if (!res.ok) throw new Error('Failed to load forum posts');
        const data = await res.json();
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
    const author = escapeHtml(post.author || 'Anonymous');
    const date = new Date(post.date || post.createdAt || Date.now()).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let imageHtml = '';
    if (post.imageUrl) {
        imageHtml = `<div style="margin:1rem 0;"><img src="${post.imageUrl}" alt="Post image" style="max-width:100%;border-radius:6px;"></div>`;
    }
    return `<div class="forum-post" style="background:#f8f9fa;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <h4 style="margin:0 0 0.5rem 0;color:#667eea;">${title}</h4>
        <div style="color:#333;margin-bottom:0.7rem;">${content}</div>
        ${imageHtml}
        <div style="font-size:0.9rem;color:#888;display:flex;justify-content:space-between;align-items:center;">
            <span>By ${author}</span>
            <span>${date}</span>
        </div>
    </div>`;
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
        if (imageInput && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        try {
            const res = await fetch(FORUM_API, {
                method: 'POST',
                body: formData,
                credentials: 'include',
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
