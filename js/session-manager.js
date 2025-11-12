/**
 * Session Manager
 * Handles automatic token renewal and idle timeout
 */

class SessionManager {
    constructor(options = {}) {
        // Configuration
        this.idleTimeout = options.idleTimeout || 15 * 60 * 1000; // 15 minutes default
        this.tokenRefreshInterval = options.tokenRefreshInterval || 5 * 60 * 1000; // Refresh every 5 minutes
        this.warningTime = options.warningTime || 2 * 60 * 1000; // Warn 2 minutes before timeout
        this.apiBaseUrl = options.apiBaseUrl || API_BASE_URL;
        
        // State
        this.lastActivity = Date.now();
        this.idleTimer = null;
        this.warningTimer = null;
        this.refreshTimer = null;
        this.isWarningShown = false;
        
        // Bind methods
        this.resetIdleTimer = this.resetIdleTimer.bind(this);
        this.checkIdleStatus = this.checkIdleStatus.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.logout = this.logout.bind(this);
        
        console.log('SessionManager initialized with:', {
            idleTimeout: this.idleTimeout / 1000 / 60 + ' minutes',
            tokenRefreshInterval: this.tokenRefreshInterval / 1000 / 60 + ' minutes',
            warningTime: this.warningTime / 1000 / 60 + ' minutes'
        });
    }
    
    /**
     * Start monitoring user activity and token refresh
     */
    start() {
        console.log('SessionManager: Starting session monitoring');
        
        // Set up activity listeners
        this.setupActivityListeners();
        
        // Start idle timer
        this.resetIdleTimer();
        
        // Start token refresh timer
        this.startTokenRefresh();
        
        console.log('SessionManager: Active');
    }
    
    /**
     * Stop all monitoring
     */
    stop() {
        console.log('SessionManager: Stopping session monitoring');
        
        // Remove activity listeners
        this.removeActivityListeners();
        
        // Clear all timers
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        
        this.idleTimer = null;
        this.warningTimer = null;
        this.refreshTimer = null;
        
        console.log('SessionManager: Stopped');
    }
    
    /**
     * Set up event listeners for user activity
     */
    setupActivityListeners() {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'keydown'
        ];
        
        events.forEach(event => {
            document.addEventListener(event, this.resetIdleTimer, true);
        });
        
        console.log('SessionManager: Activity listeners set up');
    }
    
    /**
     * Remove activity event listeners
     */
    removeActivityListeners() {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'keydown'
        ];
        
        events.forEach(event => {
            document.removeEventListener(event, this.resetIdleTimer, true);
        });
    }
    
    /**
     * Reset the idle timer when user is active
     */
    resetIdleTimer() {
        this.lastActivity = Date.now();
        
        // Clear existing timers
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        
        // Reset warning state
        if (this.isWarningShown) {
            this.hideIdleWarning();
        }
        
        // Set timer to show warning
        this.warningTimer = setTimeout(() => {
            this.showIdleWarning();
        }, this.idleTimeout - this.warningTime);
        
        // Set timer for automatic logout
        this.idleTimer = setTimeout(() => {
            this.handleIdleTimeout();
        }, this.idleTimeout);
    }
    
    /**
     * Show warning before idle timeout
     */
    showIdleWarning() {
        this.isWarningShown = true;
        const remainingTime = Math.floor(this.warningTime / 1000);
        
        console.log('SessionManager: Showing idle warning');
        
        // Use custom alert if available, otherwise use native alert
        if (typeof showAlert === 'function') {
            showAlert(
                `You will be logged out in ${remainingTime} seconds due to inactivity. Move your mouse or press a key to stay logged in.`,
                'warning'
            );
        } else {
            console.warn(`Session timeout warning: ${remainingTime} seconds remaining`);
        }
    }
    
    /**
     * Hide idle warning
     */
    hideIdleWarning() {
        this.isWarningShown = false;
        console.log('SessionManager: Hiding idle warning (user is active)');
    }
    
    /**
     * Handle idle timeout - logout user
     */
    handleIdleTimeout() {
        console.log('SessionManager: Idle timeout reached, logging out user');
        
        if (typeof showAlert === 'function') {
            showAlert('You have been logged out due to inactivity.', 'info');
        }
        
        setTimeout(() => {
            this.logout();
        }, 1000);
    }
    
    /**
     * Start automatic token refresh
     */
    startTokenRefresh() {
        console.log('SessionManager: Starting automatic token refresh');
        
        // Initial refresh after interval
        this.refreshTimer = setInterval(async () => {
            await this.refreshToken();
        }, this.tokenRefreshInterval);
    }
    
    /**
     * Refresh the authentication token
     */
    async refreshToken() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.log('SessionManager: No token to refresh');
            return;
        }
        
        try {
            console.log('SessionManager: Attempting to refresh token');
            
            const response = await fetch(`${this.apiBaseUrl}/users/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const newToken = data.access_token || data.token;
                
                if (newToken) {
                    localStorage.setItem('token', newToken);
                    console.log('SessionManager: Token refreshed successfully');
                } else {
                    console.warn('SessionManager: No token in refresh response');
                }
            } else if (response.status === 401) {
                console.error('SessionManager: Token refresh failed - unauthorized');
                console.log('SessionManager: Logging out due to invalid token');
                this.logout();
            } else {
                console.warn('SessionManager: Token refresh failed with status:', response.status);
                // Don't logout on other errors, try again next interval
            }
        } catch (error) {
            console.error('SessionManager: Error refreshing token:', error);
            // Don't logout on network errors, try again next interval
        }
    }
    
    /**
     * Logout and redirect to login page
     */
    logout() {
        console.log('SessionManager: Logging out user');
        
        // Stop monitoring
        this.stop();
        
        // Clear authentication data
        const authItems = ['token', 'userRole', 'username', 'user', 'full_name'];
        authItems.forEach(item => {
            localStorage.removeItem(item);
        });
        
        // Redirect to login
        window.location.href = 'index.html';
    }
    
    /**
     * Get remaining time until idle timeout (in seconds)
     */
    getRemainingTime() {
        const elapsed = Date.now() - this.lastActivity;
        const remaining = Math.max(0, this.idleTimeout - elapsed);
        return Math.floor(remaining / 1000);
    }
}

// Create global instance (will be initialized when needed)
let sessionManager = null;

/**
 * Initialize session manager for authenticated users
 */
function initSessionManager(options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('SessionManager: No token found, not initializing');
        return;
    }
    
    if (sessionManager) {
        console.log('SessionManager: Already initialized, stopping previous instance');
        sessionManager.stop();
    }
    
    sessionManager = new SessionManager(options);
    sessionManager.start();
    
    return sessionManager;
}

/**
 * Stop session manager
 */
function stopSessionManager() {
    if (sessionManager) {
        sessionManager.stop();
        sessionManager = null;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.initSessionManager = initSessionManager;
    window.stopSessionManager = stopSessionManager;
    window.sessionManager = sessionManager;
}
