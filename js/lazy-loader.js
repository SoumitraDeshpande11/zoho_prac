/**
 * Zoho CRM Clone - Lazy Loading System
 * Provides lazy loading for images, components, and resources to improve performance
 */

class LazyLoader {
    constructor() {
        this.imageObserver = null;
        this.componentObserver = null;
        this.loadedImages = new Set();
        this.loadedComponents = new Set();
        this.loadingQueue = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.setupImageObserver();
        this.setupComponentObserver();
        this.setupIntersectionObserver();
        this.bindEvents();
    }

    /**
     * Setup Intersection Observer for images
     */
    setupImageObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
    }

    /**
     * Setup Intersection Observer for components
     */
    setupComponentObserver() {
        if (!('IntersectionObserver' in window)) {
            this.loadAllComponents();
            return;
        }

        this.componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadComponent(entry.target);
                    this.componentObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });
    }

    /**
     * Setup generic Intersection Observer
     */
    setupIntersectionObserver() {
        this.observeLazyElements();
    }

    /**
     * Bind events for lazy loading
     */
    bindEvents() {
        // Re-observe elements when DOM changes
        const mutationObserver = new MutationObserver(() => {
            this.observeLazyElements();
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.observeLazyElements();
            }
        });
    }

    /**
     * Observe lazy elements
     */
    observeLazyElements() {
        // Observe lazy images
        const lazyImages = document.querySelectorAll('img[data-src]:not([data-observed])');
        lazyImages.forEach(img => {
            img.setAttribute('data-observed', 'true');
            this.imageObserver?.observe(img);
        });

        // Observe lazy components
        const lazyComponents = document.querySelectorAll('[data-lazy-component]:not([data-observed])');
        lazyComponents.forEach(component => {
            component.setAttribute('data-observed', 'true');
            this.componentObserver?.observe(component);
        });

        // Observe lazy sections
        const lazySections = document.querySelectorAll('[data-lazy-load]:not([data-observed])');
        lazySections.forEach(section => {
            section.setAttribute('data-observed', 'true');
            this.observeSection(section);
        });
    }

    /**
     * Load image with lazy loading
     */
    async loadImage(img) {
        const src = img.getAttribute('data-src');
        const placeholder = img.getAttribute('data-placeholder');
        
        if (!src || this.loadedImages.has(src)) {
            return;
        }

        try {
            // Show loading state
            img.classList.add('lazy-loading');
            
            // Preload image
            const imagePromise = this.preloadImage(src);
            
            // Add to loading queue
            this.loadingQueue.set(src, imagePromise);
            
            const loadedSrc = await imagePromise;
            
            // Update image source
            img.src = loadedSrc;
            img.removeAttribute('data-src');
            
            // Add loaded class for fade-in effect
            img.classList.add('lazy-loaded');
            img.classList.remove('lazy-loading');
            
            // Mark as loaded
            this.loadedImages.add(src);
            this.loadingQueue.delete(src);
            
            // Trigger load event
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                detail: { src: loadedSrc }
            }));
            
        } catch (error) {
            this.handleImageLoadError(img, src, error);
        }
    }

    /**
     * Preload image
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(src);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            
            // Set loading timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Image load timeout: ${src}`));
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(src);
            };
            
            img.src = src;
        });
    }

    /**
     * Handle image load errors
     */
    handleImageLoadError(img, src, error) {
        const attempts = this.retryAttempts.get(src) || 0;
        
        if (attempts < this.maxRetries) {
            // Retry loading
            this.retryAttempts.set(src, attempts + 1);
            setTimeout(() => {
                this.loadImage(img);
            }, 1000 * Math.pow(2, attempts)); // Exponential backoff
        } else {
            // Show fallback image
            const fallback = img.getAttribute('data-fallback') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
            
            img.src = fallback;
            img.classList.add('lazy-error');
            img.classList.remove('lazy-loading');
            
            console.warn('Failed to load image after retries:', src, error);
            
            // Report error
            if (window.errorHandler) {
                window.errorHandler.logError('image-load', `Failed to load image: ${src}`, {
                    attempts: attempts + 1,
                    error: error.message
                });
            }
        }
    }

    /**
     * Load component lazily
     */
    async loadComponent(element) {
        const componentName = element.getAttribute('data-lazy-component');
        const componentUrl = element.getAttribute('data-component-url');
        
        if (!componentName || this.loadedComponents.has(componentName)) {
            return;
        }

        try {
            // Show loading state
            element.classList.add('component-loading');
            element.innerHTML = this.getLoadingHTML();
            
            let componentHTML;
            
            if (componentUrl) {
                // Load from URL
                componentHTML = await this.fetchComponent(componentUrl);
            } else {
                // Load from template
                componentHTML = await this.loadComponentTemplate(componentName);
            }
            
            // Insert component content
            element.innerHTML = componentHTML;
            element.classList.add('component-loaded');
            element.classList.remove('component-loading');
            
            // Initialize component scripts
            this.initializeComponentScripts(element);
            
            // Mark as loaded
            this.loadedComponents.add(componentName);
            
            // Trigger loaded event
            element.dispatchEvent(new CustomEvent('componentloaded', {
                detail: { component: componentName }
            }));
            
        } catch (error) {
            this.handleComponentLoadError(element, componentName, error);
        }
    }

    /**
     * Fetch component from URL
     */
    async fetchComponent(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch component: ${response.status}`);
        }
        return await response.text();
    }

    /**
     * Load component template
     */
    async loadComponentTemplate(componentName) {
        const template = document.querySelector(`template[data-component="${componentName}"]`);
        if (template) {
            return template.innerHTML;
        }
        
        // Try to load from components directory
        const componentUrl = `js/components/${componentName}.html`;
        return await this.fetchComponent(componentUrl);
    }

    /**
     * Initialize component scripts
     */
    initializeComponentScripts(element) {
        const scripts = element.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    }

    /**
     * Handle component load errors
     */
    handleComponentLoadError(element, componentName, error) {
        element.classList.add('component-error');
        element.classList.remove('component-loading');
        element.innerHTML = `
            <div class="component-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Failed to load component: ${componentName}</span>
                <button class="retry-btn" onclick="lazyLoader.retryComponent('${componentName}', this.closest('[data-lazy-component]'))">
                    Retry
                </button>
            </div>
        `;
        
        console.error('Failed to load component:', componentName, error);
        
        // Report error
        if (window.errorHandler) {
            window.errorHandler.logError('component-load', `Failed to load component: ${componentName}`, {
                error: error.message
            });
        }
    }

    /**
     * Retry loading component
     */
    retryComponent(componentName, element) {
        this.loadedComponents.delete(componentName);
        element.removeAttribute('data-observed');
        this.loadComponent(element);
    }

    /**
     * Observe section for lazy loading
     */
    observeSection(section) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadSection(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.01
        });

        observer.observe(section);
    }

    /**
     * Load section content
     */
    async loadSection(section) {
        const loadType = section.getAttribute('data-lazy-load');
        const loadUrl = section.getAttribute('data-load-url');
        
        try {
            section.classList.add('section-loading');
            
            switch (loadType) {
                case 'content':
                    await this.loadSectionContent(section, loadUrl);
                    break;
                case 'script':
                    await this.loadSectionScript(section, loadUrl);
                    break;
                case 'style':
                    await this.loadSectionStyle(section, loadUrl);
                    break;
                default:
                    await this.loadSectionContent(section, loadUrl);
            }
            
            section.classList.add('section-loaded');
            section.classList.remove('section-loading');
            
        } catch (error) {
            section.classList.add('section-error');
            section.classList.remove('section-loading');
            console.error('Failed to load section:', error);
        }
    }

    /**
     * Load section content
     */
    async loadSectionContent(section, url) {
        if (!url) return;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load content: ${response.status}`);
        }
        
        const content = await response.text();
        section.innerHTML = content;
    }

    /**
     * Load section script
     */
    async loadSectionScript(section, url) {
        if (!url) return;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load section style
     */
    async loadSectionStyle(section, url) {
        if (!url) return;
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load style: ${url}`));
            document.head.appendChild(link);
        });
    }

    /**
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="lazy-loading-placeholder">
                <div class="loading-spinner"></div>
                <span>Loading...</span>
            </div>
        `;
    }

    /**
     * Fallback for browsers without Intersection Observer
     */
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }

    /**
     * Fallback for browsers without Intersection Observer
     */
    loadAllComponents() {
        const components = document.querySelectorAll('[data-lazy-component]');
        components.forEach(component => this.loadComponent(component));
    }

    /**
     * Preload critical resources
     */
    preloadCritical(resources) {
        resources.forEach(resource => {
            if (resource.type === 'image') {
                this.preloadImage(resource.url);
            } else if (resource.type === 'script') {
                this.preloadScript(resource.url);
            } else if (resource.type === 'style') {
                this.preloadStyle(resource.url);
            }
        });
    }

    /**
     * Preload script
     */
    preloadScript(url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = url;
        document.head.appendChild(link);
    }

    /**
     * Preload style
     */
    preloadStyle(url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = url;
        document.head.appendChild(link);
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            loadedImages: this.loadedImages.size,
            loadedComponents: this.loadedComponents.size,
            loadingQueue: this.loadingQueue.size,
            retryAttempts: this.retryAttempts.size
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.loadedImages.clear();
        this.loadedComponents.clear();
        this.loadingQueue.clear();
        this.retryAttempts.clear();
    }
}

// Initialize lazy loader
const lazyLoader = new LazyLoader();

// Export for global use
window.LazyLoader = LazyLoader;
window.lazyLoader = lazyLoader;

// Add CSS for lazy loading
const lazyStyles = document.createElement('style');
lazyStyles.textContent = `
    /* Lazy loading styles */
    img[data-src] {
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    img.lazy-loaded {
        opacity: 1;
    }

    img.lazy-loading {
        opacity: 0.5;
    }

    img.lazy-error {
        opacity: 1;
        filter: grayscale(100%);
    }

    .lazy-loading-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #666;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e3e3e3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .component-loading {
        min-height: 100px;
    }

    .component-error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        color: #dc3545;
        text-align: center;
    }

    .component-error-message i {
        font-size: 24px;
        margin-bottom: 10px;
    }

    .retry-btn {
        margin-top: 10px;
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .retry-btn:hover {
        background: #0056b3;
    }

    .section-loading::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1;
    }

    .section-loading::after {
        content: 'Loading...';
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        color: #666;
    }
`;

document.head.appendChild(lazyStyles);