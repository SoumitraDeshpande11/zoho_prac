/**
 * Zoho CRM Clone - Navbar JavaScript
 * Handles all navbar interactions, dropdowns, search, and mobile navigation
 */

class NavbarManager {
    constructor() {
        this.isSearchActive = false;
        this.isMobileMenuOpen = false;
        this.activeDropdown = null;
        this.searchTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeSearch();
        this.setupKeyboardNavigation();
        this.handleResize();
    }

    /**
     * Bind all navbar events
     */
    bindEvents() {
        // Dropdown toggles
        this.bindDropdownEvents();
        
        // Search functionality
        this.bindSearchEvents();
        
        // Mobile menu
        this.bindMobileEvents();
        
        // User menu
        this.bindUserMenuEvents();
        
        // Notifications
        this.bindNotificationEvents();
        
        // Outside clicks
        this.bindOutsideClicks();
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Escape key
        document.addEventListener('keydown', (e) => this.handleEscapeKey(e));
    }

    /**
     * Bind dropdown events
     */
    bindDropdownEvents() {
        const dropdowns = document.querySelectorAll('.navbar-item.dropdown');
        
        dropdowns.forEach(dropdown => {
            const link = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (link && menu) {
                // Store hover timeout for this dropdown
                dropdown.hoverTimeout = null;
                
                // Mouse events with proper hover handling
                dropdown.addEventListener('mouseenter', (e) => {
                    e.stopPropagation();
                    // Clear any pending hide timeout
                    if (dropdown.hoverTimeout) {
                        clearTimeout(dropdown.hoverTimeout);
                        dropdown.hoverTimeout = null;
                    }
                    this.showDropdown(dropdown);
                });
                
                dropdown.addEventListener('mouseleave', (e) => {
                    e.stopPropagation();
                    // Add delay to prevent flickering when moving to submenu
                    dropdown.hoverTimeout = setTimeout(() => {
                        if (!this.isMouseOverDropdown(dropdown)) {
                            this.hideDropdown(dropdown);
                        }
                    }, 150);
                });
                
                // Keep dropdown open when hovering over menu
                menu.addEventListener('mouseenter', (e) => {
                    e.stopPropagation();
                    if (dropdown.hoverTimeout) {
                        clearTimeout(dropdown.hoverTimeout);
                        dropdown.hoverTimeout = null;
                    }
                    this.showDropdown(dropdown);
                });
                
                menu.addEventListener('mouseleave', (e) => {
                    e.stopPropagation();
                    dropdown.hoverTimeout = setTimeout(() => {
                        if (!this.isMouseOverDropdown(dropdown)) {
                            this.hideDropdown(dropdown);
                        }
                    }, 150);
                });
                
                // Click events for mobile
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.innerWidth <= 768) {
                        this.toggleDropdown(dropdown);
                    }
                });
                
                // Keyboard navigation
                link.addEventListener('keydown', (e) => {
                    this.handleDropdownKeydown(e, dropdown);
                });
            }
        });
    }

    /**
     * Bind search events
     */
    bindSearchEvents() {
        const searchInput = document.getElementById('global-search');
        const searchBtn = document.getElementById('search-btn');
        const searchDropdown = document.getElementById('search-dropdown');
        
        if (searchInput && searchDropdown) {
            // Focus events
            searchInput.addEventListener('focus', () => {
                this.showSearchDropdown();
            });
            
            // Input events
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            // Search button click
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.performSearch(searchInput.value);
                });
            }
            
            // Enter key search
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(searchInput.value);
                } else if (e.key === 'Escape') {
                    this.hideSearchDropdown();
                    searchInput.blur();
                }
            });
            
            // Search tags
            this.bindSearchTags();
        }
    }

    /**
     * Bind search tag events
     */
    bindSearchTags() {
        const searchTags = document.querySelectorAll('.search-tag');
        searchTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const searchInput = document.getElementById('global-search');
                if (searchInput) {
                    searchInput.value = tag.textContent;
                    this.performSearch(tag.textContent);
                }
            });
        });
    }

    /**
     * Bind mobile menu events
     */
    bindMobileEvents() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileClose = document.getElementById('mobile-close');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        if (mobileClose) {
            mobileClose.addEventListener('click', () => {
                this.hideMobileMenu();
            });
        }
        
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this.hideMobileMenu();
            });
        }
    }

    /**
     * Bind user menu events
     */
    bindUserMenuEvents() {
        const userMenu = document.getElementById('user-menu');
        const userDropdown = document.querySelector('.user-dropdown-menu');
        
        if (userMenu && userDropdown) {
            userMenu.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUserMenu();
            });
        }
    }

    /**
     * Bind notification events
     */
    bindNotificationEvents() {
        const notificationBtn = document.getElementById('notifications-btn');
        
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    /**
     * Bind outside click events
     */
    bindOutsideClicks() {
        document.addEventListener('click', (e) => {
            // Close dropdowns when clicking outside
            if (!e.target.closest('.navbar-item.dropdown')) {
                this.hideAllDropdowns();
            }
            
            // Close search dropdown when clicking outside
            if (!e.target.closest('.navbar-search')) {
                this.hideSearchDropdown();
            }
            
            // Close user menu when clicking outside
            if (!e.target.closest('.user-profile')) {
                this.hideUserMenu();
            }
        });
    }

    /**
     * Show dropdown menu
     */
    showDropdown(dropdown) {
        if (this.activeDropdown && this.activeDropdown !== dropdown) {
            this.hideDropdown(this.activeDropdown);
        }
        
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            dropdown.classList.add('active');
            menu.classList.add('show');
            this.activeDropdown = dropdown;
            
            // Update arrow
            const arrow = dropdown.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(180deg)';
            }
            
            // Reset and trigger staggered animation for dropdown items
            this.triggerStaggeredAnimation(menu);
        }
    }

    /**
     * Hide dropdown menu
     */
    hideDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            dropdown.classList.remove('active');
            menu.classList.remove('show');
            
            if (this.activeDropdown === dropdown) {
                this.activeDropdown = null;
            }
            
            // Reset arrow
            const arrow = dropdown.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
            
            // Clear any pending hover timeout
            if (dropdown.hoverTimeout) {
                clearTimeout(dropdown.hoverTimeout);
                dropdown.hoverTimeout = null;
            }
            
            // Reset dropdown items animation state
            this.resetDropdownItems(menu);
        }
    }

    /**
     * Toggle dropdown menu
     */
    toggleDropdown(dropdown) {
        if (dropdown.classList.contains('active')) {
            this.hideDropdown(dropdown);
        } else {
            this.showDropdown(dropdown);
        }
    }

    /**
     * Hide all dropdowns
     */
    hideAllDropdowns() {
        const activeDropdowns = document.querySelectorAll('.navbar-item.dropdown.active');
        activeDropdowns.forEach(dropdown => {
            // Clear any hover timeouts
            if (dropdown.hoverTimeout) {
                clearTimeout(dropdown.hoverTimeout);
                dropdown.hoverTimeout = null;
            }
            this.hideDropdown(dropdown);
        });
    }

    /**
     * Trigger staggered animation for dropdown items
     */
    triggerStaggeredAnimation(menu) {
        const items = menu.querySelectorAll('.dropdown-item');
        
        // Reset all items first
        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.animation = 'none';
        });
        
        // Force reflow
        menu.offsetHeight;
        
        // Apply staggered animation
        items.forEach((item, index) => {
            const delay = (index + 1) * 0.05; // 50ms delay between each item
            item.style.animation = `slideInStaggered 0.4s ease forwards`;
            item.style.animationDelay = `${delay}s`;
        });
    }

    /**
     * Reset dropdown items animation state
     */
    resetDropdownItems(menu) {
        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.style.opacity = '';
            item.style.transform = '';
            item.style.animation = '';
            item.style.animationDelay = '';
        });
    }

    /**
     * Check if mouse is over dropdown or its menu
     */
    isMouseOverDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        return dropdown.matches(':hover') || (menu && menu.matches(':hover'));
    }

    /**
     * Handle dropdown keyboard navigation
     */
    handleDropdownKeydown(e, dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const items = menu.querySelectorAll('.dropdown-item');
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleDropdown(dropdown);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.showDropdown(dropdown);
                if (items.length > 0) {
                    items[0].focus();
                }
                break;
                
            case 'Escape':
                this.hideDropdown(dropdown);
                break;
        }
    }

    /**
     * Show search dropdown
     */
    showSearchDropdown() {
        const searchDropdown = document.getElementById('search-dropdown');
        if (searchDropdown) {
            searchDropdown.classList.add('show');
            this.isSearchActive = true;
        }
    }

    /**
     * Hide search dropdown
     */
    hideSearchDropdown() {
        const searchDropdown = document.getElementById('search-dropdown');
        if (searchDropdown) {
            searchDropdown.classList.remove('show');
            this.isSearchActive = false;
        }
    }

    /**
     * Handle search input
     */
    handleSearchInput(query) {
        // Clear previous timer
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
        
        // Debounce search
        this.searchTimer = setTimeout(() => {
            this.updateSearchResults(query);
        }, 300);
    }

    /**
     * Update search results
     */
    updateSearchResults(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer || !query.trim()) {
            return;
        }
        
        // Show loading state
        this.showSearchLoading();
        
        // Simulate search delay
        setTimeout(() => {
            const mockResults = this.generateMockSearchResults(query);
            this.displaySearchResults(mockResults);
        }, 500);
    }

    /**
     * Generate mock search results
     */
    generateMockSearchResults(query) {
        const mockData = [
            { type: 'lead', name: 'John Smith', company: 'Tech Solutions Inc', id: 'lead_1' },
            { type: 'contact', name: 'Sarah Johnson', company: 'Digital Marketing Co', id: 'contact_1' },
            { type: 'account', name: 'Enterprise Solutions Ltd', industry: 'Technology', id: 'account_1' },
            { type: 'deal', name: 'Q1 Software License Deal', amount: '$75,000', id: 'deal_1' },
            { type: 'task', name: 'Follow up with Enterprise Solutions', status: 'Pending', id: 'task_1' }
        ];
        
        return mockData.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            (item.company && item.company.toLowerCase().includes(query.toLowerCase()))
        );
    }

    /**
     * Display search results
     */
    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        let html = '';
        
        if (results.length > 0) {
            html += '<div class="search-section">';
            html += '<h6 class="search-section-title">Search Results</h6>';
            
            results.forEach(result => {
                html += `
                    <a href="pages/${result.type}s.html?id=${result.id}" class="dropdown-item search-result-item">
                        <i class="fas ${this.getTypeIcon(result.type)}"></i>
                        <div class="search-result-content">
                            <div class="search-result-name">${result.name}</div>
                            <div class="search-result-meta">${result.company || result.industry || result.amount || result.status}</div>
                        </div>
                    </a>
                `;
            });
            
            html += '</div>';
        } else {
            html += `
                <div class="search-section">
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>No results found</p>
                    </div>
                </div>
            `;
        }
        
        // Add quick access section
        html += `
            <div class="search-section">
                <h6 class="search-section-title">Quick Access</h6>
                <a href="pages/leads.html" class="quick-access-item">
                    <i class="fas fa-user-tie"></i>
                    Create New Lead
                </a>
                <a href="pages/contacts.html" class="quick-access-item">
                    <i class="fas fa-address-book"></i>
                    Add Contact
                </a>
                <a href="pages/deals.html" class="quick-access-item">
                    <i class="fas fa-handshake"></i>
                    New Deal
                </a>
                <a href="pages/tasks.html" class="quick-access-item">
                    <i class="fas fa-tasks"></i>
                    Create Task
                </a>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }

    /**
     * Show search loading state
     */
    showSearchLoading() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-section">
                    <div class="search-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Searching...</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Get icon for search result type
     */
    getTypeIcon(type) {
        const icons = {
            lead: 'fa-user-tie',
            contact: 'fa-address-book',
            account: 'fa-building',
            deal: 'fa-handshake',
            task: 'fa-tasks',
            meeting: 'fa-calendar-alt',
            call: 'fa-phone'
        };
        return icons[type] || 'fa-file';
    }

    /**
     * Perform search
     */
    performSearch(query) {
        if (!query.trim()) return;
        
        // Add to recent searches
        this.addToRecentSearches(query);
        
        // Navigate to search results page
        window.location.href = `pages/search-results.html?q=${encodeURIComponent(query)}`;
    }

    /**
     * Add to recent searches
     */
    addToRecentSearches(query) {
        let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Remove if already exists
        recentSearches = recentSearches.filter(search => search !== query);
        
        // Add to beginning
        recentSearches.unshift(query);
        
        // Keep only last 5
        recentSearches = recentSearches.slice(0, 5);
        
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        
        // Update UI
        this.updateRecentSearches();
    }

    /**
     * Update recent searches in UI
     */
    updateRecentSearches() {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const container = document.querySelector('.recent-searches');
        
        if (container && recentSearches.length > 0) {
            container.innerHTML = recentSearches.map(search => 
                `<span class="search-tag">${search}</span>`
            ).join('');
            
            // Re-bind events
            this.bindSearchTags();
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.hideMobileMenu();
        } else {
            this.showMobileMenu();
        }
    }

    /**
     * Show mobile menu
     */
    showMobileMenu() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileSidebar && mobileOverlay) {
            mobileSidebar.classList.add('show');
            mobileOverlay.classList.add('show');
            this.isMobileMenuOpen = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide mobile menu
     */
    hideMobileMenu() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileSidebar && mobileOverlay) {
            mobileSidebar.classList.remove('show');
            mobileOverlay.classList.remove('show');
            this.isMobileMenuOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    /**
     * Toggle user menu
     */
    toggleUserMenu() {
        const userDropdown = document.querySelector('.user-dropdown-menu');
        if (userDropdown) {
            userDropdown.classList.toggle('show');
        }
    }

    /**
     * Hide user menu
     */
    hideUserMenu() {
        const userDropdown = document.querySelector('.user-dropdown-menu');
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
    }

    /**
     * Show notifications
     */
    showNotifications() {
        // Create notification modal/panel
        const notificationPanel = this.createNotificationPanel();
        document.body.appendChild(notificationPanel);
        
        setTimeout(() => {
            notificationPanel.classList.add('show');
        }, 10);
    }

    /**
     * Create notification panel
     */
    createNotificationPanel() {
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-panel-content">
                <div class="notification-panel-header">
                    <h6>Notifications</h6>
                    <button class="notification-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-panel-body">
                    <div class="notification-item">
                        <div class="notification-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <div class="notification-content">
                            <p><strong>New deal created</strong></p>
                            <p>Q4 Enterprise Solution - $125,000</p>
                            <span class="notification-time">2 minutes ago</span>
                        </div>
                    </div>
                    <div class="notification-item">
                        <div class="notification-icon">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="notification-content">
                            <p><strong>New lead assigned</strong></p>
                            <p>Michael Johnson from Tech Corp</p>
                            <span class="notification-time">5 minutes ago</span>
                        </div>
                    </div>
                    <div class="notification-item">
                        <div class="notification-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="notification-content">
                            <p><strong>Meeting reminder</strong></p>
                            <p>Client presentation in 30 minutes</p>
                            <span class="notification-time">10 minutes ago</span>
                        </div>
                    </div>
                </div>
                <div class="notification-panel-footer">
                    <a href="pages/notifications.html" class="view-all-notifications">
                        View All Notifications
                    </a>
                </div>
            </div>
        `;
        
        // Close button event
        panel.querySelector('.notification-close').addEventListener('click', () => {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.remove();
            }, 300);
        });
        
        return panel;
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + S for search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const searchInput = document.getElementById('global-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Alt + M for mobile menu (on mobile)
            if (e.altKey && e.key === 'm' && window.innerWidth <= 768) {
                e.preventDefault();
                this.toggleMobileMenu();
            }
        });
    }

    /**
     * Handle escape key
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            this.hideAllDropdowns();
            this.hideSearchDropdown();
            this.hideUserMenu();
            this.hideMobileMenu();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.hideMobileMenu();
        }
        
        // Close dropdowns on mobile
        if (window.innerWidth <= 768) {
            this.hideAllDropdowns();
        }
    }

    /**
     * Initialize search with recent searches
     */
    initializeSearch() {
        this.updateRecentSearches();
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
});

// Add notification panel styles
const notificationStyles = `
<style>
.notification-panel {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 350px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 1004;
    max-height: 80vh;
    overflow: hidden;
}

.notification-panel.show {
    opacity: 1;
    transform: translateY(0);
}

.notification-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.notification-panel-header h6 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2b2e34;
}

.notification-close {
    background: none;
    border: none;
    color: #6c757d;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.notification-close:hover {
    color: #f0433d;
    background-color: #f8f9fa;
}

.notification-panel-body {
    max-height: 400px;
    overflow-y: auto;
}

.notification-item {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;
}

.notification-item:hover {
    background-color: #f8f9fa;
}

.notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0433d;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
    flex-shrink: 0;
}

.notification-content {
    flex: 1;
}

.notification-content p {
    margin: 0 0 4px 0;
    font-size: 14px;
    line-height: 1.4;
}

.notification-time {
    font-size: 12px;
    color: #6c757d;
}

.notification-panel-footer {
    padding: 16px 20px;
    background-color: #f8f9fa;
    text-align: center;
}

.view-all-notifications {
    color: #f0433d;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
}

.view-all-notifications:hover {
    text-decoration: underline;
}

.search-loading, .no-results {
    text-align: center;
    padding: 20px;
    color: #6c757d;
}

.search-loading i {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
}

.search-result-item {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
    padding: 12px 16px !important;
}

.search-result-content {
    flex: 1;
}

.search-result-name {
    font-weight: 500;
    color: #2b2e34;
    margin-bottom: 2px;
}

.search-result-meta {
    font-size: 12px;
    color: #6c757d;
}
</style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', notificationStyles);