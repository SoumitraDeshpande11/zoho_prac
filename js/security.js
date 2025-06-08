/**
 * Zoho CRM Clone - Security & Validation Utilities
 * Provides comprehensive security features and input validation
 */

class SecurityManager {
    constructor() {
        this.csrfToken = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.encryptionKey = null;
        this.validator = new InputValidator();
        this.sanitizer = new DataSanitizer();
        this.init();
    }

    init() {
        this.generateCSRFToken();
        this.setupSessionManagement();
        this.setupSecurityHeaders();
        this.setupContentSecurityPolicy();
        this.monitorSecurityEvents();
        this.bindSecurityEvents();
    }

    /**
     * Generate CSRF token for forms
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        // Add to all forms
        this.addCSRFTokenToForms();
    }

    /**
     * Add CSRF token to all forms
     */
    addCSRFTokenToForms() {
        document.querySelectorAll('form').forEach(form => {
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                form.appendChild(csrfInput);
            }
            csrfInput.value = this.csrfToken;
        });
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        return token === this.csrfToken && token !== null;
    }

    /**
     * Setup session management
     */
    setupSessionManagement() {
        this.startSessionTimer();
        
        // Reset timer on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimer();
            }, { passive: true });
        });
    }

    /**
     * Start session timeout timer
     */
    startSessionTimer() {
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }

    /**
     * Reset session timer
     */
    resetSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        this.startSessionTimer();
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        // Clear sensitive data
        this.clearSensitiveData();
        
        // Show timeout modal
        this.showSessionTimeoutModal();
        
        // Redirect to login after delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 10000);
    }

    /**
     * Clear sensitive data from memory and storage
     */
    clearSensitiveData() {
        // Clear localStorage items that might contain sensitive data
        const sensitiveKeys = ['auth_token', 'user_data', 'api_keys'];
        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        // Clear form data
        document.querySelectorAll('input[type="password"], input[name*="token"]').forEach(input => {
            input.value = '';
        });

        // Clear variables
        this.csrfToken = null;
        this.encryptionKey = null;
    }

    /**
     * Show session timeout modal
     */
    showSessionTimeoutModal() {
        const modal = document.createElement('div');
        modal.className = 'modal session-timeout-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Session Expired</h5>
                    </div>
                    <div class="modal-body">
                        <p>Your session has expired for security reasons. You will be redirected to the login page.</p>
                        <div class="countdown">Redirecting in <span id="countdown">10</span> seconds...</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="window.location.href='/login'">
                            Login Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        // Countdown timer
        let countdown = 10;
        const countdownElement = modal.querySelector('#countdown');
        const countdownTimer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownTimer);
            }
        }, 1000);
    }

    /**
     * Setup security headers (for development guidance)
     */
    setupSecurityHeaders() {
        // Note: These would typically be set by the server
        // This is for development awareness only
        console.info('Recommended Security Headers:');
        console.info('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';');
        console.info('X-Frame-Options: DENY');
        console.info('X-Content-Type-Options: nosniff');
        console.info('X-XSS-Protection: 1; mode=block');
        console.info('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }

    /**
     * Setup Content Security Policy monitoring
     */
    setupContentSecurityPolicy() {
        // Monitor CSP violations
        document.addEventListener('securitypolicyviolation', (e) => {
            console.error('CSP Violation:', {
                blockedURI: e.blockedURI,
                violatedDirective: e.violatedDirective,
                originalPolicy: e.originalPolicy
            });
            
            // Report to security team (in production)
            this.reportSecurityIncident('csp_violation', {
                blockedURI: e.blockedURI,
                violatedDirective: e.violatedDirective
            });
        });
    }

    /**
     * Monitor security-related events
     */
    monitorSecurityEvents() {
        // Monitor for potential XSS attempts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanForSecurityIssues(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['onclick', 'onload', 'onerror']
        });
    }

    /**
     * Scan element for security issues
     */
    scanForSecurityIssues(element) {
        // Check for inline event handlers
        const inlineEvents = ['onclick', 'onload', 'onerror', 'onmouseover'];
        inlineEvents.forEach(event => {
            if (element.hasAttribute(event)) {
                console.warn('Security Warning: Inline event handler detected:', event, element);
                this.reportSecurityIncident('inline_event_handler', {
                    event,
                    element: element.outerHTML.substring(0, 200)
                });
            }
        });

        // Check for javascript: URLs
        element.querySelectorAll('a[href^="javascript:"], [src^="javascript:"]').forEach(el => {
            console.warn('Security Warning: JavaScript URL detected:', el);
            this.reportSecurityIncident('javascript_url', {
                element: el.outerHTML.substring(0, 200)
            });
        });

        // Check for data: URLs with script content
        element.querySelectorAll('[src^="data:"], [href^="data:"]').forEach(el => {
            const url = el.src || el.href;
            if (url.includes('script') || url.includes('javascript')) {
                console.warn('Security Warning: Suspicious data URL detected:', el);
                this.reportSecurityIncident('suspicious_data_url', {
                    url: url.substring(0, 200)
                });
            }
        });
    }

    /**
     * Report security incident
     */
    reportSecurityIncident(type, details) {
        const incident = {
            type,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store locally for debugging
        const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
        incidents.push(incident);
        
        // Keep only last 50 incidents
        if (incidents.length > 50) {
            incidents.splice(0, incidents.length - 50);
        }
        
        localStorage.setItem('security_incidents', JSON.stringify(incidents));

        // In production, send to security endpoint
        console.warn('Security Incident Logged:', incident);
    }

    /**
     * Bind security-related events
     */
    bindSecurityEvents() {
        // Validate forms before submission
        document.addEventListener('submit', (e) => {
            if (!this.validateFormSecurity(e.target)) {
                e.preventDefault();
                console.error('Form submission blocked due to security validation failure');
            }
        });

        // Monitor clipboard access
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection().toString();
            if (this.containsSensitiveData(selection)) {
                console.warn('Sensitive data copied to clipboard');
            }
        });

        // Monitor for developer tools
        this.detectDevTools();
    }

    /**
     * Validate form security
     */
    validateFormSecurity(form) {
        // Check CSRF token
        const csrfInput = form.querySelector('input[name="csrf_token"]');
        if (!csrfInput || !this.validateCSRFToken(csrfInput.value)) {
            console.error('Invalid or missing CSRF token');
            return false;
        }

        // Validate all inputs
        const inputs = form.querySelectorAll('input, textarea, select');
        for (const input of inputs) {
            if (!this.validator.validateInput(input)) {
                console.error('Input validation failed:', input.name);
                return false;
            }
        }

        return true;
    }

    /**
     * Check if text contains sensitive data patterns
     */
    containsSensitiveData(text) {
        const sensitivePatterns = [
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
            /password/i,
            /token/i,
            /key/i
        ];

        return sensitivePatterns.some(pattern => pattern.test(text));
    }

    /**
     * Detect developer tools (basic detection)
     */
    detectDevTools() {
        let devtools = false;
        const threshold = 160;

        const checkDevTools = () => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools) {
                    devtools = true;
                    console.warn('Developer tools detected');
                    this.reportSecurityIncident('devtools_detected', {
                        outerDimensions: `${window.outerWidth}x${window.outerHeight}`,
                        innerDimensions: `${window.innerWidth}x${window.innerHeight}`
                    });
                }
            } else {
                devtools = false;
            }
        };

        setInterval(checkDevTools, 500);
    }

    /**
     * Encrypt sensitive data
     */
    async encryptData(data, key = null) {
        if (!key) {
            key = await this.generateEncryptionKey();
        }

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
            key,
            dataBuffer
        );

        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            key: await crypto.subtle.exportKey('raw', key)
        };
    }

    /**
     * Decrypt sensitive data
     */
    async decryptData(encryptedData, keyData) {
        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(keyData),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
            key,
            new Uint8Array(encryptedData.encrypted)
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    /**
     * Generate encryption key
     */
    async generateEncryptionKey() {
        return await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Hash password securely
     */
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(16));
        }

        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltedPassword = new Uint8Array(passwordBuffer.length + salt.length);
        saltedPassword.set(passwordBuffer);
        saltedPassword.set(salt, passwordBuffer.length);

        const hash = await crypto.subtle.digest('SHA-256', saltedPassword);
        
        return {
            hash: Array.from(new Uint8Array(hash)),
            salt: Array.from(salt)
        };
    }

    /**
     * Verify password hash
     */
    async verifyPassword(password, storedHash, storedSalt) {
        const { hash } = await this.hashPassword(password, new Uint8Array(storedSalt));
        return this.constantTimeCompare(hash, storedHash);
    }

    /**
     * Constant-time comparison to prevent timing attacks
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }

    /**
     * Generate secure random string
     */
    generateSecureRandom(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get security incidents
     */
    getSecurityIncidents() {
        return JSON.parse(localStorage.getItem('security_incidents') || '[]');
    }

    /**
     * Clear security incidents
     */
    clearSecurityIncidents() {
        localStorage.removeItem('security_incidents');
    }
}

/**
 * Input Validator Class
 */
class InputValidator {
    constructor() {
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-\(\)]+$/,
            url: /^https?:\/\/.+/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            numeric: /^\d+$/,
            decimal: /^\d+\.?\d*$/,
            date: /^\d{4}-\d{2}-\d{2}$/,
            time: /^\d{2}:\d{2}$/,
            creditCard: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/,
            ssn: /^\d{3}-\d{2}-\d{4}$/
        };

        this.maxLengths = {
            name: 100,
            email: 254,
            phone: 20,
            address: 255,
            description: 1000,
            note: 2000
        };
    }

    /**
     * Validate input element
     */
    validateInput(input) {
        const value = input.value.trim();
        const type = input.type || 'text';
        const name = input.name;

        // Check required fields
        if (input.required && !value) {
            this.setError(input, 'This field is required');
            return false;
        }

        // Skip validation for empty optional fields
        if (!value && !input.required) {
            this.clearError(input);
            return true;
        }

        // Length validation
        if (this.maxLengths[name] && value.length > this.maxLengths[name]) {
            this.setError(input, `Maximum length is ${this.maxLengths[name]} characters`);
            return false;
        }

        // Type-specific validation
        if (!this.validateByType(value, type, name)) {
            return false;
        }

        // Custom validation rules
        if (!this.validateCustomRules(input, value)) {
            return false;
        }

        this.clearError(input);
        return true;
    }

    /**
     * Validate by input type
     */
    validateByType(value, type, name) {
        switch (type) {
            case 'email':
                if (!this.patterns.email.test(value)) {
                    this.setError(input, 'Please enter a valid email address');
                    return false;
                }
                break;

            case 'tel':
                if (!this.patterns.phone.test(value)) {
                    this.setError(input, 'Please enter a valid phone number');
                    return false;
                }
                break;

            case 'url':
                if (!this.patterns.url.test(value)) {
                    this.setError(input, 'Please enter a valid URL');
                    return false;
                }
                break;

            case 'number':
                if (!this.patterns.numeric.test(value)) {
                    this.setError(input, 'Please enter a valid number');
                    return false;
                }
                break;

            case 'date':
                if (!this.patterns.date.test(value)) {
                    this.setError(input, 'Please enter a valid date');
                    return false;
                }
                break;

            case 'time':
                if (!this.patterns.time.test(value)) {
                    this.setError(input, 'Please enter a valid time');
                    return false;
                }
                break;
        }

        return true;
    }

    /**
     * Validate custom rules
     */
    validateCustomRules(input, value) {
        // Check for script injection
        if (this.containsScript(value)) {
            this.setError(input, 'Invalid characters detected');
            return false;
        }

        // Check for SQL injection patterns
        if (this.containsSQLInjection(value)) {
            this.setError(input, 'Invalid input detected');
            return false;
        }

        // Password strength validation
        if (input.type === 'password') {
            return this.validatePassword(input, value);
        }

        return true;
    }

    /**
     * Check for script injection
     */
    containsScript(value) {
        const scriptPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];

        return scriptPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Check for SQL injection patterns
     */
    containsSQLInjection(value) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
            /(-{2}|\/\*|\*\/)/,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            /(\b(OR|AND)\s+['"]\w*['"]?\s*=\s*['"]\w*['"]?)/i
        ];

        return sqlPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Validate password strength
     */
    validatePassword(input, password) {
        const minLength = 8;
        const requirements = {
            length: password.length >= minLength,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const failedRequirements = [];
        
        if (!requirements.length) failedRequirements.push(`at least ${minLength} characters`);
        if (!requirements.lowercase) failedRequirements.push('lowercase letter');
        if (!requirements.uppercase) failedRequirements.push('uppercase letter');
        if (!requirements.number) failedRequirements.push('number');
        if (!requirements.special) failedRequirements.push('special character');

        if (failedRequirements.length > 0) {
            this.setError(input, `Password must contain: ${failedRequirements.join(', ')}`);
            return false;
        }

        return true;
    }

    /**
     * Set validation error
     */
    setError(input, message) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');

        let errorElement = input.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            input.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
    }

    /**
     * Clear validation error
     */
    clearError(input) {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');

        const errorElement = input.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Validate all inputs in form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        return isValid;
    }
}

/**
 * Data Sanitizer Class
 */
class DataSanitizer {
    constructor() {
        this.htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(html) {
        return html.replace(/[&<>"'\/]/g, (char) => this.htmlEntities[char]);
    }

    /**
     * Sanitize for SQL (basic - use parameterized queries in production)
     */
    sanitizeSQL(input) {
        return input.replace(/[';\\]/g, '\\$&');
    }

    /**
     * Sanitize URL
     */
    sanitizeURL(url) {
        try {
            const urlObj = new URL(url);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return '';
            }
            return urlObj.toString();
        } catch {
            return '';
        }
    }

    /**
     * Remove dangerous characters
     */
    removeDangerous(input) {
        return input.replace(/[<>'"&]/g, '');
    }

    /**
     * Sanitize for filename
     */
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    }

    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj === 'string') {
            return this.sanitizeHTML(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            Object.keys(obj).forEach(key => {
                sanitized[key] = this.sanitizeObject(obj[key]);
            });
            return sanitized;
        }

        return obj;
    }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Global access
window.Security = securityManager;
window.InputValidator = InputValidator;
window.DataSanitizer = DataSanitizer;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, InputValidator, DataSanitizer };
}