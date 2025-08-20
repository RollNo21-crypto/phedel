// PHEDEL Advanced Universal Search System
// Modern, efficient search with fuzzy matching, relevance scoring, and enhanced UX
// Supports both inline search and dedicated search results page

class UniversalSearchSystem {
    constructor() {
        this.isSearchResultsPage = window.location.pathname.includes('products.html');
        this.currentQuery = '';
        this.currentResults = [];
        this.filteredResults = [];
        this.searchHistory = this.loadSearchHistory();
        this.searchCache = new Map();
        this.debounceTimer = null;
        this.searchAnalytics = {
            totalSearches: 0,
            popularQueries: new Map(),
            clickThroughRate: new Map()
        };
        
        // Enhanced product database with better categorization
        this.productDatabase = {
            'it-infrastructure': {
                name: 'IT Infrastructure',
                icon: 'fas fa-server',
                description: 'Enterprise-grade IT infrastructure solutions',
                categories: {
                    'server-racks': {
                        name: 'Server Racks',
                        icon: 'fas fa-database',
                        products: [
                            {
                                id: 'sr-42u-smart',
                                name: 'SR-42U Smart Rack',
                                description: 'Intelligent 42U server rack with advanced monitoring capabilities and thermal management',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'data-centre-category.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/server-rack-42u.jpg',
                                tags: ['smart', '42u', 'monitoring', 'intelligent', 'thermal', 'enterprise'],
                                specifications: {
                                    height: '42U (2000mm)',
                                    depth: '800mm',
                                    width: '600mm',
                                    loadCapacity: '1000kg',
                                    material: 'Cold-rolled steel',
                                    finish: 'RAL 7035 powder coating',
                                    ventilation: 'Front-to-back airflow',
                                    monitoring: 'Temperature, humidity, door access'
                                },
                                features: ['Smart monitoring', 'Cable management', 'Adjustable rails', 'Lockable doors'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.8
                            },
                            {
                                id: 'sv-42u-server',
                                name: 'SV-42U Server Rack',
                                description: 'Standard 42U server rack optimized for data center applications with enhanced cable management',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'server-rack.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/network-cabinet-27u.jpg',
                                tags: ['server', '42u', 'standard', 'datacenter', 'cable-management'],
                                specifications: {
                                    height: '42U (2000mm)',
                                    depth: '1000mm',
                                    width: '600mm',
                                    loadCapacity: '1200kg',
                                    material: 'Cold-rolled steel',
                                    finish: 'Black RAL 9005',
                                    doors: 'Perforated front and rear'
                                },
                                features: ['Tool-free assembly', 'Adjustable depth', 'Cable management', 'Ventilation'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.6
                            },
                            {
                                id: 'dcr-42u-datacentre',
                                name: 'DCR-42U Data Centre Rack',
                                description: 'High-density data centre rack with advanced thermal management and maximum load capacity',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'data-centre-rack.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/it-equipment-rack.jpg',
                                tags: ['datacenter', '42u', 'thermal', 'high-density', 'enterprise', 'cooling'],
                                specifications: {
                                    height: '42U (2000mm)',
                                    depth: '1200mm',
                                    width: '600mm',
                                    loadCapacity: '1500kg',
                                    material: 'Heavy-duty steel',
                                    cooling: 'Integrated thermal management',
                                    power: 'Built-in PDU options'
                                },
                                features: ['Maximum load capacity', 'Thermal optimization', 'Power distribution', 'Seismic compliance'],
                                price: 'Contact for pricing',
                                availability: 'Made to Order',
                                rating: 4.9
                            }
                        ]
                    },
                    'network-cabinets': {
                        name: 'Network Cabinets',
                        icon: 'fas fa-network-wired',
                        products: [
                            {
                                id: 'nc-27u-network',
                                name: 'NC-27U Network Cabinet',
                                description: 'Compact 27U network cabinet perfect for office and small data center environments',
                                category: 'network-cabinets',
                                domain: 'it-infrastructure',
                                url: 'network-cabinet.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/wall-mount-rack-12u.jpg',
                                tags: ['network', '27u', 'compact', 'office', 'switching'],
                                specifications: {
                                    height: '27U (1350mm)',
                                    depth: '600mm',
                                    width: '600mm',
                                    loadCapacity: '800kg',
                                    doors: 'Glass front, steel rear'
                                },
                                features: ['Compact design', 'Glass door', 'Cable management', 'Ventilation fans'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.5
                            }
                        ]
                    }
                }
            },
            'telecommunications': {
                name: 'Telecommunications',
                icon: 'fas fa-broadcast-tower',
                description: 'Comprehensive telecommunications infrastructure solutions',
                categories: {
                    'outdoor-equipment': {
                        name: 'Outdoor Equipment',
                        icon: 'fas fa-cloud',
                        products: [
                            {
                                id: 'ot-600-outdoor',
                                name: 'OT-600 Outdoor Cabinet',
                                description: 'Weatherproof outdoor telecommunications cabinet with superior environmental protection',
                                category: 'outdoor-equipment',
                                domain: 'telecommunications',
                                url: 'outdoor-telecom-products.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/outdoor-telecom-cabinet.jpg',
                                tags: ['outdoor', 'weatherproof', 'telecom', 'cabinet', 'ip65', 'galvanized'],
                                specifications: {
                                    protection: 'IP65',
                                    material: 'Galvanized Steel',
                                    ventilation: 'Natural convection',
                                    temperature: '-40°C to +70°C',
                                    humidity: '95% RH non-condensing',
                                    coating: 'Polyester powder coating'
                                },
                                features: ['Weather resistant', 'Corrosion protection', 'Natural cooling', 'Easy access'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.7
                            }
                        ]
                    },
                    'fiber-optics': {
                        name: 'Fiber Optics',
                        icon: 'fas fa-wifi',
                        products: [
                            {
                                id: 'of-sc-connectors',
                                name: 'OF-SC Fiber Connectors',
                                description: 'Premium SC type fiber optic connectors with ultra-low insertion loss',
                                category: 'fiber-optics',
                                domain: 'telecommunications',
                                url: 'optical-fibre-accessories.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/optical-fiber-accessories.jpg',
                                tags: ['fiber', 'connectors', 'sc', 'optical', 'low-loss', 'precision'],
                                specifications: {
                                    type: 'SC/UPC',
                                    insertionLoss: '<0.2dB',
                                    returnLoss: '>50dB',
                                    durability: '>1000 mating cycles',
                                    temperature: '-40°C to +85°C'
                                },
                                features: ['Ultra-low loss', 'High durability', 'Precision alignment', 'Quality tested'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.8
                            },
                            {
                                id: 'fdh-24-fiber',
                                name: 'FDH-24 Fiber Distribution Hub',
                                description: '24-port fiber distribution hub for network termination and cross-connection',
                                category: 'fiber-optics',
                                domain: 'telecommunications',
                                url: 'fiber-distribution.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/fiber-distribution-hub.jpg',
                                tags: ['fiber', 'distribution', 'hub', '24-port', 'termination', 'cross-connect'],
                                specifications: {
                                    ports: '24 SC/LC ports',
                                    capacity: 'Up to 24 fibers',
                                    mounting: 'Wall or rack mount',
                                    material: 'ABS plastic housing'
                                },
                                features: ['Modular design', 'Easy installation', 'Cable management', 'Dust protection'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.6
                            }
                        ]
                    },
                    'security-systems': {
                        name: 'Security Systems',
                        icon: 'fas fa-shield-alt',
                        products: [
                            {
                                id: 'cc-12u-cctv',
                                name: 'CC-12U CCTV Rack',
                                description: 'Compact 12U rack specifically designed for CCTV surveillance equipment',
                                category: 'security-systems',
                                domain: 'telecommunications',
                                url: 'cctv-racks.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/cctv-pole-mount.jpg',
                                tags: ['cctv', '12u', 'surveillance', 'security', 'compact', 'monitoring'],
                                specifications: {
                                    height: '12U (600mm)',
                                    mounting: 'Wall/Floor mount',
                                    protection: 'IP54',
                                    ventilation: 'Fan-assisted cooling',
                                    power: 'Integrated power strip'
                                },
                                features: ['Compact design', 'Ventilation system', 'Cable management', 'Secure locking'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.4
                            }
                        ]
                    }
                }
            },
            'infrastructure': {
                name: 'Infrastructure',
                icon: 'fas fa-building',
                description: 'Essential infrastructure components and cable management',
                categories: {
                    'cable-management': {
                        name: 'Cable Management',
                        icon: 'fas fa-plug',
                        products: [
                            {
                                id: 'hd-32-hdpe',
                                name: 'HD-32 HDPE Duct',
                                description: 'High-density polyethylene duct for superior cable protection in underground installations',
                                category: 'cable-management',
                                domain: 'infrastructure',
                                url: 'hdpe-plb-duct-pipes.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/hdpe-duct-product.jpg',
                                tags: ['hdpe', 'duct', 'cable', 'protection', 'underground', 'polyethylene'],
                                specifications: {
                                    diameter: '32mm',
                                    material: 'HDPE (High-Density Polyethylene)',
                                    length: '6m standard',
                                    color: 'Orange/Black',
                                    temperature: '-40°C to +60°C',
                                    pressure: '450N (45kg)'
                                },
                                features: ['Chemical resistance', 'UV protection', 'Flexible installation', 'Long lifespan'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.7
                            },
                            {
                                id: 'ct-system-cable',
                                name: 'CT-System Cable Tray',
                                description: 'Modular cable tray system for organized cable routing and support',
                                category: 'cable-management',
                                domain: 'infrastructure',
                                url: 'cable-tray-system.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/cable-tray-system.jpg',
                                tags: ['cable-tray', 'modular', 'routing', 'support', 'galvanized', 'system'],
                                specifications: {
                                    width: '100-600mm',
                                    material: 'Galvanized steel',
                                    finish: 'Hot-dip galvanized',
                                    loadCapacity: 'Up to 50kg/m',
                                    installation: 'Bolt-together system'
                                },
                                features: ['Modular design', 'Easy installation', 'Corrosion resistant', 'Multiple widths'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.5
                            }
                        ]
                    },
                    'power-solutions': {
                        name: 'Power Solutions',
                        icon: 'fas fa-bolt',
                        products: [
                            {
                                id: 'pdu-19-power',
                                name: 'PDU-19 Power Distribution Unit',
                                description: 'Rack-mounted power distribution unit with monitoring and surge protection',
                                category: 'power-solutions',
                                domain: 'infrastructure',
                                url: 'power-distribution.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/power-distribution-unit.jpg',
                                tags: ['pdu', 'power', 'distribution', 'monitoring', 'surge-protection', '19-inch'],
                                specifications: {
                                    mounting: '19-inch rack',
                                    outlets: '8-24 outlets',
                                    voltage: '230V AC',
                                    current: 'Up to 32A',
                                    monitoring: 'Current, voltage, power'
                                },
                                features: ['Real-time monitoring', 'Surge protection', 'Remote management', 'Multiple outlets'],
                                price: 'Contact for pricing',
                                availability: 'In Stock',
                                rating: 4.6
                            }
                        ]
                    }
                }
            },
            'laboratory': {
                name: 'Laboratory Equipment',
                icon: 'fas fa-flask',
                description: 'Specialized laboratory and clean room solutions',
                categories: {
                    'clean-room': {
                        name: 'Clean Room Equipment',
                        icon: 'fas fa-microscope',
                        products: [
                            {
                                id: 'cr-cabinet-clean',
                                name: 'CR-Cabinet Clean Room Storage',
                                description: 'Stainless steel clean room cabinet for sterile equipment storage',
                                category: 'clean-room',
                                domain: 'laboratory',
                                url: 'laboratory-category.html',
                                image: 'https://cdn.jsdelivr.net/gh/phedel/assets@main/images/clean-room-cabinet.jpg',
                                tags: ['clean-room', 'stainless-steel', 'sterile', 'laboratory', 'storage'],
                                specifications: {
                                    material: '316L Stainless Steel',
                                    finish: 'Electropolished',
                                    class: 'ISO Class 5 compatible',
                                    doors: 'HEPA filtered',
                                    shelves: 'Adjustable perforated'
                                },
                                features: ['HEPA filtration', 'Electropolished finish', 'Adjustable shelving', 'Easy cleaning'],
                                price: 'Contact for pricing',
                                availability: 'Made to Order',
                                rating: 4.8
                            }
                        ]
                    }
                }
            }
        };
        
        this.initializeSearch();
    }

    // Enhanced search algorithms with fuzzy matching and relevance scoring
    performAdvancedSearch(query) {
        // Use page products if available and on products page, otherwise use database
        const allProducts = (this.isSearchResultsPage && this.searchableProducts) 
            ? this.searchableProducts 
            : this.getAllProducts();
            
        if (!query || query.trim().length < 1) {
            return allProducts;
        }

        const normalizedQuery = query.toLowerCase().trim();
        
        // Check cache first
        if (this.searchCache.has(normalizedQuery)) {
            return this.searchCache.get(normalizedQuery);
        }
        const results = [];

        allProducts.forEach(product => {
            const relevanceScore = this.calculateRelevanceScore(product, normalizedQuery);
            if (relevanceScore > 0) {
                results.push({
                    ...product,
                    relevanceScore,
                    matchedFields: this.getMatchedFields(product, normalizedQuery)
                });
            }
        });

        // Sort by relevance score (highest first)
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Cache results
        this.searchCache.set(normalizedQuery, results);
        
        // Update analytics
        this.updateSearchAnalytics(normalizedQuery, results.length);
        
        return results;
    }

    calculateRelevanceScore(product, query) {
        let score = 0;
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        
        // Exact matches get highest scores
        if (product.name.toLowerCase().includes(query)) score += 100;
        if (product.id.toLowerCase().includes(query)) score += 90;
        if (product.description.toLowerCase().includes(query)) score += 80;
        
        // Word-by-word matching
        queryWords.forEach(word => {
            // Name matches
            if (product.name.toLowerCase().includes(word)) score += 50;
            
            // Tag matches
            product.tags.forEach(tag => {
                if (tag.toLowerCase().includes(word)) score += 30;
                if (this.fuzzyMatch(tag.toLowerCase(), word)) score += 15;
            });
            
            // Category and domain matches
            if (product.category.toLowerCase().includes(word)) score += 40;
            if (product.domain.toLowerCase().includes(word)) score += 35;
            
            // Description matches
            if (product.description.toLowerCase().includes(word)) score += 25;
            
            // Specification matches
            if (product.specifications) {
                Object.entries(product.specifications).forEach(([key, value]) => {
                    if (key.toLowerCase().includes(word)) score += 20;
                    if (String(value).toLowerCase().includes(word)) score += 15;
                });
            }
            
            // Feature matches
            if (product.features) {
                product.features.forEach(feature => {
                    if (feature.toLowerCase().includes(word)) score += 20;
                });
            }
            
            // Fuzzy matching for typos
            if (this.fuzzyMatch(product.name.toLowerCase(), word)) score += 10;
            if (this.fuzzyMatch(product.description.toLowerCase(), word)) score += 5;
        });
        
        // Boost popular products
        if (product.rating >= 4.5) score += 10;
        if (product.availability === 'In Stock') score += 5;
        
        return score;
    }

    fuzzyMatch(text, pattern) {
        if (pattern.length < 3) return false;
        
        const maxDistance = Math.floor(pattern.length / 3);
        const words = text.split(/\s+/);
        
        return words.some(word => {
            return this.levenshteinDistance(word, pattern) <= maxDistance;
        });
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    getMatchedFields(product, query) {
        const matched = [];
        const queryWords = query.split(/\s+/);
        
        queryWords.forEach(word => {
            if (product.name.toLowerCase().includes(word)) matched.push('name');
            if (product.description.toLowerCase().includes(word)) matched.push('description');
            if (product.tags.some(tag => tag.toLowerCase().includes(word))) matched.push('tags');
            if (product.category.toLowerCase().includes(word)) matched.push('category');
        });
        
        return [...new Set(matched)];
    }

    getAllProducts() {
        // If we have page products and we're on the products page, use those
        if (this.isSearchResultsPage && this.searchableProducts) {
            return this.searchableProducts;
        }
        
        const allProducts = [];
        
        Object.keys(this.productDatabase).forEach(domainKey => {
            const domain = this.productDatabase[domainKey];
            Object.keys(domain.categories).forEach(categoryKey => {
                const category = domain.categories[categoryKey];
                category.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        domain: domain.name,
                        domainKey,
                        domainIcon: domain.icon,
                        category: category.name,
                        categoryKey,
                        categoryIcon: category.icon
                    });
                });
            });
        });
        
        return allProducts;
    }

    // Enhanced UI creation with modern design
    createSearchInterface() {
        // Remove existing search container if it exists
        const existingContainer = document.getElementById('universalSearchContainer');
        if (existingContainer) {
            existingContainer.remove();
        }

        const searchContainer = document.createElement('div');
        searchContainer.id = 'universalSearchContainer';
        searchContainer.className = 'hidden fixed inset-0 z-50 overflow-y-auto';
        
        searchContainer.innerHTML = `
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" id="searchBackdrop"></div>
            
            <!-- Search Modal -->
            <div class="flex min-h-full items-start justify-center p-4 text-center sm:p-0">
                <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                    <!-- Search Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-search text-white text-xl"></i>
                                <h3 class="text-lg font-semibold text-white">Universal Product Search</h3>
                            </div>
                            <button id="closeSearchBtn" class="text-white hover:text-gray-200 transition-colors">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <!-- Search Input -->
                        <div class="mt-4 relative">
                            <input type="text" id="universalSearchInput" 
                                   placeholder="Search products, categories, specifications..." 
                                   class="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                   autocomplete="off">
                            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <div id="searchLoader" class="hidden absolute right-4 top-1/2 transform -translate-y-1/2">
                                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                        </div>
                        
                        <!-- Quick Filters -->
                        <div class="mt-3 flex flex-wrap gap-2" id="quickFilters">
                            <button class="px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-400 transition-colors" data-filter="all">All Products</button>
                            <button class="px-3 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors" data-filter="it-infrastructure">IT Infrastructure</button>
                            <button class="px-3 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors" data-filter="telecommunications">Telecommunications</button>
                            <button class="px-3 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors" data-filter="infrastructure">Infrastructure</button>
                            <button class="px-3 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors" data-filter="laboratory">Laboratory</button>
                        </div>
                    </div>
                    
                    <!-- Search Results -->
                    <div class="bg-white px-6 py-4 max-h-96 overflow-y-auto" id="searchResultsContainer">
                        <div id="searchSuggestions">
                            <!-- Initial suggestions will be populated here -->
                        </div>
                        
                        <div id="searchResults" class="hidden">
                            <!-- Search results will be populated here -->
                        </div>
                        
                        <div id="noResults" class="hidden text-center py-8">
                            <i class="fas fa-search text-gray-300 text-4xl mb-4"></i>
                            <h4 class="text-lg font-medium text-gray-900 mb-2">No products found</h4>
                            <p class="text-gray-500">Try adjusting your search terms or browse our categories</p>
                        </div>
                    </div>
                    
                    <!-- Search Footer -->
                    <div class="bg-gray-50 px-6 py-3 border-t">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <div class="flex items-center space-x-4">
                                <span><kbd class="px-2 py-1 bg-gray-200 rounded text-xs">↑↓</kbd> Navigate</span>
                                <span><kbd class="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> Select</span>
                                <span><kbd class="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> Close</span>
                            </div>
                            <div id="searchStats" class="text-xs">
                                <!-- Search statistics -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(searchContainer);
        this.bindSearchEvents();
        this.showInitialSuggestions();
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('universalSearchInput');
        const searchContainer = document.getElementById('universalSearchContainer');
        const closeBtn = document.getElementById('closeSearchBtn');
        const backdrop = document.getElementById('searchBackdrop');
        const quickFilters = document.querySelectorAll('[data-filter]');
        
        // Search input events
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeSearch();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearchSubmit(e.target.value);
                }
            });
        }
        
        // Close events
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSearch());
        }
        
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeSearch());
        }
        
        // Quick filter events
        quickFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const filterValue = e.target.dataset.filter;
                this.applyQuickFilter(filterValue);
                this.updateQuickFilterUI(e.target);
            });
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
        
        // Search button events (for existing buttons in the page)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'search-button' || e.target.closest('#search-button') || 
                e.target.id === 'mobile-search-button' || e.target.closest('#mobile-search-button')) {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    handleSearchInput(query) {
        clearTimeout(this.debounceTimer);
        
        const loader = document.getElementById('searchLoader');
        if (loader) {
            loader.classList.remove('hidden');
        }
        
        this.debounceTimer = setTimeout(() => {
            if (query.trim().length === 0) {
                this.showInitialSuggestions();
            } else {
                this.performSearchAndDisplay(query);
            }
            
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 300);
    }

    performSearchAndDisplay(query) {
        const results = this.performAdvancedSearch(query);
        this.currentResults = results;
        this.displaySearchResults(results, query);
        this.updateSearchStats(query, results.length);
        
        // If on products page, filter the displayed products in real-time
        if (this.isSearchResultsPage) {
            if (query.trim() && window.filterProductsBySearch) {
                window.filterProductsBySearch(query, results);
            } else if (!query.trim() && window.clearSearchResults) {
                window.clearSearchResults();
            }
        }
    }

    displaySearchResults(results, query = '') {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const resultsContainer = document.getElementById('searchResults');
        const noResultsContainer = document.getElementById('noResults');
        
        if (!resultsContainer) return;
        
        // Hide suggestions, show results
        if (suggestionsContainer) suggestionsContainer.classList.add('hidden');
        if (noResultsContainer) noResultsContainer.classList.add('hidden');
        
        if (results.length === 0) {
            resultsContainer.classList.add('hidden');
            if (noResultsContainer) noResultsContainer.classList.remove('hidden');
            return;
        }
        
        resultsContainer.classList.remove('hidden');
        
        // Group results by domain for better organization
        const groupedResults = this.groupResultsByDomain(results);
        
        let html = '';
        
        if (query) {
            html += `
                <div class="mb-4 pb-3 border-b">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-search mr-2"></i>Search Results for "${query}" (${results.length} found)
                    </h4>
                </div>
            `;
        }
        
        Object.entries(groupedResults).forEach(([domain, products]) => {
            const domainInfo = this.getDomainInfo(domain);
            html += `
                <div class="mb-6">
                    <h5 class="text-sm font-semibold text-blue-600 mb-3 flex items-center">
                        <i class="${domainInfo.icon} mr-2"></i>${domain}
                        <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">${products.length}</span>
                    </h5>
                    <div class="space-y-3">
                        ${products.slice(0, 5).map(product => this.createSearchResultCard(product, query)).join('')}
                    </div>
                    ${products.length > 5 ? `
                        <button class="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center" 
                                onclick="window.location.href='products.html?domain=${product.domainKey}'">
                            <i class="fas fa-plus mr-1"></i>Show ${products.length - 5} more ${domain} products
                        </button>
                    ` : ''}
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    createSearchResultCard(product, query = '') {
        const matchedFields = product.matchedFields || [];
        const relevanceScore = product.relevanceScore || 0;
        
        return `
            <div class="search-result-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" 
                 onclick="window.location.href='${product.url}'" data-product-id="${product.id}">
                <div class="flex items-start space-x-4">
                    <img src="${product.image}" alt="${product.name}" 
                         class="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100">
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h6 class="text-sm font-semibold text-gray-900 mb-1">
                                    ${this.highlightMatches(product.name, query)}
                                    ${product.rating ? `<span class="ml-2 text-xs text-yellow-500">★ ${product.rating}</span>` : ''}
                                </h6>
                                <p class="text-xs text-gray-600 mb-2 line-clamp-2">
                                    ${this.highlightMatches(product.description, query)}
                                </p>
                            </div>
                            <div class="flex flex-col items-end ml-4">
                                <span class="text-xs text-gray-500 mb-1">${product.category}</span>
                                ${product.availability ? `
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        product.availability === 'In Stock' ? 'bg-green-100 text-green-600' :
                                        product.availability === 'Made to Order' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-gray-100 text-gray-600'
                                    }">${product.availability}</span>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Key specifications -->
                        ${product.specifications ? `
                            <div class="mt-2 flex flex-wrap gap-2">
                                ${Object.entries(product.specifications).slice(0, 3).map(([key, value]) => `
                                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        ${key}: ${value}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <!-- Tags -->
                        <div class="mt-2 flex flex-wrap gap-1">
                            ${product.tags.slice(0, 4).map(tag => `
                                <span class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                    ${this.highlightMatches(tag, query)}
                                </span>
                            `).join('')}
                        </div>
                        
                        <!-- Match indicators -->
                        ${matchedFields.length > 0 ? `
                            <div class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-bullseye mr-1"></i>Matches: ${matchedFields.join(', ')}
                                ${relevanceScore > 0 ? `<span class="ml-2">Score: ${Math.round(relevanceScore)}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    highlightMatches(text, query) {
        if (!query || !text) return text;
        
        const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        let highlightedText = text;
        
        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
        });
        
        return highlightedText;
    }

    groupResultsByDomain(results) {
        const grouped = {};
        
        results.forEach(product => {
            if (!grouped[product.domain]) {
                grouped[product.domain] = [];
            }
            grouped[product.domain].push(product);
        });
        
        return grouped;
    }

    getDomainInfo(domainName) {
        const domainKey = Object.keys(this.productDatabase).find(key => 
            this.productDatabase[key].name === domainName
        );
        
        return domainKey ? this.productDatabase[domainKey] : { icon: 'fas fa-cube' };
    }

    showInitialSuggestions() {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const resultsContainer = document.getElementById('searchResults');
        const noResultsContainer = document.getElementById('noResults');
        
        if (!suggestionsContainer) return;
        
        // Show suggestions, hide results
        suggestionsContainer.classList.remove('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
        if (noResultsContainer) noResultsContainer.classList.add('hidden');
        
        const allProducts = this.getAllProducts();
        const recentSearches = this.getRecentSearches();
        const popularProducts = this.getPopularProducts(allProducts);
        const domainOverview = this.getDomainOverview();
        
        let html = '';
        
        // Recent searches
        if (recentSearches.length > 0) {
            html += `
                <div class="mb-6">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i class="fas fa-history mr-2"></i>Recent Searches
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${recentSearches.map(search => `
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                                    onclick="document.getElementById('universalSearchInput').value='${search}'; document.getElementById('universalSearchInput').dispatchEvent(new Event('input'));">
                                <i class="fas fa-search mr-1"></i>${search}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Domain overview
        html += `
            <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-sitemap mr-2"></i>Browse by Category
                </h4>
                <div class="grid grid-cols-2 gap-3">
                    ${domainOverview.map(domain => `
                        <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                             onclick="window.location.href='products.html?domain=${domain.key}'">
                            <div class="flex items-center space-x-3">
                                <i class="${domain.icon} text-blue-600 text-lg"></i>
                                <div>
                                    <h5 class="text-sm font-medium text-gray-900">${domain.name}</h5>
                                    <p class="text-xs text-gray-500">${domain.productCount} products</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Popular products
        if (popularProducts.length > 0) {
            html += `
                <div class="mb-6">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i class="fas fa-star mr-2"></i>Popular Products
                    </h4>
                    <div class="space-y-2">
                        ${popularProducts.slice(0, 4).map(product => `
                            <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                 onclick="window.location.href='${product.url}'">
                                <img src="${product.image}" alt="${product.name}" class="w-10 h-10 object-cover rounded">
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">${product.name}</p>
                                    <p class="text-xs text-gray-500">${product.category} • ${product.domain}</p>
                                </div>
                                <div class="text-xs text-yellow-500">★ ${product.rating}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        suggestionsContainer.innerHTML = html;
    }

    getRecentSearches() {
        return this.searchHistory.slice(-5).reverse();
    }

    getPopularProducts(products) {
        return products
            .filter(product => product.rating >= 4.5)
            .sort((a, b) => b.rating - a.rating);
    }

    getDomainOverview() {
        return Object.entries(this.productDatabase).map(([key, domain]) => {
            const productCount = Object.values(domain.categories)
                .reduce((total, category) => total + category.products.length, 0);
            
            return {
                key,
                name: domain.name,
                icon: domain.icon,
                productCount
            };
        });
    }

    applyQuickFilter(filterValue) {
        const searchInput = document.getElementById('universalSearchInput');
        
        if (filterValue === 'all') {
            this.showInitialSuggestions();
        } else {
            const filteredProducts = this.getAllProducts().filter(product => 
                product.domainKey === filterValue
            );
            this.displaySearchResults(filteredProducts);
        }
        
        if (searchInput) {
            searchInput.value = '';
        }
    }

    updateQuickFilterUI(activeButton) {
        const allFilters = document.querySelectorAll('[data-filter]');
        
        allFilters.forEach(filter => {
            filter.className = 'px-3 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors';
        });
        
        activeButton.className = 'px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-400 transition-colors';
    }

    updateSearchStats(query, resultCount) {
        const statsContainer = document.getElementById('searchStats');
        if (statsContainer) {
            const searchTime = Date.now() - (this.searchStartTime || Date.now());
            statsContainer.textContent = `${resultCount} results in ${searchTime}ms`;
        }
    }

    updateSearchAnalytics(query, resultCount) {
        this.searchAnalytics.totalSearches++;
        
        if (this.searchAnalytics.popularQueries.has(query)) {
            this.searchAnalytics.popularQueries.set(query, 
                this.searchAnalytics.popularQueries.get(query) + 1
            );
        } else {
            this.searchAnalytics.popularQueries.set(query, 1);
        }
        
        // Save to localStorage
        this.saveSearchAnalytics();
    }

    openSearch() {
        const searchContainer = document.getElementById('universalSearchContainer');
        const searchInput = document.getElementById('universalSearchInput');
        
        if (searchContainer) {
            searchContainer.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            if (searchInput) {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }
            
            this.showInitialSuggestions();
        }
    }

    closeSearch() {
        const searchContainer = document.getElementById('universalSearchContainer');
        
        if (searchContainer) {
            searchContainer.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    handleSearchSubmit(query) {
        if (query.trim()) {
            this.addToSearchHistory(query.trim());
            
            // If already on products page, filter products directly
            if (this.isSearchResultsPage && window.filterProductsBySearch) {
                const results = this.performAdvancedSearch(query.trim());
                window.filterProductsBySearch(query.trim(), results);
                this.closeSearch();
            } else {
                // Navigate to products page with search query
                window.location.href = `products.html?search=${encodeURIComponent(query.trim())}`;
            }
        }
    }

    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.push(query);
            if (this.searchHistory.length > 10) {
                this.searchHistory.shift();
            }
            this.saveSearchHistory();
        }
    }

    loadSearchHistory() {
        try {
            const history = localStorage.getItem('phedel_search_history');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('phedel_search_history', JSON.stringify(this.searchHistory));
        } catch {
            // Handle localStorage errors silently
        }
    }

    saveSearchAnalytics() {
        try {
            const analytics = {
                totalSearches: this.searchAnalytics.totalSearches,
                popularQueries: Array.from(this.searchAnalytics.popularQueries.entries()),
                clickThroughRate: Array.from(this.searchAnalytics.clickThroughRate.entries())
            };
            localStorage.setItem('phedel_search_analytics', JSON.stringify(analytics));
        } catch {
            // Handle localStorage errors silently
        }
    }

    loadSearchAnalytics() {
        try {
            const analytics = localStorage.getItem('phedel_search_analytics');
            if (analytics) {
                const data = JSON.parse(analytics);
                this.searchAnalytics.totalSearches = data.totalSearches || 0;
                this.searchAnalytics.popularQueries = new Map(data.popularQueries || []);
                this.searchAnalytics.clickThroughRate = new Map(data.clickThroughRate || []);
            }
        } catch {
            // Handle localStorage errors silently
        }
    }

    initializeSearch() {
        this.loadSearchAnalytics();
        
        if (this.isSearchResultsPage) {
            this.initializeSearchResultsPage();
        } else {
            this.createSearchInterface();
        }
    }
    
    // Method to set products data from the products page
    setProductsData(productsArray) {
        this.pageProducts = productsArray || [];
        
        // Convert page products to search format and merge with existing database
        const convertedProducts = this.convertPageProductsToSearchFormat(productsArray);
        
        // Store reference to page products for filtering
        this.originalPageProducts = productsArray;
        
        // Update search results to use page products when on products page
        if (this.isSearchResultsPage) {
            this.searchableProducts = convertedProducts;
        }
    }
    
    // Convert products from page format to search system format
    convertPageProductsToSearchFormat(productsArray) {
        return productsArray.map((product, index) => {
            return {
                id: `page-product-${index}`,
                name: product.name,
                description: product.description,
                category: product.category,
                domain: this.mapCategoryToDomain(product.category),
                url: product.link,
                image: product.image,
                tags: this.generateTagsFromProduct(product),
                specifications: {
                    series: product.series,
                    category: product.category
                },
                features: [product.series],
                price: 'Contact for pricing',
                availability: 'Available',
                rating: 4.5,
                pageProduct: true // Flag to identify page products
            };
        });
    }
    
    // Map category to domain for consistency
    mapCategoryToDomain(category) {
        const categoryMap = {
            'data-centre': 'it-infrastructure',
            'telecom': 'telecommunications',
            'power-it': 'infrastructure',
            'industrial-rack': 'it-infrastructure',
            'civil-work': 'infrastructure',
            'laboratory': 'laboratory',
            'accessories': 'telecommunications'
        };
        return categoryMap[category] || 'infrastructure';
    }
    
    // Generate search tags from product data
    generateTagsFromProduct(product) {
        const tags = [];
        
        // Add category-based tags
        tags.push(product.category);
        
        // Add series-based tags
        if (product.series) {
            tags.push(...product.series.toLowerCase().split(' '));
        }
        
        // Add name-based tags
        tags.push(...product.name.toLowerCase().split(' '));
        
        // Add description-based tags
        const descWords = product.description.toLowerCase().match(/\b\w{4,}\b/g) || [];
        tags.push(...descWords.slice(0, 5)); // Limit to 5 description words
        
        return [...new Set(tags)]; // Remove duplicates
    }

    initializeSearchResultsPage() {
        // Initialize search results page functionality
        // This would be implemented for the dedicated search results page
        console.log('Search results page initialized');
    }
}

// Initialize the search system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchSystem = new UniversalSearchSystem();
    window.universalSearch = window.searchSystem; // Keep backward compatibility
    window.searchSystem.initializeSearch(); // Initialize the search interface
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSearchSystem;
}