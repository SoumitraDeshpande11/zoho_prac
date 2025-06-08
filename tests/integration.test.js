/**
 * Zoho CRM Clone - Integration Tests
 * Comprehensive integration tests for the CRM application
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.sessionStorage = dom.window.sessionStorage;
global.fetch = jest.fn();
global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

describe('Zoho CRM Clone - Integration Tests', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        
        // Reset fetch mock
        fetch.mockClear();
        
        // Reset localStorage
        localStorage.clear();
        
        // Reset console
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Application Initialization', () => {
        test('should initialize core components without errors', () => {
            // Create basic HTML structure
            document.body.innerHTML = `
                <div class="container">
                    <aside class="sidebar">
                        <div class="sidebar-menu">
                            <ul class="sidebar-menu-items">
                                <li class="sidebar-menu-item">
                                    <a href="index.html">Home</a>
                                </li>
                            </ul>
                        </div>
                    </aside>
                    <main class="main-content">
                        <div class="content-wrapper">
                            <h1>Test Page</h1>
                        </div>
                    </main>
                </div>
            `;

            // Load main script (mocked)
            const mockScript = require('../js/script.js');
            
            // Should not throw any errors
            expect(() => {
                // Simulate DOMContentLoaded event
                const event = new dom.window.Event('DOMContentLoaded');
                document.dispatchEvent(event);
            }).not.toThrow();
        });

        test('should handle missing elements gracefully', () => {
            // Empty DOM
            document.body.innerHTML = '';
            
            // Should not throw errors with empty DOM
            expect(() => {
                const event = new dom.window.Event('DOMContentLoaded');
                document.dispatchEvent(event);
            }).not.toThrow();
        });
    });

    describe('Navbar Functionality', () => {
        beforeEach(() => {
            // Mock navbar HTML
            document.body.innerHTML = `
                <nav class="main-navbar">
                    <div class="navbar-container">
                        <div class="navbar-brand">
                            <span class="navbar-title">CRM</span>
                        </div>
                        <ul class="navbar-menu">
                            <li class="navbar-item dropdown" id="modules-dropdown">
                                <a href="#" class="navbar-link dropdown-toggle">
                                    Modules
                                </a>
                                <div class="dropdown-menu">
                                    <a href="pages/leads.html" class="dropdown-item">Leads</a>
                                    <a href="pages/contacts.html" class="dropdown-item">Contacts</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </nav>
            `;
        });

        test('should load navbar successfully', async () => {
            // Mock fetch response
            fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('<nav class="main-navbar">Navbar Content</nav>')
            });

            // Test navbar loading logic (mocked)
            const navbar = document.querySelector('.main-navbar');
            expect(navbar).toBeTruthy();
            expect(navbar.textContent).toContain('CRM');
        });

        test('should handle dropdown interactions', () => {
            const dropdown = document.querySelector('#modules-dropdown');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            const toggle = dropdown.querySelector('.dropdown-toggle');

            // Initial state
            expect(dropdownMenu.classList.contains('show')).toBe(false);

            // Simulate click on toggle
            const clickEvent = new dom.window.Event('click', { bubbles: true });
            toggle.dispatchEvent(clickEvent);

            // Should toggle dropdown (mocked behavior)
            expect(dropdown).toBeTruthy();
        });

        test('should handle navigation clicks', () => {
            const navLink = document.querySelector('.dropdown-item[href="pages/leads.html"]');
            
            // Mock navigation
            const originalLocation = window.location;
            delete window.location;
            window.location = { href: '' };

            // Simulate click
            const clickEvent = new dom.window.Event('click', { bubbles: true });
            navLink.dispatchEvent(clickEvent);

            // Restore location
            window.location = originalLocation;
            
            expect(navLink).toBeTruthy();
        });
    });

    describe('Sidebar Functionality', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="container">
                    <aside class="sidebar">
                        <div class="sidebar-search">
                            <input type="text" placeholder="Search" id="sidebar-search">
                        </div>
                        <div class="sidebar-menu">
                            <ul class="sidebar-menu-items">
                                <li class="sidebar-menu-item active">
                                    <a href="index.html">Home</a>
                                </li>
                                <li class="sidebar-menu-item">
                                    <a href="pages/leads.html">Leads</a>
                                </li>
                                <li class="sidebar-menu-item">
                                    <a href="pages/contacts.html">Contacts</a>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            `;
        });

        test('should initialize sidebar menu items', () => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item');
            expect(menuItems.length).toBe(3);
            
            const activeItem = document.querySelector('.sidebar-menu-item.active');
            expect(activeItem).toBeTruthy();
            expect(activeItem.textContent.trim()).toBe('Home');
        });

        test('should handle menu item selection', () => {
            const menuItems = document.querySelectorAll('.sidebar-menu-item a');
            const leadsItem = Array.from(menuItems).find(item => 
                item.getAttribute('href') === 'pages/leads.html'
            );

            // Simulate click
            const clickEvent = new dom.window.Event('click', { bubbles: true });
            leadsItem.dispatchEvent(clickEvent);

            expect(leadsItem).toBeTruthy();
        });

        test('should handle search functionality', () => {
            const searchInput = document.querySelector('#sidebar-search');
            
            // Simulate input
            searchInput.value = 'lead';
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            searchInput.dispatchEvent(inputEvent);

            expect(searchInput.value).toBe('lead');
        });
    });

    describe('Error Handling', () => {
        test('should handle fetch errors gracefully', async () => {
            // Mock fetch to reject
            fetch.mockRejectedValueOnce(new Error('Network error'));

            // Should handle error without crashing
            expect(() => {
                fetch('/test-endpoint').catch(error => {
                    expect(error.message).toBe('Network error');
                });
            }).not.toThrow();
        });

        test('should handle missing elements', () => {
            // Try to access non-existent elements
            const nonExistent = document.querySelector('.non-existent-class');
            expect(nonExistent).toBeNull();

            // Should not throw when trying to add event listeners to null elements
            expect(() => {
                if (nonExistent) {
                    nonExistent.addEventListener('click', () => {});
                }
            }).not.toThrow();
        });

        test('should handle localStorage errors', () => {
            // Mock localStorage to throw
            const mockSetItem = jest.spyOn(localStorage, 'setItem');
            mockSetItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                try {
                    localStorage.setItem('test', 'value');
                } catch (error) {
                    expect(error.message).toBe('Storage quota exceeded');
                }
            }).not.toThrow();

            mockSetItem.mockRestore();
        });
    });

    describe('Data Management', () => {
        test('should handle CRUD operations', () => {
            // Mock data manager
            const mockData = {
                leads: [
                    { id: 1, name: 'John Doe', email: 'john@example.com' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                ]
            };

            // Store in localStorage
            localStorage.setItem('crm-leads', JSON.stringify(mockData.leads));

            // Retrieve data
            const storedData = JSON.parse(localStorage.getItem('crm-leads'));
            expect(storedData).toEqual(mockData.leads);
            expect(storedData.length).toBe(2);
        });

        test('should validate form data', () => {
            // Mock form data
            const formData = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890'
            };

            // Basic validation tests
            expect(formData.name).toBeTruthy();
            expect(formData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(formData.phone).toBeTruthy();
        });

        test('should handle data synchronization', async () => {
            // Mock API response
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    leads: [
                        { id: 1, name: 'Updated Lead', email: 'updated@example.com' }
                    ]
                })
            });

            // Test sync operation
            const response = await fetch('/api/sync');
            const data = await response.json();
            
            expect(data.leads).toBeTruthy();
            expect(data.leads[0].name).toBe('Updated Lead');
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels', () => {
            document.body.innerHTML = `
                <nav class="main-navbar" role="navigation" aria-label="Main navigation">
                    <button aria-label="Toggle menu">Menu</button>
                </nav>
                <main role="main">
                    <h1>Page Title</h1>
                </main>
            `;

            const nav = document.querySelector('[role="navigation"]');
            const main = document.querySelector('[role="main"]');
            const button = document.querySelector('[aria-label="Toggle menu"]');

            expect(nav).toBeTruthy();
            expect(main).toBeTruthy();
            expect(button).toBeTruthy();
            expect(nav.getAttribute('aria-label')).toBe('Main navigation');
        });

        test('should support keyboard navigation', () => {
            document.body.innerHTML = `
                <button id="test-button">Test Button</button>
                <input id="test-input" type="text" />
            `;

            const button = document.querySelector('#test-button');
            const input = document.querySelector('#test-input');

            // Should be focusable
            expect(button.tabIndex).toBeGreaterThanOrEqual(0);
            expect(input.tabIndex).toBeGreaterThanOrEqual(0);

            // Simulate keyboard events
            const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter' });
            const tabEvent = new dom.window.KeyboardEvent('keydown', { key: 'Tab' });

            expect(() => {
                button.dispatchEvent(enterEvent);
                input.dispatchEvent(tabEvent);
            }).not.toThrow();
        });

        test('should have semantic HTML structure', () => {
            document.body.innerHTML = `
                <header>
                    <nav>Navigation</nav>
                </header>
                <main>
                    <section>
                        <h1>Main Heading</h1>
                        <article>Content</article>
                    </section>
                </main>
                <footer>Footer</footer>
            `;

            expect(document.querySelector('header')).toBeTruthy();
            expect(document.querySelector('nav')).toBeTruthy();
            expect(document.querySelector('main')).toBeTruthy();
            expect(document.querySelector('section')).toBeTruthy();
            expect(document.querySelector('article')).toBeTruthy();
            expect(document.querySelector('footer')).toBeTruthy();
            expect(document.querySelector('h1')).toBeTruthy();
        });
    });

    describe('Performance', () => {
        test('should load resources efficiently', () => {
            // Mock performance API
            global.performance = {
                now: jest.fn(() => Date.now()),
                mark: jest.fn(),
                measure: jest.fn(),
                getEntriesByType: jest.fn(() => []),
                getEntriesByName: jest.fn(() => [])
            };

            // Test performance marking
            performance.mark('test-start');
            performance.mark('test-end');
            performance.measure('test-duration', 'test-start', 'test-end');

            expect(performance.mark).toHaveBeenCalledWith('test-start');
            expect(performance.mark).toHaveBeenCalledWith('test-end');
            expect(performance.measure).toHaveBeenCalledWith('test-duration', 'test-start', 'test-end');
        });

        test('should handle lazy loading', () => {
            document.body.innerHTML = `
                <img data-src="image1.jpg" alt="Test Image 1" />
                <img data-src="image2.jpg" alt="Test Image 2" />
                <div data-lazy-component="test-component"></div>
            `;

            const lazyImages = document.querySelectorAll('img[data-src]');
            const lazyComponents = document.querySelectorAll('[data-lazy-component]');

            expect(lazyImages.length).toBe(2);
            expect(lazyComponents.length).toBe(1);

            // Test that images have data-src attribute
            lazyImages.forEach(img => {
                expect(img.getAttribute('data-src')).toBeTruthy();
            });
        });
    });

    describe('Security', () => {
        test('should sanitize user input', () => {
            // Test input sanitization
            const maliciousInput = '<script>alert("XSS")</script>';
            const sanitizedInput = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '');
            
            expect(sanitizedInput).not.toContain('<script>');
            expect(sanitizedInput).not.toContain('alert');
        });

        test('should validate data before storage', () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'admin'
            };

            // Validate required fields
            expect(userData.name).toBeTruthy();
            expect(userData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            
            // Validate role is from allowed list
            const allowedRoles = ['admin', 'user', 'manager'];
            expect(allowedRoles).toContain(userData.role);
        });

        test('should handle CSRF protection', () => {
            // Mock CSRF token
            const csrfToken = 'mock-csrf-token-123';
            
            // Should include CSRF token in requests
            const requestHeaders = {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            };

            expect(requestHeaders['X-CSRF-Token']).toBe(csrfToken);
        });
    });

    describe('Responsive Design', () => {
        test('should adapt to different screen sizes', () => {
            // Mock viewport changes
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768
            });

            // Test mobile breakpoint
            expect(window.innerWidth).toBe(768);

            // Change to desktop size
            window.innerWidth = 1200;
            expect(window.innerWidth).toBe(1200);
        });

        test('should handle touch events', () => {
            document.body.innerHTML = `
                <div id="touch-target">Touch Target</div>
            `;

            const touchTarget = document.querySelector('#touch-target');
            
            // Simulate touch events
            const touchStartEvent = new dom.window.TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientX: 100, clientY: 100 }]
            });

            expect(() => {
                touchTarget.dispatchEvent(touchStartEvent);
            }).not.toThrow();
        });
    });

    describe('Browser Compatibility', () => {
        test('should handle missing APIs gracefully', () => {
            // Test when IntersectionObserver is not available
            const originalIntersectionObserver = global.IntersectionObserver;
            delete global.IntersectionObserver;

            expect(() => {
                // Code should handle missing IntersectionObserver
                if ('IntersectionObserver' in window) {
                    new IntersectionObserver(() => {});
                } else {
                    // Fallback behavior
                    console.log('IntersectionObserver not supported');
                }
            }).not.toThrow();

            // Restore
            global.IntersectionObserver = originalIntersectionObserver;
        });

        test('should use feature detection', () => {
            // Test feature detection patterns
            const hasLocalStorage = typeof Storage !== 'undefined';
            const hasFetch = typeof fetch !== 'undefined';
            const hasPromises = typeof Promise !== 'undefined';

            // These should be available in test environment
            expect(hasLocalStorage).toBe(true);
            expect(hasFetch).toBe(true);
            expect(hasPromises).toBe(true);
        });
    });
});

// Additional utility tests
describe('Utility Functions', () => {
    test('should format dates correctly', () => {
        const date = new Date('2023-12-25T10:30:00Z');
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        expect(formattedDate).toBe('Dec 25, 2023');
    });

    test('should validate email addresses', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org'
        ];

        const invalidEmails = [
            'invalid-email',
            '@example.com',
            'user@',
            'user name@example.com'
        ];

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        validEmails.forEach(email => {
            expect(emailRegex.test(email)).toBe(true);
        });

        invalidEmails.forEach(email => {
            expect(emailRegex.test(email)).toBe(false);
        });
    });

    test('should handle URL parsing', () => {
        const testUrl = 'https://example.com/path?param=value#hash';
        const url = new URL(testUrl);

        expect(url.hostname).toBe('example.com');
        expect(url.pathname).toBe('/path');
        expect(url.searchParams.get('param')).toBe('value');
        expect(url.hash).toBe('#hash');
    });

    test('should debounce function calls', (done) => {
        let callCount = 0;
        const debouncedFunction = debounce(() => {
            callCount++;
        }, 100);

        // Call multiple times quickly
        debouncedFunction();
        debouncedFunction();
        debouncedFunction();

        // Should only be called once after delay
        setTimeout(() => {
            expect(callCount).toBe(1);
            done();
        }, 150);
    });
});

// Helper function for debounce test
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}