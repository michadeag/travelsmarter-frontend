// Admin Dashboard JavaScript
// Connects to backend API for data management

// Determine correct API URL based on current domain
let API_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000';
} else {
    API_URL = localStorage.getItem('apiUrl') || 'https://api.travelsmarterapp.com';
}

console.log('Admin Dashboard using API:', API_URL);

// Helper function to get current auth token
function getAuthToken() {
    return localStorage.getItem('userToken') || localStorage.getItem('adminToken');
}

// Deprecated: Use getAuthToken() instead
const API_TOKEN = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    // Check if logged in
    if (!getAuthToken()) {
        redirectToLogin();
        return;
    }

    // Load dashboard data
    loadDashboardStats();
    loadUsers();
    loadSubscriptions();
    loadDeals();
    loadHacks();
    loadPromos();
    loadEmailTemplates();
    loadRecentActivities();
    loadSettings();

    // Set admin name
    const adminName = localStorage.getItem('adminName') || 'Admin';
    document.getElementById('admin-name').textContent = adminName;
    document.getElementById('user-avatar').textContent = adminName.charAt(0).toUpperCase();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Search functionality
    document.getElementById('user-search')?.addEventListener('input', (e) => {
        filterUsers(e.target.value);
    });

    document.getElementById('deals-search')?.addEventListener('input', (e) => {
        filterDeals(e.target.value);
    });
}

// TAB SWITCHING
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    const titles = {
        dashboard: 'Dashboard', users: 'Users Management', subscriptions: 'Subscriptions',
        deals: 'Deals Management', hacks: 'Hacks & Modules', promos: 'Promo Codes',
        'email-templates': 'Email Templates', analytics: 'Analytics', settings: 'Settings',
        reddit: '🤖 Reddit', linkedin: '💼 LinkedIn', pinterest: '📌 Pinterest',
        instagram: '📸 Instagram', wordpress: '📝 WordPress', quora: '❓ Quora', blogger: '📰 Blogger'
    };
    document.getElementById('page-title').textContent = titles[tabName] || tabName;

    // Auto-load data when switching to platform tabs
    if (tabName === 'analytics') loadAnalytics();
    if (tabName === 'twitter') { loadTwitterStatus(); loadTwitterRecentPosts(); }
    if (tabName === 'reddit') { loadRedditStatus(); loadRedditRecentPosts(); }
    if (tabName === 'linkedin') { loadLinkedInStatus(); loadLinkedInRecentPosts(); }
    if (tabName === 'pinterest') { loadPinterestStatus(); loadPinterestRecentPosts(); }
    if (tabName === 'instagram') { loadInstagramStatus(); loadInstagramRecentPosts(); }
    if (tabName === 'wordpress') { loadWordPressStatus(); loadWordPressRecentPosts(); }
    if (tabName === 'quora') { loadQuoraStatus(); loadQuoraRecentAnswers(); }
    if (tabName === 'blogger') { loadBloggerStatus(); loadBloggerRecentPosts(); }
}

// ALERTS
function showAlert(message, type = 'success') {
    const alertEl = document.getElementById('alert');
    alertEl.textContent = message;
    alertEl.className = `alert alert-${type} show`;

    setTimeout(() => {
        alertEl.classList.remove('show');
    }, 4000);
}

// DASHBOARD STATS
async function loadDashboardStats() {
    try {
        // Fetch stats from API
        const [usersRes, subsRes, dealsRes] = await Promise.all([
            fetch(`${API_URL}/api/auth/users/count`, {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            }),
            fetch(`${API_URL}/api/subscriptions/stats`, {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            }),
            fetch(`${API_URL}/api/deals/count`, {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            })
        ]);

        if (usersRes.ok) {
            const data = await usersRes.json();
            document.getElementById('stat-users').textContent = data.count || '0';
        }

        if (dealsRes.ok) {
            const data = await dealsRes.json();
            document.getElementById('stat-deals').textContent = data.count || '0';
        }

        // Load subscription breakdown
        loadSubscriptionStats();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadSubscriptionStats() {
    try {
        const response = await fetch(`${API_URL}/api/subscriptions/stats`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('stat-subscriptions').textContent = data.active || '0';

            // Update counts
            document.getElementById('count-free').textContent = data.free || '0';
            document.getElementById('count-smart').textContent = data.smartTraveler || '0';
            document.getElementById('count-elite').textContent = data.elite || '0';

            // Calculate MRR
            const smartMRR = (data.smartTraveler || 0) * 19;
            const eliteMRR = (data.elite || 0) * 49;
            const totalMRR = smartMRR + eliteMRR;

            document.getElementById('total-mrr').textContent = `€${totalMRR.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading subscription stats:', error);
    }
}

// USERS MANAGEMENT
async function loadUsers() {
    try {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch(`${API_URL}/api/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users || []);
        } else {
            console.error('Failed to load users:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        displayError('users-table', 'Failed to load users');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.email}</td>
            <td>${user.first_name || ''} ${user.last_name || ''}</td>
            <td><span class="badge badge-${user.subscription_tier === 'free' ? 'info' : 'success'}">${user.subscription_tier}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers(query) {
    const rows = document.querySelectorAll('#users-table tr');
    rows.forEach(row => {
        const email = row.querySelector('td')?.textContent.toLowerCase();
        if (email?.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// USER MODALS
function openUserModal() {
    document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.remove('active');
    document.getElementById('modal-user-email').value = '';
    document.getElementById('modal-user-first').value = '';
    document.getElementById('modal-user-last').value = '';
    document.getElementById('modal-user-tier').value = 'free';
    // Reset edit mode
    modal.dataset.isEditing = 'false';
    modal.dataset.userId = '';
    // Reset modal title
    const modalTitle = document.querySelector('#user-modal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Add New User';
    }
}

async function saveUser() {
    const email = document.getElementById('modal-user-email').value;
    const firstName = document.getElementById('modal-user-first').value;
    const lastName = document.getElementById('modal-user-last').value;
    const tier = document.getElementById('modal-user-tier').value;
    const modal = document.getElementById('user-modal');
    const isEditing = modal.dataset.isEditing === 'true';
    const userId = modal.dataset.userId;

    if (!email) {
        showAlert('Email is required', 'error');
        return;
    }

    try {
        let url = `${API_URL}/api/auth/users`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/auth/users/${userId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                firstName,
                lastName,
                subscriptionTier: tier
            })
        });

        if (response.ok) {
            showAlert('User saved successfully', 'success');
            closeUserModal();
            // Reset edit mode
            modal.dataset.isEditing = 'false';
            modal.dataset.userId = '';
            loadUsers();
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Failed to save user', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('Error saving user', 'error');
    }
}

async function editUser(userId) {
    try {
        // Fetch user data
        const response = await fetch(`${API_URL}/api/auth/users`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            showAlert('Failed to load user data', 'error');
            return;
        }

        const data = await response.json();
        const user = data.users.find(u => u.id === userId);

        if (!user) {
            showAlert('User not found', 'error');
            return;
        }

        // Populate modal with user data
        document.getElementById('modal-user-email').value = user.email;
        document.getElementById('modal-user-first').value = user.first_name || '';
        document.getElementById('modal-user-last').value = user.last_name || '';
        document.getElementById('modal-user-tier').value = user.subscription_tier || 'free';

        // Store userId for save operation
        document.getElementById('user-modal').dataset.userId = userId;
        document.getElementById('user-modal').dataset.isEditing = 'true';

        // Update modal title
        const modalTitle = document.querySelector('#user-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit User';
        }

        // Open modal
        openUserModal();
    } catch (error) {
        console.error('Error loading user for edit:', error);
        showAlert('Error loading user data', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('User deleted successfully', 'success');
            loadUsers();
        } else {
            showAlert('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user', 'error');
    }
}

// SUBSCRIPTIONS
async function loadSubscriptions() {
    try {
        const response = await fetch(`${API_URL}/api/subscriptions`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Subscriptions data:', data);
            displaySubscriptions(data.subscriptions || []);
        } else {
            console.error('Subscriptions API error:', response.status, response.statusText);
            displayError('subscriptions-table', `Failed to load subscriptions: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        displayError('subscriptions-table', 'Failed to load subscriptions');
    }
}

function displaySubscriptions(subscriptions) {
    console.log('displaySubscriptions called with:', subscriptions.length, 'items');
    const tbody = document.getElementById('subscriptions-table');

    if (subscriptions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No subscriptions found</td></tr>';
        return;
    }

    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.email || 'N/A'}</td>
            <td>${sub.tier}</td>
            <td><span class="badge badge-${sub.status === 'active' ? 'success' : 'danger'}">${sub.status}</span></td>
            <td>${formatDate(sub.created_at)}</td>
            <td>${formatDate(sub.current_period_end)}</td>
            <td>€${sub.price_monthly || '0'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editSubscription('${sub.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSubscription('${sub.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// SUBSCRIPTION MODALS & CRUD
function openSubscriptionModal() {
    document.getElementById('subscription-modal').classList.add('active');
}

function closeSubscriptionModal() {
    document.getElementById('subscription-modal').classList.remove('active');
    document.getElementById('modal-subscription-tier').value = '';
    document.getElementById('modal-subscription-status').value = 'active';
}

async function editSubscription(subId) {
    try {
        const response = await fetch(`${API_URL}/api/subscriptions`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            showAlert('Failed to load subscription data', 'error');
            return;
        }

        const data = await response.json();
        const sub = data.subscriptions.find(s => s.id === subId);

        if (!sub) {
            showAlert('Subscription not found', 'error');
            return;
        }

        document.getElementById('modal-subscription-tier').value = sub.tier;
        document.getElementById('modal-subscription-status').value = sub.status;
        document.getElementById('subscription-modal').dataset.subId = subId;
        openSubscriptionModal();
    } catch (error) {
        console.error('Error loading subscription for edit:', error);
        showAlert('Error loading subscription data', 'error');
    }
}

async function deleteSubscription(subId) {
    if (!confirm('Are you sure you want to delete this subscription?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/subscriptions/${subId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('Subscription deleted successfully', 'success');
            loadSubscriptions();
        } else {
            showAlert('Failed to delete subscription', 'error');
        }
    } catch (error) {
        console.error('Error deleting subscription:', error);
        showAlert('Error deleting subscription', 'error');
    }
}

async function saveSubscription() {
    const subId = document.getElementById('subscription-modal').dataset.subId;
    const tier = document.getElementById('modal-subscription-tier').value;
    const status = document.getElementById('modal-subscription-status').value;

    if (!tier || !status) {
        showAlert('All fields are required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/subscriptions/${subId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tier, status })
        });

        if (response.ok) {
            showAlert('Subscription updated successfully', 'success');
            closeSubscriptionModal();
            loadSubscriptions();
        } else {
            showAlert('Failed to update subscription', 'error');
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        showAlert('Error updating subscription', 'error');
    }
}

// DEALS
async function loadDeals() {
    try {
        const response = await fetch(`${API_URL}/api/deals?limit=50`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Deals data:', data);
            displayDeals(data.deals || []);
        } else {
            console.error('Deals API error:', response.status, response.statusText);
            displayError('deals-table', `Failed to load deals: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading deals:', error);
        displayError('deals-table', 'Failed to load deals');
    }
}

function displayDeals(deals) {
    const tbody = document.getElementById('deals-table');

    if (deals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No deals found</td></tr>';
        return;
    }

    tbody.innerHTML = deals.map(deal => `
        <tr>
            <td>${deal.title}</td>
            <td>${deal.category}</td>
            <td>€${deal.value_amount}</td>
            <td><span class="badge badge-${deal.verified ? 'success' : 'pending'}">${deal.verified ? 'Yes' : 'No'}</span></td>
            <td>${deal.upvote_count}</td>
            <td>${deal.expires_at ? formatDate(deal.expires_at) : 'No expiry'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editDeal('${deal.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDeal('${deal.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterDeals(query) {
    const rows = document.querySelectorAll('#deals-table tr');
    rows.forEach(row => {
        const title = row.querySelector('td')?.textContent.toLowerCase();
        if (title?.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// DEAL MODALS
function openDealModal() {
    document.getElementById('deal-modal').classList.add('active');
}

function closeDealModal() {
    const modal = document.getElementById('deal-modal');
    modal.classList.remove('active');
    document.getElementById('modal-deal-title').value = '';
    document.getElementById('modal-deal-description').value = '';
    document.getElementById('modal-deal-value').value = '';
    document.getElementById('modal-deal-category').value = '';
    modal.dataset.isEditing = 'false';
    modal.dataset.dealId = '';
    const modalTitle = document.querySelector('#deal-modal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Deal';
    }
}

async function saveDeal() {
    const modal = document.getElementById('deal-modal');
    const isEditing = modal.dataset.isEditing === 'true';
    const dealId = modal.dataset.dealId;

    const title = document.getElementById('modal-deal-title').value;
    const description = document.getElementById('modal-deal-description').value;
    const category = document.getElementById('modal-deal-category').value;
    const value = document.getElementById('modal-deal-value').value;

    if (!title || !value) {
        showAlert('Title and value are required', 'error');
        return;
    }

    try {
        let url = `${API_URL}/api/deals`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/deals/${dealId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                category,
                deal_type: 'featured',
                value_amount: parseFloat(value),
                value_currency: 'EUR'
            })
        });

        if (response.ok) {
            showAlert(isEditing ? 'Deal updated successfully' : 'Deal created successfully', 'success');
            closeDealModal();
            loadDeals();
        } else {
            showAlert('Failed to save deal', 'error');
        }
    } catch (error) {
        console.error('Error saving deal:', error);
        showAlert('Error saving deal', 'error');
    }
}

async function editDeal(dealId) {
    try {
        const response = await fetch(`${API_URL}/api/deals/${dealId}`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            showAlert('Failed to load deal data', 'error');
            return;
        }

        const data = await response.json();
        const deal = data.deal;

        document.getElementById('modal-deal-title').value = deal.title;
        document.getElementById('modal-deal-description').value = deal.description || '';
        document.getElementById('modal-deal-category').value = deal.category || '';
        document.getElementById('modal-deal-value').value = deal.value_amount || '';

        const modal = document.getElementById('deal-modal');
        modal.dataset.dealId = dealId;
        modal.dataset.isEditing = 'true';

        const modalTitle = document.querySelector('#deal-modal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Deal';
        }

        openDealModal();
    } catch (error) {
        console.error('Error loading deal for edit:', error);
        showAlert('Error loading deal data', 'error');
    }
}

async function deleteDeal(dealId) {
    if (!confirm('Are you sure you want to delete this deal?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/deals/${dealId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('Deal deleted successfully', 'success');
            loadDeals();
        } else {
            showAlert('Failed to delete deal', 'error');
        }
    } catch (error) {
        console.error('Error deleting deal:', error);
        showAlert('Error deleting deal', 'error');
    }
}

// PROMO CODES
function openPromoModal() {
    document.getElementById('promo-modal').classList.add('active');
    // Set default date to 90 days from now
    const date = new Date();
    date.setDate(date.getDate() + 90);
    document.getElementById('modal-promo-until').value = date.toISOString().split('T')[0];
}

function closePromoModal() {
    const modal = document.getElementById('promo-modal');
    modal.classList.remove('active');
    document.getElementById('modal-promo-code').value = '';
    document.getElementById('modal-promo-percent').value = '';
    document.getElementById('modal-promo-max').value = '';
    modal.dataset.isEditing = 'false';
    modal.dataset.promoId = '';
}

async function loadPromos() {
    try {
        const response = await fetch(`${API_URL}/api/promos`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Promos data:', data);
            displayPromos(data.data || []);
        } else {
            console.error('Promos API error:', response.status, response.statusText);
            displayError('promos-table', `Failed to load promo codes: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading promos:', error);
        displayError('promos-table', 'Failed to load promo codes');
    }
}

function displayPromos(promos) {
    const tbody = document.getElementById('promos-table');

    if (promos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No promo codes found</td></tr>';
        return;
    }

    tbody.innerHTML = promos.map(promo => `
        <tr>
            <td><strong>${promo.code}</strong></td>
            <td>${promo.discount_percent || promo.discount_amount}${promo.discount_percent ? '%' : '€'}</td>
            <td>${promo.current_uses || '0'}</td>
            <td>${promo.max_uses || '∞'}</td>
            <td>${promo.valid_until ? formatDate(promo.valid_until) : 'No expiry'}</td>
            <td><span class="badge badge-${promo.is_active ? 'success' : 'danger'}">${promo.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editPromo('${promo.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePromo('${promo.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function savePromo() {
    const modal = document.getElementById('promo-modal');
    const isEditing = modal.dataset.isEditing === 'true';
    const promoId = modal.dataset.promoId;

    const code = document.getElementById('modal-promo-code').value.toUpperCase();
    const percent = document.getElementById('modal-promo-percent').value;
    const maxUses = document.getElementById('modal-promo-max').value;
    const validUntil = document.getElementById('modal-promo-until').value;

    if (!code || !percent) {
        showAlert('Code and percentage are required', 'error');
        return;
    }

    try {
        let url = `${API_URL}/api/promos`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/promos/${promoId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                discount_percent: parseFloat(percent),
                discount_amount: null,
                max_uses: parseInt(maxUses) || null,
                valid_until: validUntil ? new Date(validUntil).toISOString() : null
            })
        });

        if (response.ok) {
            showAlert(isEditing ? 'Promo code updated successfully' : 'Promo code created successfully', 'success');
            closePromoModal();
            loadPromos();
        } else {
            showAlert('Failed to save promo code', 'error');
        }
    } catch (error) {
        console.error('Error saving promo:', error);
        showAlert('Error saving promo code', 'error');
    }
}

async function editPromo(promoId) {
    try {
        const response = await fetch(`${API_URL}/api/promos`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            showAlert('Failed to load promo data', 'error');
            return;
        }

        const data = await response.json();
        const promo = data.data.find(p => p.id === promoId);

        if (!promo) {
            showAlert('Promo not found', 'error');
            return;
        }

        document.getElementById('modal-promo-code').value = promo.code;
        document.getElementById('modal-promo-percent').value = promo.discount_percent;
        document.getElementById('modal-promo-max').value = promo.max_uses || '';
        if (promo.valid_until) {
            document.getElementById('modal-promo-until').value = promo.valid_until.split('T')[0];
        }

        const modal = document.getElementById('promo-modal');
        modal.dataset.promoId = promoId;
        modal.dataset.isEditing = 'true';

        openPromoModal();
    } catch (error) {
        console.error('Error loading promo for edit:', error);
        showAlert('Error loading promo data', 'error');
    }
}

async function deletePromo(promoId) {
    if (!confirm('Are you sure you want to delete this promo code?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/promos/${promoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('Promo code deleted successfully', 'success');
            loadPromos();
        } else {
            showAlert('Failed to delete promo code', 'error');
        }
    } catch (error) {
        console.error('Error deleting promo:', error);
        showAlert('Error deleting promo code', 'error');
    }
}

// HACKS - Load admin hack management interface
function loadHacks() {
    // Call the hack management list loader
    loadHacksList();
}

// RECENT ACTIVITIES
async function loadRecentActivities() {
    try {
        const response = await fetch(`${API_URL}/api/admin/activities?limit=10`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayActivities(data.activities || []);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function displayActivities(activities) {
    const tbody = document.getElementById('recent-activities');

    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No recent activities</td></tr>';
        return;
    }

    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.user_email}</td>
            <td>${activity.action}</td>
            <td>${formatTime(activity.created_at)}</td>
            <td><span class="badge badge-${activity.status === 'success' ? 'success' : 'danger'}">${activity.status}</span></td>
        </tr>
    `).join('');
}

// SETTINGS
async function loadSettings() {
    try {
        // Try to fetch from backend API
        console.log('🔍 Loading settings from:', `${API_URL}/api/admin/settings`);
        const response = await fetch(`${API_URL}/api/admin/settings`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        console.log('📡 Settings API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('📊 Settings API response data:', data);
            const settings = data.data || {};

            console.log('🔧 Found settings:', Object.keys(settings));

            // Populate form fields with settings values
            if (settings.anthropic_api_key?.value) {
                const el = document.getElementById('anthropic-api-key');
                if (el) el.value = settings.anthropic_api_key.value;
            }
            if (settings.sendgrid_api_key?.value) {
                console.log('✅ Setting SendGrid key');
                document.getElementById('sendgrid-key').value = settings.sendgrid_api_key.value;
            } else {
                console.warn('⚠️ No SendGrid API key value found');
            }

            if (settings.sender_email?.value) {
                console.log('✅ Setting sender email');
                document.getElementById('sender-email').value = settings.sender_email.value;
            }
            if (settings.stripe_secret_key?.value) {
                console.log('✅ Setting Stripe secret key');
                document.getElementById('stripe-key').value = settings.stripe_secret_key.value;
            }
            if (settings.stripe_publishable_key?.value) {
                console.log('✅ Setting Stripe publishable key');
                const pubKeyField = document.getElementById('stripe-pub-key');
                if (pubKeyField) {
                    pubKeyField.value = settings.stripe_publishable_key.value;
                }
            }
            if (settings.stripe_webhook_secret?.value) {
                console.log('✅ Setting webhook secret');
                document.getElementById('webhook-secret').value = settings.stripe_webhook_secret.value;
            }

            // Load checkboxes
            const sendSignupEmail = document.getElementById('send-signup');
            const sendSubEmail = document.getElementById('send-sub');
            const sendDigest = document.getElementById('send-digest');

            if (sendSignupEmail) {
                sendSignupEmail.checked = settings.send_email_on_signup?.value === 'true';
            }
            if (sendSubEmail) {
                sendSubEmail.checked = settings.send_email_on_subscription?.value === 'true';
            }
            if (sendDigest) {
                sendDigest.checked = settings.send_daily_digest?.value === 'true';
            }

            console.log('✅ Settings loaded successfully from backend database');
            loadSocialSettings();
            return;
        } else {
            console.warn('⚠️ Settings API returned status:', response.status, response.statusText);
            const errorData = await response.json().catch(() => ({}));
            console.warn('Error details:', errorData);
        }
    } catch (error) {
        console.warn('Backend API unavailable, trying localStorage fallback:', error.message);
    }

    // Fallback: Load from localStorage
    try {
        const stripePubKey = localStorage.getItem('stripePublishableKey');
        const stripeSecret = localStorage.getItem('admin_stripe_secret');
        const sendgridKey = localStorage.getItem('admin_sendgrid_key');
        const senderEmail = localStorage.getItem('admin_sender_email');
        const webhookSecret = localStorage.getItem('admin_webhook_secret');

        if (stripePubKey) {
            const pubKeyField = document.getElementById('stripe-pub-key');
            if (pubKeyField) pubKeyField.value = stripePubKey;
        }
        if (stripeSecret) {
            document.getElementById('stripe-key').value = stripeSecret;
        }
        if (sendgridKey) {
            document.getElementById('sendgrid-key').value = sendgridKey;
        }
        if (senderEmail) {
            document.getElementById('sender-email').value = senderEmail;
        }
        if (webhookSecret) {
            document.getElementById('webhook-secret').value = webhookSecret;
        }

        // Load checkboxes from localStorage
        const sendSignupEmail = document.getElementById('send-signup');
        const sendSubEmail = document.getElementById('send-sub');
        const sendDigest = document.getElementById('send-digest');

        if (sendSignupEmail) {
            sendSignupEmail.checked = localStorage.getItem('admin_send_signup_email') === 'true';
        }
        if (sendSubEmail) {
            sendSubEmail.checked = localStorage.getItem('admin_send_sub_email') === 'true';
        }
        if (sendDigest) {
            sendDigest.checked = localStorage.getItem('admin_send_digest') === 'true';
        }

        console.log('✅ Settings loaded from localStorage');
    } catch (localStorageError) {
        console.error('Error loading settings from localStorage:', localStorageError);
    }
}

async function saveSettings() {
    const sendgridKey = document.getElementById('sendgrid-key').value;
    const senderEmail = document.getElementById('sender-email').value;
    const stripeKey = document.getElementById('stripe-key').value;
    const stripePubKey = document.getElementById('stripe-pub-key')?.value || '';
    const webhookSecret = document.getElementById('webhook-secret').value;

    // Checkbox values
    const sendSignupEmail = document.getElementById('send-signup').checked;
    const sendSubEmail = document.getElementById('send-sub').checked;
    const sendDigest = document.getElementById('send-digest').checked;

    // Validate required fields
    if (!stripeKey || !sendgridKey) {
        showAlert('Stripe Secret Key and SendGrid API Key are required', 'error');
        return;
    }

    try {
        // Save all settings to localStorage (works reliably, survives page refresh)
        localStorage.setItem('admin_sendgrid_key', sendgridKey);
        localStorage.setItem('admin_sender_email', senderEmail);
        localStorage.setItem('admin_stripe_secret', stripeKey);
        localStorage.setItem('stripePublishableKey', stripePubKey); // Used by checkout page
        localStorage.setItem('admin_webhook_secret', webhookSecret);
        localStorage.setItem('admin_send_signup_email', sendSignupEmail.toString());
        localStorage.setItem('admin_send_sub_email', sendSubEmail.toString());
        localStorage.setItem('admin_send_digest', sendDigest.toString());

        console.log('✅ Settings saved to localStorage');
        await saveSocialSettings();
        showAlert('Settings saved successfully!', 'success');

        // Optional: Try to sync to backend (non-blocking)
        try {
            await fetch(`${API_URL}/api/admin/settings/batch/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'anthropic_api_key': document.getElementById('anthropic-api-key')?.value?.trim() || '',
                    'sendgrid_api_key': sendgridKey,
                    'sender_email': senderEmail,
                    'stripe_secret_key': stripeKey,
                    'stripe_publishable_key': stripePubKey,
                    'stripe_webhook_secret': webhookSecret,
                    'send_email_on_signup': sendSignupEmail.toString(),
                    'send_email_on_subscription': sendSubEmail.toString(),
                    'send_daily_digest': sendDigest.toString()
                })
            });
            console.log('✅ Settings also synced to backend database');
        } catch (backendError) {
            console.warn('⚠️ Backend sync failed (non-blocking):', backendError.message);
            // This is OK - localStorage is our primary storage now
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Error saving settings to localStorage', 'error');
    }
}

// AUTHENTICATION
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('apiUrl');
    redirectToLogin();
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

// UTILITIES
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';

    return date.toLocaleDateString();
}

function displayError(elementId, message) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${message}</td></tr>`;
}

// EMAIL TEMPLATES MANAGEMENT
async function loadEmailTemplates() {
    try {
        // Load sequences
        const sequencesResponse = await fetch(`${API_URL}/api/email-templates/sequences`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (sequencesResponse.ok) {
            const sequencesData = await sequencesResponse.json();
            renderSequences(sequencesData.data || []);
        } else {
            console.error('Failed to load sequences');
        }

        // Load templates
        const templatesResponse = await fetch(`${API_URL}/api/email-templates/templates`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (templatesResponse.ok) {
            const templatesData = await templatesResponse.json();
            // For now, just show loading - we'll render after getting sequence info
        }
    } catch (error) {
        console.error('Error loading email templates:', error);
    }
}

function renderSequences(sequences) {
    const tbody = document.getElementById('sequences-table');

    if (!sequences || sequences.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No sequences yet</td></tr>';
        return;
    }

    tbody.innerHTML = sequences.map(seq => `
        <tr>
            <td><strong>${seq.name}</strong></td>
            <td>${seq.description || '-'}</td>
            <td>${seq.template_count || 0} templates</td>
            <td><span class="badge ${seq.is_active ? 'badge-success' : 'badge-danger'}">${seq.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewSequence('${seq.id}')">View</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSequence('${seq.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function viewSequence(sequenceId) {
    try {
        const response = await fetch(`${API_URL}/api/email-templates/sequences/${sequenceId}`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderTemplatesForSequence(data.templates);
        }
    } catch (error) {
        console.error('Error loading sequence details:', error);
    }
}

function renderTemplatesForSequence(templates) {
    const tbody = document.getElementById('templates-table');

    if (!templates || templates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No templates in this sequence</td></tr>';
        return;
    }

    tbody.innerHTML = templates.map(template => `
        <tr>
            <td>Day ${template.day}</td>
            <td>${template.subject}</td>
            <td>${template.sequence_id}</td>
            <td><span class="badge ${template.is_active ? 'badge-success' : 'badge-danger'}">${template.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTemplate('${template.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${template.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openEmailSequenceModal() {
    document.getElementById('email-sequence-modal').classList.add('active');
}

function closeEmailSequenceModal() {
    document.getElementById('email-sequence-modal').classList.remove('active');
    document.getElementById('modal-sequence-name').value = '';
    document.getElementById('modal-sequence-description').value = '';
}

function openTemplateModal() {
    document.getElementById('template-modal').classList.add('active');
}

function closeTemplateModal() {
    document.getElementById('template-modal').classList.remove('active');
    document.getElementById('modal-template-id').value = '';
    document.getElementById('modal-template-day').value = '';
    document.getElementById('modal-template-subject').value = '';
    document.getElementById('modal-template-content').value = '';
    document.getElementById('template-modal-title').textContent = 'Create Email Template';
    document.getElementById('template-save-btn').textContent = 'Create Template';
}

async function saveEmailSequence() {
    const name = document.getElementById('modal-sequence-name').value;
    const description = document.getElementById('modal-sequence-description').value;

    if (!name) {
        showAlert('Sequence name is required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/email-templates/sequences`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            showAlert('Sequence created successfully', 'success');
            closeEmailSequenceModal();
            loadEmailTemplates();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to create sequence', 'error');
            console.error('API error:', error);
        }
    } catch (error) {
        console.error('Error creating sequence:', error);
        showAlert('Error creating sequence: ' + error.message, 'error');
    }
}

async function saveEmailTemplate() {
    const templateId = document.getElementById('modal-template-id').value;
    const sequenceId = document.getElementById('modal-template-sequence').value;
    const day = document.getElementById('modal-template-day').value;
    const subject = document.getElementById('modal-template-subject').value;
    const content = document.getElementById('modal-template-content').value;

    if (!sequenceId || !subject) {
        showAlert('Sequence and subject are required', 'error');
        return;
    }

    const isEdit = !!templateId;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/api/email-templates/templates/${templateId}` : `${API_URL}/api/email-templates/templates`;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sequence_id: sequenceId,
                day: parseInt(day) || 0,
                subject,
                html_content: content,
                content: content
            })
        });

        if (response.ok) {
            const action = isEdit ? 'updated' : 'created';
            showAlert(`Template ${action} successfully`, 'success');
            closeTemplateModal();
            loadEmailTemplates();
        } else {
            const error = await response.json();
            showAlert(error.message || `Failed to ${isEdit ? 'update' : 'create'} template`, 'error');
            console.error('API error:', error);
        }
    } catch (error) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} template:`, error);
        showAlert(`Error ${isEdit ? 'updating' : 'creating'} template: ` + error.message, 'error');
    }
}

async function createSequence(name) {
    try {
        const response = await fetch(`${API_URL}/api/email-templates/sequences`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description: '' })
        });

        if (response.ok) {
            showAlert('Sequence created successfully', 'success');
            loadEmailTemplates();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to create sequence', 'error');
        }
    } catch (error) {
        console.error('Error creating sequence:', error);
        showAlert('Error creating sequence', 'error');
    }
}

async function deleteSequence(sequenceId) {
    if (confirm('Are you sure you want to delete this sequence?')) {
        try {
            const response = await fetch(`${API_URL}/api/email-templates/sequences/${sequenceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });

            if (response.ok) {
                showAlert('Sequence deleted', 'success');
                loadEmailTemplates();
            }
        } catch (error) {
            console.error('Error deleting sequence:', error);
            showAlert('Error deleting sequence', 'error');
        }
    }
}

async function deleteTemplate(templateId) {
    if (confirm('Are you sure you want to delete this template?')) {
        try {
            const response = await fetch(`${API_URL}/api/email-templates/templates/${templateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });

            if (response.ok) {
                showAlert('Template deleted', 'success');
                loadEmailTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            showAlert('Error deleting template', 'error');
        }
    }
}

async function editTemplate(templateId) {
    try {
        // Fetch the template data
        const response = await fetch(`${API_URL}/api/email-templates/templates/${templateId}`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) {
            showAlert('Failed to load template', 'error');
            return;
        }

        const data = await response.json();
        const template = data.data;

        // Populate form fields
        document.getElementById('modal-template-day').value = template.day || 0;
        document.getElementById('modal-template-subject').value = template.subject || '';
        document.getElementById('modal-template-content').value = template.html_content || template.content || '';
        document.getElementById('modal-template-sequence').value = template.sequence_id || '';

        // Change modal title and button to Edit
        document.getElementById('template-modal-title').textContent = 'Edit Email Template';
        document.getElementById('template-save-btn').textContent = 'Update Template';

        // Store the template ID for saving
        document.getElementById('modal-template-id').value = templateId;

        // Open the modal
        document.getElementById('template-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading template:', error);
        showAlert('Error loading template: ' + error.message, 'error');
    }
}

// ============================================
// HACK MANAGEMENT FUNCTIONS
// ============================================

let currentEditingHackId = null;

// Load and display all hacks
async function loadHacksList() {
    try {
        const response = await fetch(`${API_URL}/api/hacks/admin/hacks`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load hacks');

        const data = await response.json();
        const tbody = document.getElementById('hacks-tbody');
        tbody.innerHTML = '';

        const moduleNames = {
            1: 'Flight Hacks', 2: 'Credit Cards', 3: 'Hotel Hacks', 4: 'Timing Intelligence',
            5: 'Airport & Transit', 6: 'Destinations', 7: 'Car Rentals', 8: 'Community',
            9: 'Travel Money', 10: 'Travel Insurance', 11: 'Visa & Immigration',
            12: 'Accommodations', 13: 'Ground Transport', 14: 'Travel Bookings',
            15: 'Food & Dining', 16: 'Shopping & VAT'
        };

        if (data.hacks && data.hacks.length > 0) {
            data.hacks.forEach(hack => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${moduleNames[hack.module_id] || `Module ${hack.module_id}`}</td>
                    <td>${hack.title}</td>
                    <td>${hack.category}</td>
                    <td><span class="badge badge-${hack.difficulty}">${hack.difficulty}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editHack('${hack.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHack('${hack.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hacks found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading hacks:', error);
        showAlert('Failed to load hacks', 'error');
    }
}

// Open add hack modal
function openAddHackModal() {
    currentEditingHackId = null;
    document.getElementById('hack-modal-title').textContent = 'Add New Hack';
    document.getElementById('modal-hack-module-id').value = '';
    document.getElementById('modal-hack-title-new').value = '';
    document.getElementById('modal-hack-description').value = '';
    document.getElementById('modal-hack-category').value = '';
    document.getElementById('modal-hack-difficulty').value = 'medium';

    // Populate module dropdown
    const select = document.getElementById('modal-hack-module-id');
    select.innerHTML = '<option value="">Select a module (1-16)</option>';
    for (let i = 1; i <= 16; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = `Module ${i}`;
        select.appendChild(option);
    }

    document.getElementById('hack-management-modal').classList.add('active');
}

// Edit hack
async function editHack(hackId) {
    try {
        // Get all hacks and find this one
        const response = await fetch(`${API_URL}/api/hacks/admin/hacks`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        const data = await response.json();
        const hack = data.hacks.find(h => h.id === hackId);

        if (!hack) {
            showAlert('Hack not found', 'error');
            return;
        }

        currentEditingHackId = hackId;
        document.getElementById('hack-modal-title').textContent = 'Edit Hack';
        document.getElementById('modal-hack-module-id').value = hack.module_id;
        document.getElementById('modal-hack-title-new').value = hack.title;
        document.getElementById('modal-hack-description').value = hack.description;
        document.getElementById('modal-hack-category').value = hack.category;
        document.getElementById('modal-hack-difficulty').value = hack.difficulty;

        // Populate module dropdown
        const select = document.getElementById('modal-hack-module-id');
        select.innerHTML = '<option value="">Select a module (1-16)</option>';
        for (let i = 1; i <= 16; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Module ${i}`;
            select.appendChild(option);
        }

        document.getElementById('hack-management-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading hack for edit:', error);
        showAlert('Failed to load hack', 'error');
    }
}

// Save hack (create or update)
async function saveHackManagement() {
    const moduleId = document.getElementById('modal-hack-module-id').value;
    const title = document.getElementById('modal-hack-title-new').value;
    const description = document.getElementById('modal-hack-description').value;
    const category = document.getElementById('modal-hack-category').value;
    const difficulty = document.getElementById('modal-hack-difficulty').value;

    if (!moduleId || !title || !description || !category) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    try {
        const url = currentEditingHackId
            ? `${API_URL}/api/hacks/admin/hacks/${currentEditingHackId}`
            : `${API_URL}/api/hacks/admin/hacks`;

        const method = currentEditingHackId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                module_id: parseInt(moduleId),
                title,
                description,
                category,
                difficulty
            })
        });

        if (response.ok) {
            showAlert(currentEditingHackId ? 'Hack updated' : 'Hack created', 'success');
            closeHackManagementModal();
            loadHacksList();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to save hack', 'error');
        }
    } catch (error) {
        console.error('Error saving hack:', error);
        showAlert('Error saving hack', 'error');
    }
}

// Delete hack
async function deleteHack(hackId) {
    if (!confirm('Are you sure you want to delete this hack?')) return;

    try {
        const response = await fetch(`${API_URL}/api/hacks/admin/hacks/${hackId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (response.ok) {
            showAlert('Hack deleted', 'success');
            loadHacksList();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to delete hack', 'error');
        }
    } catch (error) {
        console.error('Error deleting hack:', error);
        showAlert('Error deleting hack', 'error');
    }
}

// Close hack management modal
function closeHackManagementModal() {
    document.getElementById('hack-management-modal').classList.remove('active');
    currentEditingHackId = null;
}

// ─── SETTINGS: Platform Tab Switcher ────────────────────────────────────────
function switchPlatformTab(platform) {
    document.querySelectorAll('.platform-settings').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.platform-tab').forEach(btn => {
        btn.style.background = '#e5e7eb';
        btn.style.color = '#374151';
    });
    const el = document.getElementById(`settings-${platform}`);
    if (el) el.style.display = 'block';
    const btn = document.querySelector(`.platform-tab[data-platform="${platform}"]`);
    if (btn) { btn.style.background = '#667eea'; btn.style.color = 'white'; }
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
async function loadAnalytics() {
    try {
        const res = await fetch(`${API_URL}/api/admin/analytics/summary`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');

        const u = data.users;
        document.getElementById('an-total-users').textContent = u.total.toLocaleString();
        document.getElementById('an-signups-month').textContent = u.signupsThisMonth;
        document.getElementById('an-signups-last').textContent = `Last month: ${u.signupsLastMonth}`;
        document.getElementById('an-signup-change').textContent = u.signupChange !== null ? `${u.signupChange > 0 ? '+' : ''}${u.signupChange}% vs last month` : 'First month';
        document.getElementById('an-paid').textContent = u.paid;
        document.getElementById('an-elite').textContent = `Elite: ${u.elite}`;
        document.getElementById('an-total-posts').textContent = data.social.totalPosts.toLocaleString();
        document.getElementById('an-cta-posts').textContent = `with CTA: ${data.social.totalCTA}`;

        const icons = { reddit:'🤖', linkedin:'💼', pinterest:'📌', instagram:'📸', wordpress:'📝', blogger:'📰', quora:'❓' };
        const tbody = document.getElementById('analytics-platforms');
        tbody.innerHTML = Object.entries(data.social.platforms).map(([key, p]) => `
            <tr>
                <td>${icons[key] || ''} ${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                <td>${p.total}</td>
                <td>${p.thisMonth}</td>
                <td>${p.withCTA}</td>
            </tr>`).join('');
    } catch (err) {
        console.error('Analytics error:', err);
    }
}

// ─── TWITTER ─────────────────────────────────────────────────────────────────

// Best posting times for travel content based on engagement research
const TWITTER_BEST_TIMES = {
    1: ['09:00'],
    2: ['09:00', '18:00'],
    3: ['09:00', '13:00', '18:00'],
    4: ['08:00', '12:00', '15:00', '19:00'],
    5: ['08:00', '11:00', '13:00', '17:00', '20:00']
};

function updateTwitterTimes() {
    const count = parseInt(document.getElementById('twitter-posts-per-day')?.value || 3);
    const times = TWITTER_BEST_TIMES[count];
    const el = document.getElementById('twitter-times-display');
    if (el) el.textContent = times.join(' · ');
}

function getTwitterTimes() {
    const count = parseInt(document.getElementById('twitter-posts-per-day')?.value || 3);
    return TWITTER_BEST_TIMES[count];
}

async function loadTwitterStatus() {
    const card = document.getElementById('twitter-status-card');
    try {
        const res = await fetch(`${API_URL}/api/twitter/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const jobs = data.jobs || [];
        const isRunning = (data.scheduledJobs || 0) > 0;
        card.innerHTML = `
            <p><strong>Status:</strong> ${data.configured ? '✅ Configured' : '❌ Not configured — add credentials in Settings'}</p>
            ${data.configured ? `<p><strong>Scheduler:</strong> ${isRunning ? `▶ Running (${data.scheduledJobs} job${data.scheduledJobs > 1 ? 's' : ''})` : '⏹ Stopped'}</p>` : ''}`;
        renderTwitterUpcoming(jobs, isRunning);
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}

function renderTwitterUpcoming(jobs, isRunning) {
    const el = document.getElementById('twitter-upcoming');
    if (!el) return;
    if (!isRunning || !jobs.length) {
        el.innerHTML = '<p style="color:#6b7280">Scheduler is stopped. Start it to see upcoming posts.</p>';
        return;
    }
    const now = new Date();
    const upcoming = [];
    // Deduplicate times from jobs
    const uniqueTimes = [...new Set(jobs.filter(j => j.time && j.time !== 'N/A').map(j => j.time))];
    for (let d = 0; d < 3; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() + d);
        uniqueTimes.forEach(time => {
            const [h, m] = time.split(':');
            const postTime = new Date(date);
            postTime.setHours(parseInt(h), parseInt(m), 0, 0);
            if (postTime > now) upcoming.push(postTime);
        });
    }
    upcoming.sort((a, b) => a - b);
    const next5 = upcoming.slice(0, 5);
    if (!next5.length) {
        el.innerHTML = '<p style="color:#6b7280">No upcoming times available.</p>';
        return;
    }
    el.innerHTML = next5.map(t => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:1.2em">🐦</span>
            <div>
                <strong>${t.toLocaleDateString('de-DE', {weekday:'short', day:'numeric', month:'short'})}</strong>
                <span style="color:#667eea;margin-left:8px;font-weight:600">${t.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</span>
                <span style="color:#6b7280;margin-left:8px;font-size:0.85em">Travel tip (auto-generated)</span>
            </div>
        </div>`).join('');
}

async function publishTwitterPost() {
    showAlert('Posting travel tip...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/twitter/post-random`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Posted to Twitter!', 'success'); loadTwitterRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}

async function startTwitterScheduler() {
    const times = getTwitterTimes();
    try {
        // Always stop first to avoid duplicate jobs
        await fetch(`${API_URL}/api/twitter/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const res = await fetch(`${API_URL}/api/twitter/scheduler/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: 'multiple', times })
        });
        const data = await res.json();
        if (data.success) {
            showAlert(`▶ Scheduler started — ${times.length} post${times.length > 1 ? 's' : ''}/day at ${times.join(', ')}`, 'success');
            loadTwitterStatus();
        } else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}

async function stopTwitterScheduler() {
    const res = await fetch(`${API_URL}/api/twitter/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ Twitter scheduler stopped' : `❌ ${data.error || data.message}`, data.success ? 'success' : 'error');
    loadTwitterStatus();
}

async function loadTwitterRecentPosts() {
    const el = document.getElementById('twitter-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/twitter/tips/random`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        // Twitter has no DB log — show last scheduled jobs info instead
        el.innerHTML = '<p style="color:#6b7280">Twitter posts are not stored locally. Check your <a href="https://twitter.com" target="_blank">Twitter profile</a> to see recent posts.</p>';
    } catch { el.innerHTML = '<p style="color:#ef4444">Error</p>'; }
}

// ─── REDDIT ──────────────────────────────────────────────────────────────────
async function loadRedditStatus() {
    const card = document.getElementById('reddit-status-card');
    try {
        const res = await fetch(`${API_URL}/api/reddit/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Configured' : '❌ Not configured — add credentials in Settings'}</p>
            ${s.configured ? `<p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Posts:</strong> ${s.totalPosts || 0}</p>` : ''}`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function publishRedditPost() {
    showAlert('Generating Reddit post...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/reddit/post`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert(`✅ Posted to r/${data.subreddit}`, 'success'); loadRedditRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startRedditScheduler() {
    const res = await fetch(`${API_URL}/api/reddit/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ Reddit scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadRedditStatus();
}
async function stopRedditScheduler() {
    const res = await fetch(`${API_URL}/api/reddit/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ Reddit scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadRedditStatus();
}
async function loadRedditRecentPosts() {
    const el = document.getElementById('reddit-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/reddit/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No posts yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>r/${p.subreddit}</strong> — ${p.title?.substring(0,80)}...<br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.reddit_url ? `| <a href="${p.reddit_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading posts</p>'; }
}

// ─── LINKEDIN ─────────────────────────────────────────────────────────────────
async function loadLinkedInStatus() {
    const card = document.getElementById('linkedin-status-card');
    try {
        const res = await fetch(`${API_URL}/api/linkedin/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Configured' : '❌ Not configured — add credentials in Settings'}</p>
            ${s.configured ? `<p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Posts:</strong> ${s.totalPosts || 0}</p>` : ''}`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function publishLinkedInPost() {
    showAlert('Generating LinkedIn post...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/linkedin/post-article`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Posted to LinkedIn!', 'success'); loadLinkedInRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startLinkedInScheduler() {
    const res = await fetch(`${API_URL}/api/linkedin/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ LinkedIn scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadLinkedInStatus();
}
async function stopLinkedInScheduler() {
    const res = await fetch(`${API_URL}/api/linkedin/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ LinkedIn scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadLinkedInStatus();
}
async function loadLinkedInRecentPosts() {
    const el = document.getElementById('linkedin-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/linkedin/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No posts yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>LinkedIn</strong> — ${p.content?.substring(0,100)}...<br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.post_url ? `| <a href="${p.post_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading posts</p>'; }
}

// ─── PINTEREST ───────────────────────────────────────────────────────────────
async function loadPinterestStatus() {
    const card = document.getElementById('pinterest-status-card');
    try {
        const res = await fetch(`${API_URL}/api/pinterest/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Configured' : '❌ Not configured — add credentials in Settings'}</p>
            ${s.configured ? `<p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Pins:</strong> ${s.totalPosts || 0}</p>` : ''}
            <button onclick="reloadPinterestSettings()" style="margin-top:8px;padding:6px 12px;background:#e5e7eb;border:none;border-radius:4px;cursor:pointer;">🔄 Reload Settings</button>`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function reloadPinterestSettings() {
    try {
        const res = await fetch(`${API_URL}/api/pinterest/reload-settings`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.configured) { showAlert('✅ Pinterest configured!', 'success'); }
        else {
            const d = data.debug || {};
            const missing = [];
            if (!d.hasAccessToken) missing.push('Access Token');
            if (!d.hasBoardId) missing.push('Board ID');
            if (!d.hasIdeogramKey) missing.push('Ideogram API Key');
            showAlert(`❌ Missing: ${missing.join(', ') || 'credentials'}`, 'error');
        }
        loadPinterestStatus();
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function publishPinterestPin() {
    showAlert('Generating Pinterest pin...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/pinterest/post-pin`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Pin posted to Pinterest!', 'success'); loadPinterestRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startPinterestScheduler() {
    const res = await fetch(`${API_URL}/api/pinterest/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ Pinterest scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadPinterestStatus();
}
async function stopPinterestScheduler() {
    const res = await fetch(`${API_URL}/api/pinterest/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ Pinterest scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadPinterestStatus();
}
async function loadPinterestRecentPosts() {
    const el = document.getElementById('pinterest-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/pinterest/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No pins yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>📌 ${p.title?.substring(0,80)}</strong><br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.pin_url ? `| <a href="${p.pin_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading pins</p>'; }
}

// ─── INSTAGRAM ────────────────────────────────────────────────────────────────
async function loadInstagramStatus() {
    const card = document.getElementById('instagram-status-card');
    try {
        const res = await fetch(`${API_URL}/api/instagram/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Configured' : '❌ Not configured — add credentials in Settings'}</p>
            ${s.configured ? `<p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Posts:</strong> ${s.totalPosts || 0}</p>` : ''}`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function publishInstagramPost() {
    showAlert('Generating Instagram post...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/instagram/post`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Posted to Instagram!', 'success'); loadInstagramRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startInstagramScheduler() {
    const res = await fetch(`${API_URL}/api/instagram/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ Instagram scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadInstagramStatus();
}
async function stopInstagramScheduler() {
    const res = await fetch(`${API_URL}/api/instagram/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ Instagram scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadInstagramStatus();
}
async function loadInstagramRecentPosts() {
    const el = document.getElementById('instagram-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/instagram/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No posts yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>📸 Instagram</strong> — ${p.caption?.substring(0,100)}...<br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.post_url ? `| <a href="${p.post_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading posts</p>'; }
}

// ─── WORDPRESS ────────────────────────────────────────────────────────────────
async function loadWordPressStatus() {
    const card = document.getElementById('wordpress-status-card');
    try {
        const res = await fetch(`${API_URL}/api/wordpress/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Connected' : '❌ Not connected — authorize below'}</p>
            ${s.configured ? `<p><strong>Site ID:</strong> ${s.siteId || 'Set'}</p><p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Posts:</strong> ${s.totalPosts || 0}</p>` : ''}`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function getWordPressAuthUrl() {
    try {
        const res = await fetch(`${API_URL}/api/wordpress/auth-url`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.authUrl) {
            document.getElementById('wordpress-auth-url').innerHTML = `<p>Open this URL in your browser, authorize, then copy the code:<br><a href="${data.authUrl}" target="_blank" style="word-break:break-all">${data.authUrl}</a></p>`;
        } else showAlert(`❌ ${data.error || 'Could not get URL'}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function exchangeWordPressToken() {
    const code = document.getElementById('wordpress-auth-code').value.trim();
    if (!code) { showAlert('Please enter the authorization code', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/api/wordpress/exchange-token`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (data.success) { showAlert('✅ WordPress.com connected!', 'success'); loadWordPressStatus(); }
        else showAlert(`❌ ${data.error}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function loadWordPressSites() {
    try {
        const res = await fetch(`${API_URL}/api/wordpress/sites`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.sites?.length) { document.getElementById('wordpress-sites').innerHTML = '<p style="color:#6b7280">No sites found. Make sure you are connected.</p>'; return; }
        document.getElementById('wordpress-sites').innerHTML = data.sites.map(s =>
            `<button onclick="selectWordPressSite('${s.ID}','${s.name}')" style="margin:4px;padding:8px 14px;background:#e5e7eb;border:none;border-radius:6px;cursor:pointer;">${s.name}</button>`
        ).join('');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function selectWordPressSite(siteId, siteName) {
    try {
        const res = await fetch(`${API_URL}/api/wordpress/select-site`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId, siteName })
        });
        const data = await res.json();
        if (data.success) { showAlert(`✅ Site selected: ${siteName}`, 'success'); loadWordPressStatus(); }
        else showAlert(`❌ ${data.error}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function publishWordPressPost() {
    showAlert('Generating WordPress article...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/wordpress/publish`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Article published on WordPress!', 'success'); loadWordPressRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startWordPressScheduler() {
    const res = await fetch(`${API_URL}/api/wordpress/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ WordPress scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadWordPressStatus();
}
async function stopWordPressScheduler() {
    const res = await fetch(`${API_URL}/api/wordpress/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ WordPress scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadWordPressStatus();
}
async function loadWordPressRecentPosts() {
    const el = document.getElementById('wordpress-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/wordpress/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No posts yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>📝 ${p.title?.substring(0,80)}</strong><br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.post_url ? `| <a href="${p.post_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading posts</p>'; }
}

// ─── QUORA ────────────────────────────────────────────────────────────────────
async function loadQuoraStatus() {
    const card = document.getElementById('quora-status-card');
    try {
        const res = await fetch(`${API_URL}/api/quora/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Claude API ready' : '❌ No Claude API key — add in Settings'}</p>
            <p><strong>Generated Answers:</strong> ${s.totalAnswers || 0}</p>`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function generateQuoraAnswer() {
    showAlert('Generating Quora answer...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/quora/generate`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Answer generated!', 'success'); loadQuoraRecentAnswers(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function generateQuoraBatch() {
    showAlert('Generating 5 Quora answers...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/quora/generate-batch`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert(`✅ ${data.count || 5} answers generated!`, 'success'); loadQuoraRecentAnswers(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function loadQuoraRecentAnswers() {
    const el = document.getElementById('quora-answers-list');
    try {
        const res = await fetch(`${API_URL}/api/quora/recent-answers`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.answers?.length) { el.innerHTML = '<p style="color:#6b7280">No answers yet. Click Generate above.</p>'; return; }
        el.innerHTML = data.answers.map(a => `
            <div style="padding:15px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:10px;">
                <strong style="color:#667eea">Q: ${a.question}</strong>
                <p style="margin:8px 0;font-size:0.9em;color:#374151;max-height:120px;overflow:hidden">${a.answer?.substring(0,300)}...</p>
                <button onclick="copyQuoraAnswer('${a.id}')" style="padding:6px 12px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer;">📋 Copy Full Answer</button>
                <small style="color:#9ca3af;margin-left:10px">${new Date(a.created_at || a.posted_at).toLocaleString()}</small>
            </div>`).join('');
        // Store answers for copying
        window._quoraAnswers = data.answers;
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading answers</p>'; }
}
function copyQuoraAnswer(id) {
    const a = (window._quoraAnswers || []).find(x => String(x.id) === String(id));
    if (!a) { showAlert('Answer not found', 'error'); return; }
    const text = `Q: ${a.question}\n\n${a.answer}`;
    navigator.clipboard.writeText(text).then(() => showAlert('✅ Copied to clipboard!', 'success')).catch(() => showAlert('❌ Copy failed', 'error'));
}

// ─── BLOGGER ──────────────────────────────────────────────────────────────────
async function loadBloggerStatus() {
    const card = document.getElementById('blogger-status-card');
    try {
        const res = await fetch(`${API_URL}/api/blogger/status`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        const s = data.status || {};
        card.innerHTML = `<p><strong>Status:</strong> ${s.configured ? '✅ Connected' : '❌ Not connected — authorize below'}</p>
            ${s.configured ? `<p><strong>Scheduler:</strong> ${s.schedulerRunning ? '▶ Running' : '⏹ Stopped'}</p><p><strong>Total Posts:</strong> ${s.totalPosts || 0}</p>` : ''}`;
    } catch { card.innerHTML = '<p>❌ Could not reach backend</p>'; }
}
async function getBloggerAuthUrl() {
    try {
        const res = await fetch(`${API_URL}/api/blogger/auth-url`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.authUrl) {
            document.getElementById('blogger-auth-url').innerHTML = `<p>Open this URL, authorize Google, then copy the code shown:<br><a href="${data.authUrl}" target="_blank" style="word-break:break-all">${data.authUrl}</a></p>`;
        } else showAlert(`❌ ${data.error || 'Could not get URL'}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function exchangeBloggerToken() {
    const code = document.getElementById('blogger-auth-code').value.trim();
    if (!code) { showAlert('Please enter the authorization code', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/api/blogger/exchange-token`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (data.success) { showAlert('✅ Google Blogger connected!', 'success'); loadBloggerStatus(); }
        else showAlert(`❌ ${data.error}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function loadBloggerBlogs() {
    try {
        const res = await fetch(`${API_URL}/api/blogger/blogs`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.blogs?.length) { document.getElementById('blogger-blogs').innerHTML = '<p style="color:#6b7280">No blogs found. Make sure you are connected.</p>'; return; }
        document.getElementById('blogger-blogs').innerHTML = data.blogs.map(b =>
            `<button onclick="selectBloggerBlog('${b.id}','${b.name}')" style="margin:4px;padding:8px 14px;background:#e5e7eb;border:none;border-radius:6px;cursor:pointer;">${b.name}</button>`
        ).join('');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function selectBloggerBlog(blogId, blogName) {
    try {
        const res = await fetch(`${API_URL}/api/blogger/select-blog`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ blogId, blogName })
        });
        const data = await res.json();
        if (data.success) { showAlert(`✅ Blog selected: ${blogName}`, 'success'); loadBloggerStatus(); }
        else showAlert(`❌ ${data.error}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function publishBloggerPost() {
    showAlert('Generating Blogger article...', 'success');
    try {
        const res = await fetch(`${API_URL}/api/blogger/publish`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (data.success) { showAlert('✅ Article published on Blogger!', 'success'); loadBloggerRecentPosts(); }
        else showAlert(`❌ ${data.error || data.message}`, 'error');
    } catch (err) { showAlert('❌ Error: ' + err.message, 'error'); }
}
async function startBloggerScheduler() {
    const res = await fetch(`${API_URL}/api/blogger/scheduler/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '▶ Blogger scheduler started' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadBloggerStatus();
}
async function stopBloggerScheduler() {
    const res = await fetch(`${API_URL}/api/blogger/scheduler/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    const data = await res.json();
    showAlert(data.success ? '⏹ Blogger scheduler stopped' : `❌ ${data.error}`, data.success ? 'success' : 'error');
    loadBloggerStatus();
}
async function loadBloggerRecentPosts() {
    const el = document.getElementById('blogger-recent-posts');
    try {
        const res = await fetch(`${API_URL}/api/blogger/recent-posts`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        const data = await res.json();
        if (!data.posts?.length) { el.innerHTML = '<p style="color:#6b7280">No posts yet.</p>'; return; }
        el.innerHTML = data.posts.map(p => `<div style="padding:10px;border-bottom:1px solid #e5e7eb">
            <strong>📰 ${p.title?.substring(0,80)}</strong><br>
            <small style="color:#6b7280">${new Date(p.posted_at).toLocaleString()} ${p.post_url ? `| <a href="${p.post_url}" target="_blank">View</a>` : ''}</small>
        </div>`).join('');
    } catch { el.innerHTML = '<p style="color:#ef4444">Error loading posts</p>'; }
}

// ─── SETTINGS: Load & Save Social Media Credentials ──────────────────────────
async function loadSocialSettings() {
    try {
        const res = await fetch(`${API_URL}/api/admin/settings`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        const s = data.data || {};
        const set = (id, key) => { const el = document.getElementById(id); if (el && s[key]?.value) el.value = s[key].value; };
        const chk = (id, key) => { const el = document.getElementById(id); if (el) el.checked = s[key]?.value === 'true'; };
        set('twitter-api-key', 'twitter_api_key');
        set('twitter-api-secret', 'twitter_api_secret');
        set('twitter-bearer-token', 'twitter_bearer_token');
        set('twitter-access-token', 'twitter_access_token');
        set('twitter-access-secret', 'twitter_access_secret');
        set('twitter-frequency', 'twitter_frequency_hours');
        chk('twitter-auto', 'twitter_auto_posting');
        set('reddit-client-id', 'reddit_client_id');
        set('reddit-client-secret', 'reddit_client_secret');
        set('reddit-username', 'reddit_username');
        set('reddit-password', 'reddit_password');
        set('reddit-frequency', 'reddit_frequency_hours');
        chk('reddit-auto', 'reddit_auto_posting');
        set('pinterest-access-token', 'pinterest_access_token');
        set('pinterest-board-id', 'pinterest_board_id');
        set('ideogram-api-key', 'ideogram_api_key');
        set('pinterest-frequency', 'pinterest_frequency_hours');
        chk('pinterest-auto', 'pinterest_auto_posting');
        set('instagram-access-token', 'instagram_access_token');
        set('instagram-account-id', 'instagram_account_id');
        set('instagram-frequency', 'instagram_frequency_hours');
        chk('instagram-auto', 'instagram_auto_posting');
        set('linkedin-access-token', 'linkedin_access_token');
        set('linkedin-org-id', 'linkedin_org_id');
        set('linkedin-frequency', 'linkedin_frequency_hours');
        chk('linkedin-auto', 'linkedin_auto_posting');
        set('wordpress-client-id', 'wordpress_client_id');
        set('wordpress-client-secret', 'wordpress_client_secret');
        set('wordpress-frequency', 'wordpress_frequency_hours');
        chk('wordpress-auto', 'wordpress_auto_posting');
        set('google-client-id', 'google_client_id');
        set('google-client-secret', 'google_client_secret');
        set('blogger-frequency', 'blogger_frequency_hours');
        chk('blogger-auto', 'blogger_auto_posting');
    } catch (err) { console.warn('Could not load social settings:', err.message); }
}

async function saveSocialSettings() {
    const val = id => document.getElementById(id)?.value?.trim() || '';
    const chk = id => document.getElementById(id)?.checked ? 'true' : 'false';
    const settings = {
        twitter_api_key: val('twitter-api-key'),
        twitter_api_secret: val('twitter-api-secret'),
        twitter_bearer_token: val('twitter-bearer-token'),
        twitter_access_token: val('twitter-access-token'),
        twitter_access_secret: val('twitter-access-secret'),
        twitter_frequency_hours: val('twitter-frequency') || '4',
        twitter_auto_posting: chk('twitter-auto'),
        reddit_client_id: val('reddit-client-id'),
        reddit_client_secret: val('reddit-client-secret'),
        reddit_username: val('reddit-username'),
        reddit_password: val('reddit-password'),
        reddit_frequency_hours: val('reddit-frequency') || '6',
        reddit_auto_posting: chk('reddit-auto'),
        pinterest_access_token: val('pinterest-access-token'),
        pinterest_board_id: val('pinterest-board-id'),
        ideogram_api_key: val('ideogram-api-key'),
        pinterest_frequency_hours: val('pinterest-frequency') || '4',
        pinterest_auto_posting: chk('pinterest-auto'),
        instagram_access_token: val('instagram-access-token'),
        instagram_account_id: val('instagram-account-id'),
        instagram_frequency_hours: val('instagram-frequency') || '8',
        instagram_auto_posting: chk('instagram-auto'),
        linkedin_access_token: val('linkedin-access-token'),
        linkedin_org_id: val('linkedin-org-id'),
        linkedin_frequency_hours: val('linkedin-frequency') || '12',
        linkedin_auto_posting: chk('linkedin-auto'),
        wordpress_client_id: val('wordpress-client-id'),
        wordpress_client_secret: val('wordpress-client-secret'),
        wordpress_frequency_hours: val('wordpress-frequency') || '24',
        wordpress_auto_posting: chk('wordpress-auto'),
        google_client_id: val('google-client-id'),
        google_client_secret: val('google-client-secret'),
        blogger_frequency_hours: val('blogger-frequency') || '24',
        blogger_auto_posting: chk('blogger-auto'),
    };
    await fetch(`${API_URL}/api/admin/settings/batch/update`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    // Reload services with new credentials
    for (const platform of ['twitter', 'pinterest', 'reddit', 'linkedin', 'instagram', 'wordpress', 'blogger']) {
        fetch(`${API_URL}/api/${platform}/reload-settings`, { method: 'POST', headers: { 'Authorization': `Bearer ${getAuthToken()}` } }).catch(() => {});
    }
}
