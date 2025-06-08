/**
 * Zoho CRM Clone - Error Handling and Validation System
 * Provides comprehensive error handling, logging, and validation utilities
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.errorCounts = new Map();
        this.isLoggingEnabled = true;
        this.reportingEndpoint = null;
        this.init();
    }

    init() {
        this.setupGlobalErrorHandlers();
        this.setupUnhandledRejectionHandler();
        this.setupConsoleErrorCapture();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                reason: event.reason,
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Setup unhandled promise rejection handler
     */
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError('Promise Rejection', event.reason);
            
            // Prevent the default handling (which would log to console)
            event.preventDefault();
        });
    }

    /**
     * Capture console errors
     */
    setupConsoleErrorCapture() {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logError('Console Error', args.join(' '));
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Handle different types of errors
     */
    handleError(errorInfo) {
        const errorKey = `${errorInfo.type}:${errorInfo.message}`;
        
        // Increment error count
        const count = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, count + 1);

        // Add to error log
        this.addToErrorLog(errorInfo);

        // Log to console in development
        if (this.isDevelopment()) {
            console.group('🚨 Error Detected');
            console.error('Type:', errorInfo.type);
            console.error('Message:', errorInfo.message);
            if (errorInfo.filename) console.error('File:', errorInfo.filename);
            if (errorInfo.lineno) console.error('Line:', errorInfo.lineno);
            if (errorInfo.stack) console.error('Stack:', errorInfo.stack);
            console.groupEnd();
        }

        // Report critical errors
        if (this.isCriticalError(errorInfo)) {
            this.reportError(errorInfo);
        }

        // Show user-friendly error message for critical errors
        if (this.shouldShowUserError(errorInfo)) {
            this.showUserError(errorInfo);
        }
    }

    /**
     * Add error to internal log
     */
    addToErrorLog(errorInfo) {
        if (!this.isLoggingEnabled) return;

        this.errorLog.unshift({
            ...errorInfo,
            id: this.generateErrorId(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });

        // Limit log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
    }

    /**
     * Log custom errors
     */
    logError(category, message, details = {}) {
        const errorInfo = {
            type: 'custom',
            category,
            message,
            details,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        };

        this.handleError(errorInfo);
    }

    /**
     * Log warnings
     */
    logWarning(category, message, details = {}) {
        const warningInfo = {
            type: 'warning',
            category,
            message,
            details,
            timestamp: new Date().toISOString()
        };

        console.warn(`⚠️ Warning [${category}]:`, message, details);
        this.addToErrorLog(warningInfo);
    }

    /**
     * Check if error is critical
     */
    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /network/i,
            /failed to fetch/i,
            /chunk load error/i,
            /script error/i,
            /syntax error/i
        ];

        return criticalPatterns.some(pattern => 
            pattern.test(errorInfo.message)
        );
    }

    /**
     * Check if error should be shown to user
     */
    shouldShowUserError(errorInfo) {
        // Show errors that affect user experience
        const userErrorTypes = ['network', 'data-load', 'auth'];
        return userErrorTypes.includes(errorInfo.category);
    }

    /**
     * Show user-friendly error message
     */
    showUserError(errorInfo) {
        const errorMessage = this.getUserErrorMessage(errorInfo);
        
        // Create error notification
        this.createErrorNotification(errorMessage, errorInfo.type);
    }

    /**
     * Get user-friendly error message
     */
    getUserErrorMessage(errorInfo) {
        const errorMessages = {
            'network': 'Unable to connect to the server. Please check your internet connection.',
            'data-load': 'Failed to load data. Please refresh the page and try again.',
            'auth': 'Authentication failed. Please log in again.',
            'validation': 'Please check your input and try again.',
            'default': 'An unexpected error occurred. Please try again later.'
        };

        return errorMessages[errorInfo.category] || errorMessages.default;
    }

    /**
     * Create error notification
     */
    createErrorNotification(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        notification.innerHTML = `
            <div class="error-notification-content">
                <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                <span>${message}</span>
                <button class="error-notification-close" aria-label="Close notification">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Add close functionality
        const closeBtn = notification.querySelector('.error-notification-close');
        closeBtn.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Report error to external service
     */
    async reportError(errorInfo) {
        if (!this.reportingEndpoint) return;

        try {
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorInfo,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Check if in development mode
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev');
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            totalErrors: this.errorLog.length,
            errorCounts: Object.fromEntries(this.errorCounts),
            recentErrors: this.errorLog.slice(0, 10)
        };
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.errorCounts.clear();
    }

    /**
     * Export error log
     */
    exportErrorLog() {
        const data = {
            errors: this.errorLog,
            stats: this.getErrorStats(),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Input Validation Utilities
 */
class Validator {
    static email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
        };
    }

    static phone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return {
            isValid: phoneRegex.test(cleanPhone),
            message: phoneRegex.test(cleanPhone) ? '' : 'Please enter a valid phone number'
        };
    }

    static required(value) {
        const isValid = value !== null && value !== undefined && value.toString().trim() !== '';
        return {
            isValid,
            message: isValid ? '' : 'This field is required'
        };
    }

    static minLength(value, min) {
        const length = value ? value.toString().length : 0;
        const isValid = length >= min;
        return {
            isValid,
            message: isValid ? '' : `Minimum length is ${min} characters`
        };
    }

    static maxLength(value, max) {
        const length = value ? value.toString().length : 0;
        const isValid = length <= max;
        return {
            isValid,
            message: isValid ? '' : `Maximum length is ${max} characters`
        };
    }

    static number(value) {
        const isValid = !isNaN(value) && isFinite(value);
        return {
            isValid,
            message: isValid ? '' : 'Please enter a valid number'
        };
    }

    static url(url) {
        try {
            new URL(url);
            return {
                isValid: true,
                message: ''
            };
        } catch {
            return {
                isValid: false,
                message: 'Please enter a valid URL'
            };
        }
    }

    static validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(field => {
            const fieldRules = rules[field];
            const value = formData[field];
            
            fieldRules.forEach(rule => {
                if (typeof rule === 'function') {
                    const result = rule(value);
                    if (!result.isValid) {
                        errors[field] = result.message;
                        isValid = false;
                    }
                } else if (typeof rule === 'object') {
                    const { validator, params } = rule;
                    const result = validator(value, ...params);
                    if (!result.isValid) {
                        errors[field] = result.message;
                        isValid = false;
                    }
                }
            });
        });

        return { isValid, errors };
    }
}

/**
 * Form Error Display Utilities
 */
class FormErrorHandler {
    static showFieldError(fieldElement, message) {
        // Remove existing error
        this.clearFieldError(fieldElement);

        // Add error class
        fieldElement.classList.add('error');

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');

        // Insert after field
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);

        // Focus the field
        fieldElement.focus();
    }

    static clearFieldError(fieldElement) {
        fieldElement.classList.remove('error');
        
        const errorElement = fieldElement.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    static clearAllErrors(formElement) {
        const errorElements = formElement.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());

        const errorFields = formElement.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    static showFormErrors(formElement, errors) {
        Object.keys(errors).forEach(fieldName => {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, errors[fieldName]);
            }
        });
    }
}

// Initialize global error handler
const globalErrorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.Validator = Validator;
window.FormErrorHandler = FormErrorHandler;
window.errorHandler = globalErrorHandler;

// Add CSS for error notifications
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }

    .error-notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .error-notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
    }

    .field-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 4px;
    }

    .error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

document.head.appendChild(errorStyles);