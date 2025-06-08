/**
 * Zoho CRM Clone - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Main script initialization

    // Initialize navbar first
    loadNavbar();
    
    // Initialize components
    initSidebar();
    initDropdowns();
    initSearchBars();
    initCheckboxes();
    initPagination();
    initFilterTabs();
    initTooltips();
    initNotifications();
    initNavbarNavigation();
});

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Toggle sidebar on mobile
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Handle sidebar menu item clicks
    const menuItems = document.querySelectorAll('.sidebar-menu-item a');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all menu items
            menuItems.forEach(i => i.parentElement.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.parentElement.classList.add('active');
            
            // On mobile, hide sidebar after click
            if (window.innerWidth < 768) {
                sidebar.classList.remove('show');
            }
        });
    });
}

/**
 * Initialize dropdown functionality
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
                
                // Close other open dropdowns
                dropdowns.forEach(d => {
                    if (d !== dropdown && d.querySelector('.dropdown-menu.show')) {
                        d.querySelector('.dropdown-menu').classList.remove('show');
                    }
                });
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });
}

/**
 * Initialize search bar functionality
 */
function initSearchBars() {
    const searchBars = document.querySelectorAll('.topbar-search input, .sidebar-search input');
    
    searchBars.forEach(searchBar => {
        searchBar.addEventListener('focus', () => {
            searchBar.parentElement.classList.add('focused');
        });
        
        searchBar.addEventListener('blur', () => {
            searchBar.parentElement.classList.remove('focused');
        });
        
        searchBar.addEventListener('input', (e) => {
            // Implement search functionality here
            console.log('Searching for:', e.target.value);
        });
    });
}

/**
 * Initialize checkbox functionality
 */
function initCheckboxes() {
    const tableHeaders = document.querySelectorAll('th.checkbox-column input[type="checkbox"]');
    
    tableHeaders.forEach(headerCheckbox => {
        headerCheckbox.addEventListener('change', () => {
            const table = headerCheckbox.closest('table');
            const checkboxes = table.querySelectorAll('tbody td.checkbox-column input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = headerCheckbox.checked;
            });
        });
    });
}

/**
 * Initialize pagination functionality
 */
function initPagination() {
    const paginationButtons = document.querySelectorAll('.table-pagination-button, .leads-pagination-button, .contacts-pagination-button, .accounts-pagination-button');
    
    paginationButtons.forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', () => {
                // Implement pagination functionality here
                console.log('Pagination button clicked');
            });
        }
    });
}

/**
 * Initialize filter tabs functionality
 */
function initFilterTabs() {
    const filterButtons = document.querySelectorAll('.leads-view-button, .contacts-view-button, .accounts-view-button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons in the same container
            const container = button.closest('.leads-views, .contacts-views, .accounts-views');
            container.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Implement filter functionality here
            console.log('Filter applied:', button.textContent.trim());
        });
    });
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            const tooltipText = element.getAttribute('data-tooltip');
            
            if (tooltipText) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                const rect = element.getBoundingClientRect();
                tooltip.style.top = `${rect.bottom + 10}px`;
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
                
                setTimeout(() => {
                    tooltip.classList.add('show');
                }, 10);
                
                element.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(tooltip);
                    }, 200);
                }, { once: true });
            }
        });
    });
}

/**
 * Initialize notifications
 */
function initNotifications() {
    const notificationBadges = document.querySelectorAll('.badge');
    const notificationIcons = document.querySelectorAll('.topbar-icon .fa-bell, .footer-action-button .fa-bell');
    
    notificationIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            // Implement notification panel functionality here
            console.log('Notification icon clicked');
        });
    });
}

/**
 * Dynamic content loading for pages
 */
function loadPageContent(pageId) {
    const pageContent = document.getElementById('page-content');
    
    if (!pageContent) return;
    
    // Clear current content
    pageContent.innerHTML = '';
    
    // Load new content based on pageId
    switch (pageId) {
        case 'home':
            loadHomePage(pageContent);
            break;
        case 'leads':
            loadLeadsPage(pageContent);
            break;
        case 'contacts':
            loadContactsPage(pageContent);
            break;
        case 'accounts':
            loadAccountsPage(pageContent);
            break;
        case 'dashboards':
            loadDashboardsPage(pageContent);
            break;
        case 'reports':
            loadReportsPage(pageContent);
            break;
        case 'marketplace':
            loadMarketplacePage(pageContent);
            break;
        default:
            pageContent.innerHTML = '<div class="content-placeholder">Page content not available</div>';
    }
}

/**
 * Update page title and breadcrumbs
 */
function updatePageHeader(title) {
    const pageTitle = document.querySelector('.topbar-title');
    
    if (pageTitle) {
        pageTitle.textContent = title;
    }
}

/**
 * Handle form submissions
 */
function handleFormSubmit(form, successCallback) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate form
        if (validateForm(form)) {
            // Collect form data
            const formData = new FormData(form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // Simulate form submission
            console.log('Form submitted:', data);
            
            // Call success callback if provided
            if (typeof successCallback === 'function') {
                successCallback(data);
            }
        }
    });
}

/**
 * Validate form fields
 */
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Clear previous error messages
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    
    requiredFields.forEach(field => {
        field.classList.remove('is-invalid');
        
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            
            // Add error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'This field is required';
            field.parentNode.appendChild(errorMessage);
        }
    });
    
    // Validate email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value.trim() && !validateEmail(field.value)) {
            isValid = false;
            field.classList.add('is-invalid');
            
            // Add error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please enter a valid email address';
            field.parentNode.appendChild(errorMessage);
        }
    });
    
    return isValid;
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto hide after 5 seconds
    const hideTimeout = setTimeout(() => {
        hideToast(toast);
    }, 5000);
    
    // Close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        clearTimeout(hideTimeout);
        hideToast(toast);
    });
}

/**
 * Hide toast notification
 */
function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 300);
}

/**
 * Format date for display
 */
function formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}/${day}/${year}`;
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Load navbar on all pages
 */
function loadNavbar() {
    // Don't load navbar if it already exists
    if (document.querySelector('.main-navbar')) {
        return;
    }
    
    // Determine correct path to navbar.html
    const isInSubdirectory = window.location.pathname.includes('/pages/');
    const navbarPath = isInSubdirectory ? '../navbar.html' : 'navbar.html';
    
    // Fetch and insert navbar
    fetch(navbarPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load navbar: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const navbar = doc.querySelector('.main-navbar');
            
            if (navbar) {
                // Fix relative paths in navbar links
                if (isInSubdirectory) {
                    fixNavbarPaths(navbar);
                }
                
                // Insert navbar at the beginning of the body
                document.body.insertBefore(navbar, document.body.firstChild);
                
                // Initialize navbar functionality
                setTimeout(initNavbarFunctionality, 100);
            }
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
        });
}

/**
 * Fix navbar link paths for subdirectory pages
 */
function fixNavbarPaths(navbar) {
    const links = navbar.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Fix relative paths by adding ../ prefix for pages in subdirectories
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('/')) {
            if (href.startsWith('pages/') || href === 'index.html' || href.endsWith('.html')) {
                link.setAttribute('href', '../' + href);
            }
        }
    });
}

/**
 * Initialize navbar navigation functionality
 */
function initNavbarNavigation() {
    // Add handler for Modules button navigation
    setTimeout(() => {
        const modulesButton = document.querySelector('#modules-dropdown .navbar-link');
        if (modulesButton) {
            modulesButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                const indexPath = window.location.pathname.includes('/pages/') 
                    ? '../index.html' 
                    : 'index.html';
                
                window.location.href = indexPath;
            });
        }
    }, 200);
}

/**
 * Navigate to a specific page
 */
function navigateToPage(pagePath) {
    const isInSubdirectory = window.location.pathname.includes('/pages/');
    let fullPath = pagePath;
    
    if (isInSubdirectory) {
        if (pagePath.startsWith('pages/')) {
            fullPath = '../' + pagePath.substring(6);
        } else {
            fullPath = '../' + pagePath;
        }
    }
    
    window.location.href = fullPath;
}

/**
 * Initialize navbar functionality after it's loaded
 */
function initNavbarFunctionality() {
    // Initialize dropdowns
    const dropdowns = document.querySelectorAll('.navbar-item.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        const arrow = dropdown.querySelector('.dropdown-arrow');
        
        if (toggle && menu && arrow) {
            // Handle dropdown arrow clicks to show/hide dropdown
            arrow.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.querySelector('.dropdown-menu').classList.remove('show');
                    }
                });
                
                // Toggle current dropdown
                menu.classList.toggle('show');
            });
            
            // Handle main link clicks - allow natural navigation
            toggle.addEventListener('click', (e) => {
                // If clicking on the arrow area, prevent navigation and toggle dropdown
                if (e.target.closest('.dropdown-arrow')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Close other dropdowns
                    dropdowns.forEach(d => {
                        if (d !== dropdown) {
                            d.querySelector('.dropdown-menu').classList.remove('show');
                        }
                    });
                    
                    // Toggle current dropdown
                    menu.classList.toggle('show');
                } else {
                    // Allow natural navigation to the href destination
                    // No preventDefault() here - let the browser handle the navigation
                    console.log('Navigating via navbar link');
                }
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
    
    // Initialize search functionality
    initNavbarSearch();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize user menu
    initUserMenu();
}

/**
 * Initialize navbar search functionality
 */
function initNavbarSearch() {
    const searchInput = document.querySelector('#global-search');
    const searchDropdown = document.querySelector('#search-dropdown');
    const searchButton = document.querySelector('#search-btn');
    
    if (searchInput && searchDropdown) {
        searchInput.addEventListener('focus', () => {
            searchDropdown.classList.add('show');
        });
        
        searchInput.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on dropdown items
            setTimeout(() => {
                if (!searchDropdown.contains(document.activeElement)) {
                    searchDropdown.classList.remove('show');
                }
            }, 200);
        });
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                // Perform search (placeholder functionality)
                console.log('Searching for:', query);
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                console.log('Search button clicked for:', query);
                // Implement actual search functionality here
            }
        });
    }
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const mobileToggle = document.querySelector('#mobile-menu-toggle');
    const mobileSidebar = document.querySelector('#mobile-sidebar');
    const mobileClose = document.querySelector('#mobile-close');
    
    if (mobileToggle && mobileSidebar) {
        mobileToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('show');
        });
    }
    
    if (mobileClose && mobileSidebar) {
        mobileClose.addEventListener('click', () => {
            mobileSidebar.classList.remove('show');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileSidebar && !mobileSidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
            mobileSidebar.classList.remove('show');
        }
    });
}

/**
 * Initialize user menu functionality
 */
function initUserMenu() {
    const userMenu = document.querySelector('#user-menu');
    const userDropdown = document.querySelector('.user-dropdown-menu');
    
    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile')) {
                userDropdown.classList.remove('show');
            }
        });
    }
}

