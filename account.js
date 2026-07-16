// User Account Dashboard
// Uses api-service.js for consistent API communication

// Check if user is logged in
function checkAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadProfile();
    loadSubscription();
    loadPaymentHistory();
    loadSavedHacks();
    loadDealFilters();
});

// Show alert message
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert show alert-${type}`;

    setTimeout(() => {
        alert.classList.remove('show');
    }, 4000);
}

// Load user profile
async function loadProfile() {
    try {
        const response = await api.request('GET', '/auth/me');

        if (!response || !response.user) throw new Error('Failed to load profile');

        const user = response.user;

        document.getElementById('profile-name').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-joined').textContent = formatDate(user.createdAt);

        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-content').style.display = 'block';

        // Store user data for later use
        window.currentUser = user;
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile', 'error');
    }
}

// Load user subscription
async function loadSubscription() {
    try {
        const response = await api.request('GET', '/subscriptions/current');

        if (!response || !response.subscription) throw new Error('Failed to load subscription');

        const subscription = response.subscription;

        const tierNames = {
            'free': 'Free',
            'smart_traveler': 'Smart Traveler',
            'elite': 'Elite'
        };

        const tierBadges = {
            'free': 'badge-free',
            'smart_traveler': 'badge-smart',
            'elite': 'badge-elite'
        };

        const tierDisplay = tierNames[subscription.tier] || subscription.tier;
        document.getElementById('subscription-tier').textContent = tierDisplay;

        const badge = document.getElementById('subscription-badge');
        badge.textContent = tierDisplay;
        badge.className = `subscription-badge ${tierBadges[subscription.tier]}`;

        const isActive = subscription.status === 'active';
        if (isActive && subscription.cancelAtPeriodEnd) {
            document.getElementById('subscription-status').textContent = `Cancels on ${subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'period end'}`;
        } else {
            document.getElementById('subscription-status').textContent = isActive ? 'Active' : 'Inactive';
        }
        document.getElementById('subscription-next-billing').textContent = subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A';

        document.getElementById('subscription-loading').style.display = 'none';
        document.getElementById('subscription-content').style.display = 'block';

        // Show deal filters card for Elite users
        if (subscription.tier === 'elite') {
            document.getElementById('deal-filters-card').style.display = 'block';
        }

        // Store subscription for later use
        window.currentSubscription = subscription;
    } catch (error) {
        console.error('Error loading subscription:', error);
        showAlert('Failed to load subscription', 'error');
    }
}

// Load payment history
async function loadPaymentHistory() {
    try {
        const response = await api.request('GET', '/subscriptions/current');

        if (!response || !response.subscription) throw new Error('Failed to load payment history');

        const subscription = response.subscription;

        // For now, show the current subscription as a recent payment
        // In a real app, you'd query a separate payment history endpoint
        const tbody = document.getElementById('payments-table-body');

        if (subscription && (subscription.currentPeriodStart || subscription.tier !== 'free')) {
            const row = document.createElement('tr');
            const paymentDate = subscription.currentPeriodStart || new Date().toISOString();
            row.innerHTML = `
                <td>${formatDate(paymentDate)}</td>
                <td>$${subscription.priceMonthly || '0.00'}</td>
                <td>${subscription.tier === 'smart_traveler' ? 'Smart Traveler' : subscription.tier === 'elite' ? 'Elite' : 'Free'}</td>
                <td><span class="status-badge status-success">Completed</span></td>
            `;
            tbody.appendChild(row);
        }

        if (tbody.children.length === 0) {
            document.getElementById('payments-empty').style.display = 'block';
        } else {
            document.getElementById('payments-content').style.display = 'block';
        }

        document.getElementById('payments-loading').style.display = 'none';
    } catch (error) {
        console.error('Error loading payment history:', error);
        document.getElementById('payments-loading').style.display = 'none';
        document.getElementById('payments-empty').style.display = 'block';
    }
}

// Load saved hacks
async function loadSavedHacks() {
    try {
        const response = await api.getSavedHacks();

        if (!response || !response.savedHacks) throw new Error('Failed to load saved hacks');

        const hacks = response.savedHacks || [];

        const grid = document.getElementById('hacks-grid');

        if (hacks.length === 0) {
            document.getElementById('hacks-empty').style.display = 'block';
        } else {
            hacks.forEach(hack => {
                const card = document.createElement('div');
                card.className = 'hack-card';
                card.innerHTML = `
                    <h4>${hack.title || 'Hack'}</h4>
                    <p><strong>Category:</strong> ${hack.category || 'General'}</p>
                    <p><strong>Saved:</strong> ${formatDate(hack.saved_at)}</p>
                `;
                grid.appendChild(card);
            });
            document.getElementById('hacks-content').style.display = 'block';
        }

        document.getElementById('hacks-loading').style.display = 'none';
    } catch (error) {
        console.error('Error loading saved hacks:', error);
        document.getElementById('hacks-loading').style.display = 'none';
        document.getElementById('hacks-empty').style.display = 'block';
    }
}

// Modal functions
function openEditProfileModal() {
    if (window.currentUser) {
        document.getElementById('modal-first-name').value = window.currentUser.firstName || '';
        document.getElementById('modal-last-name').value = window.currentUser.lastName || '';
    }
    document.getElementById('edit-profile-modal').classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('active');
}

function openChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('active');
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('active');
    document.getElementById('modal-current-password').value = '';
    document.getElementById('modal-new-password').value = '';
    document.getElementById('modal-confirm-password').value = '';
}

function openCancelModal() {
    document.getElementById('cancel-subscription-modal').classList.add('active');
}

function closeCancelModal() {
    document.getElementById('cancel-subscription-modal').classList.remove('active');
    document.getElementById('cancel-confirm').checked = false;
    document.getElementById('cancel-button').disabled = true;
}

// Toggle cancel button
document.addEventListener('change', (e) => {
    if (e.target.id === 'cancel-confirm') {
        document.getElementById('cancel-button').disabled = !e.target.checked;
    }
});

// Save profile changes
async function saveProfileChanges() {
    const firstName = document.getElementById('modal-first-name').value;
    const lastName = document.getElementById('modal-last-name').value;

    try {
        console.log('Updating profile with:', { firstName, lastName });
        const data = await api.updateProfile(firstName, lastName);
        console.log('Profile update response:', data);

        if (data.success || data.user) {
            showAlert('Profile updated successfully', 'success');
            closeEditProfileModal();
            loadProfile();
        } else {
            showAlert(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert(error.message || 'Error updating profile', 'error');
    }
}

// Save password change
async function savePasswordChange() {
    const currentPassword = document.getElementById('modal-current-password').value;
    const newPassword = document.getElementById('modal-new-password').value;
    const confirmPassword = document.getElementById('modal-confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    try {
        console.log('Changing password...');
        const data = await api.changePassword(currentPassword, newPassword);

        if (data.success) {
            showAlert('Password changed successfully', 'success');
            closeChangePasswordModal();
            document.getElementById('change-password-modal').reset?.();
        } else {
            showAlert(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert(error.message || 'Error changing password', 'error');
    }
}

// Cancel subscription
async function confirmCancel() {
    try {
        const data = await api.request('POST', '/subscriptions/cancel');

        if (data.success) {
            showAlert('Subscription cancelled successfully', 'success');
            closeCancelModal();
            loadSubscription();
        } else {
            const error = data;
            showAlert(error.message || 'Failed to cancel subscription', 'error');
        }
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        showAlert('Error cancelling subscription', 'error');
    }
}

// Go to pricing page
function goToPricing() {
    window.location.href = 'sales-page.html';
}

// Logout
function logout() {
    api.logout();
    window.location.href = 'auth.html';
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============ Deal Filters Functions ============

// Load user's deal filters
async function loadDealFilters() {
    try {
        const response = await api.request('GET', '/user/deal-filters');

        if (!response || !response.filters) {
            // If not Elite or endpoint doesn't exist, just return
            return;
        }

        const filters = response.filters;

        // Display filter values
        const tripTypeNames = {
            'all': 'All Travel Types',
            'flights': 'Flights Only',
            'hotels': 'Hotels Only'
        };

        document.getElementById('filter-trip-type').textContent = tripTypeNames[filters.trip_type] || filters.trip_type;
        document.getElementById('filter-min-savings').textContent = filters.min_savings_threshold || '100';

        // Store filters for modal
        window.currentFilters = filters;

        document.getElementById('filters-loading').style.display = 'none';
        document.getElementById('filters-content').style.display = 'block';
    } catch (error) {
        console.error('Error loading deal filters:', error);
        // Silent fail for non-Elite users
        document.getElementById('filters-loading').style.display = 'none';
    }
}

// Open edit filters modal
function openEditFiltersModal() {
    if (window.currentFilters) {
        document.getElementById('modal-trip-type').value = window.currentFilters.trip_type || 'all';
        document.getElementById('modal-min-savings').value = window.currentFilters.min_savings_threshold || 100;
    } else {
        document.getElementById('modal-trip-type').value = 'all';
        document.getElementById('modal-min-savings').value = 100;
    }
    document.getElementById('edit-filters-modal').classList.add('active');
}

// Close edit filters modal
function closeEditFiltersModal() {
    document.getElementById('edit-filters-modal').classList.remove('active');
}

// Save filters changes
async function saveFiltersChanges() {
    const tripType = document.getElementById('modal-trip-type').value;
    const minSavings = parseInt(document.getElementById('modal-min-savings').value) || 100;

    // Validate minimum savings
    if (minSavings < 0) {
        showAlert('Minimum savings must be a positive number', 'error');
        return;
    }

    try {
        const data = await api.request('POST', '/user/deal-filters', {
            trip_type: tripType,
            min_savings_threshold: minSavings
        });

        if (data.success) {
            showAlert('Deal preferences saved successfully', 'success');
            closeEditFiltersModal();
            loadDealFilters();
        } else {
            showAlert(data.message || 'Failed to save preferences', 'error');
        }
    } catch (error) {
        console.error('Error saving filters:', error);
        showAlert('Error saving deal preferences', 'error');
    }
}
