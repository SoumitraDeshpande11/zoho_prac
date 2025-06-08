/**
 * Zoho CRM Clone - Testing Framework & Documentation Generator
 * Provides comprehensive testing utilities and automatic documentation generation
 */

class TestFramework {
    constructor() {
        this.tests = new Map();
        this.suites = new Map();
        this.results = [];
        this.currentSuite = null;
        this.beforeEachCallbacks = [];
        this.afterEachCallbacks = [];
        this.beforeAllCallbacks = [];
        this.afterAllCallbacks = [];
        this.reporter = new TestReporter();
        this.coverage = new CoverageTracker();
        this.init();
    }

    init() {
        this.setupGlobalAssertions();
        this.setupTestRunner();
        this.bindEvents();
    }

    /**
     * Create a test suite
     * @param {string} name - Suite name
     * @param {Function} callback - Suite definition
     */
    describe(name, callback) {
        const suite = {
            name,
            tests: [],
            beforeEach: [],
            afterEach: [],
            beforeAll: [],
            afterAll: [],
            parent: this.currentSuite
        };

        this.suites.set(name, suite);
        const previousSuite = this.currentSuite;
        this.currentSuite = suite;

        try {
            callback();
        } finally {
            this.currentSuite = previousSuite;
        }

        return suite;
    }

    /**
     * Define a test
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     * @param {number} timeout - Test timeout in ms
     */
    it(name, testFn, timeout = 5000) {
        const test = {
            name,
            fn: testFn,
            timeout,
            suite: this.currentSuite?.name || 'Global',
            status: 'pending',
            error: null,
            duration: 0,
            retries: 0,
            maxRetries: 0
        };

        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        }

        this.tests.set(`${test.suite}:${name}`, test);
        return test;
    }

    /**
     * Skip a test
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     */
    xit(name, testFn) {
        const test = this.it(name, testFn);
        test.status = 'skipped';
        return test;
    }

    /**
     * Focus on specific tests (only run these)
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     */
    fit(name, testFn) {
        const test = this.it(name, testFn);
        test.focused = true;
        return test;
    }

    /**
     * Set up before each test
     * @param {Function} callback - Setup function
     */
    beforeEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach.push(callback);
        } else {
            this.beforeEachCallbacks.push(callback);
        }
    }

    /**
     * Clean up after each test
     * @param {Function} callback - Cleanup function
     */
    afterEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterEach.push(callback);
        } else {
            this.afterEachCallbacks.push(callback);
        }
    }

    /**
     * Set up before all tests in suite
     * @param {Function} callback - Setup function
     */
    beforeAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll.push(callback);
        } else {
            this.beforeAllCallbacks.push(callback);
        }
    }

    /**
     * Clean up after all tests in suite
     * @param {Function} callback - Cleanup function
     */
    afterAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterAll.push(callback);
        } else {
            this.afterAllCallbacks.push(callback);
        }
    }

    /**
     * Run all tests
     * @param {Object} options - Run options
     */
    async run(options = {}) {
        const {
            grep = null,
            timeout = 5000,
            bail = false,
            reporter = 'default'
        } = options;

        this.reporter.start();
        this.coverage.start();

        let testsToRun = Array.from(this.tests.values());

        // Filter by grep pattern
        if (grep) {
            const pattern = new RegExp(grep, 'i');
            testsToRun = testsToRun.filter(test => 
                pattern.test(test.name) || pattern.test(test.suite)
            );
        }

        // Filter focused tests
        const focusedTests = testsToRun.filter(test => test.focused);
        if (focusedTests.length > 0) {
            testsToRun = focusedTests;
        }

        // Filter out skipped tests
        testsToRun = testsToRun.filter(test => test.status !== 'skipped');

        // Run beforeAll callbacks
        await this.runCallbacks(this.beforeAllCallbacks);

        // Group tests by suite
        const testsBySuite = this.groupTestsBySuite(testsToRun);

        for (const [suiteName, tests] of testsBySuite) {
            const suite = this.suites.get(suiteName);
            
            if (suite) {
                await this.runCallbacks(suite.beforeAll);
            }

            for (const test of tests) {
                try {
                    await this.runTest(test, suite);
                    
                    if (test.status === 'failed' && bail) {
                        break;
                    }
                } catch (error) {
                    console.error('Test runner error:', error);
                }
            }

            if (suite) {
                await this.runCallbacks(suite.afterAll);
            }
        }

        // Run afterAll callbacks
        await this.runCallbacks(this.afterAllCallbacks);

        this.coverage.stop();
        const results = this.reporter.finish();
        
        return results;
    }

    /**
     * Run a single test
     * @param {Object} test - Test object
     * @param {Object} suite - Test suite
     */
    async runTest(test, suite) {
        const startTime = performance.now();
        
        try {
            test.status = 'running';
            this.reporter.testStart(test);

            // Run beforeEach callbacks
            await this.runCallbacks(this.beforeEachCallbacks);
            if (suite) {
                await this.runCallbacks(suite.beforeEach);
            }

            // Run the test with timeout
            await this.runWithTimeout(test.fn, test.timeout);

            test.status = 'passed';
            test.duration = performance.now() - startTime;
            this.reporter.testPass(test);

        } catch (error) {
            test.status = 'failed';
            test.error = error;
            test.duration = performance.now() - startTime;
            this.reporter.testFail(test);

            // Retry logic
            if (test.retries < test.maxRetries) {
                test.retries++;
                console.log(`Retrying test: ${test.name} (${test.retries}/${test.maxRetries})`);
                await this.runTest(test, suite);
                return;
            }
        } finally {
            // Run afterEach callbacks
            try {
                if (suite) {
                    await this.runCallbacks(suite.afterEach);
                }
                await this.runCallbacks(this.afterEachCallbacks);
            } catch (error) {
                console.error('AfterEach callback error:', error);
            }
        }

        this.results.push(test);
    }

    /**
     * Run function with timeout
     * @param {Function} fn - Function to run
     * @param {number} timeout - Timeout in ms
     */
    async runWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timeout after ${timeout}ms`));
            }, timeout);

            Promise.resolve(fn()).then(resolve, reject).finally(() => {
                clearTimeout(timer);
            });
        });
    }

    /**
     * Run callback functions
     * @param {Array} callbacks - Array of callback functions
     */
    async runCallbacks(callbacks) {
        for (const callback of callbacks) {
            await callback();
        }
    }

    /**
     * Group tests by suite
     * @param {Array} tests - Array of tests
     */
    groupTestsBySuite(tests) {
        const grouped = new Map();
        
        tests.forEach(test => {
            if (!grouped.has(test.suite)) {
                grouped.set(test.suite, []);
            }
            grouped.get(test.suite).push(test);
        });

        return grouped;
    }

    /**
     * Setup global assertion functions
     */
    setupGlobalAssertions() {
        window.expect = (actual) => new Assertion(actual);
        window.assert = new Assert();
    }

    /**
     * Setup test runner
     */
    setupTestRunner() {
        window.describe = this.describe.bind(this);
        window.it = this.it.bind(this);
        window.xit = this.xit.bind(this);
        window.fit = this.fit.bind(this);
        window.beforeEach = this.beforeEach.bind(this);
        window.afterEach = this.afterEach.bind(this);
        window.beforeAll = this.beforeAll.bind(this);
        window.afterAll = this.afterAll.bind(this);
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Auto-run tests when page loads (if in test mode)
        if (window.location.search.includes('test=true')) {
            document.addEventListener('DOMContentLoaded', () => {
                this.run();
            });
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return {
            total: this.results.length,
            passed: this.results.filter(t => t.status === 'passed').length,
            failed: this.results.filter(t => t.status === 'failed').length,
            skipped: this.results.filter(t => t.status === 'skipped').length,
            tests: this.results
        };
    }

    /**
     * Mock function
     * @param {Function} implementation - Mock implementation
     */
    mock(implementation = () => {}) {
        const mock = {
            calls: [],
            callCount: 0,
            lastCall: null,
            implementation,
            
            mockImplementation: (newImpl) => {
                mock.implementation = newImpl;
                return mock;
            },
            
            mockReturnValue: (value) => {
                mock.implementation = () => value;
                return mock;
            },
            
            mockResolvedValue: (value) => {
                mock.implementation = () => Promise.resolve(value);
                return mock;
            },
            
            mockRejectedValue: (error) => {
                mock.implementation = () => Promise.reject(error);
                return mock;
            },
            
            reset: () => {
                mock.calls = [];
                mock.callCount = 0;
                mock.lastCall = null;
            }
        };

        const mockFn = function(...args) {
            mock.calls.push(args);
            mock.callCount++;
            mock.lastCall = args;
            return mock.implementation.apply(this, args);
        };

        Object.assign(mockFn, mock);
        return mockFn;
    }

    /**
     * Spy on object method
     * @param {Object} object - Object to spy on
     * @param {string} method - Method name
     */
    spy(object, method) {
        const original = object[method];
        const spy = this.mock(original);
        
        spy.restore = () => {
            object[method] = original;
        };

        object[method] = spy;
        return spy;
    }
}

/**
 * Assertion Class
 */
class Assertion {
    constructor(actual) {
        this.actual = actual;
        this.negated = false;
    }

    get not() {
        this.negated = !this.negated;
        return this;
    }

    toBe(expected) {
        const result = Object.is(this.actual, expected);
        this.assert(result, `Expected ${this.actual} to be ${expected}`);
        return this;
    }

    toEqual(expected) {
        const result = this.deepEqual(this.actual, expected);
        this.assert(result, `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
        return this;
    }

    toBeTruthy() {
        this.assert(!!this.actual, `Expected ${this.actual} to be truthy`);
        return this;
    }

    toBeFalsy() {
        this.assert(!this.actual, `Expected ${this.actual} to be falsy`);
        return this;
    }

    toBeNull() {
        this.assert(this.actual === null, `Expected ${this.actual} to be null`);
        return this;
    }

    toBeUndefined() {
        this.assert(this.actual === undefined, `Expected ${this.actual} to be undefined`);
        return this;
    }

    toContain(expected) {
        const result = this.actual && this.actual.includes && this.actual.includes(expected);
        this.assert(result, `Expected ${this.actual} to contain ${expected}`);
        return this;
    }

    toHaveLength(expected) {
        const result = this.actual && this.actual.length === expected;
        this.assert(result, `Expected ${this.actual} to have length ${expected}`);
        return this;
    }

    toThrow(expected) {
        let threw = false;
        let error = null;

        try {
            if (typeof this.actual === 'function') {
                this.actual();
            }
        } catch (e) {
            threw = true;
            error = e;
        }

        if (expected) {
            if (typeof expected === 'string') {
                this.assert(threw && error.message.includes(expected), 
                    `Expected function to throw error containing "${expected}"`);
            } else if (expected instanceof RegExp) {
                this.assert(threw && expected.test(error.message), 
                    `Expected function to throw error matching ${expected}`);
            } else {
                this.assert(threw && error instanceof expected, 
                    `Expected function to throw ${expected.name}`);
            }
        } else {
            this.assert(threw, 'Expected function to throw');
        }

        return this;
    }

    async toResolve() {
        try {
            await this.actual;
            this.assert(true, 'Promise should resolve');
        } catch (error) {
            this.assert(false, `Expected promise to resolve but it rejected with: ${error.message}`);
        }
        return this;
    }

    async toReject() {
        try {
            await this.actual;
            this.assert(false, 'Expected promise to reject but it resolved');
        } catch (error) {
            this.assert(true, 'Promise should reject');
        }
        return this;
    }

    toHaveBeenCalled() {
        this.assert(this.actual.callCount > 0, 'Expected function to have been called');
        return this;
    }

    toHaveBeenCalledWith(...args) {
        const called = this.actual.calls.some(call => 
            this.deepEqual(call, args)
        );
        this.assert(called, `Expected function to have been called with ${JSON.stringify(args)}`);
        return this;
    }

    toHaveBeenCalledTimes(times) {
        this.assert(this.actual.callCount === times, 
            `Expected function to have been called ${times} times but was called ${this.actual.callCount} times`);
        return this;
    }

    assert(condition, message) {
        const result = this.negated ? !condition : condition;
        if (!result) {
            const finalMessage = this.negated ? `NOT ${message}` : message;
            throw new Error(finalMessage);
        }
    }

    deepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return a === b;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object') return a === b;

        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            return a.every((item, index) => this.deepEqual(item, b[index]));
        }

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;

        return keysA.every(key => keysB.includes(key) && this.deepEqual(a[key], b[key]));
    }
}

/**
 * Assert Class (Node.js style assertions)
 */
class Assert {
    ok(value, message = 'Expected value to be truthy') {
        if (!value) throw new Error(message);
    }

    equal(actual, expected, message = `Expected ${actual} to equal ${expected}`) {
        if (actual != expected) throw new Error(message);
    }

    strictEqual(actual, expected, message = `Expected ${actual} to strictly equal ${expected}`) {
        if (actual !== expected) throw new Error(message);
    }

    throws(fn, expected, message = 'Expected function to throw') {
        let threw = false;
        try {
            fn();
        } catch (error) {
            threw = true;
            if (expected && !expected.test(error.message)) {
                throw new Error(`Expected error message to match ${expected}`);
            }
        }
        if (!threw) throw new Error(message);
    }
}

/**
 * Test Reporter
 */
class TestReporter {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.tests = [];
    }

    start() {
        this.startTime = Date.now();
        console.log('🧪 Starting test run...\n');
    }

    testStart(test) {
        console.log(`⏳ Running: ${test.suite} > ${test.name}`);
    }

    testPass(test) {
        console.log(`✅ Passed: ${test.suite} > ${test.name} (${test.duration.toFixed(2)}ms)`);
        this.tests.push(test);
    }

    testFail(test) {
        console.log(`❌ Failed: ${test.suite} > ${test.name} (${test.duration.toFixed(2)}ms)`);
        console.error(`   Error: ${test.error.message}`);
        if (test.error.stack) {
            console.error(`   Stack: ${test.error.stack}`);
        }
        this.tests.push(test);
    }

    finish() {
        this.endTime = Date.now();
        const duration = this.endTime - this.startTime;
        
        const passed = this.tests.filter(t => t.status === 'passed').length;
        const failed = this.tests.filter(t => t.status === 'failed').length;
        const total = this.tests.length;

        console.log('\n📊 Test Results:');
        console.log(`   Total: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Duration: ${duration}ms`);

        if (failed > 0) {
            console.log('\n❌ Tests failed!');
        } else {
            console.log('\n✅ All tests passed!');
        }

        return {
            total,
            passed,
            failed,
            duration,
            tests: this.tests
        };
    }
}

/**
 * Coverage Tracker
 */
class CoverageTracker {
    constructor() {
        this.coverage = new Map();
        this.functions = new Map();
        this.startTime = 0;
    }

    start() {
        this.startTime = Date.now();
        this.instrumentFunctions();
    }

    stop() {
        this.generateReport();
    }

    instrumentFunctions() {
        // Basic function coverage tracking
        const originalDefineProperty = Object.defineProperty;
        
        Object.defineProperty = function(obj, prop, descriptor) {
            if (typeof descriptor.value === 'function') {
                const originalFn = descriptor.value;
                const key = `${obj.constructor.name}.${prop}`;
                
                descriptor.value = function(...args) {
                    window.testFramework.coverage.recordCall(key);
                    return originalFn.apply(this, args);
                };
            }
            return originalDefineProperty.call(this, obj, prop, descriptor);
        };
    }

    recordCall(functionName) {
        const count = this.coverage.get(functionName) || 0;
        this.coverage.set(functionName, count + 1);
    }

    generateReport() {
        console.log('\n📈 Coverage Report:');
        
        if (this.coverage.size === 0) {
            console.log('   No coverage data collected');
            return;
        }

        this.coverage.forEach((count, functionName) => {
            console.log(`   ${functionName}: ${count} calls`);
        });
    }
}

/**
 * Documentation Generator
 */
class DocumentationGenerator {
    constructor() {
        this.docs = new Map();
        this.components = new Map();
        this.apis = new Map();
    }

    /**
     * Generate documentation from code comments
     * @param {string} sourceCode - Source code to analyze
     */
    generateFromCode(sourceCode) {
        const jsDocPattern = /\/\*\*([\s\S]*?)\*\//g;
        const functionPattern = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))/g;
        
        let match;
        while ((match = jsDocPattern.exec(sourceCode)) !== null) {
            const comment = match[1];
            const parsed = this.parseJSDoc(comment);
            
            // Find following function
            const functionMatch = functionPattern.exec(sourceCode);
            if (functionMatch) {
                const functionName = functionMatch[1] || functionMatch[2];
                parsed.name = functionName;
                this.docs.set(functionName, parsed);
            }
        }
    }

    /**
     * Parse JSDoc comment
     * @param {string} comment - JSDoc comment
     */
    parseJSDoc(comment) {
        const lines = comment.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));
        
        const doc = {
            description: '',
            params: [],
            returns: null,
            examples: [],
            since: null,
            deprecated: false
        };

        let currentSection = 'description';
        let currentExample = '';

        lines.forEach(line => {
            if (line.startsWith('@param')) {
                currentSection = 'params';
                const paramMatch = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+-?\s*(.*)/);
                if (paramMatch) {
                    doc.params.push({
                        type: paramMatch[1],
                        name: paramMatch[2],
                        description: paramMatch[3]
                    });
                }
            } else if (line.startsWith('@returns')) {
                const returnMatch = line.match(/@returns\s+\{([^}]+)\}\s+(.*)/);
                if (returnMatch) {
                    doc.returns = {
                        type: returnMatch[1],
                        description: returnMatch[2]
                    };
                }
            } else if (line.startsWith('@example')) {
                currentSection = 'example';
                currentExample = '';
            } else if (line.startsWith('@since')) {
                doc.since = line.replace('@since', '').trim();
            } else if (line.startsWith('@deprecated')) {
                doc.deprecated = true;
            } else if (currentSection === 'description' && line.trim()) {
                doc.description += line + '\n';
            } else if (currentSection === 'example') {
                currentExample += line + '\n';
                if (line.trim() === '' && currentExample.trim()) {
                    doc.examples.push(currentExample.trim());
                    currentExample = '';
                }
            }
        });

        if (currentExample.trim()) {
            doc.examples.push(currentExample.trim());
        }

        doc.description = doc.description.trim();
        return doc;
    }

    /**
     * Generate HTML documentation
     */
    generateHTML() {
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zoho CRM Clone - API Documentation</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 40px; }
                h3 { color: #7f8c8d; }
                .function { margin: 20px 0; padding: 20px; border: 1px solid #ecf0f1; border-radius: 5px; }
                .function-name { font-size: 1.2em; font-weight: bold; color: #2980b9; }
                .deprecated { background-color: #fff3cd; border-color: #ffeaa7; }
                .param { margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 3px; }
                .param-type { color: #e74c3c; font-weight: bold; }
                .param-name { color: #8e44ad; font-weight: bold; }
                .example { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
                .toc { background: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                .toc a { color: #2980b9; text-decoration: none; }
                .toc a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🧪 Zoho CRM Clone - API Documentation</h1>
                
                <div class="toc">
                    <h3>Table of Contents</h3>
                    <ul>
        `;

        // Generate table of contents
        this.docs.forEach((doc, name) => {
            html += `<li><a href="#${name}">${name}</a></li>`;
        });

        html += `
                    </ul>
                </div>
        `;

        // Generate function documentation
        this.docs.forEach((doc, name) => {
            html += `
                <div class="function ${doc.deprecated ? 'deprecated' : ''}" id="${name}">
                    <div class="function-name">${name}</div>
                    ${doc.deprecated ? '<div style="color: #e74c3c; font-weight: bold;">⚠️ Deprecated</div>' : ''}
                    <p>${doc.description}</p>
                    
                    ${doc.params.length > 0 ? '<h4>Parameters:</h4>' : ''}
                    ${doc.params.map(param => `
                        <div class="param">
                            <span class="param-type">{${param.type}}</span>
                            <span class="param-name">${param.name}</span>
                            - ${param.description}
                        </div>
                    `).join('')}
                    
                    ${doc.returns ? `
                        <h4>Returns:</h4>
                        <div class="param">
                            <span class="param-type">{${doc.returns.type}}</span>
                            ${doc.returns.description}
                        </div>
                    ` : ''}
                    
                    ${doc.examples.length > 0 ? '<h4>Examples:</h4>' : ''}
                    ${doc.examples.map(example => `
                        <pre class="example"><code>${example}</code></pre>
                    `).join('')}
                    
                    ${doc.since ? `<p><strong>Since:</strong> ${doc.since}</p>` : ''}
                </div>
            `;
        });

        html += `
            </div>
        </body>
        </html>
        `;

        return html;
    }

    /**
     * Save documentation to file
     */
    saveDocumentation() {
        const html = this.generateHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'api-documentation.html';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Analyze component structure
     * @param {Element} element - DOM element to analyze
     */
    analyzeComponent(element) {
        const componentName = element.getAttribute('data-component') || element.className;
        
        const analysis = {
            name: componentName,
            attributes: Array.from(element.attributes).map(attr => ({
                name: attr.name,
                value: attr.value
            })),
            children: Array.from(element.children).map(child => child.tagName),
            events: this.getElementEvents(element),
            styles: window.getComputedStyle(element)
        };

        this.components.set(componentName, analysis);
        return analysis;
    }

    /**
     * Get events attached to element
     * @param {Element} element - DOM element
     */
    getElementEvents(element) {
        const events = [];
        const eventTypes = ['click', 'change', 'input', 'submit', 'focus', 'blur'];
        
        eventTypes.forEach(type => {
            if (element[`on${type}`]) {
                events.push(type);
            }
        });

        return events;
    }
}

// Initialize test framework
const testFramework = new TestFramework();
const documentationGenerator = new DocumentationGenerator();

// Global access
window.TestFramework = testFramework;
window.DocumentationGenerator = documentationGenerator;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestFramework, DocumentationGenerator };
}

// Example