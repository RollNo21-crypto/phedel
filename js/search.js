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

    // Modern glassmorphism search interface
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
            <!-- Modern Backdrop with Blur -->
            <div class="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-slate-900/20 backdrop-blur-sm transition-all duration-300" id="searchBackdrop"></div>
            
            <!-- Search Modal -->
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <div class="relative transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl text-left shadow-2xl transition-all duration-300 sm:w-full sm:max-w-5xl border border-white/20">
                    <!-- Modern Search Header -->
                    <div class="bg-gradient-to-r from-[#3A46A5] via-blue-600 to-indigo-700 px-8 py-6 relative overflow-hidden" style="background: linear-gradient(to right, #3A46A5, #4c5db8, #5a6bc7);">
                        <!-- Animated Background Pattern -->
                        <div class="absolute inset-0 opacity-10">
                            <div class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
                            <div class="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
                        </div>
                        
                        <div class="flex items-center justify-between relative z-10">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <i class="fas fa-search text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white tracking-tight">Smart Product Search</h3>
                                    <p class="text-white/80 text-sm font-medium">Find exactly what you need</p>
                                </div>
                            </div>
                            <button id="closeSearchBtn" class="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <!-- Modern Search Input -->
                        <div class="mt-6 relative">
                            <div class="relative group">
                                <input type="text" id="universalSearchInput" 
                                       placeholder="Search products, categories, specifications..." 
                                       class="w-full px-6 py-4 pl-14 pr-14 text-gray-800 bg-white/90 backdrop-blur-sm border-0 rounded-2xl focus:ring-4 focus:ring-white/30 focus:bg-white transition-all duration-300 text-lg placeholder-gray-500 shadow-lg"
                                       autocomplete="off">
                                <div class="absolute left-5 top-1/2 transform -translate-y-1/2">
                                    <i class="fas fa-search text-gray-400 text-lg group-focus-within:text-[#3A46A5] transition-colors duration-200"></i>
                                </div>
                                <div id="searchLoader" class="hidden absolute right-5 top-1/2 transform -translate-y-1/2">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-[#3A46A5]"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Modern Quick Filters -->
                        <div class="mt-4 flex flex-wrap gap-3" id="quickFilters">
                            <button class="px-4 py-2 bg-white text-[#3A46A5] text-sm font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5" data-filter="all">All Products</button>
                            <button class="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm" data-filter="it-infrastructure">IT Infrastructure</button>
                            <button class="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm" data-filter="telecommunications">Telecommunications</button>
                            <button class="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm" data-filter="infrastructure">Infrastructure</button>
                        </div>
                    </div>
                    
                    <!-- Modern Search Results -->
                    <div class="bg-gradient-to-b from-gray-50/50 to-white px-8 py-6 max-h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" id="searchResultsContainer">
                        <div id="searchSuggestions">
                            <!-- Initial suggestions will be populated here -->
                        </div>
                        
                        <div id="searchResults" class="hidden">
                            <!-- Search results will be populated here -->
                        </div>
                        
                        <div id="noResults" class="hidden text-center py-12">
                            <div class="mb-6">
                                <div class="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                    <i class="fas fa-search text-gray-400 text-2xl"></i>
                                </div>
                            </div>
                            <h4 class="text-xl font-bold text-gray-800 mb-3">No products found</h4>
                            <p class="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">Try adjusting your search terms or explore our product categories</p>
                        </div>
                    </div>
                    
                    <!-- Modern Search Footer -->
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-t border-gray-200/50">
                        <div class="flex items-center justify-between text-sm">
                            <div class="flex items-center space-x-6">
                                <span class="flex items-center space-x-2 text-gray-600">
                                    <kbd class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">↑↓</kbd>
                                    <span class="font-medium">Navigate</span>
                                </span>
                                <span class="flex items-center space-x-2 text-gray-600">
                                    <kbd class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">Enter</kbd>
                                    <span class="font-medium">Select</span>
                                </span>
                                <span class="flex items-center space-x-2 text-gray-600">
                                    <kbd class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">Esc</kbd>
                                    <span class="font-medium">Close</span>
                                </span>
                            </div>
                            <div id="searchStats" class="text-xs font-medium text-gray-500">
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
            <div class="search-result-card group bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:shadow-xl hover:shadow-[#3A46A5]/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:bg-gradient-to-r hover:from-white/90 hover:to-white/70" 
                 onclick="window.location.href='${product.url}'" data-product-id="${product.id}">
                <div class="flex items-start space-x-5">
                    <div class="relative">
                        <img src="${product.image}" alt="${product.name}" 
                             class="w-20 h-20 object-cover rounded-2xl flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h6 class="text-base font-bold text-gray-900 mb-2 group-hover:text-[#3A46A5] transition-colors duration-200">
                                    ${this.highlightMatches(product.name, query)}
                                    ${product.rating ? `<span class="ml-3 inline-flex items-center px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-sm">★ ${product.rating}</span>` : ''}
                                </h6>
                                <p class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                    ${this.highlightMatches(product.description, query)}
                                </p>
                            </div>
                            <div class="flex flex-col items-end ml-6">
                                <span class="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-[#3A46A5] rounded-full mb-2 shadow-sm">${product.category}</span>
                                ${product.availability ? `
                                    <span class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                                        product.availability === 'In Stock' ? 'bg-gradient-to-r from-green-100 to-lime-100 text-[#4EAE01]' :
                                        product.availability === 'Made to Order' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700' :
                                        'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700'
                                    }">
                                        <div class="w-2 h-2 rounded-full mr-2 ${
                                            product.availability === 'In Stock' ? 'bg-[#4EAE01]' :
                                            product.availability === 'Made to Order' ? 'bg-yellow-500' :
                                            'bg-gray-500'
                                        }"></div>
                                        ${product.availability}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Modern Key specifications -->
                        ${product.specifications ? `
                            <div class="mt-4 flex flex-wrap gap-2">
                                ${Object.entries(product.specifications).slice(0, 3).map(([key, value]) => `
                                    <span class="inline-flex items-center text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200/50 font-medium shadow-sm">
                                        <span class="text-gray-500 mr-1">${key}:</span> ${value}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <!-- Modern Tags -->
                        <div class="mt-3 flex flex-wrap gap-2">
                            ${product.tags.slice(0, 4).map(tag => `
                                <span class="inline-flex items-center text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-[#3A46A5] px-3 py-1 rounded-full border border-blue-100 font-medium shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <i class="fas fa-tag text-blue-400 mr-1.5 text-xs"></i>
                                    ${this.highlightMatches(tag, query)}
                                </span>
                            `).join('')}
                        </div>
                        
                        <!-- Modern Match indicators -->
                        ${matchedFields.length > 0 ? `
                            <div class="mt-4 p-3 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border border-green-100">
                                <div class="flex items-center text-sm text-[#4EAE01]">
                                    <div class="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full mr-3">
                                        <i class="fas fa-bullseye text-[#4EAE01] text-xs"></i>
                                    </div>
                                    <span class="font-semibold">Matches:</span>
                                    <span class="ml-2 font-medium">${matchedFields.join(', ')}</span>
                                    ${relevanceScore > 0 ? `
                                        <div class="ml-auto flex items-center">
                                            <span class="text-xs text-[#4EAE01] font-medium mr-2">Relevance:</span>
                                            <div class="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-[#4EAE01] to-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                                                ${Math.round(relevanceScore)}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
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
        
        // Always create the search interface for all pages
        this.createSearchInterface();
        
        if (this.isSearchResultsPage) {
            this.initializeSearchResultsPage();
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