/**
 * Zoho CRM Clone - Component System
 * Provides reusable UI components for the CRM application
 */

class ComponentSystem {
    constructor() {
        this.components = new Map();
        this.instances = new Map();
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        this.registerComponents();
        this.bindGlobalEvents();
    }

    /**
     * Register all built-in components
     */
    registerComponents() {
        this.register('DataTable', DataTableComponent);
        this.register('Modal', ModalComponent);
        this.register('Card', CardComponent);
        this.register('Form', FormComponent);
        this.register('Button', ButtonComponent);
        this.register('Dropdown', DropdownComponent);
        this.register('Pagination', PaginationComponent);
        this.register('Toast', ToastComponent);
        this.register('Tabs', TabsComponent);
        this.register('Sidebar', SidebarComponent);
        this.register('Topbar', TopbarComponent);
        this.register('SearchBox', SearchBoxComponent);
        this.register('DatePicker', DatePickerComponent);
        this.register('FileUpload', FileUploadComponent);
        this.register('Chart', ChartComponent);
    }

    /**
     * Register a component
     * @param {string} name - Component name
     * @param {Class} componentClass - Component class
     */
    register(name, componentClass) {
        this.components.set(name, componentClass);
    }

    /**
     * Create component instance
     * @param {string} name - Component name
     * @param {Element} element - DOM element
     * @param {Object} options - Component options
     */
    create(name, element, options = {}) {
        const ComponentClass = this.components.get(name);
        if (!ComponentClass) {
            throw new Error(`Component "${name}" not found`);
        }

        const instance = new ComponentClass(element, options, this.eventBus);
        const instanceId = this.generateId();
        
        this.instances.set(instanceId, instance);
        element.setAttribute('data-component-id', instanceId);
        
        instance.init();
        return instance;
    }

    /**
     * Get component instance by element
     * @param {Element} element - DOM element
     */
    getInstance(element) {
        const instanceId = element.getAttribute('data-component-id');
        return this.instances.get(instanceId);
    }

    /**
     * Destroy component instance
     * @param {Element} element - DOM element
     */
    destroy(element) {
        const instanceId = element.getAttribute('data-component-id');
        const instance = this.instances.get(instanceId);
        
        if (instance) {
            instance.destroy();
            this.instances.delete(instanceId);
            element.removeAttribute('data-component-id');
        }
    }

    /**
     * Auto-initialize components from DOM
     */
    autoInit() {
        document.querySelectorAll('[data-component]').forEach(element => {
            const componentName = element.getAttribute('data-component');
            if (!element.hasAttribute('data-component-id')) {
                const options = this.parseDataAttributes(element);
                this.create(componentName, element, options);
            }
        });
    }

    /**
     * Parse data attributes as options
     * @param {Element} element - DOM element
     */
    parseDataAttributes(element) {
        const options = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') && !['data-component', 'data-component-id'].includes(attr.name)) {
                const key = attr.name.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                try {
                    options[key] = JSON.parse(attr.value);
                } catch {
                    options[key] = attr.value;
                }
            }
        });
        return options;
    }

    /**
     * Bind global events
     */
    bindGlobalEvents() {
        // Auto-initialize on DOM changes
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute('data-component')) {
                                const componentName = node.getAttribute('data-component');
                                const options = this.parseDataAttributes(node);
                                this.create(componentName, node, options);
                            }
                            // Check children
                            node.querySelectorAll('[data-component]').forEach(child => {
                                if (!child.hasAttribute('data-component-id')) {
                                    const componentName = child.getAttribute('data-component');
                                    const options = this.parseDataAttributes(child);
                                    this.create(componentName, child, options);
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'comp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

/**
 * Base Component Class
 */
class BaseComponent {
    constructor(element, options = {}, eventBus = null) {
        this.element = element;
        this.options = { ...this.defaultOptions, ...options };
        this.eventBus = eventBus;
        this.listeners = [];
        this.destroyed = false;
    }

    get defaultOptions() {
        return {};
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // Override in subclasses
    }

    render() {
        // Override in subclasses
    }

    destroy() {
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
        this.destroyed = true;
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
        
        const customEvent = new CustomEvent(event, { detail: data });
        this.element.dispatchEvent(customEvent);
    }

    on(event, handler) {
        this.addEventListener(this.element, event, handler);
    }
}

/**
 * Data Table Component
 */
class DataTableComponent extends BaseComponent {
    get defaultOptions() {
        return {
            columns: [],
            data: [],
            sortable: true,
            filterable: true,
            pagination: true,
            pageSize: 10,
            selectable: false,
            searchable: true
        };
    }

    init() {
        super.init();
        this.currentPage = 1;
        this.sortField = null;
        this.sortOrder = 'asc';
        this.filters = {};
        this.searchTerm = '';
        this.selectedRows = new Set();
    }

    render() {
        this.element.innerHTML = `
            <div class="data-table">
                ${this.options.searchable ? this.renderSearch() : ''}
                ${this.options.filterable ? this.renderFilters() : ''}
                <div class="table-container">
                    ${this.renderTable()}
                </div>
                ${this.options.pagination ? this.renderPagination() : ''}
            </div>
        `;
    }

    renderSearch() {
        return `
            <div class="table-search">
                <input type="text" placeholder="Search..." class="search-input">
                <button class="search-button">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        `;
    }

    renderFilters() {
        return `
            <div class="table-filters">
                ${this.options.columns.filter(col => col.filterable).map(col => `
                    <select class="filter-select" data-field="${col.field}">
                        <option value="">All ${col.label}</option>
                        ${this.getUniqueValues(col.field).map(value => `
                            <option value="${value}">${value}</option>
                        `).join('')}
                    </select>
                `).join('')}
            </div>
        `;
    }

    renderTable() {
        const filteredData = this.getFilteredData();
        const paginatedData = this.options.pagination ? 
            this.getPaginatedData(filteredData) : filteredData;

        return `
            <table class="table">
                <thead>
                    <tr>
                        ${this.options.selectable ? '<th class="select-column"><input type="checkbox" class="select-all"></th>' : ''}
                        ${this.options.columns.map(col => `
                            <th class="${col.sortable !== false ? 'sortable' : ''}" data-field="${col.field}">
                                ${col.label}
                                ${col.sortable !== false ? '<i class="fas fa-sort sort-icon"></i>' : ''}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${paginatedData.map((row, index) => `
                        <tr data-row-index="${index}">
                            ${this.options.selectable ? `<td class="select-column"><input type="checkbox" class="row-select" value="${row.id || index}"></td>` : ''}
                            ${this.options.columns.map(col => `
                                <td class="${col.className || ''}">
                                    ${this.renderCell(row, col)}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderCell(row, column) {
        const value = this.getCellValue(row, column.field);
        
        if (column.render) {
            return column.render(value, row);
        }
        
        if (column.type === 'date') {
            return new Date(value).toLocaleDateString();
        }
        
        if (column.type === 'currency') {
            return new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
            }).format(value);
        }
        
        if (column.type === 'link') {
            return `<a href="${column.href || '#'}">${value}</a>`;
        }
        
        return value || '';
    }

    renderPagination() {
        const filteredData = this.getFilteredData();
        const totalPages = Math.ceil(filteredData.length / this.options.pageSize);
        
        return `
            <div class="table-pagination">
                <div class="pagination-info">
                    Showing ${((this.currentPage - 1) * this.options.pageSize) + 1} to 
                    ${Math.min(this.currentPage * this.options.pageSize, filteredData.length)} 
                    of ${filteredData.length} entries
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-sm" data-action="first" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="btn btn-sm" data-action="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-left"></i>
                    </button>
                    <span class="page-info">Page ${this.currentPage} of ${totalPages}</span>
                    <button class="btn btn-sm" data-action="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="btn btn-sm" data-action="last" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Search
        this.addEventListener(this.element, 'input', (e) => {
            if (e.target.classList.contains('search-input')) {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.updateTable();
            }
        });

        // Sorting
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.closest('.sortable')) {
                const th = e.target.closest('.sortable');
                const field = th.dataset.field;
                
                if (this.sortField === field) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortOrder = 'asc';
                }
                
                this.updateTable();
                this.updateSortIcons();
            }
        });

        // Pagination
        this.addEventListener(this.element, 'click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                switch (action) {
                    case 'first': this.currentPage = 1; break;
                    case 'prev': this.currentPage = Math.max(1, this.currentPage - 1); break;
                    case 'next': this.currentPage++; break;
                    case 'last': 
                        const totalPages = Math.ceil(this.getFilteredData().length / this.options.pageSize);
                        this.currentPage = totalPages; 
                        break;
                }
                this.updateTable();
            }
        });

        // Row selection
        if (this.options.selectable) {
            this.addEventListener(this.element, 'change', (e) => {
                if (e.target.classList.contains('select-all')) {
                    const checkboxes = this.element.querySelectorAll('.row-select');
                    checkboxes.forEach(cb => {
                        cb.checked = e.target.checked;
                        if (e.target.checked) {
                            this.selectedRows.add(cb.value);
                        } else {
                            this.selectedRows.delete(cb.value);
                        }
                    });
                    this.emit('selectionChanged', Array.from(this.selectedRows));
                } else if (e.target.classList.contains('row-select')) {
                    if (e.target.checked) {
                        this.selectedRows.add(e.target.value);
                    } else {
                        this.selectedRows.delete(e.target.value);
                    }
                    this.emit('selectionChanged', Array.from(this.selectedRows));
                }
            });
        }

        // Filters
        this.addEventListener(this.element, 'change', (e) => {
            if (e.target.classList.contains('filter-select')) {
                const field = e.target.dataset.field;
                if (e.target.value) {
                    this.filters[field] = e.target.value;
                } else {
                    delete this.filters[field];
                }
                this.currentPage = 1;
                this.updateTable();
            }
        });
    }

    updateTable() {
        const tableContainer = this.element.querySelector('.table-container');
        const paginationContainer = this.element.querySelector('.table-pagination');
        
        tableContainer.innerHTML = this.renderTable();
        if (paginationContainer) {
            paginationContainer.outerHTML = this.renderPagination();
        }
    }

    updateSortIcons() {
        this.element.querySelectorAll('.sort-icon').forEach(icon => {
            icon.className = 'fas fa-sort sort-icon';
        });
        
        if (this.sortField) {
            const th = this.element.querySelector(`[data-field="${this.sortField}"]`);
            const icon = th?.querySelector('.sort-icon');
            if (icon) {
                icon.className = `fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'} sort-icon`;
            }
        }
    }

    getFilteredData() {
        let data = [...this.options.data];
        
        // Apply search
        if (this.searchTerm) {
            data = data.filter(row => {
                return this.options.columns.some(col => {
                    const value = this.getCellValue(row, col.field);
                    return String(value).toLowerCase().includes(this.searchTerm.toLowerCase());
                });
            });
        }
        
        // Apply filters
        Object.entries(this.filters).forEach(([field, value]) => {
            data = data.filter(row => this.getCellValue(row, field) === value);
        });
        
        // Apply sorting
        if (this.sortField) {
            data.sort((a, b) => {
                const aVal = this.getCellValue(a, this.sortField);
                const bVal = this.getCellValue(b, this.sortField);
                
                if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return data;
    }

    getPaginatedData(data) {
        const start = (this.currentPage - 1) * this.options.pageSize;
        const end = start + this.options.pageSize;
        return data.slice(start, end);
    }

    getCellValue(row, field) {
        return field.split('.').reduce((obj, key) => obj?.[key], row);
    }

    getUniqueValues(field) {
        const values = this.options.data.map(row => this.getCellValue(row, field));
        return [...new Set(values)].filter(Boolean).sort();
    }

    setData(data) {
        this.options.data = data;
        this.currentPage = 1;
        this.render();
    }

    getSelectedRows() {
        return Array.from(this.selectedRows);
    }

    clearSelection() {
        this.selectedRows.clear();
        this.element.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
}

/**
 * Modal Component
 */
class ModalComponent extends BaseComponent {
    get defaultOptions() {
        return {
            title: 'Modal',
            size: 'md',
            backdrop: true,
            keyboard: true,
            focus: true,
            show: false
        };
    }

    init() {
        super.init();
        if (this.options.show) {
            this.show();
        }
    }

    render() {
        this.element.innerHTML = `
            <div class="modal-backdrop ${this.options.backdrop ? '' : 'd-none'}"></div>
            <div class="modal-dialog modal-${this.options.size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${this.options.title}</h5>
                        <button type="button" class="modal-close" aria-label="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${this.options.content || ''}
                    </div>
                    ${this.options.footer ? `<div class="modal-footer">${this.options.footer}</div>` : ''}
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Close button
        this.addEventListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.hide();
            }
        });

        // Backdrop click
        if (this.options.backdrop) {
            this.addEventListener(this.element, 'click', (e) => {
                if (e.target.classList.contains('modal-backdrop')) {
                    this.hide();
                }
            });
        }

        // Keyboard events
        if (this.options.keyboard) {
            this.addEventListener(document, 'keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible()) {
                    this.hide();
                }
            });
        }
    }

    show() {
        this.element.classList.add('show');
        document.body.classList.add('modal-open');
        
        if (this.options.focus) {
            this.element.focus();
        }
        
        this.emit('shown');
    }

    hide() {
        this.element.classList.remove('show');
        document.body.classList.remove('modal-open');
        this.emit('hidden');
    }

    toggle() {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }

    isVisible() {
        return this.element.classList.contains('show');
    }

    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setContent(content) {
        const bodyElement = this.element.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
        }
    }
}

/**
 * Card Component
 */
class CardComponent extends BaseComponent {
    get defaultOptions() {
        return {
            title: '',
            subtitle: '',
            collapsible: false,
            collapsed: false,
            removable: false
        };
    }

    render() {
        this.element.innerHTML = `
            <div class="card">
                ${this.options.title ? `
                    <div class="card-header">
                        <h6 class="card-title">${this.options.title}</h6>
                        ${this.options.subtitle ? `<p class="card-subtitle">${this.options.subtitle}</p>` : ''}
                        <div class="card-actions">
                            ${this.options.collapsible ? '<button class="btn btn-sm card-toggle"><i class="fas fa-chevron-up"></i></button>' : ''}
                            ${this.options.removable ? '<button class="btn btn-sm card-remove"><i class="fas fa-times"></i></button>' : ''}
                        </div>
                    </div>
                ` : ''}
                <div class="card-body ${this.options.collapsed ? 'collapsed' : ''}">
                    ${this.element.innerHTML}
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (this.options.collapsible) {
            this.addEventListener(this.element, 'click', (e) => {
                if (e.target.closest('.card-toggle')) {
                    this.toggle();
                }
            });
        }

        if (this.options.removable) {
            this.addEventListener(this.element, 'click', (e) => {
                if (e.target.closest('.card-remove')) {
                    this.remove();
                }
            });
        }
    }

    toggle() {
        const body = this.element.querySelector('.card-body');
        const icon = this.element.querySelector('.card-toggle i');
        
        body.classList.toggle('collapsed');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
        
        this.emit('toggled', { collapsed: body.classList.contains('collapsed') });
    }

    remove() {
        this.emit('removing');
        this.element.remove();
        this.destroy();
    }
}

/**
 * Event Bus for component communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            const index = this.events[event].indexOf(callback);
            if (index > -1) {
                this.events[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// Additional component classes would be defined here...
// (ButtonComponent, DropdownComponent, PaginationComponent, etc.)

// Initialize component system
window.ComponentSystem = new ComponentSystem();

// Auto-initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ComponentSystem.autoInit();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComponentSystem, BaseComponent, DataTableComponent, ModalComponent, CardComponent };
}