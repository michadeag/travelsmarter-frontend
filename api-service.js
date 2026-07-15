/**
 * TravelSmarter API Service
 * Handles all backend API communication with JWT authentication
 */

class APIService {
    constructor() {
        // Determine API URL based on current domain. There's no supported
        // way to override this anymore (the "Change API URL" UI was removed
        // since it had no validation and could silently break login) — so
        // clear out any leftover override from localStorage in production,
        // rather than trusting a value nothing can set or fix anymore.
        let defaultApiUrl;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Local development
            defaultApiUrl = 'http://localhost:5000/api';
        } else {
            // Production
            defaultApiUrl = 'https://api.travelsmarterapp.com/api';
            localStorage.removeItem('apiUrl');
        }

        this.baseURL = defaultApiUrl;
        this.token = localStorage.getItem('userToken');
        this.user = JSON.parse(localStorage.getItem('userData') || '{}');

        this.captureReferralCode();

        console.log('API Service initialized with URL:', this.baseURL);
    }

    /**
     * Referral partner attribution — last-click, 60-day window. Any page can
     * be the landing page for a partner link (?ref=CODE), so this runs on
     * every load and overwrites whatever code was stored before.
     */
    captureReferralCode() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('ref');
        if (code) {
            localStorage.setItem('ts_referral', JSON.stringify({
                code,
                capturedAt: Date.now(),
            }));
        }
    }

    /**
     * Returns the stored referral code if it's still within the 60-day
     * attribution window, otherwise null.
     */
    getReferralCode() {
        try {
            const stored = JSON.parse(localStorage.getItem('ts_referral') || 'null');
            if (!stored) return null;
            const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
            if (Date.now() - stored.capturedAt > sixtyDaysMs) {
                localStorage.removeItem('ts_referral');
                return null;
            }
            return stored.code;
        } catch {
            return null;
        }
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('userToken', token);
    }

    /**
     * Set user data
     */
    setUser(userData) {
        this.user = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    /**
     * Get authorization header
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make API request
     */
    async request(method, endpoint, body = null, includeAuth = true) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const options = {
                method,
                headers: this.getHeaders(includeAuth),
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            console.log(`[API] ${method} ${url}`, { body, includeAuth });
            const response = await fetch(url, options);
            console.log(`[API Response] ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                // Token expired, clear and redirect to login
                this.logout();
                window.location.href = './auth.html';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================

    /**
     * Sign up new user
     */
    async signup(email, password, firstName, lastName) {
        const response = await this.request('POST', '/auth/signup', {
            email,
            password,
            firstName,
            lastName,
            referralCode: this.getReferralCode(),
        }, false);

        if (response.success) {
            this.setToken(response.token);
            this.setUser(response.user);
        }

        return response;
    }

    /**
     * Log in user
     */
    async login(email, password) {
        const response = await this.request('POST', '/auth/login', {
            email,
            password,
        }, false);

        if (response.success) {
            this.setToken(response.token);
            this.setUser(response.user);
        }

        return response;
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        const response = await this.request('GET', '/auth/me');
        if (response.success) {
            this.setUser(response.user);
        }
        return response;
    }

    /**
     * Update user profile
     */
    async updateProfile(firstName, lastName) {
        return this.request('PUT', '/auth/update-profile', {
            firstName,
            lastName,
        });
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        return this.request('POST', '/auth/change-password', {
            currentPassword,
            newPassword,
        });
    }

    /**
     * Log out user
     */
    logout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        this.token = null;
        this.user = {};
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.token;
    }

    /**
     * Get user subscription tier
     */
    getUserTier() {
        return this.user?.subscriptionTier || 'free';
    }

    // ============================================
    // SUBSCRIPTION/PAYMENT ENDPOINTS
    // ============================================

    /**
     * Get pricing plans
     */
    async getPricing() {
        return this.request('GET', '/subscriptions/pricing', null, false);
    }

    /**
     * Create checkout session
     */
    async createCheckoutSession(tier, promoCode = null) {
        return this.request('POST', '/subscriptions/checkout', {
            tier,
            promoCode,
        });
    }

    /**
     * Get current subscription
     */
    async getCurrentSubscription() {
        return this.request('GET', '/subscriptions/current');
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription() {
        return this.request('POST', '/subscriptions/cancel');
    }

    // ============================================
    // DEALS ENDPOINTS
    // ============================================

    /**
     * Get all deals
     */
    async getDeals(category = null, limit = 20, offset = 0) {
        let endpoint = `/deals?limit=${limit}&offset=${offset}`;
        if (category) {
            endpoint += `&category=${category}`;
        }
        return this.request('GET', endpoint, null, false);
    }

    /**
     * Get single deal
     */
    async getDeal(dealId) {
        return this.request('GET', `/deals/${dealId}`, null, false);
    }

    /**
     * Search deals
     */
    async searchDeals(query, category = null) {
        let endpoint = `/deals/search?q=${encodeURIComponent(query)}`;
        if (category) {
            endpoint += `&category=${category}`;
        }
        return this.request('GET', endpoint, null, false);
    }

    /**
     * Get trending deals
     */
    async getTrendingDeals() {
        return this.request('GET', '/deals/trending', null, false);
    }

    /**
     * Get deal stats by category
     */
    async getDealStats() {
        return this.request('GET', '/deals/stats/by-category', null, false);
    }

    /**
     * Create deal
     */
    async createDeal(title, description, category, dealType, valueAmount) {
        return this.request('POST', '/deals', {
            title,
            description,
            category,
            dealType,
            valueAmount,
            valueCurrency: 'USD',
        });
    }

    /**
     * Upvote deal
     */
    async upvoteDeal(dealId) {
        return this.request('POST', `/deals/${dealId}/upvote`);
    }

    /**
     * Save deal
     */
    async saveDeal(dealId) {
        return this.request('POST', `/deals/${dealId}/save`);
    }

    /**
     * Get saved deals
     */
    async getSavedDeals() {
        return this.request('GET', '/deals/saved');
    }

    // ============================================
    // HACKS ENDPOINTS
    // ============================================

    /**
     * Get all modules
     */
    async getModules() {
        return this.request('GET', '/hacks/modules', null, false);
    }

    /**
     * Get hacks in module
     */
    async getHacksByModule(moduleId) {
        return this.request('GET', `/hacks/module/${moduleId}`, null, false);
    }

    /**
     * Save hack
     */
    async saveHack(moduleId, hackId, hackTitle, hackCategory) {
        return this.request('POST', '/hacks/save', {
            moduleId,
            hackId,
            hackTitle,
            hackCategory,
        });
    }

    /**
     * Remove saved hack
     */
    async removeHack(hackId) {
        return this.request('DELETE', `/hacks/${hackId}/remove`);
    }

    /**
     * Get saved hacks
     */
    async getSavedHacks(moduleId = null) {
        let endpoint = '/hacks/saved';
        if (moduleId) {
            endpoint += `?moduleId=${moduleId}`;
        }
        return this.request('GET', endpoint);
    }

    /**
     * Check if hack is saved
     */
    async isHackSaved(hackId) {
        const response = await this.request('GET', `/hacks/${hackId}/is-saved`);
        return response.isSaved;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if user has tier or higher
     */
    hasTier(requiredTier) {
        const tierLevels = {
            free: 0,
            smart_traveler: 1,
            elite: 2,
        };

        const userLevel = tierLevels[this.getUserTier()] || 0;
        const requiredLevel = tierLevels[requiredTier] || 0;

        return userLevel >= requiredLevel;
    }
}

// Create global instance
const api = new APIService();
