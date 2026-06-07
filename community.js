/**
 * Community Discussion Boards
 * Manages the UI and interactions for Elite member discussions
 */

// Determine API URL based on environment
let API_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000';
} else {
    API_URL = 'https://api.travelsmarterapp.com';
}

// Module names for reference
const MODULE_NAMES = {
    1: 'Flight Hacking',
    2: 'Credit Cards',
    3: 'Hotel Hacking',
    4: 'Timing Intelligence',
    5: 'Airport & Transit',
    6: 'Destinations',
    7: 'Car Rentals',
    8: 'Community',
    9: 'Travel Money',
    10: 'Travel Insurance',
    11: 'Visa & Immigration',
    12: 'Accommodations',
    13: 'Ground Transport',
    14: 'Travel Bookings',
    15: 'Food & Dining',
    16: 'Shopping & VAT'
};

// Get auth token
function getAuthToken() {
    return localStorage.getItem('userToken') || localStorage.getItem('token');
}

// Show notification
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
        alert.style.background = '#d1fae5';
        alert.style.color = '#065f46';
        alert.style.border = '1px solid #6ee7b7';
    } else {
        alert.style.background = '#fee2e2';
        alert.style.color = '#991b1b';
        alert.style.border = '1px solid #fca5a5';
    }

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// Load posts for a module
async function loadCommunityPosts(moduleId, sort = 'recent') {
    try {
        const response = await fetch(`${API_URL}/api/community/posts/${moduleId}?sort=${sort}&limit=50`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load posts');

        const data = await response.json();
        renderCommunityPosts(data.posts || []);
    } catch (error) {
        console.error('Error loading posts:', error);
        showAlert('Failed to load community posts', 'error');
    }
}

// Render community posts
function renderCommunityPosts(posts) {
    const container = document.getElementById('community-posts-container');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>No discussions yet. Be the first to share!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="community-post" data-post-id="${post.id}" style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #e5e7eb;
            transition: all 0.3s ease;
        ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1em;">${post.title}</h3>
                    <div style="font-size: 0.85em; color: #6b7280;">
                        by <strong>${post.first_name || 'Member'}</strong>
                        <span style="background: ${post.tier === 'elite' ? '#f0fdf4' : '#e8eef7'}; padding: 2px 8px; border-radius: 4px; margin-left: 8px; font-weight: 600;">
                            ${post.tier === 'elite' ? '⭐ Elite' : 'Smart Traveler'}
                        </span>
                    </div>
                </div>
                ${post.is_pinned ? '<span style="color: #667eea; font-weight: bold;">📌 Pinned</span>' : ''}
            </div>

            <p style="color: #4b5563; margin: 15px 0; line-height: 1.6;">${post.content}</p>

            <div style="display: flex; gap: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                <button class="community-upvote-btn" onclick="upvotePost('${post.id}')" style="
                    background: ${post.user_voted ? '#f0fdf4' : 'transparent'};
                    color: ${post.user_voted ? '#10b981' : '#667eea'};
                    border: 1px solid ${post.user_voted ? '#10b981' : '#e5e7eb'};
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                ">
                    👍 ${post.upvote_count}
                </button>

                <button onclick="openRepliesModal('${post.id}', '${post.title}')" style="
                    background: transparent;
                    color: #667eea;
                    border: 1px solid #e5e7eb;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                ">
                    💬 ${post.reply_count}
                </button>

                <span style="color: #999; font-size: 0.85em; margin-left: auto; padding: 6px 12px;">
                    ${formatDate(post.created_at)}
                </span>
            </div>
        </div>
    `).join('');
}

// Upvote a post
async function upvotePost(postId) {
    try {
        const response = await fetch(`${API_URL}/api/community/posts/${postId}/upvote`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            showAlert(data.action === 'added' ? 'Post upvoted!' : 'Upvote removed');

            // Reload posts to reflect changes
            const moduleId = document.getElementById('current-module-id')?.value;
            if (moduleId) {
                loadCommunityPosts(moduleId);
            }
        }
    } catch (error) {
        console.error('Error upvoting post:', error);
        showAlert('Error upvoting post', 'error');
    }
}

// Open replies modal
async function openRepliesModal(postId, postTitle) {
    try {
        // Load replies
        const response = await fetch(`${API_URL}/api/community/posts/${postId}/replies`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load replies');

        const data = await response.json();
        const replies = data.replies || [];

        // Store current post ID for reply creation
        window.currentReplyPostId = postId;

        // Render replies modal
        renderRepliesModal(postId, postTitle, replies);
    } catch (error) {
        console.error('Error loading replies:', error);
        showAlert('Failed to load replies', 'error');
    }
}

// Render replies modal
function renderRepliesModal(postId, postTitle, replies) {
    const modal = document.createElement('div');
    modal.id = 'replies-modal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h2 style="margin: 0; font-size: 1.3em; color: #2c3e50;">${postTitle}</h2>
        <button onclick="closeRepliesModal()" style="
            background: none;
            border: none;
            font-size: 1.5em;
            cursor: pointer;
            color: #999;
        ">✕</button>
    `;
    content.appendChild(header);

    const repliesContainer = document.createElement('div');
    repliesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    `;

    if (replies.length === 0) {
        repliesContainer.innerHTML = '<p style="color: #999; text-align: center;">No replies yet. Be the first to reply!</p>';
    } else {
        repliesContainer.innerHTML = replies.map(reply => `
            <div style="
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 12px;
                border-left: 3px solid #667eea;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #2c3e50;">${reply.first_name || 'Member'}</strong>
                    <span style="color: #999; font-size: 0.85em;">${formatDate(reply.created_at)}</span>
                </div>
                <p style="margin: 0 0 10px 0; color: #4b5563;">${reply.content}</p>
                <button onclick="upvoteReply('${reply.id}')" style="
                    background: ${reply.user_voted ? '#f0fdf4' : 'transparent'};
                    color: ${reply.user_voted ? '#10b981' : '#667eea'};
                    border: 1px solid ${reply.user_voted ? '#10b981' : '#e5e7eb'};
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85em;
                    font-weight: 500;
                ">
                    👍 ${reply.upvote_count}
                </button>
            </div>
        `).join('');
    }
    content.appendChild(repliesContainer);

    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
    `;
    footer.innerHTML = `
        <input
            type="text"
            id="reply-input"
            placeholder="Write a reply..."
            style="
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 0.95em;
            "
        >
        <button onclick="submitReply('${postId}')" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        ">
            Reply
        </button>
    `;
    content.appendChild(footer);

    modal.appendChild(content);

    // Remove existing modal if present
    const existingModal = document.getElementById('replies-modal');
    if (existingModal) existingModal.remove();

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeRepliesModal();
    });
}

// Submit a reply
async function submitReply(postId) {
    const input = document.getElementById('reply-input');
    const content = input.value.trim();

    if (!content) {
        showAlert('Please write a reply', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/community/posts/${postId}/replies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            showAlert('Reply posted!', 'success');
            input.value = '';

            // Reload replies
            openRepliesModal(postId, document.querySelector('#replies-modal h2')?.textContent || 'Post');

            // Reload posts
            const moduleId = document.getElementById('current-module-id')?.value;
            if (moduleId) {
                loadCommunityPosts(moduleId);
            }
        } else {
            showAlert('Failed to post reply', 'error');
        }
    } catch (error) {
        console.error('Error posting reply:', error);
        showAlert('Error posting reply', 'error');
    }
}

// Upvote a reply
async function upvoteReply(replyId) {
    try {
        const response = await fetch(`${API_URL}/api/community/replies/${replyId}/upvote`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('Reply upvoted!', 'success');
            // Reload the current post's replies
            const postId = window.currentReplyPostId;
            if (postId) {
                const postTitle = document.querySelector('#replies-modal h2')?.textContent || 'Post';
                openRepliesModal(postId, postTitle);
            }
        }
    } catch (error) {
        console.error('Error upvoting reply:', error);
        showAlert('Error upvoting reply', 'error');
    }
}

// Close replies modal
function closeRepliesModal() {
    const modal = document.getElementById('replies-modal');
    if (modal) modal.remove();
}

// Open create post modal
function openCreatePostModal(moduleId) {
    const modal = document.createElement('div');
    modal.id = 'create-post-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        padding: 30px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    `;

    content.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #2c3e50;">Start a Discussion</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">Share your travel hacking tips and experiences with the community!</p>

        <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #667eea; margin-bottom: 8px;">Topic Title</label>
            <input
                type="text"
                id="post-title"
                placeholder="What would you like to discuss?"
                style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.95em;
                    box-sizing: border-box;
                "
            >
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #667eea; margin-bottom: 8px;">Your Message</label>
            <textarea
                id="post-content"
                placeholder="Share your thoughts, tips, or questions..."
                rows="6"
                style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 0.95em;
                    resize: vertical;
                    box-sizing: border-box;
                "
            ></textarea>
        </div>

        <div style="display: flex; gap: 12px;">
            <button onclick="submitPost(${moduleId})" style="
                flex: 1;
                background: #667eea;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.95em;
            ">
                Post Discussion
            </button>
            <button onclick="closeCreatePostModal()" style="
                flex: 1;
                background: #e5e7eb;
                color: #667eea;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.95em;
            ">
                Cancel
            </button>
        </div>
    `;

    modal.appendChild(content);

    // Remove existing modal if present
    const existingModal = document.getElementById('create-post-modal');
    if (existingModal) existingModal.remove();

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCreatePostModal();
    });
}

// Close create post modal
function closeCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) modal.remove();
}

// Submit a post
async function submitPost(moduleId) {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !content) {
        showAlert('Please fill in both title and content', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/community/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                moduleId,
                title,
                content
            })
        });

        if (response.ok) {
            showAlert('Discussion posted! 🎉', 'success');
            closeCreatePostModal();

            // Reload posts
            loadCommunityPosts(moduleId);
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showAlert('Error creating post: ' + error.message, 'error');
    }
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}
