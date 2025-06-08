/**
 * Zoho CRM Clone - Template System
 * Eliminates code duplication by providing reusable templates
 */

class TemplateSystem {
    constructor() {
        this.templates = {};
        this.cache = {};
        this.init();
    }

    init() {
        this.loadTemplates();
        this.bindEvents();
    }

    /**
     * Load and cache all templates
     */
    loadTemplates() {
        this.templates = {
            sidebar: this.getSidebarTemplate(),
            topbar: this.getTopbarTemplate(),
            footer: this.getFooterTemplate(),
            pageHeader: this.getPageHeaderTemplate(),
            tableWrapper: this.getTableWrapperTemplate(),
            modal: this.getModalTemplate(),
            card: this.getCardTemplate(),
            button: this.getButtonTemplate(),
            formField: this.getFormFieldTemplate(),
            pagination: this.getPaginationTemplate(),
            dropdown: this.getDropdownTemplate()
        };
    }

    /**
     * Render a template with data
     * @param {string} templateName - Name of the template
     * @param {Object} data - Data to populate the template
     * @returns {string} Rendered HTML
     */
    render(templateName, data = {}) {
        if (!this.templates[templateName]) {
            throw new Error(`Template "${templateName}" not found`);
        }

        const template = this.templates[templateName];
        return this.interpolate(template, data);
    }

    /**
     * Replace placeholders in template with data
     * @param {string} template - Template string
     * @param {Object} data - Data object
     * @returns {string} Interpolated string
     */
    interpolate(template, data) {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(data, path);
            return value !== undefined ? value : match;
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Sidebar template
     */
    getSidebarTemplate() {
        return `
        <aside class="sidebar">
            <div class="sidebar-logo">
                <img src="https://www.zohowebstatic.com/sites/default/files/ogimage/crm-logo.png" alt="Zoho CRM Logo">
                <span>Modules</span>
            </div>
            <div class="sidebar-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search">
            </div>
            <div class="sidebar-menu">
                <ul class="sidebar-menu-items">
                    {{#each menuItems}}
                    <li class="sidebar-menu-item {{#if active}}active{{/if}}">
                        <a href="{{url}}">
                            <i class="{{icon}}"></i>
                            {{label}}
                        </a>
                    </li>
                    {{/each}}
                </ul>
            </div>
            <div class="sidebar-footer">
                <div class="user-avatar">{{user.initials}}</div>
                <div class="user-info">
                    <div class="user-name">{{user.name}}</div>
                    <div class="user-role">{{user.role}}</div>
                </div>
                <div class="dropdown-toggle">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
        </aside>`;
    }

    /**
     * Topbar template
     */
    getTopbarTemplate() {
        return `
        <header class="topbar">
            <div class="topbar-left">
                <h1 class="topbar-title">{{title}}</h1>
                <div class="topbar-actions">
                    {{#if showRefresh}}
                    <button class="btn btn-outline-secondary" data-action="refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    {{/if}}
                    {{#if dropdown}}
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle">
                            {{dropdown.label}} <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu">
                            {{#each dropdown.items}}
                            <a href="{{url}}" class="dropdown-item">{{label}}</a>
                            {{/each}}
                        </div>
                    </div>
                    {{/if}}
                </div>
            </div>
            <div class="topbar-right">
                <div class="topbar-icons">
                    {{#each actions}}
                    <div class="topbar-icon" data-action="{{action}}">
                        <i class="{{icon}}"></i>
                        {{#if badge}}<span class="badge">{{badge}}</span>{{/if}}
                    </div>
                    {{/each}}
                </div>
            </div>
        </header>`;
    }

    /**
     * Footer template
     */
    getFooterTemplate() {
        return `
        <footer class="footer">
            <div class="smart-chat">
                {{smartChat.text}}
            </div>
            <div class="footer-actions">
                {{#each actions}}
                <button class="footer-action-button" data-action="{{action}}">
                    {{#if icon}}<i class="{{icon}}"></i>{{/if}}
                    {{#if text}}{{text}}{{/if}}
                    {{#if badge}}<span class="badge">{{badge}}</span>{{/if}}
                </button>
                {{/each}}
            </div>
        </footer>`;
    }

    /**
     * Page header template
     */
    getPageHeaderTemplate() {
        return `
        <div class="page-header">
            <div class="page-header-left">
                <h2 class="page-title">{{title}}</h2>
                {{#if subtitle}}<p class="page-subtitle">{{subtitle}}</p>{{/if}}
            </div>
            <div class="page-header-right">
                {{#each actions}}
                <button class="btn {{className}}" data-action="{{action}}">
                    {{#if icon}}<i class="{{icon}}"></i>{{/if}}
                    {{text}}
                </button>
                {{/each}}
            </div>
        </div>`;
    }

    /**
     * Table wrapper template
     */
    getTableWrapperTemplate() {
        return `
        <div class="table-container">
            {{#if filters}}
            <div class="table-filters">
                {{#each filters}}
                <button class="table-filter-button {{#if active}}active{{/if}}" data-filter="{{value}}">
                    {{label}}
                </button>
                {{/each}}
            </div>
            {{/if}}
            
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            {{#each columns}}
                            <th class="{{className}}" data-sort="{{sortKey}}">
                                {{#if checkbox}}
                                <input type="checkbox" class="select-all">
                                {{else}}
                                {{label}}
                                {{#if sortable}}<i class="fas fa-sort"></i>{{/if}}
                                {{/if}}
                            </th>
                            {{/each}}
                        </tr>
                    </thead>
                    <tbody>
                        {{#each rows}}
                        <tr class="table-row" data-id="{{id}}">
                            {{#each cells}}
                            <td class="{{className}}">
                                {{#if checkbox}}
                                <input type="checkbox" value="{{../id}}">
                                {{else if link}}
                                <a href="{{link}}">{{value}}</a>
                                {{else}}
                                {{value}}
                                {{/if}}
                            </td>
                            {{/each}}
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            
            {{#if pagination}}
            <div class="table-pagination">
                <span class="pagination-info">{{pagination.info}}</span>
                <div class="pagination-buttons">
                    <button class="btn btn-sm btn-icon" data-action="prev" {{#unless pagination.hasPrev}}disabled{{/unless}}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="btn btn-sm btn-icon" data-action="next" {{#unless pagination.hasNext}}disabled{{/unless}}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            {{/if}}
        </div>`;
    }

    /**
     * Modal template
     */
    getModalTemplate() {
        return `
        <div class="modal-overlay">
            <div class="modal {{#if size}}modal-{{size}}{{/if}}">
                <div class="modal-header">
                    <h3 class="modal-title">{{title}}</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    {{content}}
                </div>
                {{#if buttons}}
                <div class="modal-footer">
                    {{#each buttons}}
                    <button class="btn {{className}}" data-action="{{action}}">
                        {{text}}
                    </button>
                    {{/each}}
                </div>
                {{/if}}
            </div>
        </div>`;
    }

    /**
     * Card template
     */
    getCardTemplate() {
        return `
        <div class="card {{className}}">
            {{#if header}}
            <div class="card-header">
                <h3 class="card-title">{{header.title}}</h3>
                {{#if header.actions}}
                <div class="card-actions">
                    {{#each header.actions}}
                    <button class="btn btn-sm {{className}}" data-action="{{action}}">
                        {{#if icon}}<i class="{{icon}}"></i>{{/if}}
                        {{text}}
                    </button>
                    {{/each}}
                </div>
                {{/if}}
            </div>
            {{/if}}
            <div class="card-body">
                {{content}}
            </div>
            {{#if footer}}
            <div class="card-footer">
                {{footer}}
            </div>
            {{/if}}
        </div>`;
    }

    /**
     * Button template
     */
    getButtonTemplate() {
        return `
        <button class="btn {{className}}" {{#if action}}data-action="{{action}}"{{/if}} {{#if disabled}}disabled{{/if}}>
            {{#if icon}}<i class="{{icon}}"></i>{{/if}}
            {{text}}
            {{#if badge}}<span class="badge">{{badge}}</span>{{/if}}
        </button>`;
    }

    /**
     * Form field template
     */
    getFormFieldTemplate() {
        return `
        <div class="form-group {{#if error}}has-error{{/if}}">
            {{#if label}}
            <label for="{{id}}" class="form-label">
                {{label}}
                {{#if required}}<span class="required">*</span>{{/if}}
            </label>
            {{/if}}
            
            {{#if type === 'select'}}
            <select id="{{id}}" name="{{name}}" class="form-control" {{#if required}}required{{/if}}>
                {{#each options}}
                <option value="{{value}}" {{#if selected}}selected{{/if}}>{{text}}</option>
                {{/each}}
            </select>
            {{else if type === 'textarea'}}
            <textarea id="{{id}}" name="{{name}}" class="form-control" placeholder="{{placeholder}}" {{#if required}}required{{/if}}>{{value}}</textarea>
            {{else}}
            <input type="{{type}}" id="{{id}}" name="{{name}}" class="form-control" value="{{value}}" placeholder="{{placeholder}}" {{#if required}}required{{/if}}>
            {{/if}}
            
            {{#if error}}
            <div class="form-error">{{error}}</div>
            {{/if}}
            {{#if help}}
            <div class="form-help">{{help}}</div>
            {{/if}}
        </div>`;
    }

    /**
     * Pagination template
     */
    getPaginationTemplate() {
        return `
        <div class="pagination">
            <span class="pagination-info">{{info}}</span>
            <div class="pagination-buttons">
                <button class="btn btn-sm" data-action="first" {{#unless hasFirst}}disabled{{/unless}}>
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="btn btn-sm" data-action="prev" {{#unless hasPrev}}disabled{{/unless}}>
                    <i class="fas fa-angle-left"></i>
                </button>
                
                {{#each pages}}
                <button class="btn btn-sm {{#if active}}btn-primary{{else}}btn-outline{{/if}}" data-page="{{number}}">
                    {{number}}
                </button>
                {{/each}}
                
                <button class="btn btn-sm" data-action="next" {{#unless hasNext}}disabled{{/unless}}>
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="btn btn-sm" data-action="last" {{#unless hasLast}}disabled{{/unless}}>
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        </div>`;
    }

    /**
     * Dropdown template
     */
    getDropdownTemplate() {
        return `
        <div class="dropdown">
            <button class="btn dropdown-toggle {{className}}" data-toggle="dropdown">
                {{#if icon}}<i class="{{icon}}"></i>{{/if}}
                {{label}}
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu">
                {{#each items}}
                {{#if divider}}
                <div class="dropdown-divider"></div>
                {{else}}
                <a href="{{url}}" class="dropdown-item" {{#if action}}data-action="{{action}}"{{/if}}>
                    {{#if icon}}<i class="{{icon}}"></i>{{/if}}
                    {{text}}
                </a>
                {{/if}}
                {{/each}}
            </div>
        </div>`;
    }

    /**
     * Render template with Handlebars-like syntax
     * @param {string} template - Template string
     * @param {Object} data - Data object
     * @returns {string} Rendered HTML
     */
    renderHandlebars(template, data) {
        // Handle {{#each}} blocks
        template = template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
            const array = this.getNestedValue(data, arrayName);
            if (!Array.isArray(array)) return '';
            
            return array.map(item => {
                // Handle {{../}} parent context
                let itemContent = content.replace(/\{\{\.\.\/(\w+)\}\}/g, (m, key) => {
                    return this.getNestedValue(data, key) || '';
                });
                
                return this.interpolate(itemContent, item);
            }).join('');
        });

        // Handle {{#if}} blocks
        template = template.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, truthy, falsy = '') => {
            const value = this.getNestedValue(data, condition);
            return value ? truthy : falsy;
        });

        // Handle {{#unless}} blocks
        template = template.replace(/\{\{#unless\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
            const value = this.getNestedValue(data, condition);
            return !value ? content : '';
        });

        // Handle regular interpolation
        return this.interpolate(template, data);
    }

    /**
     * Initialize page with templates
     * @param {string} pageName - Name of the page
     * @param {Object} pageData - Page-specific data
     */
    initPage(pageName, pageData = {}) {
        const defaultData = this.getDefaultPageData();
        const data = { ...defaultData, ...pageData };

        // Set active menu item
        if (data.menuItems) {
            data.menuItems.forEach(item => {
                item.active = item.id === pageName;
            });
        }

        // Render templates
        document.getElementById('sidebar-container').innerHTML = this.render('sidebar', data);
        document.getElementById('topbar-container').innerHTML = this.render('topbar', data);
        document.getElementById('footer-container').innerHTML = this.render('footer', data);
    }

    /**
     * Get default page data
     */
    getDefaultPageData() {
        return {
            user: {
                name: 'CRM Teamspace',
                role: 'Administrator',
                initials: 'SD'
            },
            menuItems: [
                { id: 'home', label: 'Home', icon: 'fas fa-home', url: '../index.html' },
                { id: 'leads', label: 'Leads', icon: 'fas fa-user-tie', url: 'leads.html' },
                { id: 'contacts', label: 'Contacts', icon: 'fas fa-address-book', url: 'contacts.html' },
                { id: 'accounts', label: 'Accounts', icon: 'fas fa-building', url: 'accounts.html' },
                { id: 'deals', label: 'Deals', icon: 'fas fa-handshake', url: 'deals.html' },
                { id: 'tasks', label: 'Tasks', icon: 'fas fa-tasks', url: 'tasks.html' },
                { id: 'meetings', label: 'Meetings', icon: 'fas fa-calendar-alt', url: 'meetings.html' },
                { id: 'calls', label: 'Calls', icon: 'fas fa-phone', url: 'calls.html' },
                { id: 'invoices', label: 'Invoices', icon: 'fas fa-receipt', url: 'invoices.html' },
                { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar', url: 'reports.html' },
                { id: 'dashboards', label: 'Dashboards', icon: 'fas fa-tachometer-alt', url: 'dashboards.html' },
                { id: 'marketplace', label: 'Marketplace', icon: 'fas fa-store-alt', url: 'marketplace.html' }
            ],
            smartChat: {
                text: 'Here is your Smart Chat (Ctrl+Space)'
            },
            actions: [
                { action: 'chat', icon: 'fas fa-comment-alt' },
                { action: 'refresh', icon: 'fas fa-sync-alt' },
                { action: 'feedback', text: 'Feedback on New UI' },
                { action: 'zia', text: 'Ask Zia' },
                { action: 'clipboard', icon: 'fas fa-clipboard' },
                { action: 'up', icon: 'fas fa-arrow-up' },
                { action: 'down', icon: 'fas fa-arrow-down' },
                { action: 'notifications', icon: 'fas fa-bell', badge: '1' },
                { action: 'help', icon: 'fas fa-question-circle' },
                { action: 'settings', icon: 'fas fa-cog' }
            ]
        };
    }

    /**
     * Bind template events
     */
    bindEvents() {
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleAction(action, e);
            }
        });
    }

    /**
     * Handle template actions
     * @param {string} action - Action name
     * @param {Event} event - Click event
     */
    handleAction(action, event) {
        const element = event.target.closest('[data-action]');
        
        switch (action) {
            case 'refresh':
                this.refreshPage();
                break;
            case 'prev':
            case 'next':
            case 'first':
            case 'last':
                this.handlePagination(action, element);
                break;
            default:
                console.log(`Action: ${action}`, element);
        }
    }

    /**
     * Refresh current page
     */
    refreshPage() {
        window.location.reload();
    }

    /**
     * Handle pagination actions
     * @param {string} action - Pagination action
     * @param {Element} element - Button element
     */
    handlePagination(action, element) {
        if (element.disabled) return;
        
        // Implement pagination logic here
        console.log(`Pagination: ${action}`);
    }
}

// Initialize template system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.TemplateSystem = new TemplateSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateSystem;
}