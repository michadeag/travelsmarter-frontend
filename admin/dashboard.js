// Admin Dashboard JavaScript
// Connects to backend API for data management with JWT authentication

// Determine correct API URL based on current domain
let API_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5000';
} else {
    // For production, use api subdomain
    const apiUrl = localStorage.getItem('apiUrl');
    if (apiUrl) {
        API_URL = apiUrl;
    } else if (window.location.hostname === 'travelsmarterapp.com') {
        API_URL = 'https://api.travelsmarterapp.com';
    } else {
        API_URL = window.location.origin;
    }
}

console.log('🔒 Admin Dashboard using API:', API_URL);

// Global state for dashboard data
let usersData = [];
let dealsData = [];
let hacksData = [];
let promosData = [];

// Helper function to get admin JWT token
function getAdminToken() {
    return localStorage.getItem('adminToken');
}

// Helper function to get auth headers with JWT token
function getAuthHeaders() {
    const token = getAdminToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    // Check if logged in
    if (!getAdminToken()) {
        redirectToLogin();
        return;
    }

    // Verify token is still valid
    verifyAdminToken();

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Load dashboard data
    loadDashboardStats();
    loadUsers();
    loadSubscriptions();
    loadDeals();
    loadHacks();
    loadPromos();
    loadEmailTemplates();
    loadAnalytics();
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
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active to clicked nav link
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        users: 'Users Management',
        subscriptions: 'Subscriptions',
        deals: 'Deals Management',
        hacks: 'Hacks & Modules',
        promos: 'Promo Codes',
        'email-templates': 'Email Templates',
        analytics: 'Analytics',
        settings: 'Settings'
    };

    document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';
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
                headers: getAuthHeaders()
            }),
            fetch(`${API_URL}/api/subscriptions/stats`, {
                headers: getAuthHeaders()
            }),
            fetch(`${API_URL}/api/admin/deals/count`, {
                headers: getAuthHeaders()
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
            headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/api/admin/activities`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayUsers(data.activities || []);
        } else if (response.status === 401) {
            console.error('Unauthorized - token may be expired');
            redirectToLogin();
        } else {
            console.error('Failed to load users:', response.status, response.statusText);
            displayError('users-table', `Error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        displayError('users-table', 'Failed to load users');
    }
}

function displayUsers(users) {
    // Store users data globally for use in edit/delete operations
    usersData = users;

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
        let url = `${API_URL}/api/admin/users`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/admin/users/${userId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
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
        // Find user from stored global data
        const user = usersData.find(u => u.id === userId);

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
        const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
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
            headers: getAuthHeaders()
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
            headers: getAuthHeaders()
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
            headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/api/admin/subscriptions/${subId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ tier, status })
        });

        if (response.ok) {
            showAlert('Subscription updated successfully', 'success');
            closeSubscriptionModal();
            loadSubscriptions();
        } else {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            showAlert(errorData.message || 'Failed to update subscription', 'error');
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        showAlert(error.message || 'Error updating subscription', 'error');
    }
}

// DEALS
async function loadDeals() {
    try {
        const response = await fetch(`${API_URL}/api/admin/deals?limit=50`, {
            headers: getAuthHeaders()
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
    // Store deals data globally for use in edit/delete operations
    dealsData = deals;

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
        let url = `${API_URL}/api/admin/deals`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/admin/deals/${dealId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
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
        // Find deal from stored global data
        const deal = dealsData.find(d => d.id === dealId);

        if (!deal) {
            showAlert('Deal not found', 'error');
            return;
        }

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
        const response = await fetch(`${API_URL}/api/admin/deals/${dealId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/api/admin/promos`, {
            headers: getAuthHeaders()
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
    // Store promos data globally for use in edit/delete operations
    promosData = promos;

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
        let url = `${API_URL}/api/admin/promos`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/api/admin/promos/${promoId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
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
            const errorData = await response.json();
            console.error('API Error:', errorData);
            showAlert(errorData.message || 'Failed to save promo code', 'error');
        }
    } catch (error) {
        console.error('Error saving promo:', error);
        showAlert(error.message || 'Error saving promo code', 'error');
    }
}

async function editPromo(promoId) {
    try {
        // Find promo from stored global data
        const promo = promosData.find(p => p.id === promoId);

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
        const response = await fetch(`${API_URL}/api/admin/promos/${promoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
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
            headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/api/admin/settings`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const settings = data.data || {};

            // Populate form fields with settings values
            if (settings.sendgrid_api_key?.value) {
                document.getElementById('sendgrid-key').value = settings.sendgrid_api_key.value;
            }
            if (settings.sender_email?.value) {
                document.getElementById('sender-email').value = settings.sender_email.value;
            }
            if (settings.stripe_secret_key?.value) {
                document.getElementById('stripe-key').value = settings.stripe_secret_key.value;
            }
            if (settings.stripe_publishable_key?.value) {
                const pubKeyField = document.getElementById('stripe-pub-key');
                if (pubKeyField) {
                    pubKeyField.value = settings.stripe_publishable_key.value;
                }
            }
            if (settings.stripe_webhook_secret?.value) {
                document.getElementById('webhook-secret').value = settings.stripe_webhook_secret.value;
            }

            // Load Twitter settings
            if (settings.twitter_api_key?.value) {
                const el = document.getElementById('twitter-api-key');
                if (el) el.value = settings.twitter_api_key.value;
            }
            if (settings.twitter_api_secret?.value) {
                const el = document.getElementById('twitter-api-secret');
                if (el) el.value = settings.twitter_api_secret.value;
            }
            if (settings.twitter_access_token?.value) {
                const el = document.getElementById('twitter-access-token');
                if (el) el.value = settings.twitter_access_token.value;
            }
            if (settings.twitter_access_secret?.value) {
                const el = document.getElementById('twitter-access-secret');
                if (el) el.value = settings.twitter_access_secret.value;
            }
            if (settings.twitter_bearer_token?.value) {
                const el = document.getElementById('twitter-bearer-token');
                if (el) el.value = settings.twitter_bearer_token.value;
            }
            if (settings.twitter_auto_posting?.value) {
                const el = document.getElementById('twitter-auto-posting');
                if (el) el.checked = settings.twitter_auto_posting.value === 'true';
            }
            if (settings.twitter_posting_schedule?.value) {
                const el = document.getElementById('twitter-posting-schedule');
                if (el) el.value = settings.twitter_posting_schedule.value;
            }
            if (settings.twitter_posting_time?.value) {
                const el = document.getElementById('twitter-posting-time');
                if (el) el.value = settings.twitter_posting_time.value;
            }

            // Load Blogger settings
            const bloggerFields = [
                ['google_client_id', 'google-client-id'],
                ['google_client_secret', 'google-client-secret'],
                ['blogger_blog_id', 'blogger-blog-id'],
                ['blogger_frequency_hours', 'blogger-frequency-hours']
            ];
            bloggerFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.blogger_auto_posting?.value) {
                const el = document.getElementById('blogger-auto-posting');
                if (el) el.checked = settings.blogger_auto_posting.value === 'true';
            }

            // Load WordPress settings
            const wordpressFields = [
                ['wordpress_client_id', 'wordpress-client-id'],
                ['wordpress_client_secret', 'wordpress-client-secret'],
                ['wordpress_frequency_hours', 'wordpress-frequency-hours']
            ];
            wordpressFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.wordpress_auto_posting?.value) {
                const el = document.getElementById('wordpress-auto-posting');
                if (el) el.checked = settings.wordpress_auto_posting.value === 'true';
            }

            // Load Instagram settings
            const instagramFields = [
                ['instagram_access_token', 'instagram-access-token'],
                ['instagram_account_id', 'instagram-account-id'],
                ['instagram_posting_frequency', 'instagram-frequency'],
                ['instagram_max_posts_per_day', 'instagram-max-posts'],
                ['instagram_posting_hours', 'instagram-hours']
            ];
            instagramFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.instagram_auto_posting?.value) {
                const el = document.getElementById('instagram-auto-posting');
                if (el) el.checked = settings.instagram_auto_posting.value === 'true';
            }

            // Load Pinterest settings
            const pinterestFields = [
                ['pinterest_access_token', 'pinterest-access-token'],
                ['pinterest_board_id', 'pinterest-board-id'],
                ['ideogram_api_key', 'ideogram-api-key'],
                ['pinterest_posting_frequency', 'pinterest-frequency'],
                ['pinterest_max_posts_per_day', 'pinterest-max-posts'],
                ['pinterest_posting_time', 'pinterest-time']
            ];
            pinterestFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.pinterest_auto_posting?.value) {
                const el = document.getElementById('pinterest-auto-posting');
                if (el) el.checked = settings.pinterest_auto_posting.value === 'true';
            }

            // Load LinkedIn settings
            const linkedinFields = [
                ['linkedin_access_token', 'linkedin-access-token'],
                ['linkedin_org_id', 'linkedin-org-id'],
                ['linkedin_posting_frequency', 'linkedin-frequency'],
                ['linkedin_max_posts_per_day', 'linkedin-max-posts'],
                ['linkedin_posting_time', 'linkedin-time']
            ];
            linkedinFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.linkedin_auto_posting?.value) {
                const el = document.getElementById('linkedin-auto-posting');
                if (el) el.checked = settings.linkedin_auto_posting.value === 'true';
            }

            // Load Reddit settings
            const redditFields = [
                ['reddit_client_id', 'reddit-client-id'],
                ['reddit_client_secret', 'reddit-client-secret'],
                ['reddit_username', 'reddit-username'],
                ['reddit_password', 'reddit-password'],
                ['reddit_posting_frequency', 'reddit-frequency'],
                ['reddit_max_posts_per_day', 'reddit-max-posts'],
                ['reddit_subreddits', 'reddit-subreddits']
            ];
            redditFields.forEach(([key, id]) => {
                if (settings[key]?.value) {
                    const el = document.getElementById(id);
                    if (el) el.value = settings[key].value;
                }
            });
            if (settings.reddit_auto_posting?.value) {
                const el = document.getElementById('reddit-auto-posting');
                if (el) el.checked = settings.reddit_auto_posting.value === 'true';
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

            console.log('✅ Settings loaded from backend');
            return; // Success, don't need localStorage fallback
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

    // Twitter settings
    const twitterApiKey = document.getElementById('twitter-api-key')?.value || '';
    const twitterApiSecret = document.getElementById('twitter-api-secret')?.value || '';
    const twitterAccessToken = document.getElementById('twitter-access-token')?.value || '';
    const twitterAccessSecret = document.getElementById('twitter-access-secret')?.value || '';
    const twitterBearerToken = document.getElementById('twitter-bearer-token')?.value || '';
    const twitterAutoPosting = document.getElementById('twitter-auto-posting')?.checked || false;
    const twitterPostingSchedule = document.getElementById('twitter-posting-schedule')?.value || 'recommended';
    const twitterPostingTime = document.getElementById('twitter-posting-time')?.value || '09:00';

    // Blogger settings
    const googleClientId = document.getElementById('google-client-id')?.value || '';
    const googleClientSecret = document.getElementById('google-client-secret')?.value || '';
    const bloggerBlogId = document.getElementById('blogger-blog-id')?.value || '';
    const bloggerFrequencyHours = document.getElementById('blogger-frequency-hours')?.value || '48';
    const bloggerAutoPosting = document.getElementById('blogger-auto-posting')?.checked || false;

    // WordPress settings
    const wordpressClientId = document.getElementById('wordpress-client-id')?.value || '';
    const wordpressClientSecret = document.getElementById('wordpress-client-secret')?.value || '';
    const wordpressFrequencyHours = document.getElementById('wordpress-frequency-hours')?.value || '48';
    const wordpressAutoPosting = document.getElementById('wordpress-auto-posting')?.checked || false;

    // Instagram settings
    const instagramAccessToken = document.getElementById('instagram-access-token')?.value || '';
    const instagramAccountId = document.getElementById('instagram-account-id')?.value || '';
    const instagramFrequency = document.getElementById('instagram-frequency')?.value || 'daily';
    const instagramMaxPosts = document.getElementById('instagram-max-posts')?.value || '1';
    const instagramHours = document.getElementById('instagram-hours')?.value || '11,18';
    const instagramAutoPosting = document.getElementById('instagram-auto-posting')?.checked || false;

    // Pinterest settings
    const pinterestAccessToken = document.getElementById('pinterest-access-token')?.value || '';
    const pinterestBoardId = document.getElementById('pinterest-board-id')?.value || '';
    const ideogramApiKey = document.getElementById('ideogram-api-key')?.value || '';
    const pinterestFrequency = document.getElementById('pinterest-frequency')?.value || 'daily';
    const pinterestMaxPosts = document.getElementById('pinterest-max-posts')?.value || '1';
    const pinterestTime = document.getElementById('pinterest-time')?.value || '20:00';
    const pinterestAutoPosting = document.getElementById('pinterest-auto-posting')?.checked || false;

    // LinkedIn settings
    const linkedinAccessToken = document.getElementById('linkedin-access-token')?.value || '';
    const linkedinOrgId = document.getElementById('linkedin-org-id')?.value || '';
    const linkedinFrequency = document.getElementById('linkedin-frequency')?.value || 'daily';
    const linkedinMaxPosts = document.getElementById('linkedin-max-posts')?.value || '1';
    const linkedinTime = document.getElementById('linkedin-time')?.value || '09:00';
    const linkedinAutoPosting = document.getElementById('linkedin-auto-posting')?.checked || false;

    // Reddit settings
    const redditClientId = document.getElementById('reddit-client-id')?.value || '';
    const redditClientSecret = document.getElementById('reddit-client-secret')?.value || '';
    const redditUsername = document.getElementById('reddit-username')?.value || '';
    const redditPassword = document.getElementById('reddit-password')?.value || '';
    const redditFrequency = document.getElementById('reddit-frequency')?.value || 'daily';
    const redditMaxPosts = document.getElementById('reddit-max-posts')?.value || '1';
    const redditSubreddits = document.getElementById('reddit-subreddits')?.value || 'travel,solotravel,budgettravel';
    const redditAutoPosting = document.getElementById('reddit-auto-posting')?.checked || false;

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

        // Save Twitter settings
        if (twitterApiKey) localStorage.setItem('admin_twitter_api_key', twitterApiKey);
        if (twitterApiSecret) localStorage.setItem('admin_twitter_api_secret', twitterApiSecret);
        if (twitterAccessToken) localStorage.setItem('admin_twitter_access_token', twitterAccessToken);
        if (twitterAccessSecret) localStorage.setItem('admin_twitter_access_secret', twitterAccessSecret);
        if (twitterBearerToken) localStorage.setItem('admin_twitter_bearer_token', twitterBearerToken);
        localStorage.setItem('admin_twitter_auto_posting', twitterAutoPosting.toString());
        localStorage.setItem('admin_twitter_posting_schedule', twitterPostingSchedule);
        localStorage.setItem('admin_twitter_posting_time', twitterPostingTime);

        // Save Medium settings
        if (mediumToken) localStorage.setItem('admin_medium_token', mediumToken);
        if (mediumPubId) localStorage.setItem('admin_medium_pub_id', mediumPubId);
        localStorage.setItem('admin_medium_frequency', mediumFrequency);
        localStorage.setItem('admin_medium_auto_posting', mediumAutoPosting.toString());

        // Save Instagram settings
        if (instagramAccessToken) localStorage.setItem('admin_instagram_access_token', instagramAccessToken);
        if (instagramAccountId) localStorage.setItem('admin_instagram_account_id', instagramAccountId);
        localStorage.setItem('admin_instagram_frequency', instagramFrequency);
        localStorage.setItem('admin_instagram_max_posts', instagramMaxPosts);
        localStorage.setItem('admin_instagram_hours', instagramHours);
        localStorage.setItem('admin_instagram_auto_posting', instagramAutoPosting.toString());

        // Save Pinterest settings
        if (pinterestAccessToken) localStorage.setItem('admin_pinterest_access_token', pinterestAccessToken);
        if (pinterestBoardId) localStorage.setItem('admin_pinterest_board_id', pinterestBoardId);
        if (ideogramApiKey) localStorage.setItem('admin_ideogram_api_key', ideogramApiKey);
        localStorage.setItem('admin_pinterest_frequency', pinterestFrequency);
        localStorage.setItem('admin_pinterest_max_posts', pinterestMaxPosts);
        localStorage.setItem('admin_pinterest_time', pinterestTime);
        localStorage.setItem('admin_pinterest_auto_posting', pinterestAutoPosting.toString());

        // Save LinkedIn settings
        if (linkedinAccessToken) localStorage.setItem('admin_linkedin_access_token', linkedinAccessToken);
        if (linkedinOrgId) localStorage.setItem('admin_linkedin_org_id', linkedinOrgId);
        localStorage.setItem('admin_linkedin_frequency', linkedinFrequency);
        localStorage.setItem('admin_linkedin_max_posts', linkedinMaxPosts);
        localStorage.setItem('admin_linkedin_time', linkedinTime);
        localStorage.setItem('admin_linkedin_auto_posting', linkedinAutoPosting.toString());

        // Save Reddit settings
        if (redditClientId) localStorage.setItem('admin_reddit_client_id', redditClientId);
        if (redditClientSecret) localStorage.setItem('admin_reddit_client_secret', redditClientSecret);
        if (redditUsername) localStorage.setItem('admin_reddit_username', redditUsername);
        if (redditPassword) localStorage.setItem('admin_reddit_password', redditPassword);
        localStorage.setItem('admin_reddit_frequency', redditFrequency);
        localStorage.setItem('admin_reddit_max_posts', redditMaxPosts);
        localStorage.setItem('admin_reddit_subreddits', redditSubreddits);
        localStorage.setItem('admin_reddit_auto_posting', redditAutoPosting.toString());

        console.log('✅ Settings saved to localStorage');
        showAlert('Settings saved successfully!', 'success');

        // Optional: Try to sync to backend (non-blocking)
        try {
            const settingsData = {
                'sendgrid_api_key': sendgridKey,
                'sender_email': senderEmail,
                'stripe_secret_key': stripeKey,
                'stripe_publishable_key': stripePubKey,
                'stripe_webhook_secret': webhookSecret,
                'send_email_on_signup': sendSignupEmail.toString(),
                'send_email_on_subscription': sendSubEmail.toString(),
                'send_daily_digest': sendDigest.toString()
            };

            // Add Twitter settings if provided
            if (twitterApiKey) {
                settingsData['twitter_api_key'] = twitterApiKey;
                settingsData['twitter_api_secret'] = twitterApiSecret;
                settingsData['twitter_access_token'] = twitterAccessToken;
                settingsData['twitter_access_secret'] = twitterAccessSecret;
                settingsData['twitter_bearer_token'] = twitterBearerToken;
                settingsData['twitter_auto_posting'] = twitterAutoPosting.toString();
                settingsData['twitter_posting_schedule'] = twitterPostingSchedule;
                settingsData['twitter_posting_time'] = twitterPostingTime;
            }

            // Add Blogger settings if provided
            if (googleClientId) {
                settingsData['google_client_id'] = googleClientId;
                settingsData['google_client_secret'] = googleClientSecret;
                settingsData['blogger_blog_id'] = bloggerBlogId;
                settingsData['blogger_frequency_hours'] = bloggerFrequencyHours;
                settingsData['blogger_auto_posting'] = bloggerAutoPosting.toString();
            }

            // Add WordPress settings if provided
            if (wordpressClientId) {
                settingsData['wordpress_client_id'] = wordpressClientId;
                settingsData['wordpress_client_secret'] = wordpressClientSecret;
                settingsData['wordpress_frequency_hours'] = wordpressFrequencyHours;
                settingsData['wordpress_auto_posting'] = wordpressAutoPosting.toString();
            }

            // Add Instagram settings if provided
            if (instagramAccessToken) {
                settingsData['instagram_access_token'] = instagramAccessToken;
                settingsData['instagram_account_id'] = instagramAccountId;
                settingsData['instagram_posting_frequency'] = instagramFrequency;
                settingsData['instagram_max_posts_per_day'] = instagramMaxPosts;
                settingsData['instagram_posting_hours'] = instagramHours;
                settingsData['instagram_auto_posting'] = instagramAutoPosting.toString();
            }

            // Add Pinterest settings if provided
            if (pinterestAccessToken) {
                settingsData['pinterest_access_token'] = pinterestAccessToken;
                settingsData['pinterest_board_id'] = pinterestBoardId;
                settingsData['pinterest_posting_frequency'] = pinterestFrequency;
                settingsData['pinterest_max_posts_per_day'] = pinterestMaxPosts;
                settingsData['pinterest_posting_time'] = pinterestTime;
                settingsData['pinterest_auto_posting'] = pinterestAutoPosting.toString();
            }
            if (ideogramApiKey) {
                settingsData['ideogram_api_key'] = ideogramApiKey;
            }

            // Add LinkedIn settings if provided
            if (linkedinAccessToken) {
                settingsData['linkedin_access_token'] = linkedinAccessToken;
                settingsData['linkedin_org_id'] = linkedinOrgId;
                settingsData['linkedin_posting_frequency'] = linkedinFrequency;
                settingsData['linkedin_max_posts_per_day'] = linkedinMaxPosts;
                settingsData['linkedin_posting_time'] = linkedinTime;
                settingsData['linkedin_auto_posting'] = linkedinAutoPosting.toString();
            }

            // Add Reddit settings if provided
            if (redditClientId) {
                settingsData['reddit_client_id'] = redditClientId;
                settingsData['reddit_client_secret'] = redditClientSecret;
                settingsData['reddit_username'] = redditUsername;
                settingsData['reddit_password'] = redditPassword;
                settingsData['reddit_posting_frequency'] = redditFrequency;
                settingsData['reddit_max_posts_per_day'] = redditMaxPosts;
                settingsData['reddit_subreddits'] = redditSubreddits;
                settingsData['reddit_auto_posting'] = redditAutoPosting.toString();
            }

            await fetch(`${API_URL}/api/admin/settings/batch/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAdminToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });
            console.log('✅ Settings also synced to backend database');

            // If Blogger credentials were saved, reload the Blogger service
            if (googleClientId) {
                try {
                    await fetch(`${API_URL}/api/blogger/reload-settings`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }
                    });
                } catch (err) {
                    console.warn('⚠️ Blogger reload failed (non-blocking):', err.message);
                }
            }

            // If WordPress credentials were saved, reload the WordPress service
            if (wordpressClientId) {
                try {
                    await fetch(`${API_URL}/api/wordpress/reload-settings`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }
                    });
                } catch (err) {
                    console.warn('⚠️ Medium reload failed (non-blocking):', err.message);
                }
            }

            // If Instagram credentials were saved, reload the Instagram service
            if (instagramAccessToken && instagramAccountId) {
                try {
                    await fetch(`${API_URL}/api/instagram/reload-settings`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }
                    });
                } catch (err) {
                    console.warn('⚠️ Instagram reload failed (non-blocking):', err.message);
                }
            }

            // If Pinterest credentials were saved, reload the Pinterest service
            if (pinterestAccessToken && pinterestBoardId && ideogramApiKey) {
                try {
                    await fetch(`${API_URL}/api/pinterest/reload-settings`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }
                    });
                } catch (err) {
                    console.warn('⚠️ Pinterest reload failed (non-blocking):', err.message);
                }
            }

            // If LinkedIn credentials were saved, reload the LinkedIn service
            if (linkedinAccessToken && linkedinOrgId) {
                try {
                    await fetch(`${API_URL}/api/linkedin/reload-settings`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }
                    });
                    console.log('✅ LinkedIn service reinitialized with new credentials');
                } catch (liErr) {
                    console.warn('⚠️ LinkedIn service reload failed (non-blocking):', liErr.message);
                }
            }

            // If Reddit credentials were saved, reload the Reddit service
            if (redditClientId && redditClientSecret) {
                try {
                    await fetch(`${API_URL}/api/reddit/reload-settings`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${getAdminToken()}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('✅ Reddit service reinitialized with new credentials');
                } catch (redditError) {
                    console.warn('⚠️ Reddit service reload failed (non-blocking):', redditError.message);
                }
            }

            // If Twitter credentials were saved, reload the Twitter service
            if (twitterApiKey && twitterApiSecret) {
                try {
                    await fetch(`${API_URL}/api/twitter/reload-settings`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${getAdminToken()}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('✅ Twitter service reinitialized with new credentials');
                } catch (twitterError) {
                    console.warn('⚠️ Twitter service reload failed (non-blocking):', twitterError.message);
                }
            }
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
// Verify admin token is valid
async function verifyAdminToken() {
    try {
        const token = getAdminToken();
        if (!token) {
            redirectToLogin();
            return;
        }

        const response = await fetch(`${API_URL}/api/admin-auth/verify-token`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.warn('Token verification failed');
            redirectToLogin();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        redirectToLogin();
    }
}

// Handle logout
async function handleLogout() {
    try {
        const token = getAdminToken();
        await fetch(`${API_URL}/api/admin-auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        }).catch(() => {}); // Ignore errors

        // Clear local storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('rememberMe');

        redirectToLogin();
    } catch (error) {
        console.error('Logout error:', error);
        redirectToLogin();
    }
}

// Wrapper function for logout button
function logout() {
    handleLogout();
}

function redirectToLogin() {
    window.location.href = 'login-secure.html';
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

// ANALYTICS (single canonical definition — second duplicate below is removed)
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/api/admin/analytics/summary`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!data.success) return;

        const u = data.users;
        const s = data.social;

        // User KPIs
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('an-total-users', u.total.toLocaleString());
        set('an-signups-month', u.signupsThisMonth.toLocaleString());
        set('an-paid-users', u.paid.toLocaleString());
        set('an-elite-users', u.elite.toLocaleString());

        const changeEl = document.getElementById('an-signups-change');
        if (changeEl && u.signupChange !== null) {
            const sign = u.signupChange >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${u.signupChange}% vs. Vormonat`;
            changeEl.style.color = u.signupChange >= 0 ? '#38a169' : '#e53e3e';
        }

        // Social totals
        set('an-total-posts', s.totalPosts.toLocaleString());
        set('an-total-cta', s.totalCTA.toLocaleString());

        // Per-platform table
        const platformMeta = [
            { key: 'reddit',    label: '🤖 Reddit' },
            { key: 'linkedin',  label: '💼 LinkedIn' },
            { key: 'pinterest', label: '📌 Pinterest' },
            { key: 'instagram', label: '📸 Instagram' },
            { key: 'wordpress', label: '📝 WordPress' },
            { key: 'blogger',   label: '📰 Blogger' },
            { key: 'quora',     label: '❓ Quora' }
        ];
        const tbody = document.getElementById('an-platform-tbody');
        if (tbody) {
            tbody.innerHTML = platformMeta.map(p => {
                const pd = s.platforms[p.key] || { total: 0, thisMonth: 0, withCTA: 0 };
                const ctaRate = pd.total > 0 ? Math.round((pd.withCTA / pd.total) * 100) : 0;
                return `<tr>
                    <td style="font-weight: 600;">${p.label}</td>
                    <td style="text-align: right;">${pd.total.toLocaleString()}</td>
                    <td style="text-align: right;">${pd.thisMonth.toLocaleString()}</td>
                    <td style="text-align: right;">${pd.withCTA.toLocaleString()}</td>
                    <td style="text-align: right; color: ${ctaRate > 0 ? '#38a169' : '#999'};">${ctaRate}%</td>
                </tr>`;
            }).join('');
        }
    } catch (err) {
        console.error('Analytics error:', err);
    }
}

// TWITTER MANAGEMENT
let twitterRecentPostings = [];

async function loadTwitterStatus() {
    try {
        const response = await fetch(`${API_URL}/api/twitter/status`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            document.getElementById('twitter-status').innerHTML = `
                <p style="color: #ffcccc;">❌ Twitter service not configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Add Twitter API credentials to server .env file</p>
            `;
            return;
        }

        const data = await response.json();

        if (data.configured) {
            document.getElementById('twitter-status').innerHTML = `
                <p style="color: #ccffcc;">✅ Twitter API Connected</p>
                <p style="font-size: 14px; margin-top: 10px;">
                    <strong>Scheduled Jobs:</strong> ${data.scheduledJobs}<br>
                    ${data.jobs.length > 0 ? '<strong>Active Schedules:</strong><br>' + data.jobs.map(j => `• ${j.type} ${j.time ? 'at ' + j.time : ''}`).join('<br>') : 'No active schedule'}
                </p>
            `;
        } else {
            document.getElementById('twitter-status').innerHTML = `
                <p style="color: #ffcccc;">⚠️ Twitter Not Configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Add Twitter API keys to server environment</p>
            `;
        }
    } catch (error) {
        console.error('Error loading Twitter status:', error);
        document.getElementById('twitter-status').innerHTML = `
            <p style="color: #ffcccc;">❌ Error loading status</p>
        `;
    }
}

async function loadTwitterTips() {
    try {
        const response = await fetch(`${API_URL}/api/twitter/tips`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load tips');

        const data = await response.json();
        const tips = data.tips || [];

        // Group by category
        const byCategory = {};
        tips.forEach(tip => {
            if (!byCategory[tip.category]) {
                byCategory[tip.category] = [];
            }
            byCategory[tip.category].push(tip);
        });

        let html = '';
        Object.keys(byCategory).forEach(category => {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #667eea;">${category.toUpperCase()}</strong>
                    <div style="margin-top: 8px; font-size: 13px;">
            `;
            byCategory[category].forEach(tip => {
                html += `<p style="margin: 5px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">${tip.tip.substring(0, 80)}...</p>`;
            });
            html += `</div></div>`;
        });

        document.getElementById('tips-preview').innerHTML = html;
    } catch (error) {
        console.error('Error loading tips:', error);
        document.getElementById('tips-preview').innerHTML = '<p style="color: #ff6b6b;">Error loading tips</p>';
    }
}

async function postRandomTip() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Posting...';

    try {
        const response = await fetch(`${API_URL}/api/twitter/post-random`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showAlert('✅ Tweet posted successfully!', 'success');
            addRecentPosting('Random Tip', data.text);
            loadTwitterStatus();
        } else {
            showAlert('❌ Failed to post: ' + data.message, 'error');
        }
    } catch (error) {
        showAlert('❌ Error posting tweet: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📱 Post Random Tip';
    }
}

async function postByCategory() {
    const category = document.getElementById('category-select').value;

    if (!category) {
        showAlert('Please select a category', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Posting...';

    try {
        const response = await fetch(`${API_URL}/api/twitter/post-category`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ category })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`✅ ${category} tip posted!`, 'success');
            addRecentPosting(`Category: ${category}`, data.text);
            document.getElementById('category-select').value = '';
            loadTwitterStatus();
        } else {
            showAlert('❌ Failed to post: ' + data.message, 'error');
        }
    } catch (error) {
        showAlert('❌ Error posting tweet: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Post from Category';
    }
}

// Character counter for custom tweet
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('custom-tweet');
    if (textarea) {
        textarea.addEventListener('input', (e) => {
            document.getElementById('char-count').textContent = e.target.value.length;
            if (e.target.value.length > 280) {
                e.target.style.borderColor = '#ff6b6b';
            } else {
                e.target.style.borderColor = '#ddd';
            }
        });
    }
});

async function postCustomTweet() {
    const text = document.getElementById('custom-tweet').value;

    if (!text.trim()) {
        showAlert('Please enter tweet text', 'error');
        return;
    }

    if (text.length > 280) {
        showAlert('Tweet exceeds 280 character limit', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Posting...';

    try {
        const response = await fetch(`${API_URL}/api/twitter/post-custom`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('✅ Custom tweet posted!', 'success');
            addRecentPosting('Custom Tweet', text);
            document.getElementById('custom-tweet').value = '';
            document.getElementById('char-count').textContent = '0';
            loadTwitterStatus();
        } else {
            showAlert('❌ Failed to post: ' + data.message, 'error');
        }
    } catch (error) {
        showAlert('❌ Error posting tweet: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Post Custom Tweet';
    }
}

async function startScheduler() {
    const schedule = document.getElementById('schedule-type').value;
    const time = document.getElementById('post-time').value;

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Starting...';

    try {
        const body = { schedule };
        if (schedule === 'daily') {
            body.times = [time];
        }

        const response = await fetch(`${API_URL}/api/twitter/scheduler/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`✅ Scheduler started: ${data.message}`, 'success');
            loadTwitterStatus();
        } else {
            showAlert('❌ Failed to start scheduler: ' + data.message, 'error');
        }
    } catch (error) {
        showAlert('❌ Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '▶️ Start Scheduler';
    }
}

async function stopScheduler() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Stopping...';

    try {
        const response = await fetch(`${API_URL}/api/twitter/scheduler/stop`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showAlert('✅ Scheduler stopped', 'success');
            loadTwitterStatus();
        } else {
            showAlert('❌ Failed to stop scheduler', 'error');
        }
    } catch (error) {
        showAlert('❌ Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '⏹️ Stop Scheduler';
    }
}

function addRecentPosting(type, text) {
    const posting = {
        type,
        text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
        time: new Date().toLocaleTimeString()
    };

    twitterRecentPostings.unshift(posting);
    if (twitterRecentPostings.length > 5) {
        twitterRecentPostings.pop();
    }

    let html = '';
    twitterRecentPostings.forEach((p, i) => {
        html += `
            <div style="padding: 10px; border-left: 3px solid #667eea; margin-bottom: 8px; background: #f9fafb; border-radius: 4px;">
                <strong style="color: #667eea;">${p.type}</strong> at ${p.time}<br>
                <span style="font-size: 12px; color: #666;">"${p.text}"</span>
            </div>
        `;
    });

    document.getElementById('recent-postings').innerHTML = html;
}

// Initialize Twitter panel when tab is clicked
document.addEventListener('click', (e) => {
    if (e.target.getAttribute('data-tab') === 'twitter') {
        loadTwitterStatus();
        loadTwitterTips();
    }
});

// EMAIL TEMPLATES MANAGEMENT
async function loadEmailTemplates() {
    try {
        // Load sequences
        const sequencesResponse = await fetch(`${API_URL}/api/admin/email-templates/sequences`, {
            headers: getAuthHeaders()
        });

        if (sequencesResponse.ok) {
            const sequencesData = await sequencesResponse.json();
            renderSequences(sequencesData.data || []);
        } else {
            console.error('Failed to load sequences');
        }

        // Load templates
        const templatesResponse = await fetch(`${API_URL}/api/admin/email-templates/templates`, {
            headers: getAuthHeaders()
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
    const dropdown = document.getElementById('modal-template-sequence');

    if (!sequences || sequences.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No sequences yet</td></tr>';
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select a sequence</option>';
        }
        return;
    }

    // Populate the dropdown
    if (dropdown) {
        dropdown.innerHTML = '<option value="">Select a sequence</option>' +
            sequences.map(seq => `<option value="${seq.id}">${seq.name}</option>`).join('');
    }

    // Populate the table
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
        const response = await fetch(`${API_URL}/api/admin/email-templates/sequences/${sequenceId}`, {
            headers: getAuthHeaders()
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
    const modal = document.getElementById('template-modal');
    if (modal) modal.classList.remove('active');

    // Safely reset form fields if they exist
    const templateIdEl = document.getElementById('modal-template-id');
    const dayEl = document.getElementById('modal-template-day');
    const subjectEl = document.getElementById('modal-template-subject');
    const contentEl = document.getElementById('modal-template-content');
    const titleEl = document.getElementById('template-modal-title');
    const saveBtnEl = document.getElementById('template-save-btn');

    if (templateIdEl) templateIdEl.value = '';
    if (dayEl) dayEl.value = '';
    if (subjectEl) subjectEl.value = '';
    if (contentEl) contentEl.value = '';
    if (titleEl) titleEl.textContent = 'Create Email Template';
    if (saveBtnEl) saveBtnEl.textContent = 'Create Template';
}

async function saveEmailSequence() {
    const name = document.getElementById('modal-sequence-name').value;
    const description = document.getElementById('modal-sequence-description').value;

    if (!name) {
        showAlert('Sequence name is required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/email-templates/sequences`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
    console.log('saveEmailTemplate called');

    // Get elements with null checks
    const templateIdEl = document.getElementById('modal-template-id');
    const sequenceIdEl = document.getElementById('modal-template-sequence');
    const dayEl = document.getElementById('modal-template-day');
    const subjectEl = document.getElementById('modal-template-subject');
    const contentEl = document.getElementById('modal-template-content');

    if (!templateIdEl || !sequenceIdEl || !dayEl || !subjectEl || !contentEl) {
        console.error('Missing form elements:', {
            templateIdEl: templateIdEl ? 'EXISTS' : 'MISSING',
            sequenceIdEl: sequenceIdEl ? 'EXISTS' : 'MISSING',
            dayEl: dayEl ? 'EXISTS' : 'MISSING',
            subjectEl: subjectEl ? 'EXISTS' : 'MISSING',
            contentEl: contentEl ? 'EXISTS' : 'MISSING'
        });
        const missing = [];
        if (!templateIdEl) missing.push('modal-template-id');
        if (!sequenceIdEl) missing.push('modal-template-sequence');
        if (!dayEl) missing.push('modal-template-day');
        if (!subjectEl) missing.push('modal-template-subject');
        if (!contentEl) missing.push('modal-template-content');
        showAlert('Missing form elements: ' + missing.join(', '), 'error');
        return;
    }

    const templateId = templateIdEl.value;
    const sequenceId = sequenceIdEl.value;
    const day = dayEl.value;
    const subject = subjectEl.value;
    const content = contentEl.value;

    console.log('Form values:', { templateId, sequenceId, day, subject, content });
    console.log('Dropdown options:', sequenceIdEl.options);
    console.log('Selected option text:', sequenceIdEl.options[sequenceIdEl.selectedIndex]?.text);

    if (!sequenceId || !subject) {
        console.log('Validation failed: missing sequenceId or subject', { sequenceId, subject });
        showAlert('Sequence and subject are required', 'error');
        return;
    }

    const isEdit = !!templateId;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/api/admin/email-templates/templates/${templateId}` : `${API_URL}/api/admin/email-templates/templates`;

    console.log('Saving template:', { isEdit, method, endpoint });

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify({
                sequence_id: sequenceId,
                day: parseInt(day) || 0,
                subject,
                html_content: content,
                content: content
            })
        });

        console.log('Save response:', response.status, response.ok);

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
        const response = await fetch(`${API_URL}/api/admin/email-templates/sequences`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
            const response = await fetch(`${API_URL}/api/admin/email-templates/sequences/${sequenceId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
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
            const response = await fetch(`${API_URL}/api/admin/email-templates/templates/${templateId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/api/admin/email-templates/templates/${templateId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            showAlert('Failed to load template', 'error');
            return;
        }

        const data = await response.json();
        const template = data.data;

        // Populate form fields with error checking
        const dayField = document.getElementById('modal-template-day');
        const subjectField = document.getElementById('modal-template-subject');
        const contentField = document.getElementById('modal-template-content');
        const sequenceField = document.getElementById('modal-template-sequence');

        if (!dayField || !subjectField || !contentField || !sequenceField) {
            showAlert('Template modal not found - please reload the page', 'error');
            return;
        }

        dayField.value = template.day || 0;
        subjectField.value = template.subject || '';
        contentField.value = template.html_content || template.content || '';
        sequenceField.value = template.sequence_id || '';

        // Change modal title and button to Edit - with checks
        const titleEl = document.getElementById('template-modal-title');
        const saveBtn = document.getElementById('template-save-btn');
        const idField = document.getElementById('modal-template-id');
        const modal = document.getElementById('template-modal');

        if (titleEl) titleEl.textContent = 'Edit Email Template';
        if (saveBtn) saveBtn.textContent = 'Update Template';
        if (idField) idField.value = templateId;
        if (modal) modal.classList.add('active');
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
        const response = await fetch(`${API_URL}/api/admin/hacks`, {
            headers: getAuthHeaders()
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

        // Store hacks data globally for use in edit/delete operations
        hacksData = data.hacks || [];

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
        // Find hack from stored global data
        const hack = hacksData.find(h => h.id === hackId);

        if (!hack) {
            showAlert('Hack not found', 'error');
            return;
        }

        currentEditingHackId = hackId;
        document.getElementById('hack-modal-title').textContent = 'Edit Hack';

        // Populate module dropdown FIRST
        const select = document.getElementById('modal-hack-module-id');
        select.innerHTML = '<option value="">Select a module (1-16)</option>';
        for (let i = 1; i <= 16; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Module ${i}`;
            select.appendChild(option);
        }

        // THEN set form values
        document.getElementById('modal-hack-module-id').value = hack.module_id;
        document.getElementById('modal-hack-title-new').value = hack.title;
        document.getElementById('modal-hack-description').value = hack.description;
        document.getElementById('modal-hack-category').value = hack.category || '';
        document.getElementById('modal-hack-difficulty').value = hack.difficulty || 'medium';

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

    if (!moduleId || !title || !description) {
        showAlert('Module, title, and description are required', 'error');
        return;
    }

    try {
        const url = currentEditingHackId
            ? `${API_URL}/api/admin/hacks/${currentEditingHackId}`
            : `${API_URL}/api/admin/hacks`;

        const method = currentEditingHackId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
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
            const errorData = await response.json();
            console.error('API Error:', errorData);
            showAlert(errorData.message || 'Failed to save hack', 'error');
        }
    } catch (error) {
        console.error('Error saving hack:', error);
        showAlert(error.message || 'Error saving hack', 'error');
    }
}

// Delete hack
async function deleteHack(hackId) {
    if (!confirm('Are you sure you want to delete this hack?')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/hacks/${hackId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
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

// SOCIAL MEDIA PLATFORM TAB SWITCHING
function switchPlatformTab(platform) {
    // Hide all platform settings
    document.querySelectorAll('.platform-settings').forEach(el => {
        el.style.display = 'none';
    });

    // Remove active class from all tabs
    document.querySelectorAll('.platform-tab').forEach(el => {
        el.style.borderBottom = '3px solid transparent';
        el.style.color = '#6b7280';
    });

    // Show selected platform settings
    const settingsElement = document.getElementById(`settings-${platform}`);
    if (settingsElement) {
        settingsElement.style.display = 'block';
    }

    // Highlight active tab
    const activeTab = document.querySelector(`[data-platform="${platform}"]`);
    if (activeTab) {
        activeTab.style.borderBottom = '3px solid #667eea';
        activeTab.style.color = '#667eea';
    }
}

// SOCIAL MEDIA TAB SWITCHING
function switchSocialTab(tabName) {
    // Hide all sub-tabs
    document.querySelectorAll('.social-sub-content').forEach(el => {
        el.style.display = 'none';
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.social-sub-tab').forEach(el => {
        el.style.borderBottom = '3px solid transparent';
        el.style.color = '#6b7280';
        el.classList.remove('active');
    });

    // Show selected sub-tab
    const contentElement = document.getElementById(`content-${tabName}`);
    if (contentElement) {
        contentElement.style.display = 'block';
    }

    // Highlight active tab button
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.style.borderBottom = '3px solid #667eea';
        activeTab.style.color = '#667eea';
        activeTab.classList.add('active');
    }

    // Load data for the selected tab
    if (tabName === 'posts') {
        loadRecentPosts();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'accounts') {
        loadConnectedAccounts();
    } else if (tabName === 'reddit') {
        loadRedditStatus(); loadRedditRecentPosts();
    } else if (tabName === 'linkedin') {
        loadLinkedInStatus(); loadLinkedInRecentPosts();
    } else if (tabName === 'pinterest') {
        loadPinterestStatus(); loadPinterestRecentPosts();
    } else if (tabName === 'instagram') {
        loadInstagramStatus(); loadInstagramRecentPosts();
    } else if (tabName === 'wordpress') {
        loadWordPressStatus(); loadWordPressRecentPosts();
    } else if (tabName === 'quora') {
        loadQuoraStatus(); loadQuoraRecentAnswers();
    } else if (tabName === 'blogger') {
        loadBloggerStatus(); loadBloggerRecentPosts();
    }
}

// PUBLISH POST TO MULTIPLE PLATFORMS
async function publishPost() {
    const postType = document.getElementById('post-type').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const imageUrl = document.getElementById('post-image').value;

    const platforms = [];
    document.querySelectorAll('input[name="platforms"]:checked').forEach(checkbox => {
        platforms.push(checkbox.value);
    });

    if (!content.trim()) {
        showAlert('Please enter post content', 'error');
        return;
    }

    if (platforms.length === 0) {
        showAlert('Please select at least one platform', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/social/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: title || content.substring(0, 50),
                content,
                post_type: postType,
                image_url: imageUrl || null,
                platforms
            })
        });

        if (response.ok) {
            showAlert('Post published to ' + platforms.join(', '), 'success');

            // Clear form
            document.getElementById('post-type').value = 'travel_tip';
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            document.getElementById('post-image').value = '';
            document.querySelectorAll('input[name="platforms"]').forEach(cb => cb.checked = false);
            document.getElementById('char-count').textContent = '0/280 characters';

            // Reload posts
            loadRecentPosts();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to publish post', 'error');
        }
    } catch (error) {
        console.error('Error publishing post:', error);
        showAlert('Error publishing post', 'error');
    }
}

// LOAD CONNECTED ACCOUNTS
async function loadConnectedAccounts() {
    try {
        const response = await fetch(`${API_URL}/api/social/accounts`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const accountsList = document.getElementById('accounts-list');

            if (!data.accounts || data.accounts.length === 0) {
                accountsList.innerHTML = '<p style="color: #9ca3af;">No connected accounts yet</p>';
            } else {
                accountsList.innerHTML = data.accounts.map(account => `
                    <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" onclick="selectAccount('${account.platform}', '${account.id}')">
                        <div style="font-weight: 600;">${getPlatformEmoji(account.platform)} ${account.account_name}</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                            ${account.platform} • ${account.is_active ? '✅ Active' : '⚠️ Inactive'}
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// SELECT ACCOUNT AND SHOW DETAILS
function selectAccount(platform, accountId) {
    const detailsDiv = document.getElementById('account-details');
    detailsDiv.innerHTML = `
        <div style="text-align: left;">
            <p><strong>Platform:</strong> ${platform}</p>
            <p><strong>Account ID:</strong> ${accountId}</p>
            <button onclick="disconnectAccount('${accountId}')" class="btn btn-danger" style="margin-top: 15px;">
                🗑️ Disconnect Account
            </button>
        </div>
    `;
}

// DISCONNECT ACCOUNT
async function disconnectAccount(accountId) {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
        const response = await fetch(`${API_URL}/api/social/accounts/${accountId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showAlert('Account disconnected', 'success');
            loadConnectedAccounts();
            document.getElementById('account-details').innerHTML = 'Select an account to view details';
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to disconnect account', 'error');
        }
    } catch (error) {
        console.error('Error disconnecting account:', error);
        showAlert('Error disconnecting account', 'error');
    }
}

// OPEN CONNECT ACCOUNT MODAL
function openConnectModal() {
    const platforms = ['twitter', 'reddit', 'pinterest', 'instagram', 'linkedin'];
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
            <h3>🔗 Connect Social Media Account</h3>
            <select id="platform-select" style="width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Select Platform...</option>
                ${platforms.map(p => `<option value="${p}">${getPlatformName(p)}</option>`).join('')}
            </select>
            <input type="text" id="account-input" placeholder="Account Name/Token" style="width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ddd; border-radius: 6px;">
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                <button onclick="addAccount()" class="btn btn-primary" style="flex: 1;">Connect</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ADD NEW ACCOUNT
async function addAccount() {
    const platform = document.getElementById('platform-select').value;
    const accountName = document.getElementById('account-input').value;

    if (!platform || !accountName) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/social/accounts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                platform,
                account_name: accountName,
                access_token: accountName
            })
        });

        if (response.ok) {
            showAlert('Account connected', 'success');
            document.body.querySelector('div[style*="position: fixed"]').remove();
            loadConnectedAccounts();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to connect account', 'error');
        }
    } catch (error) {
        console.error('Error adding account:', error);
        showAlert('Error connecting account', 'error');
    }
}

// LOAD RECENT POSTS
async function loadRecentPosts() {
    try {
        const response = await fetch(`${API_URL}/api/social/posts`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const tbody = document.getElementById('posts-tbody');

            if (!data.posts || data.posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No posts yet</td></tr>';
            } else {
                tbody.innerHTML = data.posts.map(post => `
                    <tr>
                        <td>${new Date(post.created_at).toLocaleDateString()}</td>
                        <td>${getPlatformEmoji(post.platform)} ${post.platform}</td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${post.content}</td>
                        <td>${post.engagement || 0}</td>
                        <td>${post.status === 'published' ? '✅ Published' : '⏳ Scheduled'}</td>
                        <td>
                            <button onclick="deletePost('${post.id}')" class="btn btn-sm btn-danger">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// DELETE POST
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`${API_URL}/api/social/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showAlert('Post deleted', 'success');
            loadRecentPosts();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showAlert('Error deleting post', 'error');
    }
}


// HELPER: GET PLATFORM EMOJI
function getPlatformEmoji(platform) {
    const emojis = {
        twitter: '🐦',
        reddit: '🤖',
        pinterest: '📌',
        instagram: '📸',
        linkedin: '💼'
    };
    return emojis[platform] || '📱';
}

// HELPER: GET PLATFORM NAME
function getPlatformName(platform) {
    const names = {
        twitter: '🐦 Twitter',
        reddit: '🤖 Reddit',
        pinterest: '📌 Pinterest',
        instagram: '📸 Instagram',
        linkedin: '💼 LinkedIn'
    };
    return names[platform] || platform;
}

// CHARACTER COUNT FOR POST CONTENT
document.addEventListener('DOMContentLoaded', () => {
    const contentInput = document.getElementById('post-content');
    if (contentInput) {
        contentInput.addEventListener('input', function() {
            const charCount = this.value.length;
            document.getElementById('char-count').textContent = `${charCount}/280 characters`;
        });
    }
});

// ============================================================
// QUORA CONTENT GENERATOR
// ============================================================

async function loadQuoraStatus() {
    try {
        const response = await fetch(`${API_URL}/api/quora/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) return;
        const s = data.status;
        const countEl = document.getElementById('quora-answer-count');
        if (countEl) countEl.textContent = `${s.answerCounter} generiert`;
    } catch { /* non-blocking */ }

    // Also load questions into select
    try {
        const response = await fetch(`${API_URL}/api/quora/questions`, { headers: getAuthHeaders() });
        const data = await response.json();
        const select = document.getElementById('quora-question-select');
        if (select && data.questions) {
            data.questions.forEach(q => {
                const opt = document.createElement('option');
                opt.value = q.index;
                opt.textContent = `#${q.index + 1} ${q.question}`;
                select.appendChild(opt);
            });
        }
    } catch { /* non-blocking */ }
}

function _renderQuoraAnswer(item, prepend = false) {
    const container = document.getElementById('quora-answers-list');
    if (!container) return;

    if (container.querySelector('p[style*="color: #999"]')) {
        container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 16px;';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
            <div>
                <p style="font-weight: 700; font-size: 14px; color: #2c3e50; margin: 0;">${item.question}</p>
                <p style="font-size: 12px; color: #999; margin: 4px 0 0;">
                    ${item.category} · CTA: ${item.includedCTA ? '✅' : '—'}
                    ${item.posted_at ? ' · ' + new Date(item.posted_at).toLocaleString() : ''}
                </p>
            </div>
            <button onclick="copyQuoraAnswer(this)" data-answer="${encodeURIComponent(item.answer)}"
                style="padding: 7px 14px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; flex-shrink: 0;">
                📋 Kopieren
            </button>
        </div>
        <div style="font-size: 13px; color: #444; line-height: 1.6; white-space: pre-wrap; max-height: 180px; overflow-y: auto; background: #fafafa; padding: 12px; border-radius: 6px;">${item.answer}</div>`;

    if (prepend && container.firstChild) {
        container.insertBefore(div, container.firstChild);
    } else {
        container.appendChild(div);
    }
}

function copyQuoraAnswer(btn) {
    const answer = decodeURIComponent(btn.dataset.answer);
    navigator.clipboard.writeText(answer).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✅ Kopiert!';
        btn.style.background = '#38a169';
        setTimeout(() => { btn.textContent = orig; btn.style.background = '#7c3aed'; }, 2000);
    });
}

async function generateQuoraAnswer() {
    const btn = document.getElementById('quora-generate-btn');
    const resultEl = document.getElementById('quora-generate-result');
    const select = document.getElementById('quora-question-select');
    const questionIndex = select?.value !== '' ? parseInt(select.value) : undefined;

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generiere…'; }
    if (resultEl) resultEl.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/api/quora/generate`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionIndex })
        });
        const data = await response.json();

        if (data.success) {
            _renderQuoraAnswer(data, true);
            loadQuoraStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🤖 Antwort generieren'; }
    }
}

async function generateQuoraBatch() {
    const btn = document.getElementById('quora-batch-btn');
    const resultEl = document.getElementById('quora-generate-result');
    const count = parseInt(document.getElementById('quora-batch-count')?.value || '5');

    if (btn) { btn.disabled = true; btn.textContent = `⏳ Generiere ${count} Antworten…`; }
    if (resultEl) resultEl.innerHTML = `<p style="color: #999;">Generiere ${count} Antworten mit Claude Sonnet… Das dauert ca. ${count * 5}–${count * 8} Sekunden.</p>`;

    try {
        const response = await fetch(`${API_URL}/api/quora/generate-batch`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ count })
        });
        const data = await response.json();

        if (data.success) {
            if (resultEl) resultEl.innerHTML = `<p style="color: #38a169;">✅ ${data.count} Antworten generiert und bereit zum Kopieren.</p>`;
            // render all answers (prepend in reverse so newest appears first)
            data.answers.reverse().forEach(a => _renderQuoraAnswer(a, true));
            loadQuoraStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📦 Batch generieren'; }
    }
}

async function loadQuoraRecentAnswers() {
    try {
        const response = await fetch(`${API_URL}/api/quora/recent-answers`, { headers: getAuthHeaders() });
        const data = await response.json();
        const container = document.getElementById('quora-answers-list');
        if (!container) return;

        if (!data.answers || data.answers.length === 0) {
            container.innerHTML = '<p style="color: #999;">Noch keine Antworten generiert.</p>';
            return;
        }
        container.innerHTML = '';
        data.answers.forEach(a => _renderQuoraAnswer(a));
        const countEl = document.getElementById('quora-answer-count');
        if (countEl) countEl.textContent = `${data.answers.length} generiert`;
    } catch { /* non-blocking */ }
}

// ============================================================
// BLOGGER MANAGEMENT
// ============================================================

async function loadBloggerStatus() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) return;
        const s = data.status;

        const connEl = document.getElementById('blogger-connection-status');
        if (connEl) {
            if (s.connected) {
                connEl.innerHTML = `<span style="color: #38a169;">✅ Google-Konto verbunden</span>${s.blogId ? ` · Blog ID: <code>${s.blogId}</code>` : ' · <em style="color:#e67e22;">Blog ID noch nicht gesetzt</em>'}`;
            } else {
                connEl.innerHTML = `<span style="color: #e53e3e;">❌ Nicht verbunden — Google-Konto verknüpfen</span>`;
            }
        }
        const schedEl = document.getElementById('blogger-scheduler-status');
        if (schedEl) schedEl.textContent = s.schedulerRunning ? '▶️' : '⏸️';
        const freqEl = document.getElementById('blogger-frequency');
        if (freqEl) freqEl.textContent = `${s.frequencyHours}h`;
        const countEl = document.getElementById('blogger-post-count');
        if (countEl) countEl.textContent = s.postCounter;
    } catch { /* non-blocking */ }

    // Populate topic dropdown
    try {
        const response = await fetch(`${API_URL}/api/blogger/topics`, { headers: getAuthHeaders() });
        const data = await response.json();
        const select = document.getElementById('blogger-topic-select');
        if (select && data.topics && select.options.length <= 1) {
            data.topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.index;
                opt.textContent = `#${t.index + 1} ${t.title}`;
                select.appendChild(opt);
            });
        }
    } catch { /* non-blocking */ }
}

async function getBloggerAuthUrl() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/auth-url`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) { showAlert(data.error, 'error'); return; }

        const section = document.getElementById('blogger-auth-section');
        if (section) section.style.display = 'block';

        // Open auth URL in new tab
        window.open(data.url, '_blank');
        showAlert('Google-Authentifizierungsseite geöffnet. Nach der Anmeldung den Code hier einfügen.', 'info');
    } catch (err) {
        showAlert('Fehler: ' + err.message, 'error');
    }
}

async function exchangeBloggerToken() {
    const code = document.getElementById('blogger-auth-code')?.value?.trim();
    if (!code) { showAlert('Bitte Autorisierungscode einfügen', 'error'); return; }

    try {
        const response = await fetch(`${API_URL}/api/blogger/exchange-token`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await response.json();
        if (data.success) {
            showAlert('✅ Google-Konto erfolgreich verbunden!', 'success');
            document.getElementById('blogger-auth-section').style.display = 'none';
            document.getElementById('blogger-auth-code').value = '';
            loadBloggerStatus();
        } else {
            showAlert('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showAlert('Fehler: ' + err.message, 'error');
    }
}

async function loadBloggerBlogs() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/blogs`, { headers: getAuthHeaders() });
        const data = await response.json();
        const container = document.getElementById('blogger-blogs-list');
        const section = document.getElementById('blogger-blogs-section');
        if (!container || !section) return;

        if (!data.success) { showAlert(data.error, 'error'); return; }

        section.style.display = 'block';
        container.innerHTML = '';
        data.blogs.forEach(blog => {
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;';
            div.innerHTML = `
                <div>
                    <strong style="font-size: 14px;">${blog.name}</strong>
                    <a href="${blog.url}" target="_blank" style="font-size: 12px; color: #999; display: block;">${blog.url}</a>
                </div>
                <button onclick="selectBloggerBlog('${blog.id}', '${blog.name}')" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;">✅ Auswählen</button>`;
            container.appendChild(div);
        });
    } catch (err) {
        showAlert('Fehler: ' + err.message, 'error');
    }
}

async function selectBloggerBlog(blogId, blogName) {
    try {
        const response = await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { blogger_blog_id: blogId } })
        });
        const el = document.getElementById('blogger-blog-id');
        if (el) el.value = blogId;
        document.getElementById('blogger-blogs-section').style.display = 'none';
        showAlert(`Blog "${blogName}" ausgewählt (ID: ${blogId})`, 'success');
        await fetch(`${API_URL}/api/blogger/reload-settings`, { method: 'POST', headers: getAuthHeaders() });
        loadBloggerStatus();
    } catch (err) {
        showAlert('Fehler: ' + err.message, 'error');
    }
}

async function publishBloggerPost() {
    const btn = document.getElementById('blogger-publish-btn');
    const resultEl = document.getElementById('blogger-publish-result');
    const select = document.getElementById('blogger-topic-select');
    const topicIndex = select?.value !== '' ? parseInt(select.value) : undefined;

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generiere & veröffentliche…'; }
    if (resultEl) resultEl.innerHTML = '<p style="color:#999;">Claude Sonnet schreibt den Artikel… (~15–20 Sek.)</p>';

    try {
        const response = await fetch(`${API_URL}/api/blogger/publish`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicIndex })
        });
        const data = await response.json();
        if (data.success) {
            resultEl.innerHTML = `
                <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 14px; margin-top: 10px;">
                    <p style="font-weight: 700; margin: 0 0 6px;">${data.title}</p>
                    <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Kategorie: ${data.category} · CTA: ${data.includedCTA ? '✅' : '—'}</p>
                    ${data.bloggerUrl ? `<a href="${data.bloggerUrl}" target="_blank" style="color: #4285f4; font-size: 13px;">📰 Auf Blogger lesen →</a>` : ''}
                </div>`;
            loadBloggerRecentPosts();
            loadBloggerStatus();
        } else {
            resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Artikel veröffentlichen'; }
    }
}

async function startBloggerScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/scheduler/start`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.started ? `Blogger Scheduler gestartet — alle ${data.intervalHours}h` : (data.reason || 'Konnte nicht starten'), data.started ? 'success' : 'warning');
        loadBloggerStatus();
    } catch (err) { showAlert('Server error: ' + err.message, 'error'); }
}

async function stopBloggerScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/scheduler/stop`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.stopped ? 'Blogger Scheduler gestoppt' : (data.reason || 'Nicht aktiv'), data.stopped ? 'success' : 'warning');
        loadBloggerStatus();
    } catch (err) { showAlert('Server error: ' + err.message, 'error'); }
}

async function loadBloggerRecentPosts() {
    try {
        const response = await fetch(`${API_URL}/api/blogger/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        const container = document.getElementById('blogger-posts-list');
        if (!container) return;
        if (!data.posts || data.posts.length === 0) {
            container.innerHTML = '<p style="color: #999;">Noch keine Artikel veröffentlicht.</p>';
            return;
        }
        container.innerHTML = data.posts.map(p => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <div>
                    <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px;">${p.title}</p>
                    <p style="font-size: 12px; color: #999; margin: 0;">
                        ${p.category} · CTA: ${p.included_cta ? '✅' : '—'} · ${new Date(p.posted_at).toLocaleString()}
                    </p>
                </div>
                ${p.blogger_url ? `<a href="${p.blogger_url}" target="_blank" style="font-size: 12px; color: #4285f4; white-space: nowrap; flex-shrink: 0;">Lesen →</a>` : ''}
            </div>`).join('');
    } catch { /* non-blocking */ }
}

// ============================================================
// WORDPRESS MANAGEMENT
// ============================================================

async function loadWordPressStatus() {
    try {
        const response = await fetch(`${API_URL}/api/wordpress/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) return;
        const s = data.status;

        const connEl = document.getElementById('wp-connection-status');
        if (connEl) {
            connEl.innerHTML = s.connected
                ? `<span style="color:#38a169;">✅ Verbunden</span>${s.siteId ? ` · Site ID: <code>${s.siteId}</code>` : ' · <em style="color:#e67e22;">Site ID noch nicht gesetzt</em>'}`
                : `<span style="color:#e53e3e;">❌ Nicht verbunden — WordPress-Konto verknüpfen</span>`;
        }
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('wp-scheduler-status', s.schedulerRunning ? '▶️' : '⏸️');
        set('wp-post-count', s.postCounter);
        set('wp-frequency', `${s.frequencyHours}h`);
    } catch { /* non-blocking */ }

    // Populate topic dropdown
    try {
        const response = await fetch(`${API_URL}/api/wordpress/topics`, { headers: getAuthHeaders() });
        const data = await response.json();
        const select = document.getElementById('wp-topic-select');
        if (select && data.topics && select.options.length <= 1) {
            data.topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.index;
                opt.textContent = `#${t.index + 1} ${t.title}`;
                select.appendChild(opt);
            });
        }
    } catch { /* non-blocking */ }
}

async function getWordPressAuthUrl() {
    try {
        const response = await fetch(`${API_URL}/api/wordpress/auth-url`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) { showAlert(data.error, 'error'); return; }
        const section = document.getElementById('wp-auth-section');
        if (section) section.style.display = 'block';
        window.open(data.url, '_blank');
        showAlert('WordPress-Anmeldeseite geöffnet. Nach der Anmeldung den Code aus der URL kopieren.', 'info');
    } catch (err) { showAlert('Fehler: ' + err.message, 'error'); }
}

async function exchangeWordPressToken() {
    const code = document.getElementById('wp-auth-code')?.value?.trim();
    if (!code) { showAlert('Bitte Code einfügen', 'error'); return; }
    try {
        const response = await fetch(`${API_URL}/api/wordpress/exchange-token`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await response.json();
        if (data.success) {
            showAlert('✅ WordPress-Konto erfolgreich verbunden!', 'success');
            document.getElementById('wp-auth-section').style.display = 'none';
            document.getElementById('wp-auth-code').value = '';
            loadWordPressStatus();
        } else {
            showAlert('❌ ' + data.error, 'error');
        }
    } catch (err) { showAlert('Fehler: ' + err.message, 'error'); }
}

async function loadWordPressSites() {
    try {
        const response = await fetch(`${API_URL}/api/wordpress/sites`, { headers: getAuthHeaders() });
        const data = await response.json();
        const container = document.getElementById('wp-sites-list');
        const section = document.getElementById('wp-sites-section');
        if (!container || !section) return;
        if (!data.success) { showAlert(data.error, 'error'); return; }
        section.style.display = 'block';
        container.innerHTML = '';
        data.sites.forEach(site => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;';
            div.innerHTML = `
                <div>
                    <strong style="font-size:14px;">${site.name}</strong>
                    <a href="${site.url}" target="_blank" style="font-size:12px;color:#999;display:block;">${site.url}</a>
                </div>
                <button onclick="selectWordPressSite('${site.id}','${site.name}')" class="btn btn-secondary" style="font-size:12px;padding:6px 12px;">✅ Auswählen</button>`;
            container.appendChild(div);
        });
    } catch (err) { showAlert('Fehler: ' + err.message, 'error'); }
}

async function selectWordPressSite(siteId, siteName) {
    try {
        await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { wordpress_site_id: siteId } })
        });
        document.getElementById('wp-sites-section').style.display = 'none';
        showAlert(`Site "${siteName}" ausgewählt`, 'success');
        await fetch(`${API_URL}/api/wordpress/reload-settings`, { method: 'POST', headers: getAuthHeaders() });
        loadWordPressStatus();
    } catch (err) { showAlert('Fehler: ' + err.message, 'error'); }
}

async function publishWordPressPost() {
    const btn = document.getElementById('wp-publish-btn');
    const resultEl = document.getElementById('wp-publish-result');
    const select = document.getElementById('wp-topic-select');
    const topicIndex = select?.value !== '' ? parseInt(select.value) : undefined;

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generiere & veröffentliche…'; }
    if (resultEl) resultEl.innerHTML = '<p style="color:#999;">Claude Sonnet schreibt den Artikel… (~15–20 Sek.)</p>';

    try {
        const response = await fetch(`${API_URL}/api/wordpress/publish`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicIndex })
        });
        const data = await response.json();
        if (data.success) {
            resultEl.innerHTML = `
                <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:8px;padding:14px;margin-top:10px;">
                    <p style="font-weight:700;margin:0 0 6px;">${data.title}</p>
                    <p style="font-size:13px;color:#666;margin:0 0 10px;">Kategorie: ${data.category} · CTA: ${data.includedCTA ? '✅' : '—'}</p>
                    ${data.wpUrl ? `<a href="${data.wpUrl}" target="_blank" style="color:#21759b;font-size:13px;">📝 Auf WordPress lesen →</a>` : ''}
                </div>`;
            loadWordPressRecentPosts();
            loadWordPressStatus();
        } else {
            resultEl.innerHTML = `<p style="color:#e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        resultEl.innerHTML = `<p style="color:#e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Artikel veröffentlichen'; }
    }
}

async function startWordPressScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/wordpress/scheduler/start`, { method: 'POST', headers: getAuthHeaders() });
        const data = await response.json();
        showAlert(data.started ? `WordPress Scheduler gestartet — alle ${data.intervalHours}h` : (data.reason || 'Konnte nicht starten'), data.started ? 'success' : 'warning');
        loadWordPressStatus();
    } catch (err) { showAlert('Server error: ' + err.message, 'error'); }
}

async function stopWordPressScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/wordpress/scheduler/stop`, { method: 'POST', headers: getAuthHeaders() });
        const data = await response.json();
        showAlert(data.stopped ? 'WordPress Scheduler gestoppt' : (data.reason || 'Nicht aktiv'), data.stopped ? 'success' : 'warning');
        loadWordPressStatus();
    } catch (err) { showAlert('Server error: ' + err.message, 'error'); }
}

async function loadWordPressRecentPosts() {
    const container = document.getElementById('wp-posts-list');
    if (!container) return;
    try {
        const response = await fetch(`${API_URL}/api/wordpress/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.posts || data.posts.length === 0) {
            container.innerHTML = '<p style="color:#999;">Noch keine Artikel veröffentlicht.</p>';
            return;
        }
        container.innerHTML = data.posts.map(p => `
            <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div>
                    <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${p.title}</p>
                    <p style="font-size:12px;color:#999;margin:0;">${p.category} · CTA: ${p.included_cta ? '✅' : '—'} · ${new Date(p.posted_at).toLocaleString()}</p>
                </div>
                ${p.wp_url ? `<a href="${p.wp_url}" target="_blank" style="font-size:12px;color:#21759b;white-space:nowrap;flex-shrink:0;">Lesen →</a>` : ''}
            </div>`).join('');
    } catch { container.innerHTML = '<p style="color:#999;">Konnte Artikel nicht laden.</p>'; }
}

// ============================================================
// INSTAGRAM MANAGEMENT
// ============================================================

async function loadInstagramStatus() {
    try {
        const response = await fetch(`${API_URL}/api/instagram/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        const el = document.getElementById('instagram-status');
        if (!el) return;

        if (!data.success || !data.status.configured) {
            el.innerHTML = `
                <p style="color: #ffcccc;">❌ Instagram not configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Access Token + Account ID in Settings → Social Media → Instagram. Ideogram Key in Pinterest-Tab.</p>`;
            return;
        }
        const s = data.status;
        el.innerHTML = `
            <p style="color: #ccffcc;">✅ Verbunden · Account ID: ${s.accountId} · Ideogram: ${s.ideogramConfigured ? '✅' : '❌'}</p>
            <p style="font-size: 13px; margin-top: 8px;">
                Scheduler: <strong>${s.schedulerRunning ? '▶️ Running' : '⏹️ Stopped'}</strong> &nbsp;|&nbsp;
                Frequenz: <strong>${s.frequency}</strong> &nbsp;|&nbsp;
                Nächstes Thema: <strong>${s.nextTopic || '—'}</strong>
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Posts gesamt: ${s.postCounter} (CTA jeden 2. Post)</p>`;
    } catch {
        const el = document.getElementById('instagram-status');
        if (el) el.innerHTML = `<p style="color: #ffcccc;">⚠️ Server nicht erreichbar</p>`;
    }
}

async function postInstagram() {
    const btn = document.getElementById('instagram-post-btn');
    const resultEl = document.getElementById('instagram-post-result');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating & posting...'; }
    if (resultEl) resultEl.innerHTML = '<p style="color: #999;">Ideogram generiert Bild, Claude schreibt Caption, dann Instagram-Post…</p>';

    try {
        const response = await fetch(`${API_URL}/api/instagram/post`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            if (resultEl) resultEl.innerHTML = `
                <div style="background: #f0fff4; padding: 12px; border-radius: 8px; border-left: 4px solid #38a169; display: flex; gap: 15px; align-items: flex-start;">
                    ${data.imageUrl ? `<img src="${data.imageUrl}" style="width: 80px; border-radius: 6px; flex-shrink: 0;">` : ''}
                    <div>
                        <p>✅ <strong>${data.title}</strong></p>
                        <p style="font-size: 13px; margin-top: 4px;">Kategorie: ${data.category} · CTA: ${data.includedCTA ? 'Ja ✅' : '—'}</p>
                        <p style="font-size: 12px; color: #666; margin-top: 4px;">${data.captionPreview}</p>
                    </div>
                </div>`;
            loadInstagramRecentPosts();
            loadInstagramStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📸 Generate & Post'; }
    }
}

async function startInstagramScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/instagram/scheduler/start`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.started ? `Instagram Scheduler gestartet — alle ${data.intervalMinutes} Minuten` : (data.reason || 'Konnte nicht starten'), data.started ? 'success' : 'warning');
        loadInstagramStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function stopInstagramScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/instagram/scheduler/stop`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.stopped ? 'Instagram Scheduler gestoppt' : (data.reason || 'Nicht aktiv'), data.stopped ? 'success' : 'warning');
        loadInstagramStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function loadInstagramRecentPosts() {
    const el = document.getElementById('instagram-recent-posts');
    if (!el) return;
    try {
        const response = await fetch(`${API_URL}/api/instagram/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.posts || data.posts.length === 0) {
            el.innerHTML = '<p style="color: #999;">Noch keine Posts.</p>';
            return;
        }
        el.innerHTML = data.posts.map(p => `
            <div style="padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 12px; align-items: flex-start;">
                ${p.image_url ? `<img src="${p.image_url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">` : ''}
                <div>
                    <p style="font-weight: 600; margin: 0;">${p.title}</p>
                    <p style="font-size: 12px; color: #555; margin: 4px 0 0;">${(p.caption || '').substring(0, 100)}…</p>
                    <p style="font-size: 12px; color: #999; margin: 2px 0 0;">
                        ${p.category} · CTA: ${p.included_cta ? '✅' : '—'} · ${new Date(p.posted_at).toLocaleString()}
                    </p>
                </div>
            </div>`).join('');
    } catch {
        el.innerHTML = '<p style="color: #999;">Konnte Posts nicht laden.</p>';
    }
}

// ============================================================
// PINTEREST MANAGEMENT
// ============================================================

async function reloadPinterestSettings() {
    try {
        const response = await fetch(`${API_URL}/api/pinterest/reload-settings`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.configured) {
            showAlert('✅ Pinterest konfiguriert und bereit!', 'success');
        } else {
            const d = data.debug || {};
            const missing = [];
            if (!d.hasAccessToken) missing.push('Access Token');
            if (!d.hasBoardId) missing.push('Board ID');
            if (!d.hasIdeogramKey) missing.push('Ideogram Key');
            showAlert(`⚠️ Fehlend in der Datenbank: ${missing.join(', ')}. Bitte Settings speichern und nochmal versuchen.`, 'warning');
            console.log('Pinterest debug:', data.debug);
        }
        loadPinterestStatus();
    } catch (err) {
        showAlert('Fehler: ' + err.message, 'error');
    }
}

async function loadPinterestStatus() {
    try {
        const response = await fetch(`${API_URL}/api/pinterest/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        const statusEl = document.getElementById('pinterest-status');
        if (!statusEl) return;

        if (!data.success || !data.status.configured) {
            statusEl.innerHTML = `
                <p style="color: #ffcccc;">❌ Pinterest not configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Access Token, Board ID und Ideogram API Key in Settings → Social Media → Pinterest eintragen</p>`;
            return;
        }
        const s = data.status;
        statusEl.innerHTML = `
            <p style="color: #ccffcc;">✅ Verbunden · Board ID: ${s.boardId} · Ideogram: ${s.ideogramConfigured ? '✅' : '❌'}</p>
            <p style="font-size: 13px; margin-top: 8px;">
                Scheduler: <strong>${s.schedulerRunning ? '▶️ Running' : '⏹️ Stopped'}</strong> &nbsp;|&nbsp;
                Frequenz: <strong>${s.frequency}</strong> &nbsp;|&nbsp;
                Nächstes Thema: <strong>${s.nextTopic || '—'}</strong>
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Pins gesamt: ${s.postCounter} (CTA jeden 2. Pin)</p>`;
    } catch {
        const el = document.getElementById('pinterest-status');
        if (el) el.innerHTML = `<p style="color: #ffcccc;">⚠️ Server nicht erreichbar</p>`;
    }
}

async function postPinterestPin() {
    const btn = document.getElementById('pinterest-post-btn');
    const resultEl = document.getElementById('pinterest-post-result');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating image & pinning...'; }
    if (resultEl) resultEl.innerHTML = '<p style="color: #999;">Ideogram generiert Infografik, dann Pinterest-Pin erstellen…</p>';

    try {
        const response = await fetch(`${API_URL}/api/pinterest/post-pin`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            if (resultEl) resultEl.innerHTML = `
                <div style="background: #f0fff4; padding: 12px; border-radius: 8px; border-left: 4px solid #38a169; display: flex; gap: 15px; align-items: flex-start;">
                    ${data.imageUrl ? `<img src="${data.imageUrl}" style="width: 80px; border-radius: 6px; flex-shrink: 0;">` : ''}
                    <div>
                        <p>✅ <strong>${data.title}</strong></p>
                        <p style="font-size: 13px; margin-top: 4px;">Kategorie: ${data.category} · CTA: ${data.includedCTA ? 'Ja ✅' : '—'}</p>
                        <p style="font-size: 12px; color: #666; margin-top: 4px;">${data.description}</p>
                    </div>
                </div>`;
            loadPinterestRecentPosts();
            loadPinterestStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📌 Generate & Pin'; }
    }
}

async function loadPinterestTopics() {
    const container = document.getElementById('pinterest-topics');
    const listEl = document.getElementById('pinterest-topics-list');
    if (!container || !listEl) return;

    try {
        const response = await fetch(`${API_URL}/api/pinterest/topics`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.topics) return;

        listEl.innerHTML = data.topics.map(t => `
            <div style="padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; background: ${t.isNext ? '#fff5f0' : '#f9f9f9'}; border: 1px solid ${t.isNext ? '#e60023' : '#eee'};">
                <span style="font-size: 12px; color: #999;">#${t.index + 1}</span>
                ${t.isNext ? '<span style="font-size: 11px; background: #e60023; color: white; padding: 2px 6px; border-radius: 10px; margin: 0 6px;">NEXT</span>' : ''}
                <strong>${t.title}</strong>
                <span style="font-size: 12px; color: #888; margin-left: 8px;">${t.category}</span>
            </div>`).join('');

        container.style.display = 'block';
    } catch {
        listEl.innerHTML = '<p style="color: #999;">Konnte Topics nicht laden.</p>';
        container.style.display = 'block';
    }
}

async function startPinterestScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/pinterest/scheduler/start`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.started ? `Pinterest Scheduler gestartet — alle ${data.intervalMinutes} Minuten` : (data.reason || 'Konnte nicht starten'), data.started ? 'success' : 'warning');
        loadPinterestStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function stopPinterestScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/pinterest/scheduler/stop`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.stopped ? 'Pinterest Scheduler gestoppt' : (data.reason || 'Nicht aktiv'), data.stopped ? 'success' : 'warning');
        loadPinterestStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function loadPinterestRecentPosts() {
    const el = document.getElementById('pinterest-recent-posts');
    if (!el) return;
    try {
        const response = await fetch(`${API_URL}/api/pinterest/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.posts || data.posts.length === 0) {
            el.innerHTML = '<p style="color: #999;">Noch keine Pins.</p>';
            return;
        }
        el.innerHTML = data.posts.map(p => `
            <div style="padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 12px; align-items: flex-start;">
                ${p.image_url ? `<img src="${p.image_url}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">` : ''}
                <div>
                    <p style="font-weight: 600; margin: 0;">${p.title}</p>
                    <p style="font-size: 12px; color: #666; margin: 4px 0 0;">
                        ${p.category} · CTA: ${p.included_cta ? '✅' : '—'} · ${new Date(p.posted_at).toLocaleString()}
                    </p>
                </div>
            </div>`).join('');
    } catch {
        el.innerHTML = '<p style="color: #999;">Konnte Posts nicht laden.</p>';
    }
}

// ============================================================
// LINKEDIN MANAGEMENT
// ============================================================

async function loadLinkedInStatus() {
    try {
        const response = await fetch(`${API_URL}/api/linkedin/status`, { headers: getAuthHeaders() });
        const data = await response.json();
        const statusEl = document.getElementById('linkedin-status');
        if (!statusEl) return;

        if (!data.success || !data.status.configured) {
            statusEl.innerHTML = `
                <p style="color: #ffcccc;">❌ LinkedIn not configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Add Access Token and Organization ID in Settings → Social Media → LinkedIn</p>`;
            return;
        }

        const s = data.status;
        statusEl.innerHTML = `
            <p style="color: #ccffcc;">✅ Connected · Organization ID: ${s.orgId}</p>
            <p style="font-size: 13px; margin-top: 8px;">
                Scheduler: <strong>${s.schedulerRunning ? '▶️ Running' : '⏹️ Stopped'}</strong> &nbsp;|&nbsp;
                Frequency: <strong>${s.frequency}</strong> &nbsp;|&nbsp;
                Posting time: <strong>${s.postingTime}</strong>
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Posts this session: ${s.postCounter} (CTA included every 2nd post)</p>`;
    } catch {
        const statusEl = document.getElementById('linkedin-status');
        if (statusEl) statusEl.innerHTML = `<p style="color: #ffcccc;">⚠️ Could not reach server</p>`;
    }
}

async function postLinkedInArticle() {
    const btn = document.getElementById('linkedin-post-btn');
    const resultEl = document.getElementById('linkedin-post-result');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating & posting...'; }
    if (resultEl) resultEl.innerHTML = '<p style="color: #999;">Generating post with AI, then publishing to LinkedIn...</p>';

    try {
        const response = await fetch(`${API_URL}/api/linkedin/post-article`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            if (resultEl) resultEl.innerHTML = `
                <div style="background: #f0fff4; padding: 12px; border-radius: 8px; border-left: 4px solid #38a169;">
                    <p>✅ Post published · Category: <strong>${data.category}</strong> · CTA included: ${data.includedCTA ? 'Yes' : 'No'}</p>
                    <p style="font-size: 13px; margin-top: 6px; color: #555;">${data.preview}</p>
                </div>`;
            loadLinkedInRecentPosts();
            loadLinkedInStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💼 Generate & Post'; }
    }
}

async function startLinkedInScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/linkedin/scheduler/start`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.started ? `LinkedIn scheduler started — every ${data.intervalMinutes} minutes` : (data.reason || 'Could not start'), data.started ? 'success' : 'warning');
        loadLinkedInStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function stopLinkedInScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/linkedin/scheduler/stop`, {
            method: 'POST', headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.stopped ? 'LinkedIn scheduler stopped' : (data.reason || 'Not running'), data.stopped ? 'success' : 'warning');
        loadLinkedInStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function loadLinkedInRecentPosts() {
    const el = document.getElementById('linkedin-recent-posts');
    if (!el) return;
    try {
        const response = await fetch(`${API_URL}/api/linkedin/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.posts || data.posts.length === 0) {
            el.innerHTML = '<p style="color: #999;">No posts yet.</p>';
            return;
        }
        el.innerHTML = data.posts.map(p => `
            <div style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
                <p style="font-size: 13px; margin: 0; color: #333;">${p.body.substring(0, 120)}…</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0;">
                    Category: ${p.category} · CTA: ${p.included_cta ? '✅' : '—'} ·
                    ${new Date(p.posted_at).toLocaleString()}
                    ${p.linkedin_post_id ? ` · Post ID: ${p.linkedin_post_id}` : ''}
                </p>
            </div>`).join('');
    } catch {
        el.innerHTML = '<p style="color: #999;">Could not load posts.</p>';
    }
}

// ============================================================
// REDDIT MANAGEMENT
// ============================================================

async function loadRedditStatus() {
    try {
        const response = await fetch(`${API_URL}/api/reddit/status`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        const statusEl = document.getElementById('reddit-status');
        if (!statusEl) return;

        if (!data.success || !data.status.configured) {
            statusEl.innerHTML = `
                <p style="color: #ffcccc;">❌ Reddit not configured</p>
                <p style="font-size: 12px; opacity: 0.8;">Add Reddit API credentials in Settings → Social Media → Reddit</p>`;
            return;
        }

        const s = data.status;
        statusEl.innerHTML = `
            <p style="color: #ccffcc;">✅ Connected as u/${s.username}</p>
            <p style="font-size: 13px; margin-top: 8px;">
                Scheduler: <strong>${s.schedulerRunning ? '▶️ Running' : '⏹️ Stopped'}</strong> &nbsp;|&nbsp;
                Frequency: <strong>${s.frequency}</strong> &nbsp;|&nbsp;
                Subreddits: <strong>${s.subreddits}</strong>
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Posts this session: ${s.postCounter} (CTA included every 2nd post)</p>`;
    } catch (err) {
        const statusEl = document.getElementById('reddit-status');
        if (statusEl) statusEl.innerHTML = `<p style="color: #ffcccc;">⚠️ Could not reach server</p>`;
    }
}

async function postRedditArticle() {
    const btn = document.getElementById('reddit-post-btn');
    const resultEl = document.getElementById('reddit-post-result');
    const subreddit = document.getElementById('reddit-custom-subreddit')?.value?.trim() || '';

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating & posting...'; }
    if (resultEl) resultEl.innerHTML = '<p style="color: #999;">Generating article with AI, then posting to Reddit...</p>';

    try {
        const response = await fetch(`${API_URL}/api/reddit/post-article`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ subreddit: subreddit || undefined })
        });
        const data = await response.json();

        if (data.success) {
            if (resultEl) resultEl.innerHTML = `
                <div style="background: #f0fff4; padding: 12px; border-radius: 8px; border-left: 4px solid #38a169;">
                    <p>✅ <strong>${data.title}</strong></p>
                    <p style="font-size: 13px; margin-top: 4px;">Posted to r/${data.subreddit} · Category: ${data.category} · CTA included: ${data.includedCTA ? 'Yes' : 'No'}</p>
                    ${data.url ? `<a href="${data.url}" target="_blank" style="color: #667eea; font-size: 13px;">View post →</a>` : ''}
                </div>`;
            loadRedditRecentPosts();
            loadRedditStatus();
        } else {
            if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${data.error}</p>`;
        }
    } catch (err) {
        if (resultEl) resultEl.innerHTML = `<p style="color: #e53e3e;">❌ ${err.message}</p>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🤖 Generate & Post Article'; }
    }
}

async function startRedditScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/reddit/scheduler/start`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success && data.started) {
            showAlert(`Reddit scheduler started — posting every ${data.intervalMinutes} minutes`, 'success');
        } else {
            showAlert(data.reason || 'Could not start scheduler', 'warning');
        }
        loadRedditStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function stopRedditScheduler() {
    try {
        const response = await fetch(`${API_URL}/api/reddit/scheduler/stop`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        showAlert(data.stopped ? 'Reddit scheduler stopped' : (data.reason || 'Not running'), data.stopped ? 'success' : 'warning');
        loadRedditStatus();
    } catch (err) {
        showAlert('Server error: ' + err.message, 'error');
    }
}

async function loadRedditRecentPosts() {
    const el = document.getElementById('reddit-recent-posts');
    if (!el) return;
    try {
        const response = await fetch(`${API_URL}/api/reddit/recent-posts`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.posts || data.posts.length === 0) {
            el.innerHTML = '<p style="color: #999;">No posts yet.</p>';
            return;
        }
        el.innerHTML = data.posts.map(p => `
            <div style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
                <p style="font-weight: 600; margin: 0;">${p.title}</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0;">
                    r/${p.subreddit} · ${p.category} · CTA: ${p.included_cta ? '✅' : '—'} ·
                    ${new Date(p.posted_at).toLocaleString()}
                    ${p.reddit_url ? ` · <a href="${p.reddit_url}" target="_blank" style="color: #667eea;">View</a>` : ''}
                </p>
            </div>`).join('');
    } catch {
        el.innerHTML = '<p style="color: #999;">Could not load posts.</p>';
    }
}
