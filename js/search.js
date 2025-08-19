// PHEDEL Unified Search System
// Hierarchical categorization: Domain > Category > Product
// Combines inline search and search results page functionality

class ProductSearchSystem {
    constructor() {
        // Determine if we're on the search results page or another page
        this.isSearchResultsPage = window.location.pathname.includes('search-results.html');
        
        // Store search state
        this.currentQuery = '';
        this.currentResults = [];
        this.filteredResults = [];
        
        this.productDatabase = {
            // IT Infrastructure Domain
            'it-infrastructure': {
                name: 'IT Infrastructure',
                categories: {
                    'server-racks': {
                        name: 'Server Racks',
                        products: [
                            {
                                id: 'sr-42u-smart',
                                name: 'SR-42U Smart Rack',
                                description: 'Intelligent 42U server rack with monitoring capabilities',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'smart-rack.html',
                                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['smart', '42u', 'monitoring', 'intelligent'],
                                specifications: {
                                    height: '42U',
                                    depth: '800mm',
                                    loadCapacity: '1000kg'
                                }
                             },
                            {
                                id: 'sv-42u-server',
                                name: 'SV-42U Server Rack',
                                description: 'Standard 42U server rack for data center applications',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'server-rack.html',
                                image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['server', '42u', 'standard', 'datacenter'],
                                specifications: {
                                    height: '42U',
                                    depth: '1000mm',
                                    loadCapacity: '1200kg'
                                }
                            },
                            {
                                id: 'dcr-42u-datacentre',
                                name: 'DCR-42U Data Centre Rack',
                                description: 'High-density data centre rack with thermal management',
                                category: 'server-racks',
                                domain: 'it-infrastructure',
                                url: 'data-centre-rack.html',
                                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['datacenter', '42u', 'thermal', 'high-density'],
                                specifications: {
                                    height: '42U',
                                    depth: '1200mm',
                                    loadCapacity: '1500kg'
                                }
                            }
                        ]
                    }
                }
            },
            // Telecommunications Domain
            'telecommunications': {
                name: 'Telecommunications',
                categories: {
                    'security-systems': {
                        name: 'Security Systems',
                        products: [
                            {
                                id: 'cc-12u-cctv',
                                name: 'CC-12U CCTV Rack',
                                description: 'Compact 12U rack for CCTV surveillance equipment',
                                category: 'security-systems',
                                domain: 'telecommunications',
                                url: 'cctv-racks.html',
                                image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['cctv', '12u', 'surveillance', 'security'],
                                specifications: {
                                    height: '12U',
                                    mounting: 'Wall/Floor',
                                    protection: 'IP54'
                                }
                            }
                        ]
                    },
                    'outdoor-equipment': {
                        name: 'Outdoor Equipment',
                        products: [
                            {
                                id: 'ot-600-outdoor',
                                name: 'OT-600 Outdoor Cabinet',
                                description: 'Weatherproof outdoor telecommunications cabinet',
                                category: 'outdoor-equipment',
                                domain: 'telecommunications',
                                url: 'outdoor-telecom-products.html',
                                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['outdoor', 'weatherproof', 'telecom', 'cabinet'],
                                specifications: {
                                    protection: 'IP65',
                                    material: 'Galvanized Steel',
                                    ventilation: 'Natural'
                                }
                            }
                        ]
                    },
                    'fiber-optics': {
                        name: 'Fiber Optics',
                        products: [
                            {
                                id: 'of-sc-connectors',
                                name: 'OF-SC Fiber Connectors',
                                description: 'High-quality SC type fiber optic connectors',
                                category: 'fiber-optics',
                                domain: 'telecommunications',
                                url: 'optical-fibre-accessories.html',
                                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['fiber', 'connectors', 'sc', 'optical'],
                                specifications: {
                                    type: 'SC/UPC',
                                    insertionLoss: '<0.2dB',
                                    returnLoss: '>50dB'
                                }
                            }
                        ]
                    }
                }
            },
            // Infrastructure Domain
            'infrastructure': {
                name: 'Infrastructure',
                categories: {
                    'cable-management': {
                        name: 'Cable Management',
                        products: [
                            {
                                id: 'hd-32-hdpe',
                                name: 'HD-32 HDPE Duct',
                                description: 'High-density polyethylene duct for cable protection',
                                category: 'cable-management',
                                domain: 'infrastructure',
                                url: 'hdpe-plb-duct-pipes.html',
                                image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                tags: ['hdpe', 'duct', 'cable', 'protection'],
                                specifications: {
                                    diameter: '32mm',
                                    material: 'HDPE',
                                    length: '6m'
                                }
                            }
                        ]
                    }
                }
            }
        };
        
        this.initializeSearch();
    }

    getAllProducts() {
        const allProducts = [];
        
        Object.keys(this.productDatabase).forEach(domainKey => {
            const domain = this.productDatabase[domainKey];
            Object.keys(domain.categories).forEach(categoryKey => {
                const category = domain.categories[categoryKey];
                category.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        domain: domain.name,
                        category: category.name,
                        domainKey,
                        categoryKey
                    });
                });
            });
        });
        
        return allProducts;
    }
    
    displaySearchResults(results) {
        if (!this.isSearchResultsPage || !this.resultsContainer) return;
        
        // Show results grid and hide loading
        this.resultsContainer.classList.remove('hidden');
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        
        // Clear previous results
        this.resultsContainer.innerHTML = '';
        
        // Display results directly in grid
        results.forEach(product => {
            const productCard = this.createProductCard(product);
            this.resultsContainer.appendChild(productCard);
        });
        
        // Update results count
        const resultsCount = document.querySelector('#results-count');
        if (resultsCount) {
            resultsCount.textContent = `${results.length} product${results.length !== 1 ? 's' : ''} found`;
        }
    }
    
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer';
        card.dataset.productId = product.id;
        
        // Product image
        const imageContainer = document.createElement('div');
        imageContainer.className = 'h-48 bg-gray-200 overflow-hidden';
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.className = 'w-full h-full object-cover';
        imageContainer.appendChild(image);
        card.appendChild(imageContainer);
        
        // Product content
        const content = document.createElement('div');
        content.className = 'p-4';
        
        // Product name
        const name = document.createElement('h3');
        name.className = 'text-lg font-semibold text-gray-900 mb-2';
        name.textContent = product.name;
        content.appendChild(name);
        
        // Product description
        const description = document.createElement('p');
        description.className = 'text-gray-600 text-sm mb-3 line-clamp-2';
        description.textContent = product.description;
        content.appendChild(description);
        
        // Product domain and category
        const meta = document.createElement('div');
        meta.className = 'flex items-center justify-between mb-3';
        
        const domain = document.createElement('span');
        domain.className = 'text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded';
        domain.textContent = product.domain;
        meta.appendChild(domain);
        
        const category = document.createElement('span');
        category.className = 'text-xs text-gray-500';
        category.textContent = product.category;
        meta.appendChild(category);
        
        content.appendChild(meta);
        
        // Product tags (first 3 only)
        if (product.tags && product.tags.length > 0) {
            const tags = document.createElement('div');
            tags.className = 'flex flex-wrap gap-1 mb-3';
            
            product.tags.slice(0, 3).forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded';
                tagSpan.textContent = tag;
                tags.appendChild(tagSpan);
            });
            
            content.appendChild(tags);
        }
        
        // View details button
        const viewButton = document.createElement('a');
        viewButton.className = 'inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors';
        viewButton.textContent = 'View Details';
        viewButton.href = product.url;
        content.appendChild(viewButton);
        
        card.appendChild(content);
        
        // Add click event to navigate to product page
        card.addEventListener('click', (e) => {
            if (e.target !== viewButton) {
                // Save search context to session storage
                sessionStorage.setItem('searchQuery', this.currentQuery);
                window.location.href = product.url;
            }
        });
        
        return card;
    }
    
    updateDomainOverview(results) {
        if (!this.isSearchResultsPage || !this.domainOverview) return;
        
        // Show domain overview section
        const domainOverviewSection = document.querySelector('#domain-overview');
        if (domainOverviewSection && results.length > 0) {
            domainOverviewSection.classList.remove('hidden');
        }
        
        // Clear previous overview
        this.domainOverview.innerHTML = '';
        
        // Count results by domain
        const countByDomain = {};
        let totalCount = 0;
        
        results.forEach(product => {
            if (!countByDomain[product.domain]) {
                countByDomain[product.domain] = 0;
            }
            countByDomain[product.domain]++;
            totalCount++;
        });
        
        // Create overview items for domains that have results
        Object.keys(countByDomain).forEach(domainName => {
            const count = countByDomain[domainName];
            
            const overviewItem = document.createElement('div');
            overviewItem.className = 'bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer';
            
            const domainNameEl = document.createElement('h3');
            domainNameEl.className = 'text-lg font-semibold text-gray-900 mb-1';
            domainNameEl.textContent = domainName;
            overviewItem.appendChild(domainNameEl);
            
            const countEl = document.createElement('p');
            countEl.className = 'text-2xl font-bold text-blue-600';
            countEl.textContent = `${count} product${count !== 1 ? 's' : ''}`;
            overviewItem.appendChild(countEl);
            
            // Add click event to filter by domain
            overviewItem.addEventListener('click', () => {
                const domainFilter = document.querySelector('#domain-filter');
                if (domainFilter) {
                    domainFilter.value = domainName;
                    this.applyFilters();
                }
            });
            
            this.domainOverview.appendChild(overviewItem);
        });
    }

    initializeSearch() {
        // Initialize different elements based on whether we're on the search results page or not
        if (this.isSearchResultsPage) {
            // Elements specific to search results page
            this.searchInput = document.querySelector('#search-results-input');
            this.searchButton = document.querySelector('#search-results-button');
            this.searchForm = document.querySelector('#search-results-form');
            this.resultsContainer = document.querySelector('#results-grid');
            this.domainFilters = document.querySelector('#domain-filters');
            this.categoryFilters = document.querySelector('#category-filters');
            this.sortOptions = document.querySelector('#sort-options');
            this.domainOverview = document.querySelector('#domain-stats');
            this.loadingIndicator = document.querySelector('#loading');
            this.noResultsMessage = document.querySelector('#no-results');
            
            // Initialize search results page
            this.initializeSearchResultsPage();
        } else {
            // Elements for inline search on regular pages
            this.createSearchInterface();
            this.bindInlineSearchEvents();
        }
    }

    createSearchInterface() {
        // Create inline search container that will be inserted after search button
        const searchContainer = document.createElement('div');
        searchContainer.id = 'searchContainer';
        searchContainer.className = 'hidden absolute top-full left-0 right-0 bg-white shadow-lg border border-gray-200 rounded-lg mt-2 z-50';
        
        searchContainer.innerHTML = `
            <div class="p-4">
                <div class="relative mb-3">
                    <input type="text" id="searchInput" placeholder="Search products..." 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                
                <div id="searchSuggestions" class="max-h-64 overflow-y-auto">
                    <!-- Suggestions will be populated here -->
                </div>
            </div>
        `;
        
        // Insert search container after the navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.position = 'relative';
            nav.appendChild(searchContainer);
        }
    }

    bindInlineSearchEvents() {
        // Search button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'search-button' || e.target.closest('#search-button') || 
                e.target.id === 'mobile-search-button' || e.target.closest('#mobile-search-button')) {
                e.preventDefault();
                this.openSearch();
            }
            
            // Click outside to close search
            if (!e.target.closest('#searchContainer') && 
                !e.target.closest('#search-button') && 
                !e.target.closest('#mobile-search-button')) {
                this.closeSearch();
            }
            
            // Handle suggestion clicks
            if (e.target.closest('.search-suggestion')) {
                const suggestion = e.target.closest('.search-suggestion');
                const productUrl = suggestion.dataset.url;
                if (productUrl) {
                    window.location.href = productUrl;
                }
            }
        });

        // Search input
        document.addEventListener('input', (e) => {
            if (e.target.id === 'searchInput') {
                this.handleSearchInput(e.target.value);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
            if (e.key === 'Escape') {
                this.closeSearch();
            }
            
            // Handle Enter key in search input
            if (e.target.id === 'searchInput' && e.key === 'Enter') {
                e.preventDefault();
                this.handleSearchSubmit(e.target.value);
            }
        });
    }
    
    initializeSearchResultsPage() {
        // Get query from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        
        // Set the search input value
        if (this.searchInput) {
            this.searchInput.value = query;
        }
        
        // Bind search results page events
        this.bindSearchResultsEvents();
        
        // Populate filter options
        this.populateFilterOptions();
        
        // Perform search if query exists
        if (query) {
            this.currentQuery = query;
            this.performSearch(query);
        } else {
            // Show all products if no query
            this.showAllProducts();
        }
        
        // Restore any saved filters from session storage
        this.restoreFiltersFromSession();
    }
    
    bindSearchResultsEvents() {
        // Search form submission
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = this.searchInput.value.trim();
                if (query) {
                    this.currentQuery = query;
                    this.performSearch(query);
                    
                    // Update URL without reloading page
                    const url = new URL(window.location);
                    url.searchParams.set('q', query);
                    window.history.pushState({}, '', url);
                }
            });
        }
        
        // Domain filter changes
        if (this.domainFilters) {
            this.domainFilters.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // Category filter changes
        if (this.categoryFilters) {
            this.categoryFilters.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // Sort option changes
        if (this.sortOptions) {
            this.sortOptions.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // Clear filters button
        const clearFiltersBtn = document.querySelector('#clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    openSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        
        if (searchContainer.classList.contains('hidden')) {
            searchContainer.classList.remove('hidden');
            searchInput.focus();
            this.showSuggestions();
        } else {
            this.closeSearch();
        }
    }

    closeSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        
        searchContainer.classList.add('hidden');
        searchInput.value = '';
        document.getElementById('searchSuggestions').innerHTML = '';
    }

    handleSearchInput(query) {
        if (query.length === 0) {
            this.showSuggestions();
        } else {
            this.showSearchSuggestions(query);
        }
    }
    
    handleSearchSubmit(query) {
        if (query.trim()) {
            // Save search to session storage
            sessionStorage.setItem('lastSearch', query.trim());
            
            // Create a search results page URL with query parameter
            window.location.href = `search-results.html?q=${encodeURIComponent(query.trim())}`;
        }
    }
    
    // Methods for search results page
    performSearch(query) {
        if (!this.isSearchResultsPage) return;
        
        // Show loading indicator
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
        
        // Hide no results message
        if (this.noResultsMessage) {
            this.noResultsMessage.style.display = 'none';
        }
        
        // Get all products
        const allProducts = this.getAllProducts();
        
        // Filter products based on query
        const results = allProducts.filter(product => {
            const searchableText = [
                product.name,
                product.description,
                ...product.tags
            ].join(' ').toLowerCase();
            
            return searchableText.includes(query.toLowerCase());
        });
        
        // Store results
        this.currentResults = results;
        this.filteredResults = [...results];
        
        // Display results
        setTimeout(() => {
            this.displaySearchResults(results);
            
            // Hide loading indicator
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
            
            // Show no results message if needed
            if (results.length === 0 && this.noResultsMessage) {
                this.noResultsMessage.style.display = 'block';
            }
            
            // Update domain overview
            this.updateDomainOverview(results);
        }, 500); // Simulate loading for better UX
    }
    
    showAllProducts() {
        if (!this.isSearchResultsPage) return;
        
        const allProducts = this.getAllProducts();
        this.currentResults = allProducts;
        this.filteredResults = [...allProducts];
        
        this.displaySearchResults(allProducts);
        this.updateDomainOverview(allProducts);
    }
    
    populateFilterOptions() {
        if (!this.isSearchResultsPage) return;
        
        // Populate domain filters
        if (this.domainFilters) {
            this.domainFilters.innerHTML = '<option value="">All Domains</option>';
            
            for (const domainKey in this.productDatabase) {
                const domain = this.productDatabase[domainKey];
                const option = document.createElement('option');
                option.value = domainKey;
                option.textContent = domain.name;
                this.domainFilters.appendChild(option);
            }
        }
        
        // Populate category filters (all categories across all domains)
        if (this.categoryFilters) {
            this.categoryFilters.innerHTML = '<option value="">All Categories</option>';
            
            const categories = new Set();
            
            for (const domainKey in this.productDatabase) {
                const domain = this.productDatabase[domainKey];
                
                for (const categoryKey in domain.categories) {
                    const category = domain.categories[categoryKey];
                    
                    const option = document.createElement('option');
                    option.value = categoryKey;
                    option.textContent = category.name;
                    this.categoryFilters.appendChild(option);
                }
            }
        }
    }
    
    applyFilters() {
        if (!this.isSearchResultsPage || !this.currentResults) return;
        
        // Get filter values
        const domainFilter = this.domainFilters ? this.domainFilters.value : '';
        const categoryFilter = this.categoryFilters ? this.categoryFilters.value : '';
        const sortOption = this.sortOptions ? this.sortOptions.value : '';
        
        // Apply domain and category filters
        let filtered = [...this.currentResults];
        
        if (domainFilter) {
            filtered = filtered.filter(product => product.domain === domainFilter);
        }
        
        if (categoryFilter) {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }
        
        // Apply sorting
        if (sortOption) {
            switch (sortOption) {
                case 'name-asc':
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    filtered.sort((a, b) => b.name.localeCompare(a.name));
                    break;
            }
        }
        
        // Store filtered results
        this.filteredResults = filtered;
        
        // Display filtered results
        this.displaySearchResults(filtered);
        
        // Save filters to session storage
        this.saveFiltersToSession(domainFilter, categoryFilter, sortOption);
    }
    
    clearFilters() {
        if (!this.isSearchResultsPage) return;
        
        // Reset filter dropdowns
        if (this.domainFilters) this.domainFilters.value = '';
        if (this.categoryFilters) this.categoryFilters.value = '';
        if (this.sortOptions) this.sortOptions.value = '';
        
        // Clear session storage filters
        sessionStorage.removeItem('domainFilter');
        sessionStorage.removeItem('categoryFilter');
        sessionStorage.removeItem('sortOption');
        
        // Reset to current results
        this.filteredResults = [...this.currentResults];
        this.displaySearchResults(this.currentResults);
    }
    
    saveFiltersToSession(domain, category, sort) {
        if (domain) sessionStorage.setItem('domainFilter', domain);
        if (category) sessionStorage.setItem('categoryFilter', category);
        if (sort) sessionStorage.setItem('sortOption', sort);
    }
    
    restoreFiltersFromSession() {
        if (!this.isSearchResultsPage) return;
        
        const domainFilter = sessionStorage.getItem('domainFilter');
        const categoryFilter = sessionStorage.getItem('categoryFilter');
        const sortOption = sessionStorage.getItem('sortOption');
        
        // Set filter values if they exist
        if (domainFilter && this.domainFilters) this.domainFilters.value = domainFilter;
        if (categoryFilter && this.categoryFilters) this.categoryFilters.value = categoryFilter;
        if (sortOption && this.sortOptions) this.sortOptions.value = sortOption;
        
        // Apply filters if any exist
        if (domainFilter || categoryFilter || sortOption) {
            this.applyFilters();
        }
    }
    
    showSuggestions() {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const allProducts = this.getAllProducts();
        
        // Group products by domain
        const productsByDomain = {};
        allProducts.forEach(product => {
            if (!productsByDomain[product.domain]) {
                productsByDomain[product.domain] = [];
            }
            productsByDomain[product.domain].push(product);
        });
        
        // Show domain-wise categorization
        const domainSections = Object.keys(productsByDomain).map(domainName => {
            const domainProducts = productsByDomain[domainName].slice(0, 3); // Show 3 products per domain
            return `
                <div class="mb-4">
                    <h4 class="text-sm font-semibold text-blue-600 mb-2 flex items-center">
                        <i class="fas fa-layer-group mr-2"></i>${domainName}
                    </h4>
                    <div class="space-y-2 ml-4">
                        ${domainProducts.map(product => `
                            <div class="search-suggestion flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-100 mb-2" data-url="${product.url}">
                                <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded mr-3 flex-shrink-0">
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-medium text-gray-900 truncate">${product.name}</div>
                                    <div class="text-xs text-gray-500 mb-1">${product.category} • ID: ${product.id}</div>
                                    <div class="text-xs text-gray-600 line-clamp-2 mb-1">${product.description}</div>
                                    ${product.specifications ? `
                                        <div class="text-xs text-gray-500">
                                            <span class="font-medium">Specs:</span> ${Object.entries(product.specifications).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                        </div>
                                    ` : ''}
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${product.tags.slice(0, 2).map(tag => `
                                            <span class="px-1 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">${tag}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="text-xs text-blue-500 font-medium ml-2">${domainName}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        suggestionsContainer.innerHTML = `
            <div class="mb-3">
                <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-sitemap mr-2"></i>Browse by Domain
                </h3>
                ${domainSections}
                <div class="mt-3 pt-3 border-t">
                    <button class="text-sm text-blue-600 hover:text-blue-800 flex items-center" onclick="window.location.href='products.html'">
                        <i class="fas fa-th-large mr-2"></i>View All Products →
                    </button>
                </div>
            </div>
        `;
    }
    
    showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const allProducts = this.getAllProducts();
        
        // Filter products based on query
        const filteredProducts = allProducts.filter(product => {
            const searchQuery = query.toLowerCase();
            const searchableText = [
                product.name,
                product.description,
                product.category,
                product.domain,
                product.id,
                ...product.tags,
                ...(product.specifications ? Object.values(product.specifications) : []),
                ...(product.specifications ? Object.keys(product.specifications) : [])
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchQuery);
        });
        
        if (filteredProducts.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>No products found for "${query}"</p>
                    <p class="text-sm">Press Enter to search all products</p>
                </div>
            `;
        } else {
            // Group filtered results by domain
            const resultsByDomain = {};
            filteredProducts.forEach(product => {
                if (!resultsByDomain[product.domain]) {
                    resultsByDomain[product.domain] = [];
                }
                resultsByDomain[product.domain].push(product);
            });
            
            // Create domain-wise sections for search results
            const domainResultSections = Object.keys(resultsByDomain).map(domainName => {
                const domainProducts = resultsByDomain[domainName].slice(0, 4); // Show up to 4 products per domain
                return `
                    <div class="mb-3">
                        <h5 class="text-xs font-semibold text-blue-600 mb-2 flex items-center">
                            <i class="fas fa-layer-group mr-1"></i>${domainName} (${resultsByDomain[domainName].length})
                        </h5>
                        <div class="space-y-1 ml-3">
                            ${domainProducts.map(product => `
                                <div class="search-suggestion flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100 mb-1" data-url="${product.url}">
                                    <img src="${product.image}" alt="${product.name}" class="w-10 h-10 object-cover rounded mr-2 flex-shrink-0">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-medium text-gray-900 truncate">${product.name}</div>
                                        <div class="text-xs text-gray-500">${product.category} • ID: ${product.id}</div>
                                        ${product.specifications ? `
                                            <div class="text-xs text-gray-500 mt-1">
                                                ${Object.entries(product.specifications).slice(0, 1).map(([key, value]) => `${key}: ${value}`).join('')}
                                            </div>
                                        ` : ''}
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${product.tags.slice(0, 2).map(tag => `
                                                <span class="px-1 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">${tag}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="text-xs text-blue-500 ml-1">${domainName}</div>
                                </div>
                            `).join('')}
                            ${resultsByDomain[domainName].length > 4 ? `
                                <div class="text-xs text-gray-500 ml-2 mt-1">
                                    +${resultsByDomain[domainName].length - 4} more in ${domainName}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            suggestionsContainer.innerHTML = `
                <div class="mb-3">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i class="fas fa-search mr-2"></i>Search Results for "${query}" (${filteredProducts.length})
                    </h4>
                    ${domainResultSections}
                    ${filteredProducts.length > 8 ? `
                        <div class="mt-3 pt-2 border-t">
                            <button class="text-sm text-blue-600 hover:text-blue-800 flex items-center" onclick="window.location.href='search-results.html?q=${encodeURIComponent(query)}'">
                                <i class="fas fa-external-link-alt mr-2"></i>View all ${filteredProducts.length} results →
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }

    getAllProducts() {
        const allProducts = [];
        Object.keys(this.productDatabase).forEach(domainKey => {
            const domain = this.productDatabase[domainKey];
            Object.keys(domain.categories).forEach(categoryKey => {
                const category = domain.categories[categoryKey];
                category.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        domainName: domain.name,
                        categoryName: category.name
                    });
                });
            });
        });
        return allProducts;
    }

    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const domainFilter = document.getElementById('domainFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        let results = this.getAllProducts();

        // Apply filters
        if (domainFilter) {
            results = results.filter(product => product.domain === domainFilter);
        }
        if (categoryFilter) {
            results = results.filter(product => product.category === categoryFilter);
        }

        // Apply search term
        if (searchTerm) {
            results = results.filter(product => {
                const searchableText = [
                    product.name,
                    product.description,
                    product.domainName,
                    product.categoryName,
                    ...product.tags,
                    ...Object.values(product.specifications || {})
                ].join(' ').toLowerCase();
                return searchableText.includes(searchTerm);
            });
        }

        // Apply sorting
        results.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'category':
                    return a.categoryName.localeCompare(b.categoryName);
                default:
                    return 0; // relevance - keep original order
            }
        });

        this.displayResults(results);
    }

    showAllProducts() {
        const allProducts = this.getAllProducts();
        this.displayResults(allProducts);
    }

    displayResults(results) {
        const resultsContainer = document.getElementById('results-grid');
        const loadingIndicator = document.getElementById('loading');
        const noResultsElement = document.getElementById('no-results');
        const resultsCountElement = document.getElementById('results-count');
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        if (results.length === 0) {
            if (resultsContainer) {
                resultsContainer.classList.add('hidden');
            }
            if (noResultsElement) {
                noResultsElement.classList.remove('hidden');
            }
            return;
        }
        
        // Show results container and hide no results
        if (resultsContainer) {
            resultsContainer.classList.remove('hidden');
        }
        if (noResultsElement) {
            noResultsElement.classList.add('hidden');
        }
        
        // Update results count
        if (resultsCountElement) {
            resultsCountElement.textContent = `${results.length} product(s) found`;
        }

        // Generate product cards using the createProductCard method
        const productCards = results.map(product => this.createProductCard(product)).join('');
        
        resultsContainer.innerHTML = productCards;
    }

    // Navigate to product detail page with search context
    navigateToProduct(productLink, productData) {
        // Store search context in sessionStorage
        const searchContext = {
            query: document.getElementById('searchInput') ? document.getElementById('searchInput').value : '',
            domain: document.getElementById('domainFilter') ? document.getElementById('domainFilter').value : '',
            category: document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : '',
            sortBy: document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : '',
            timestamp: Date.now(),
            referrer: 'search-results'
        };
        
        sessionStorage.setItem('searchContext', JSON.stringify(searchContext));
        sessionStorage.setItem('currentProduct', productData);
        
        // Navigate to product page
        window.location.href = productLink;
    }
}

// Global function for navigation
function navigateToProduct(productLink, productData) {
    const searchSystem = new ProductSearchSystem();
    searchSystem.navigateToProduct(productLink, productData);
}

// Initialize search system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductSearchSystem();
});