class SessionManager {
    constructor(options = {}) {
        // Configuration with defaults
        this.idleTimeout = options.idleTimeout || 15 * 60 * 1000; // 15 minutes
        this.tokenRefreshInterval = options.tokenRefreshInterval || 4.5 * 60 * 1000; // 4.5 minutes (refresh before 5 min expiration)
        this.warningTime = options.warningTime || 2 * 60 * 1000; // 2 minutes
        this.apiBaseUrl = options.apiBaseUrl || API_BASE_URL;
        this.maxRetryAttempts = options.maxRetryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000; // 1 second initial delay
        
        // State
        this.lastActivity = Date.now();
        this.idleTimer = null;
        this.warningTimer = null;
        this.refreshTimer = null;
        this.retryCount = 0;
        this.isRefreshing = false;
        this.refreshQueue = [];
        
        // Bind methods
        this.resetIdleTimer = this.resetIdleTimer.bind(this);
        this.checkIdleStatus = this.checkIdleStatus.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.logout = this.logout.bind(this);
        this.handleTokenRefreshResponse = this.handleTokenRefreshResponse.bind(this);
    }
    
    // ... (keep existing methods until refreshToken)
    
    /**
     * Refresh the authentication token with retry logic
     */
    async refreshToken() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.log('SessionManager: No token to refresh');
            return null;
        }

        // If already refreshing, return the current promise
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;
        
        try {
            console.log('SessionManager: Attempting to refresh token');
            
            const response = await this.attemptTokenRefresh(token);
            return this.handleTokenRefreshResponse(response);
            
        } catch (error) {
            console.error('SessionManager: Error in token refresh:', error);
            this.handleTokenRefreshError(error);
            throw error;
        } finally {
            this.isRefreshing = false;
            this.processRefreshQueue();
        }
    }
    
    /**
     * Make the actual token refresh request
     */
    async attemptTokenRefresh(token) {
        try {
            return await fetch(`${this.apiBaseUrl}/users/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('SessionManager: Network error during token refresh:', error);
            throw new Error('Network error during token refresh');
        }
    }
    
    /**
     * Handle successful token refresh response
     */
    async handleTokenRefreshResponse(response) {
        if (response.ok) {
            const data = await response.json();
            const newToken = data.access_token || data.token;
            
            if (newToken) {
                localStorage.setItem('token', newToken);
                this.retryCount = 0; // Reset retry counter on success
                console.log('SessionManager: Token refreshed successfully');
                return newToken;
            } else {
                throw new Error('No token in refresh response');
            }
        } else if (response.status === 401) {
            console.error('SessionManager: Token refresh failed - unauthorized');
            this.logout();
            throw new Error('Session expired');
        } else {
            const error = new Error(`Token refresh failed with status: ${response.status}`);
            error.status = response.status;
            throw error;
        }
    }
    
    /**
     * Handle token refresh errors with retry logic
     */
    async handleTokenRefreshError(error) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetryAttempts) {
            const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
            console.log(`SessionManager: Retry ${this.retryCount}/${this.maxRetryAttempts} in ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.refreshToken();
        } else {
            console.error('SessionManager: Max retry attempts reached, logging out');
            this.logout();
            throw new Error('Max retry attempts reached');
        }
    }
    
    /**
     * Process any queued refresh requests
     */
    processRefreshQueue() {
        if (this.refreshQueue.length > 0) {
            const token = localStorage.getItem('token');
            this.refreshQueue.forEach(({ resolve }) => resolve(token));
            this.refreshQueue = [];
        }
    }
    
    /**
     * Check if token is expired or about to expire
     */
    isTokenExpiredOrExpiringSoon() {
        const token = localStorage.getItem('token');
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const buffer = 30000; // 30 seconds buffer
            
            return (expiresAt - now) < buffer;
        } catch (e) {
            console.error('Error checking token expiration:', e);
            return true; // If we can't parse the token, assume it's expired
        }
    }
    
    // ... (keep existing methods)
}

// Update the init function to handle token expiration check
function initSessionManager(options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('SessionManager: No token found, not initializing');
        return;
    }
    
    // Check if token is already expired
    const sessionManager = new SessionManager(options);
    if (sessionManager.isTokenExpiredOrExpiringSoon()) {
        console.log('SessionManager: Token is expired or about to expire, forcing refresh');
        sessionManager.refreshToken().catch(error => {
            console.error('Failed to refresh token on init:', error);
            sessionManager.logout();
        });
    }
    
    sessionManager.start();
    return sessionManager;
}