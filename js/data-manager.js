/**
 * Zoho CRM Clone - Data Management System
 * Handles CRUD operations, data persistence, and API integration
 */

class DataManager {
    constructor() {
        this.storage = new StorageManager();
        this.api = new APIManager();
        this.cache = new Map();
        this.subscribers = new Map();
        this.init();
    }

    init() {
        this.loadInitialData();
        this.setupEventListeners();
    }

    /**
     * Load initial data from storage or API
     */
    async loadInitialData() {
        try {
            // Load data from localStorage first, then sync with API
            const cachedData = await this.storage.getAll();
            
            if (cachedData) {
                this.cache = new Map(Object.entries(cachedData));
                this.notifySubscribers('dataLoaded', cachedData);
            }

            // Sync with API in background
            await this.syncWithAPI();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.loadMockData();
        }
    }

    /**
     * Load mock data for development/demo
     */
    loadMockData() {
        const mockData = {
            leads: this.generateMockLeads(),
            contacts: this.generateMockContacts(),
            accounts: this.generateMockAccounts(),
            deals: this.generateMockDeals(),
            tasks: this.generateMockTasks(),
            meetings: this.generateMockMeetings(),
            calls: this.generateMockCalls(),
            invoices: this.generateMockInvoices(),
            reports: this.generateMockReports(),
            dashboards: this.generateMockDashboards(),
            user: this.generateMockUser(),
            settings: this.generateMockSettings()
        };

        Object.entries(mockData).forEach(([key, value]) => {
            this.cache.set(key, value);
        });

        this.storage.setAll(Object.fromEntries(this.cache));
        this.notifySubscribers('dataLoaded', Object.fromEntries(this.cache));
    }

    /**
     * Subscribe to data changes
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
    }

    /**
     * Unsubscribe from data changes
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    unsubscribe(event, callback) {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify subscribers of data changes
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    notifySubscribers(event, data) {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    /**
     * Get data by type
     * @param {string} type - Data type (leads, contacts, etc.)
     * @param {Object} options - Query options
     */
    async get(type, options = {}) {
        let data = this.cache.get(type) || [];

        // Apply filters
        if (options.filter) {
            data = this.applyFilters(data, options.filter);
        }

        // Apply search
        if (options.search) {
            data = this.applySearch(data, options.search);
        }

        // Apply sorting
        if (options.sort) {
            data = this.applySort(data, options.sort);
        }

        // Apply pagination
        if (options.page && options.limit) {
            const start = (options.page - 1) * options.limit;
            const end = start + options.limit;
            data = data.slice(start, end);
        }

        return {
            data,
            total: this.cache.get(type)?.length || 0,
            page: options.page || 1,
            limit: options.limit || data.length
        };
    }

    /**
     * Get single item by ID
     * @param {string} type - Data type
     * @param {string} id - Item ID
     */
    async getById(type, id) {
        const data = this.cache.get(type) || [];
        return data.find(item => item.id === id);
    }

    /**
     * Create new item
     * @param {string} type - Data type
     * @param {Object} item - Item data
     */
    async create(type, item) {
        const data = this.cache.get(type) || [];
        const newItem = {
            ...item,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.push(newItem);
        this.cache.set(type, data);
        
        await this.storage.set(type, data);
        this.notifySubscribers(`${type}Created`, newItem);
        this.notifySubscribers(`${type}Changed`, data);

        return newItem;
    }

    /**
     * Update existing item
     * @param {string} type - Data type
     * @param {string} id - Item ID
     * @param {Object} updates - Update data
     */
    async update(type, id, updates) {
        const data = this.cache.get(type) || [];
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            throw new Error(`Item with ID ${id} not found`);
        }

        const updatedItem = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        data[index] = updatedItem;
        this.cache.set(type, data);
        
        await this.storage.set(type, data);
        this.notifySubscribers(`${type}Updated`, updatedItem);
        this.notifySubscribers(`${type}Changed`, data);

        return updatedItem;
    }

    /**
     * Delete item
     * @param {string} type - Data type
     * @param {string} id - Item ID
     */
    async delete(type, id) {
        const data = this.cache.get(type) || [];
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            throw new Error(`Item with ID ${id} not found`);
        }

        const deletedItem = data[index];
        data.splice(index, 1);
        this.cache.set(type, data);
        
        await this.storage.set(type, data);
        this.notifySubscribers(`${type}Deleted`, deletedItem);
        this.notifySubscribers(`${type}Changed`, data);

        return deletedItem;
    }

    /**
     * Bulk operations
     */
    async bulkCreate(type, items) {
        const results = [];
        for (const item of items) {
            results.push(await this.create(type, item));
        }
        return results;
    }

    async bulkUpdate(type, updates) {
        const results = [];
        for (const update of updates) {
            results.push(await this.update(type, update.id, update.data));
        }
        return results;
    }

    async bulkDelete(type, ids) {
        const results = [];
        for (const id of ids) {
            results.push(await this.delete(type, id));
        }
        return results;
    }

    /**
     * Apply filters to data
     */
    applyFilters(data, filters) {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (typeof value === 'object' && value.operator) {
                    return this.applyOperatorFilter(item[key], value.value, value.operator);
                }
                return item[key] === value;
            });
        });
    }

    /**
     * Apply operator-based filters
     */
    applyOperatorFilter(itemValue, filterValue, operator) {
        switch (operator) {
            case 'eq': return itemValue === filterValue;
            case 'ne': return itemValue !== filterValue;
            case 'gt': return itemValue > filterValue;
            case 'gte': return itemValue >= filterValue;
            case 'lt': return itemValue < filterValue;
            case 'lte': return itemValue <= filterValue;
            case 'contains': return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'startsWith': return String(itemValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'endsWith': return String(itemValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case 'in': return Array.isArray(filterValue) && filterValue.includes(itemValue);
            case 'notIn': return Array.isArray(filterValue) && !filterValue.includes(itemValue);
            default: return itemValue === filterValue;
        }
    }

    /**
     * Apply search to data
     */
    applySearch(data, search) {
        const searchTerm = search.toLowerCase();
        const searchFields = ['name', 'title', 'email', 'company', 'phone', 'subject'];

        return data.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(searchTerm);
            });
        });
    }

    /**
     * Apply sorting to data
     */
    applySort(data, sort) {
        const { field, order = 'asc' } = sort;
        
        return [...data].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            // Handle different data types
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Sync with API
     */
    async syncWithAPI() {
        try {
            const remoteData = await this.api.fetchAll();
            
            // Merge remote data with local cache
            Object.entries(remoteData).forEach(([type, data]) => {
                this.cache.set(type, data);
            });

            await this.storage.setAll(Object.fromEntries(this.cache));
            this.notifySubscribers('dataSynced', Object.fromEntries(this.cache));
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sync data when online
        window.addEventListener('online', () => {
            this.syncWithAPI();
        });

        // Auto-save periodically
        setInterval(() => {
            this.storage.setAll(Object.fromEntries(this.cache));
        }, 30000); // Every 30 seconds
    }

    // Mock data generators
    generateMockLeads() {
        return [
            {
                id: 'lead_1',
                name: 'John Smith',
                email: 'john.smith@example.com',
                phone: '+1-555-0123',
                company: 'Tech Solutions Inc',
                status: 'New',
                source: 'Website',
                value: 25000,
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 'lead_2',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@example.com',
                phone: '+1-555-0124',
                company: 'Digital Marketing Co',
                status: 'Qualified',
                source: 'Referral',
                value: 35000,
                createdAt: '2024-01-14T14:20:00Z',
                updatedAt: '2024-01-16T09:15:00Z'
            }
        ];
    }

    generateMockContacts() {
        return [
            {
                id: 'contact_1',
                firstName: 'Alice',
                lastName: 'Brown',
                email: 'alice.brown@company.com',
                phone: '+1-555-0125',
                company: 'Brown Industries',
                title: 'VP Marketing',
                department: 'Marketing',
                createdAt: '2024-01-10T08:00:00Z',
                updatedAt: '2024-01-10T08:00:00Z'
            },
            {
                id: 'contact_2',
                firstName: 'Michael',
                lastName: 'Davis',
                email: 'michael.davis@corp.com',
                phone: '+1-555-0126',
                company: 'Davis Corporation',
                title: 'Director of Sales',
                department: 'Sales',
                createdAt: '2024-01-12T11:30:00Z',
                updatedAt: '2024-01-12T11:30:00Z'
            }
        ];
    }

    generateMockAccounts() {
        return [
            {
                id: 'account_1',
                name: 'Enterprise Solutions Ltd',
                industry: 'Technology',
                type: 'Customer',
                employees: 500,
                revenue: 10000000,
                website: 'https://enterprise-solutions.com',
                phone: '+1-555-0127',
                address: '123 Business Ave, Suite 100, City, State 12345',
                createdAt: '2024-01-05T16:45:00Z',
                updatedAt: '2024-01-05T16:45:00Z'
            }
        ];
    }

    generateMockDeals() {
        return [
            {
                id: 'deal_1',
                name: 'Q1 Software License Deal',
                amount: 75000,
                stage: 'Negotiation',
                probability: 75,
                closeDate: '2024-03-31',
                accountId: 'account_1',
                contactId: 'contact_1',
                description: 'Annual software licensing agreement',
                createdAt: '2024-01-08T12:00:00Z',
                updatedAt: '2024-01-20T15:30:00Z'
            }
        ];
    }

    generateMockTasks() {
        return [
            {
                id: 'task_1',
                subject: 'Follow up with Enterprise Solutions',
                description: 'Call to discuss contract terms',
                status: 'Not Started',
                priority: 'High',
                dueDate: '2024-02-15',
                assignedTo: 'current_user',
                relatedTo: 'deal_1',
                createdAt: '2024-01-20T09:00:00Z',
                updatedAt: '2024-01-20T09:00:00Z'
            }
        ];
    }

    generateMockMeetings() {
        return [
            {
                id: 'meeting_1',
                title: 'Contract Review Meeting',
                description: 'Review contract terms with legal team',
                startTime: '2024-02-20T14:00:00Z',
                endTime: '2024-02-20T15:00:00Z',
                location: 'Conference Room A',
                attendees: ['current_user', 'contact_1'],
                relatedTo: 'deal_1',
                createdAt: '2024-01-18T10:00:00Z',
                updatedAt: '2024-01-18T10:00:00Z'
            }
        ];
    }

    generateMockCalls() {
        return [
            {
                id: 'call_1',
                subject: 'Discovery Call',
                description: 'Initial discovery call to understand requirements',
                duration: 45,
                callType: 'Outbound',
                status: 'Completed',
                callTime: '2024-01-19T10:30:00Z',
                contactId: 'contact_2',
                createdAt: '2024-01-19T10:30:00Z',
                updatedAt: '2024-01-19T11:15:00Z'
            }
        ];
    }

    generateMockInvoices() {
        return [
            {
                id: 'invoice_1',
                number: 'INV-2024-001',
                amount: 25000,
                status: 'Sent',
                dueDate: '2024-02-28',
                issueDate: '2024-01-28',
                accountId: 'account_1',
                items: [
                    { description: 'Software License', quantity: 1, rate: 25000, amount: 25000 }
                ],
                createdAt: '2024-01-28T14:00:00Z',
                updatedAt: '2024-01-28T14:00:00Z'
            }
        ];
    }

    generateMockReports() {
        return [
            {
                id: 'report_1',
                name: 'Monthly Sales Report',
                type: 'Sales',
                description: 'Monthly sales performance analysis',
                data: {
                    totalDeals: 15,
                    totalValue: 450000,
                    wonDeals: 8,
                    lostDeals: 2,
                    pipelineValue: 275000
                },
                createdAt: '2024-01-31T23:59:59Z',
                updatedAt: '2024-01-31T23:59:59Z'
            }
        ];
    }

    generateMockDashboards() {
        return [
            {
                id: 'dashboard_1',
                name: 'Sales Dashboard',
                widgets: [
                    { type: 'metric', title: 'Total Revenue', value: 450000 },
                    { type: 'metric', title: 'Open Deals', value: 15 },
                    { type: 'chart', title: 'Sales Trend', data: [] }
                ],
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-31T23:59:59Z'
            }
        ];
    }

    generateMockUser() {
        return {
            id: 'current_user',
            firstName: 'Soumitra',
            lastName: 'Deshpande',
            email: 'soumitra@company.com',
            role: 'Administrator',
            department: 'Sales',
            preferences: {
                theme: 'light',
                timezone: 'America/New_York',
                dateFormat: 'MM/DD/YYYY',
                currency: 'USD'
            }
        };
    }

    generateMockSettings() {
        return {
            company: {
                name: 'CRM Teamspace',
                industry: 'Technology',
                timezone: 'America/New_York',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY'
            },
            integrations: {
                email: { enabled: true, provider: 'gmail' },
                calendar: { enabled: true, provider: 'google' },
                phone: { enabled: false, provider: null }
            }
        };
    }
}

/**
 * Storage Manager - Handles local storage operations
 */
class StorageManager {
    constructor() {
        this.prefix = 'zoho_crm_';
    }

    async get(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    async remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    async getAll() {
        try {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    data[cleanKey] = JSON.parse(localStorage.getItem(key));
                }
            }
            return data;
        } catch (error) {
            console.error('Storage getAll error:', error);
            return {};
        }
    }

    async setAll(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            return true;
        } catch (error) {
            console.error('Storage setAll error:', error);
            return false;
        }
    }

    async clear() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
}

/**
 * API Manager - Handles external API communications
 */
class APIManager {
    constructor() {
        this.baseURL = 'https://api.zoho-crm-clone.com/v1';
        this.apiKey = null;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.headers.Authorization = `Bearer ${apiKey}`;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.headers,
                ...options
            };

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async fetchAll() {
        // In a real implementation, this would make multiple API calls
        // For now, return empty data to trigger local mock data loading
        throw new Error('API not configured - using mock data');
    }
}

// Initialize global data manager
window.DataManager = new DataManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, StorageManager, APIManager };
}