/**
 * Zoho CRM Clone - Accessibility & Performance Utilities
 * Provides comprehensive accessibility features and performance optimizations
 */

class AccessibilityManager {
    constructor() {
        this.focusStack = [];
        this.announcer = null;
        this.preferences = this.loadPreferences();
        this.init();
    }

    init() {
        this.createAnnouncer();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupHighContrastMode();
        this.setupReducedMotion();
        this.setupScreenReaderSupport();
        this.bindEvents();
    }

    /**
     * Create live region for screen reader announcements
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.id = 'accessibility-announcer';
        document.body.appendChild(this.announcer);
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - Priority level ('polite' or 'assertive')
     */
    announce(message, priority = 'polite') {
        if (!this.announcer) return;

        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = '';
        
        // Small delay to ensure screen readers pick up the change
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Skip links
        this.createSkipLinks();
        
        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscape();
            }
        });

        // Tab trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabTrap(e);
            }
        });

        // Arrow key navigation for lists and tables
        this.setupArrowKeyNavigation();
    }

    /**
     * Create skip links for keyboard users
     */
    createSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#sidebar-menu" class="skip-link">Skip to navigation</a>
            <a href="#page-footer" class="skip-link">Skip to footer</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    /**
     * Setup arrow key navigation
     */
    setupArrowKeyNavigation() {
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            // Table navigation
            if (activeElement.closest('table')) {
                this.handleTableNavigation(e, activeElement);
            }
            
            // Menu navigation
            if (activeElement.closest('[role="menu"], [role="menubar"]')) {
                this.handleMenuNavigation(e, activeElement);
            }
            
            // Tab navigation
            if (activeElement.closest('[role="tablist"]')) {
                this.handleTabNavigation(e, activeElement);
            }
        });
    }

    /**
     * Handle table navigation with arrow keys
     */
    handleTableNavigation(event, activeElement) {
        const table = activeElement.closest('table');
        const cell = activeElement.closest('td, th');
        if (!cell) return;

        const row = cell.parentElement;
        const cellIndex = Array.from(row.children).indexOf(cell);
        const rowIndex = Array.from(table.rows).indexOf(row);

        let targetCell = null;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (rowIndex > 0) {
                    targetCell = table.rows[rowIndex - 1].children[cellIndex];
                }
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                if (rowIndex < table.rows.length - 1) {
                    targetCell = table.rows[rowIndex + 1].children[cellIndex];
                }
                break;
                
            case 'ArrowLeft':
                event.preventDefault();
                if (cellIndex > 0) {
                    targetCell = row.children[cellIndex - 1];
                }
                break;
                
            case 'ArrowRight':
                event.preventDefault();
                if (cellIndex < row.children.length - 1) {
                    targetCell = row.children[cellIndex + 1];
                }
                break;
        }

        if (targetCell) {
            const focusable = targetCell.querySelector('button, a, input, select, textarea, [tabindex]');
            if (focusable) {
                focusable.focus();
            } else {
                targetCell.focus();
            }
        }
    }

    /**
     * Handle menu navigation with arrow keys
     */
    handleMenuNavigation(event, activeElement) {
        const menu = activeElement.closest('[role="menu"], [role="menubar"]');
        const items = menu.querySelectorAll('[role="menuitem"]');
        const currentIndex = Array.from(items).indexOf(activeElement);

        let targetIndex = currentIndex;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                break;
                
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
                
            case 'End':
                event.preventDefault();
                targetIndex = items.length - 1;
                break;
        }

        if (items[targetIndex]) {
            items[targetIndex].focus();
        }
    }

    /**
     * Handle tab navigation with arrow keys
     */
    handleTabNavigation(event, activeElement) {
        const tablist = activeElement.closest('[role="tablist"]');
        const tabs = tablist.querySelectorAll('[role="tab"]');
        const currentIndex = Array.from(tabs).indexOf(activeElement);

        let targetIndex = currentIndex;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                targetIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
                
            case 'ArrowRight':
                event.preventDefault();
                targetIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
                
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
                
            case 'End':
                event.preventDefault();
                targetIndex = tabs.length - 1;
                break;
        }

        if (tabs[targetIndex]) {
            tabs[targetIndex].focus();
            tabs[targetIndex].click();
        }
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus for restoration
        document.addEventListener('focusin', (e) => {
            if (!e.target.closest('.modal, .dropdown-menu, .popover')) {
                this.lastFocusedElement = e.target;
            }
        });

        // Ensure focusable elements have proper tabindex
        this.ensureFocusableElements();
    }

    /**
     * Ensure focusable elements have proper attributes
     */
    ensureFocusableElements() {
        // Add tabindex to interactive elements without it
        const interactiveSelectors = [
            'button:not([tabindex])',
            'a:not([tabindex]):not([href])',
            '[role="button"]:not([tabindex])',
            '[role="menuitem"]:not([tabindex])',
            '[role="tab"]:not([tabindex])'
        ];

        interactiveSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (!element.hasAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }
            });
        });
    }

    /**
     * Handle escape key presses
     */
    handleEscape() {
        // Close modals
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modalInstance = window.ComponentSystem?.getInstance(openModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            return;
        }

        // Close dropdowns
        const openDropdown = document.querySelector('.dropdown-menu.show');
        if (openDropdown) {
            openDropdown.classList.remove('show');
            return;
        }

        // Restore focus if trapped
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }

    /**
     * Handle tab trapping for modals
     */
    handleTabTrap(event) {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Setup high contrast mode support
     */
    setupHighContrastMode() {
        // Detect system high contrast mode
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        
        const updateHighContrast = (matches) => {
            document.documentElement.toggleClass('high-contrast', matches);
            this.announce(matches ? 'High contrast mode enabled' : 'High contrast mode disabled');
        };

        updateHighContrast(highContrastQuery.matches);
        highContrastQuery.addEventListener('change', (e) => updateHighContrast(e.matches));

        // Manual toggle
        this.createHighContrastToggle();
    }

    /**
     * Create high contrast toggle button
     */
    createHighContrastToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'accessibility-toggle high-contrast-toggle';
        toggle.setAttribute('aria-label', 'Toggle high contrast mode');
        toggle.innerHTML = '<i class="fas fa-adjust"></i>';
        
        toggle.addEventListener('click', () => {
            const isHighContrast = document.documentElement.classList.toggle('high-contrast');
            this.preferences.highContrast = isHighContrast;
            this.savePreferences();
            this.announce(isHighContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
        });

        document.body.appendChild(toggle);
    }

    /**
     * Setup reduced motion support
     */
    setupReducedMotion() {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const updateReducedMotion = (matches) => {
            document.documentElement.toggleClass('reduced-motion', matches);
            if (matches) {
                this.announce('Reduced motion mode enabled');
            }
        };

        updateReducedMotion(reducedMotionQuery.matches);
        reducedMotionQuery.addEventListener('change', (e) => updateReducedMotion(e.matches));
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add landmarks
        this.addLandmarks();
        
        // Add ARIA labels to unlabeled elements
        this.addAriaLabels();
        
        // Setup live regions for dynamic content
        this.setupLiveRegions();
    }

    /**
     * Add landmark roles to page sections
     */
    addLandmarks() {
        const landmarks = [
            { selector: '.sidebar', role: 'navigation', label: 'Main navigation' },
            { selector: '.main-content', role: 'main', label: 'Main content' },
            { selector: '.topbar', role: 'banner', label: 'Page header' },
            { selector: '.footer', role: 'contentinfo', label: 'Page footer' }
        ];

        landmarks.forEach(({ selector, role, label }) => {
            const element = document.querySelector(selector);
            if (element && !element.hasAttribute('role')) {
                element.setAttribute('role', role);
                element.setAttribute('aria-label', label);
            }
        });
    }

    /**
     * Add ARIA labels to unlabeled elements
     */
    addAriaLabels() {
        // Buttons without labels
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            const icon = button.querySelector('i[class*="fa-"]');
            if (icon && !button.textContent.trim()) {
                const iconClass = icon.className.match(/fa-([a-z-]+)/);
                if (iconClass) {
                    const label = this.getIconLabel(iconClass[1]);
                    button.setAttribute('aria-label', label);
                }
            }
        });

        // Form inputs without labels
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
            const placeholder = input.getAttribute('placeholder');
            if (placeholder) {
                input.setAttribute('aria-label', placeholder);
            }
        });
    }

    /**
     * Get human-readable label for icon
     */
    getIconLabel(iconName) {
        const iconLabels = {
            'search': 'Search',
            'home': 'Home',
            'user-tie': 'Leads',
            'address-book': 'Contacts',
            'building': 'Accounts',
            'handshake': 'Deals',
            'tasks': 'Tasks',
            'calendar-alt': 'Meetings',
            'phone': 'Calls',
            'chart-bar': 'Reports',
            'tachometer-alt': 'Dashboard',
            'cog': 'Settings',
            'bell': 'Notifications',
            'question-circle': 'Help',
            'sync-alt': 'Refresh',
            'plus': 'Add',
            'edit': 'Edit',
            'trash': 'Delete',
            'times': 'Close',
            'chevron-down': 'Expand',
            'chevron-up': 'Collapse'
        };

        return iconLabels[iconName] || iconName.replace(/-/g, ' ');
    }

    /**
     * Setup live regions for dynamic content updates
     */
    setupLiveRegions() {
        // Status region for success/error messages
        const statusRegion = document.createElement('div');
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        statusRegion.className = 'sr-only';
        statusRegion.id = 'status-region';
        document.body.appendChild(statusRegion);

        // Alert region for urgent messages
        const alertRegion = document.createElement('div');
        alertRegion.setAttribute('aria-live', 'assertive');
        alertRegion.setAttribute('aria-atomic', 'true');
        alertRegion.className = 'sr-only';
        alertRegion.id = 'alert-region';
        document.body.appendChild(alertRegion);
    }

    /**
     * Bind accessibility events
     */
    bindEvents() {
        // Announce page changes
        window.addEventListener('popstate', () => {
            const pageTitle = document.title;
            this.announce(`Navigated to ${pageTitle}`);
        });

        // Announce form validation errors
        document.addEventListener('invalid', (e) => {
            const message = e.target.validationMessage;
            this.announce(`Validation error: ${message}`, 'assertive');
        });

        // Announce successful form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.checkValidity()) {
                this.announce('Form submitted successfully');
            }
        });
    }

    /**
     * Load accessibility preferences
     */
    loadPreferences() {
        try {
            const stored = localStorage.getItem('accessibility-preferences');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save accessibility preferences
     */
    savePreferences() {
        try {
            localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Failed to save accessibility preferences:', error);
        }
    }

    /**
     * Set focus with announcement
     */
    setFocus(element, announcement) {
        if (element) {
            element.focus();
            if (announcement) {
                this.announce(announcement);
            }
        }
    }

    /**
     * Trap focus within element
     */
    trapFocus(element) {
        this.focusStack.push(this.lastFocusedElement);
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Restore focus from trap
     */
    restoreFocus() {
        const previousFocus = this.focusStack.pop();
        if (previousFocus) {
            previousFocus.focus();
        }
    }

    /**
     * Check if user prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Announce loading states
     */
    announceLoading(isLoading, message = 'Loading') {
        if (isLoading) {
            this.announce(`${message}...`);
        } else {
            this.announce('Loading complete');
        }
    }

    /**
     * Create accessible loading indicator
     */
    createLoadingIndicator(container, message = 'Loading') {
        const loader = document.createElement('div');
        loader.className = 'loading-indicator';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-label', message);
        loader.innerHTML = `
            <div class="spinner" aria-hidden="true"></div>
            <span class="sr-only">${message}...</span>
        `;
        
        container.appendChild(loader);
        this.announceLoading(true, message);
        
        return {
            remove: () => {
                loader.remove();
                this.announceLoading(false);
            }
        };
    }

    /**
     * Make table accessible
     */
    makeTableAccessible(table) {
        // Add role if missing
        if (!table.hasAttribute('role')) {
            table.setAttribute('role', 'table');
        }

        // Add scope to headers
        table.querySelectorAll('th').forEach((th, index) => {
            if (!th.hasAttribute('scope')) {
                th.setAttribute('scope', th.closest('thead') ? 'col' : 'row');
            }
            
            // Add unique ID for referencing
            if (!th.id) {
                th.id = `header-${index}`;
            }
        });

        // Add headers attribute to cells
        const headerIds = Array.from(table.querySelectorAll('thead th')).map(th => th.id);
        table.querySelectorAll('tbody td').forEach((td, index) => {
            const columnIndex = index % headerIds.length;
            if (headerIds[columnIndex]) {
                td.setAttribute('headers', headerIds[columnIndex]);
            }
        });

        // Add caption if missing
        if (!table.querySelector('caption')) {
            const caption = document.createElement('caption');
            caption.textContent = table.getAttribute('aria-label') || 'Data table';
            caption.className = 'sr-only';
            table.insertBefore(caption, table.firstChild);
        }
    }

    /**
     * Create accessible notification
     */
    createNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
        notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}" aria-hidden="true"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        // Add to container
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Announce to screen readers
        this.announce(message, type === 'error' ? 'assertive' : 'polite');

        return notification;
    }

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Destroy accessibility manager
     */
    destroy() {
        if (this.announcer) {
            this.announcer.remove();
        }
        
        document.querySelectorAll('.accessibility-toggle').forEach(toggle => {
            toggle.remove();
        });
    }
}

/**
 * Performance Manager
 */
class PerformanceManager {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupPerformanceObserver();
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.optimizeImages();
        this.setupLazyLoading();
        this.monitorPerformance();
    }

    /**
     * Setup performance observer for metrics
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.recordMetric(entry.name, entry.duration);
                });
            });

            observer.observe({ entryTypes: ['measure', 'navigation'] });
            this.observers.set('performance', observer);
        }
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '50px' });

            this.observers.set('intersection', observer);
        }
    }

    /**
     * Setup mutation observer for DOM changes
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.optimizeNewElement(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.set('mutation', observer);
    }

    /**
     * Optimize images for performance
     */
    optimizeImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            const intersectionObserver = this.observers.get('intersection');
            if (intersectionObserver) {
                intersectionObserver.observe(img);
            }
        });
    }

    /**
     * Setup lazy loading for content
     */
    setupLazyLoading() {
        document.querySelectorAll('[data-lazy]').forEach(element => {
            const intersectionObserver = this.observers.get('intersection');
            if (intersectionObserver) {
                intersectionObserver.observe(element);
            }
        });
    }

    /**
     * Load element when it becomes visible
     */
    loadElement(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
        }

        if (element.dataset.lazy) {
            const event = new CustomEvent('lazyload', { detail: { element } });
            element.dispatchEvent(event);
            element.removeAttribute('data-lazy');
        }
    }

    /**
     * Optimize newly added elements
     */
    optimizeNewElement(element) {
        // Add lazy loading to new images
        element.querySelectorAll('img[data-src]').forEach(img => {
            const intersectionObserver = this.observers.get('intersection');
            if (intersectionObserver) {
                intersectionObserver.observe(img);
            }
        });

        // Add lazy loading to new content
        element.querySelectorAll('[data-lazy]').forEach(el => {
            const intersectionObserver = this.observers.get('intersection');
            if (intersectionObserver) {
                intersectionObserver.observe(el);
            }
        });
    }

    /**
     * Record performance metric
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push({
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Get performance metrics
     */
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }

    /**
     * Monitor overall performance
     */
    monitorPerformance() {
        // Monitor page load time
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.recordMetric('pageLoad', navigation.loadEventEnd - navigation.loadEventStart);
            }
        });

        // Monitor frame rate
        let lastFrameTime = performance.now();
        const monitorFrameRate = (currentTime) => {
            const frameDuration = currentTime - lastFrameTime;
            this.recordMetric('frameDuration', frameDuration);
            lastFrameTime = currentTime;
            requestAnimationFrame(monitorFrameRate);
        };
        requestAnimationFrame(monitorFrameRate);
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Virtual scrolling for large lists
     */
    createVirtualScroller(container, items, renderItem, itemHeight = 50) {
        const totalHeight = items.length * itemHeight;
        const visibleHeight = container.clientHeight;
        const visibleCount = Math.ceil(visibleHeight / itemHeight) + 1;

        let scrollTop = 0;
        let startIndex = 0;

        const viewport = document.createElement('div');
        viewport.style.height = `${totalHeight}px`;
        viewport.style.position = 'relative';

        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '0';
        content.style.width = '100%';

        viewport.appendChild(content);
        container.appendChild(viewport);

        const render = () => {
            startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleCount, items.length);

            content.style.transform = `translateY(${startIndex * itemHeight}px)`;
            content.innerHTML = '';

            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                content.appendChild(item);
            }
        };

        const onScroll = this.throttle(() => {
            scrollTop = container.scrollTop;
            render();
        }, 16);

        container.addEventListener('scroll', onScroll);
        render();

        return {
            update: (newItems) => {
                items = newItems;
                viewport.style.height = `${items.length * itemHeight}px`;
                render();
            },
            destroy: () => {
                container.removeEventListener('scroll', onScroll);
                viewport.remove();
            }
        };
    }

    /**
     * Destroy performance manager
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.metrics.clear();
    }
}

// Initialize managers
const accessibilityManager = new AccessibilityManager();
const performanceManager = new PerformanceManager();

// Global utilities
window.Accessibility = accessibilityManager;
window.Performance = performanceManager;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccessibilityManager, PerformanceManager };
}