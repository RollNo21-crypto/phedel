// Data Migration Script
// Transfers existing search.js data to Cloudflare D1 database

class DataMigrator {
    constructor() {
        this.apiConfig = {
            // API Configuration - Updated with deployed worker URLs
            searchApiUrl: 'https://phedel-search-search-api.krishnamurthym.workers.dev',
            productApiUrl: 'https://phedel-search-product-api.krishnamurthym.workers.dev',
            authApiUrl: 'https://phedel-search-auth-api.krishnamurthym.workers.dev',
            uploadApiUrl: 'https://phedel-search-upload-api.krishnamurthym.workers.dev',
            endpoints: {
                products: '/products',
                categories: '/search/categories',
                domains: '/search/domains'
            }
        };
        
        this.migrationStats = {
            products: { total: 0, migrated: 0, failed: 0 },
            categories: { total: 0, migrated: 0, failed: 0 },
            domains: { total: 0, migrated: 0, failed: 0 }
        };
        
        this.existingData = null;
        // Use environment variable for Node.js or fallback to a default token
        this.adminToken = typeof localStorage !== 'undefined' 
            ? localStorage.getItem('admin_token') 
            : process.env.ADMIN_TOKEN || 'admin-migration-token';
    }
    
    async init() {
        console.log('🚀 Starting data migration process...');
        
        try {
            // Load existing search.js data
            await this.loadExistingData();
            
            // Parse and prepare data
            const parsedData = this.parseExistingData();
            
            // Migrate categories first
            await this.migrateCategories(parsedData.categories);
            
            // Migrate domains
            await this.migrateDomains(parsedData.domains);
            
            // Migrate products
            await this.migrateProducts(parsedData.products);
            
            // Display migration summary
            this.displayMigrationSummary();
            
            console.log('✅ Migration completed successfully!');
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
    
    async loadExistingData() {
        console.log('📂 Loading existing search.js data...');
        
        try {
            // Try to load from the existing search.js file
            const response = await fetch('./js/search.js');
            const searchJsContent = await response.text();
            
            // Extract the products array from search.js
            // This is a simplified extraction - in reality, you might need more sophisticated parsing
            const productsMatch = searchJsContent.match(/const\s+products\s*=\s*(\[[\s\S]*?\]);/);
            
            if (productsMatch) {
                // Use eval carefully in a controlled environment
                // In production, use a proper JavaScript parser
                const productsCode = productsMatch[1];
                this.existingData = eval(productsCode);
                console.log(`📊 Found ${this.existingData.length} products in search.js`);
            } else {
                throw new Error('Could not find products array in search.js');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load from search.js file, using fallback data...');
            
            // Fallback: Use sample data structure based on the original search.js
            this.existingData = this.getFallbackData();
        }
    }
    
    getFallbackData() {
        // Sample data structure based on the original search.js format
        return [
            {
                name: "42U Server Rack Cabinet",
                description: "Professional 42U server rack cabinet with ventilation and cable management",
                category: "Server Racks",
                domain: "Data Center",
                image: "images/server-rack-42u.jpg",
                tags: ["42U", "server", "rack", "cabinet", "data center"],
                specifications: {
                    height: "42U",
                    width: "600mm",
                    depth: "800mm",
                    material: "Steel",
                    color: "Black"
                },
                features: [
                    "Adjustable mounting rails",
                    "Ventilation panels",
                    "Cable management",
                    "Lockable doors",
                    "Leveling feet"
                ]
            },
            {
                name: "Network Switch 24-Port",
                description: "Managed 24-port Gigabit Ethernet switch with PoE+ support",
                category: "Network Equipment",
                domain: "Networking",
                image: "images/network-switch-24port.jpg",
                tags: ["switch", "24-port", "gigabit", "PoE", "managed"],
                specifications: {
                    ports: "24",
                    speed: "1Gbps",
                    poe_power: "370W",
                    management: "Web-based"
                },
                features: [
                    "PoE+ support",
                    "VLAN support",
                    "QoS management",
                    "SNMP monitoring",
                    "Rack mountable"
                ]
            },
            {
                name: "UPS Battery Backup 1500VA",
                description: "Uninterruptible Power Supply with 1500VA capacity and LCD display",
                category: "Power Management",
                domain: "Infrastructure",
                image: "images/ups-1500va.jpg",
                tags: ["UPS", "battery", "backup", "1500VA", "LCD"],
                specifications: {
                    capacity: "1500VA",
                    runtime: "15 minutes",
                    outlets: "8",
                    display: "LCD"
                },
                features: [
                    "Automatic voltage regulation",
                    "LCD status display",
                    "USB monitoring",
                    "Surge protection",
                    "Hot-swappable batteries"
                ]
            },
            {
                name: "Fiber Optic Cable 50m",
                description: "Single-mode fiber optic cable 50 meters with SC connectors",
                category: "Cables",
                domain: "Networking",
                image: "images/fiber-cable-50m.jpg",
                tags: ["fiber", "optic", "cable", "50m", "SC", "single-mode"],
                specifications: {
                    length: "50m",
                    type: "Single-mode",
                    connector: "SC/SC",
                    wavelength: "1310nm"
                },
                features: [
                    "Low insertion loss",
                    "High return loss",
                    "LSZH jacket",
                    "Bend-insensitive",
                    "Pre-terminated"
                ]
            },
            {
                name: "KVM Switch 16-Port",
                description: "16-port KVM switch with OSD and hotkey switching",
                category: "KVM Systems",
                domain: "Server Management",
                image: "images/kvm-switch-16port.jpg",
                tags: ["KVM", "switch", "16-port", "OSD", "hotkey"],
                specifications: {
                    ports: "16",
                    resolution: "1920x1200",
                    interface: "USB/PS2",
                    osd: "Yes"
                },
                features: [
                    "On-screen display",
                    "Hotkey switching",
                    "Auto-scan mode",
                    "Password protection",
                    "Rack mountable"
                ]
            }
        ];
    }
    
    parseExistingData() {
        console.log('🔄 Parsing existing data structure...');
        
        const categories = new Set();
        const domains = new Set();
        const products = [];
        
        this.existingData.forEach((item, index) => {
            try {
                // Extract categories and domains
                if (item.category) categories.add(item.category);
                if (item.domain) domains.add(item.domain);
                
                // Transform product data to match D1 schema
                const product = {
                    name: item.name || `Product ${index + 1}`,
                    description: item.description || '',
                    category: item.category || 'Uncategorized',
                    domain: item.domain || null,
                    image_url: item.image || null,
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    specifications: typeof item.specifications === 'object' ? item.specifications : {},
                    features: Array.isArray(item.features) ? item.features : []
                };
                
                products.push(product);
                
            } catch (error) {
                console.warn(`⚠️ Error parsing product at index ${index}:`, error);
            }
        });
        
        const parsedData = {
            categories: Array.from(categories).map(name => ({
                name,
                description: `${name} category`
            })),
            domains: Array.from(domains).map(name => ({
                name,
                description: `${name} domain`
            })),
            products
        };
        
        console.log(`📊 Parsed data: ${parsedData.categories.length} categories, ${parsedData.domains.length} domains, ${parsedData.products.length} products`);
        
        return parsedData;
    }
    
    async migrateCategories(categories) {
        console.log('📁 Migrating categories...');
        
        this.migrationStats.categories.total = categories.length;
        
        for (const category of categories) {
            try {
                const response = await this.apiCall('/products/categories', {
                    method: 'POST',
                    body: JSON.stringify(category)
                });
                
                if (response.success) {
                    this.migrationStats.categories.migrated++;
                    console.log(`✅ Migrated category: ${category.name}`);
                } else {
                    throw new Error(response.error || 'Unknown error');
                }
                
            } catch (error) {
                this.migrationStats.categories.failed++;
                console.error(`❌ Failed to migrate category ${category.name}:`, error.message);
            }
        }
    }
    
    async migrateDomains(domains) {
        console.log('🌐 Migrating domains...');
        
        this.migrationStats.domains.total = domains.length;
        
        for (const domain of domains) {
            try {
                const response = await this.apiCall('/products/domains', {
                    method: 'POST',
                    body: JSON.stringify(domain)
                });
                
                if (response.success) {
                    this.migrationStats.domains.migrated++;
                    console.log(`✅ Migrated domain: ${domain.name}`);
                } else {
                    throw new Error(response.error || 'Unknown error');
                }
                
            } catch (error) {
                this.migrationStats.domains.failed++;
                console.error(`❌ Failed to migrate domain ${domain.name}:`, error.message);
            }
        }
    }
    
    async migrateProducts(products) {
        console.log('📦 Migrating products...');
        
        this.migrationStats.products.total = products.length;
        
        // Migrate products in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (product, batchIndex) => {
                const productIndex = i + batchIndex;
                
                try {
                    const response = await this.apiCall('/products', {
                        method: 'POST',
                        body: JSON.stringify(product)
                    });
                    
                    if (response.success) {
                        this.migrationStats.products.migrated++;
                        console.log(`✅ Migrated product ${productIndex + 1}/${products.length}: ${product.name}`);
                    } else {
                        throw new Error(response.error || 'Unknown error');
                    }
                    
                } catch (error) {
                    this.migrationStats.products.failed++;
                    console.error(`❌ Failed to migrate product ${product.name}:`, error.message);
                }
            }));
            
            // Add a small delay between batches
            if (i + batchSize < products.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    displayMigrationSummary() {
        console.log('\n📊 Migration Summary:');
        console.log('='.repeat(50));
        
        console.log(`Categories: ${this.migrationStats.categories.migrated}/${this.migrationStats.categories.total} migrated, ${this.migrationStats.categories.failed} failed`);
        console.log(`Domains: ${this.migrationStats.domains.migrated}/${this.migrationStats.domains.total} migrated, ${this.migrationStats.domains.failed} failed`);
        console.log(`Products: ${this.migrationStats.products.migrated}/${this.migrationStats.products.total} migrated, ${this.migrationStats.products.failed} failed`);
        
        const totalMigrated = this.migrationStats.categories.migrated + this.migrationStats.domains.migrated + this.migrationStats.products.migrated;
        const totalFailed = this.migrationStats.categories.failed + this.migrationStats.domains.failed + this.migrationStats.products.failed;
        const totalItems = this.migrationStats.categories.total + this.migrationStats.domains.total + this.migrationStats.products.total;
        
        console.log(`\nTotal: ${totalMigrated}/${totalItems} items migrated successfully`);
        
        if (totalFailed > 0) {
            console.log(`⚠️ ${totalFailed} items failed to migrate. Check the logs above for details.`);
        }
        
        console.log('='.repeat(50));
    }
    
    async apiCall(endpoint, options = {}) {
        // Determine which base URL to use based on the endpoint
        let baseUrl;
        if (endpoint.includes('/search/')) {
            baseUrl = this.apiConfig.searchApiUrl;
        } else {
            baseUrl = this.apiConfig.productApiUrl;
        }
        
        const url = `${baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.adminToken}`
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }
    
    // Method to run migration from admin dashboard
    static async runMigration() {
        const migrator = new DataMigrator();
        
        try {
            await migrator.init();
            return {
                success: true,
                stats: migrator.migrationStats,
                message: 'Migration completed successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stats: migrator.migrationStats
            };
        }
    }
    
    // Method to validate migration
    static async validateMigration() {
        console.log('🔍 Validating migration...');
        
        const migrator = new DataMigrator();
        
        try {
            // Check if products exist in D1
            const productsResponse = await migrator.apiCall('/products');
            const categoriesResponse = await migrator.apiCall('/search/categories');
            const domainsResponse = await migrator.apiCall('/search/domains');
            
            const validation = {
                products: productsResponse.products?.length || 0,
                categories: categoriesResponse.categories?.length || 0,
                domains: domainsResponse.domains?.length || 0
            };
            
            console.log('✅ Migration validation:', validation);
            
            return {
                success: true,
                validation
            };
            
        } catch (error) {
            console.error('❌ Migration validation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMigrator;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.DataMigrator = DataMigrator;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
    const migrator = new DataMigrator();
    migrator.init().catch(console.error);
}