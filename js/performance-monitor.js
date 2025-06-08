/**
 * Zoho CRM Clone - Performance Monitoring System
 * Provides comprehensive performance monitoring, Core Web Vitals tracking, and optimization insights
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            FCP: 1800, // First Contentful Paint (ms)
            LCP: 2500, // Largest Contentful Paint (ms)
            FID: 100,  // First Input Delay (ms)
            CLS: 0.1,  // Cumulative Layout Shift
            TTFB: 800, // Time to First Byte (ms)
            TTI: 3800  // Time to Interactive (ms)
        };
        this.reportingEndpoint = null;
        this.isEnabled = true;
        this.init();
    }

    init() {
        if (!this.isEnabled || !this.isSupported()) {
            console.warn('Performance monitoring not supported or disabled');
            return;
        }

        this.setupPerformanceObserver();
        this.monitorCoreWebVitals();
        this.monitorResourceLoading();
        this.monitorUserInteractions();
        this.setupNavigationTiming();
        this.bindEvents();
    }

    /**
     * Check if performance monitoring is supported
     */
    isSupported() {
        return 'performance' in window && 
               'PerformanceObserver' in window &&
               'mark' in performance &&
               'measure' in performance;
    }

    /**
     * Setup Performance Observer for various metrics
     */
    setupPerformanceObserver() {
        try {
            // Observe paint timing
            this.createObserver('paint', (list) => {
                list.getEntries().forEach(entry => {
                    this.recordMetric(entry.name, entry.startTime);
                });
            });

            // Observe largest contentful paint
            this.createObserver('largest-contentful-paint', (list) => {
                list.getEntries().forEach(entry => {
                    this.recordMetric('LCP', entry.startTime);
                });
            });

            // Observe layout shift
            this.createObserver('layout-shift', (list) => {
                list.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        this.recordMetric('CLS', entry.value, 'cumulative');
                    }
                });
            });

            // Observe long tasks
            this.createObserver('longtask', (list) => {
                list.getEntries().forEach(entry => {
                    this.recordMetric('long-task', entry.duration);
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry.duration + 'ms');
                    }
                });
            });

            // Observe navigation timing
            this.createObserver('navigation', (list) => {
                list.getEntries().forEach(entry => {
                    this.processNavigationEntry(entry);
                });
            });

            // Observe resource timing
            this.createObserver('resource', (list) => {
                list.getEntries().forEach(entry => {
                    this.processResourceEntry(entry);
                });
            });

        } catch (error) {
            console.error('Failed to setup performance observers:', error);
        }
    }

    /**
     * Create a performance observer
     */
    createObserver(type, callback) {
        try {
            const observer = new PerformanceObserver(callback);
            observer.observe({ entryTypes: [type] });
            this.observers.set(type, observer);
        } catch (error) {
            console.warn(`Failed to observe ${type}:`, error);
        }
    }

    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        // First Contentful Paint
        this.onPaint('first-contentful-paint', (value) => {
            this.recordMetric('FCP', value);
            this.evaluateThreshold('FCP', value);
        });

        // First Input Delay
        this.onFirstInput((value) => {
            this.recordMetric('FID', value);
            this.evaluateThreshold('FID', value);
        });

        // Time to First Byte
        this.onNavigationComplete(() => {
            const navEntry = performance.getEntriesByType('navigation')[0];
            if (navEntry) {
                const ttfb = navEntry.responseStart - navEntry.requestStart;
                this.recordMetric('TTFB', ttfb);
                this.evaluateThreshold('TTFB', ttfb);
            }
        });
    }

    /**
     * Monitor paint events
     */
    onPaint(paintType, callback) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.name === paintType) {
                    callback(entry.startTime);
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.warn('Paint observer not supported:', error);
        }
    }

    /**
     * Monitor first input delay
     */
    onFirstInput(callback) {
        let firstInputDelay = null;

        const measureFID = (event) => {
            if (firstInputDelay !== null) return;

            firstInputDelay = performance.now() - event.timeStamp;
            callback(firstInputDelay);

            // Remove listeners after first input
            ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
                document.removeEventListener(type, measureFID, true);
            });
        };

        // Listen for first input
        ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
            document.addEventListener(type, measureFID, true);
        });
    }

    /**
     * Monitor navigation completion
     */
    onNavigationComplete(callback) {
        if (document.readyState === 'complete') {
            setTimeout(callback, 0);
        } else {
            window.addEventListener('load', callback);
        }
    }

    /**
     * Monitor resource loading performance
     */
    monitorResourceLoading() {
        const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.analyzeResourcePerformance(entry);
            });
        });

        try {
            resourceObserver.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Resource observer not supported:', error);
        }
    }

    /**
     * Analyze resource performance
     */
    analyzeResourcePerformance(entry) {
        const duration = entry.responseEnd - entry.requestStart;
        const resourceType = this.getResourceType(entry.name);

        // Record slow resources
        if (duration > 1000) { // > 1 second
            console.warn(`Slow ${resourceType} resource:`, entry.name, duration + 'ms');
            this.recordMetric('slow-resource', {
                url: entry.name,
                type: resourceType,
                duration: duration
            });
        }

        // Record resource metrics by type
        this.recordMetric(`${resourceType}-load-time`, duration);
    }

    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        if (url.includes('.css')) return 'css';
        if (url.includes('.js')) return 'javascript';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
        return 'other';
    }

    /**
     * Monitor user interactions
     */
    monitorUserInteractions() {
        let interactionCount = 0;
        const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart'];

        interactionTypes.forEach(type => {
            document.addEventListener(type, () => {
                interactionCount++;
                if (interactionCount === 1) {
                    // First interaction
                    this.recordMetric('time-to-first-interaction', performance.now());
                }
            }, { once: type !== 'scroll' && type !== 'keydown' });
        });

        // Monitor scroll performance
        let isScrolling = false;
        document.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                const startTime = performance.now();

                requestAnimationFrame(() => {
                    const scrollDuration = performance.now() - startTime;
                    if (scrollDuration > 16) { // > 1 frame at 60fps
                        this.recordMetric('slow-scroll', scrollDuration);
                    }
                    isScrolling = false;
                });
            }
        });
    }

    /**
     * Setup navigation timing monitoring
     */
    setupNavigationTiming() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry) {
                    this.processNavigationTiming(navEntry);
                }
            }, 0);
        });
    }

    /**
     * Process navigation timing entry
     */
    processNavigationTiming(entry) {
        const metrics = {
            'dns-lookup': entry.domainLookupEnd - entry.domainLookupStart,
            'tcp-connect': entry.connectEnd - entry.connectStart,
            'ssl-handshake': entry.connectEnd - entry.secureConnectionStart,
            'request-response': entry.responseEnd - entry.requestStart,
            'dom-processing': entry.domContentLoadedEventEnd - entry.responseEnd,
            'resource-loading': entry.loadEventStart - entry.domContentLoadedEventEnd,
            'total-page-load': entry.loadEventEnd - entry.navigationStart
        };

        Object.entries(metrics).forEach(([name, value]) => {
            if (value >= 0) {
                this.recordMetric(name, value);
            }
        });
    }

    /**
     * Process navigation entry
     */
    processNavigationEntry(entry) {
        this.recordMetric('navigation-type', entry.type);
        this.recordMetric('redirect-count', entry.redirectCount);
    }

    /**
     * Process resource entry
     */
    processResourceEntry(entry) {
        const resourceType = this.getResourceType(entry.name);
        this.recordMetric(`${resourceType}-count`, 1, 'count');
    }

    /**
     * Record a performance metric
     */
    recordMetric(name, value, type = 'latest') {
        const timestamp = Date.now();
        
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                values: [],
                type: type,
                count: 0,
                sum: 0,
                min: Infinity,
                max: -Infinity
            });
        }

        const metric = this.metrics.get(name);
        metric.values.push({ value, timestamp });
        metric.count++;

        if (typeof value === 'number') {
            if (type === 'cumulative') {
                metric.sum += value;
            } else if (type === 'count') {
                metric.sum++;
            } else {
                metric.sum += value;
                metric.min = Math.min(metric.min, value);
                metric.max = Math.max(metric.max, value);
            }
        }

        // Keep only last 100 values
        if (metric.values.length > 100) {
            metric.values = metric.values.slice(-100);
        }
    }

    /**
     * Evaluate metric against threshold
     */
    evaluateThreshold(metricName, value) {
        const threshold = this.thresholds[metricName];
        if (threshold && value > threshold) {
            console.warn(`Performance threshold exceeded for ${metricName}:`, value, '> threshold:', threshold);
            this.recordMetric('threshold-violation', {
                metric: metricName,
                value: value,
                threshold: threshold
            });
        }
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const summary = {};
        
        this.metrics.forEach((metric, name) => {
            if (metric.count === 0) return;

            summary[name] = {
                count: metric.count,
                latest: metric.values[metric.values.length - 1]?.value,
                average: metric.type === 'cumulative' ? metric.sum : metric.sum / metric.count,
                min: metric.min === Infinity ? null : metric.min,
                max: metric.max === -Infinity ? null : metric.max
            };
        });

        return summary;
    }

    /**
     * Get Core Web Vitals report
     */
    getCoreWebVitals() {
        const vitals = {};
        
        ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].forEach(metric => {
            if (this.metrics.has(metric)) {
                const data = this.metrics.get(metric);
                const latest = data.values[data.values.length - 1];
                vitals[metric] = {
                    value: latest?.value,
                    threshold: this.thresholds[metric],
                    status: this.getMetricStatus(metric, latest?.value)
                };
            }
        });

        return vitals;
    }

    /**
     * Get metric status (good, needs improvement, poor)
     */
    getMetricStatus(metric, value) {
        if (!value || !this.thresholds[metric]) return 'unknown';
        
        const threshold = this.thresholds[metric];
        const goodThreshold = threshold * 0.75; // 75% of threshold is "good"
        
        if (value <= goodThreshold) return 'good';
        if (value <= threshold) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            coreWebVitals: this.getCoreWebVitals(),
            summary: this.getSummary(),
            recommendations: this.getRecommendations()
        };

        return report;
    }

    /**
     * Get performance recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const vitals = this.getCoreWebVitals();

        // Check Core Web Vitals
        Object.entries(vitals).forEach(([metric, data]) => {
            if (data.status === 'poor') {
                recommendations.push(this.getRecommendationForMetric(metric, data.value));
            }
        });

        // Check for slow resources
        if (this.metrics.has('slow-resource')) {
            recommendations.push({
                category: 'Resource Loading',
                priority: 'high',
                issue: 'Slow loading resources detected',
                suggestion: 'Optimize large resources, enable compression, use CDN'
            });
        }

        // Check for long tasks
        if (this.metrics.has('long-task')) {
            recommendations.push({
                category: 'JavaScript Performance',
                priority: 'medium',
                issue: 'Long tasks blocking main thread',
                suggestion: 'Break up long tasks, use web workers for heavy computations'
            });
        }

        return recommendations;
    }

    /**
     * Get recommendation for specific metric
     */
    getRecommendationForMetric(metric, value) {
        const recommendations = {
            'FCP': {
                category: 'Loading Performance',
                priority: 'high',
                issue: `First Contentful Paint is slow (${Math.round(value)}ms)`,
                suggestion: 'Optimize critical rendering path, reduce server response times, eliminate render-blocking resources'
            },
            'LCP': {
                category: 'Loading Performance',
                priority: 'high',
                issue: `Largest Contentful Paint is slow (${Math.round(value)}ms)`,
                suggestion: 'Optimize largest element, preload important resources, optimize images'
            },
            'FID': {
                category: 'Interactivity',
                priority: 'high',
                issue: `First Input Delay is high (${Math.round(value)}ms)`,
                suggestion: 'Reduce JavaScript execution time, break up long tasks, use code splitting'
            },
            'CLS': {
                category: 'Visual Stability',
                priority: 'medium',
                issue: `Cumulative Layout Shift is high (${value.toFixed(3)})`,
                suggestion: 'Include size attributes on images and videos, avoid inserting content above existing content'
            },
            'TTFB': {
                category: 'Server Performance',
                priority: 'medium',
                issue: `Time to First Byte is slow (${Math.round(value)}ms)`,
                suggestion: 'Optimize server response time, use CDN, implement caching'
            }
        };

        return recommendations[metric] || {
            category: 'Performance',
            priority: 'low',
            issue: `${metric} performance issue`,
            suggestion: 'Review and optimize this metric'
        };
    }

    /**
     * Export performance data
     */
    exportData() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Send report to analytics
     */
    async sendReport() {
        if (!this.reportingEndpoint) return;

        try {
            const report = this.generateReport();
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
        } catch (error) {
            console.error('Failed to send performance report:', error);
        }
    }

    /**
     * Bind events for automatic reporting
     */
    bindEvents() {
        // Send report when page is being unloaded
        window.addEventListener('beforeunload', () => {
            this.sendReport();
        });

        // Send report after page load is complete
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.sendReport();
            }, 5000); // Wait 5 seconds after load
        });

        // Send report on visibility change (when user leaves page)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendReport();
            }
        });
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.clear();
    }

    /**
     * Disconnect all observers
     */
    disconnect() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
    }

    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.disconnect();
        } else {
            this.init();
        }
    }

    /**
     * Set reporting endpoint
     */
    setReportingEndpoint(url) {
        this.reportingEndpoint = url;
    }

    /**
     * Update thresholds
     */
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Export for global use
window.PerformanceMonitor = PerformanceMonitor;
window.performanceMonitor = performanceMonitor;

// Development helper functions
window.getPerformanceReport = () => performanceMonitor.generateReport();
window.exportPerformanceData = () => performanceMonitor.exportData();
window.getCoreWebVitals = () => performanceMonitor.getCoreWebVitals();

// Log performance summary in development
if (performanceMonitor.isSupported()) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const vitals = performanceMonitor.getCoreWebVitals();
            console.group('🚀 Core Web Vitals');
            Object.entries(vitals).forEach(([metric, data]) => {
                const icon = data.status === 'good' ? '✅' : data.status === 'needs-improvement' ? '⚠️' : '❌';
                console.log(`${icon} ${metric}: ${typeof data.value === 'number' ? Math.round(data.value) : data.value} (${data.status})`);
            });
            console.groupEnd();
        }, 3000);
    });
}