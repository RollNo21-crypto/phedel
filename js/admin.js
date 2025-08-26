// Admin Dashboard JavaScript
// Handles authentication, product management, analytics, and UI interactions

class AdminDashboard {
    constructor() {
        this.apiConfig = {
            baseUrl: '',
            timeout: 10000,
            endpoints: {
                auth: 'https://phedel-search-auth-api.krishnamurthym.workers.dev/api/auth',
                products: 'https://phedel-search-product-api.krishnamurthym.workers.dev/api/products',
                search: 'https://phedel-search-search-api.krishnamurthym.workers.dev/api/search',
                upload: 'https://phedel-search-upload-api.krishnamurthym.workers.dev/api/upload',
                analytics: 'https://phedel-search-product-api.krishnamurthym.workers.dev/api/analytics'
            }
        };
        
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.products = [];
        this.categories = [];
        this.domains = [];
        this.charts = {};
        
        this.init();
    }
    
    async init() {
        try {
            // Check authentication
            const isAuthenticated = await this.checkAuth();
            
            if (!isAuthenticated) {
                this.hideLoadingScreen();
                showLoginForm();
                return;
            }
            
            // Initialize UI
            this.initializeUI();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.hideLoadingScreen();
            localStorage.removeItem('admin_token');
            showLoginForm();
        }
    }
    
    async checkAuth() {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            return false;
        }
        
        try {
            // Verify token with the auth API
            const response = await fetch('https://phedel-search-auth-api.krishnamurthym.workers.dev/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                localStorage.removeItem('admin_token');
                return false;
            }
            
            const result = await response.json();
            if (!result.valid) {
                localStorage.removeItem('admin_token');
                return false;
            }
            
            this.currentUser = result.user;
            document.getElementById('adminUsername').textContent = this.currentUser.username || 'Admin User';
            return true;
        } catch (error) {
            localStorage.removeItem('admin_token');
            return false;
        }
    }
    
    initializeUI() {
        // Navigation event listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Modal event listeners
        document.getElementById('addProductBtn').addEventListener('click', () => this.openProductModal());
        document.getElementById('quickAddBtn').addEventListener('click', () => this.openProductModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeProductModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeProductModal());
        
        // Form event listeners
        document.getElementById('productForm').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('productSearch').addEventListener('input', (e) => this.handleProductSearch(e));
        
        // Settings event listeners
        document.getElementById('saveApiSettings').addEventListener('click', () => this.saveApiSettings());
        document.getElementById('migrateDataBtn').addEventListener('click', () => this.migrateData());
        document.getElementById('backupDataBtn').addEventListener('click', () => this.backupData());
        document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearCache());
        
        // Logout event listener
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Pagination event listeners
        document.getElementById('prevPageBtn').addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('nextPageBtn').addEventListener('click', () => this.changePage(this.currentPage + 1));
        
        // Close modal on outside click
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                this.closeProductModal();
            }
        });
    }
    
    async loadDashboardData() {
        try {
            // Load products, categories, and analytics in parallel
            const [productsData, categoriesData, analyticsData] = await Promise.all([
                this.apiCall('/products'),
                this.apiCall('/search/categories'),
                this.apiCall('/analytics/summary')
            ]);
            
            this.products = productsData.products || [];
            this.categories = categoriesData.categories || [];
            
            // Update dashboard stats
            this.updateDashboardStats(analyticsData);
            
            // Load domains
            const domainsData = await this.apiCall('/search/domains');
            this.domains = domainsData.domains || [];
            
            // Populate form dropdowns
            this.populateFormDropdowns();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Failed to load dashboard data', 'error');
        }
    }
    
    updateDashboardStats(analyticsData) {
        const stats = analyticsData || {};
        
        document.getElementById('totalProducts').textContent = this.products.length;
        document.getElementById('totalCategories').textContent = this.categories.length;
        document.getElementById('totalSearches').textContent = stats.totalSearches || 0;
        document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
        
        // Update charts
        this.updateCharts(stats);
        
        // Update recent activity
        this.updateRecentActivity(stats.recentActivity || []);
    }
    
    updateCharts(analyticsData) {
        // Search Analytics Chart
        const searchCtx = document.getElementById('searchChart').getContext('2d');
        if (this.charts.searchChart) {
            this.charts.searchChart.destroy();
        }
        
        this.charts.searchChart = new Chart(searchCtx, {
            type: 'line',
            data: {
                labels: analyticsData.searchTrends?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Searches',
                    data: analyticsData.searchTrends?.data || [12, 19, 3, 5, 2, 3, 9],
                    borderColor: '#3A46A5',
                    backgroundColor: 'rgba(58, 70, 165, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }
        
        const categoryData = this.getCategoryDistribution();
        this.charts.categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: [
                        '#3A46A5',
                        '#4c5db8',
                        '#5a6bc7',
                        '#6b7dd6',
                        '#7c8ee5',
                        '#8da0f4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    getCategoryDistribution() {
        const distribution = {};
        this.products.forEach(product => {
            const category = product.category || 'Uncategorized';
            distribution[category] = (distribution[category] || 0) + 1;
        });
        
        return {
            labels: Object.keys(distribution),
            data: Object.values(distribution)
        };
    }
    
    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-${activity.icon || 'info'} text-blue-600 text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'text-white');
            item.classList.add('text-gray-300');
        });
        
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        if (activeItem) {
            activeItem.classList.add('active', 'text-white');
            activeItem.classList.remove('text-gray-300');
        }
        
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show selected section
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.classList.remove('hidden');
            sectionElement.classList.add('animate-fade-in');
        }
        
        // Update page title
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Welcome to your admin dashboard' },
            products: { title: 'Products', subtitle: 'Manage your product catalog' },
            categories: { title: 'Categories', subtitle: 'Organize your products' },
            analytics: { title: 'Analytics', subtitle: 'View search and usage statistics' },
            settings: { title: 'Settings', subtitle: 'Configure system settings' }
        };
        
        const titleInfo = titles[section] || titles.dashboard;
        document.getElementById('pageTitle').textContent = titleInfo.title;
        document.getElementById('pageSubtitle').textContent = titleInfo.subtitle;
        
        this.currentSection = section;
        
        // Load section-specific data
        this.loadSectionData(section);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'products':
                await this.loadProductsTable();
                break;
            case 'categories':
                await this.loadCategoriesGrid();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }
    
    async loadProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        const searchTerm = document.getElementById('productSearch').value.toLowerCase();
        
        let filteredProducts = this.products;
        if (searchTerm) {
            filteredProducts = this.products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        tbody.innerHTML = paginatedProducts.map(product => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-lg object-cover" src="${product.image_data ? `data:image/jpeg;base64,${product.image_data}` : 'images/placeholder.jpg'}" alt="${product.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.description.substring(0, 50)}...</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${product.category}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.domain || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center space-x-2">
                        <button onclick="adminDashboard.editProduct(${product.id})" class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminDashboard.deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        this.updatePagination(filteredProducts.length);
    }
    
    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        
        document.getElementById('showingStart').textContent = startItem;
        document.getElementById('showingEnd').textContent = endItem;
        document.getElementById('totalProductsCount').textContent = totalItems;
        
        // Update pagination buttons
        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages;
        
        // Update page numbers
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = `px-3 py-1 border rounded text-sm ${
                i === this.currentPage 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border-gray-300 hover:bg-gray-50'
            }`;
            button.addEventListener('click', () => this.changePage(i));
            pageNumbers.appendChild(button);
        }
    }
    
    changePage(page) {
        const totalPages = Math.ceil(this.products.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.loadProductsTable();
        }
    }
    
    async loadCategoriesGrid() {
        const grid = document.getElementById('categoriesGrid');
        
        grid.innerHTML = this.categories.map(category => `
            <div class="bg-white border border-gray-200 rounded-lg p-6 card-hover">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-900">${category.name}</h4>
                    <div class="flex items-center space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">${category.description || 'No description available'}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">${this.getProductCountByCategory(category.name)} products</span>
                    <span class="text-blue-600 font-medium">View Products</span>
                </div>
            </div>
        `).join('');
    }
    
    getProductCountByCategory(categoryName) {
        return this.products.filter(product => product.category === categoryName).length;
    }
    
    async loadAnalyticsData() {
        try {
            const analyticsData = await this.apiCall('/analytics/detailed');
            
            // Update popular searches
            const popularSearches = document.getElementById('popularSearches');
            const searches = analyticsData.popularSearches || [];
            
            popularSearches.innerHTML = searches.map((search, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <span class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            ${index + 1}
                        </span>
                        <span class="font-medium text-gray-900">${search.term}</span>
                    </div>
                    <span class="text-sm text-gray-500">${search.count} searches</span>
                </div>
            `).join('');
            
            // Update trends chart
            const trendsCtx = document.getElementById('trendsChart').getContext('2d');
            if (this.charts.trendsChart) {
                this.charts.trendsChart.destroy();
            }
            
            this.charts.trendsChart = new Chart(trendsCtx, {
                type: 'bar',
                data: {
                    labels: analyticsData.trends?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Search Volume',
                        data: analyticsData.trends?.data || [65, 59, 80, 81, 56, 55],
                        backgroundColor: '#3A46A5',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#f3f4f6'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showToast('Failed to load analytics data', 'error');
        }
    }
    
    loadSettingsData() {
        // Load current API settings
        document.getElementById('apiBaseUrl').value = this.apiConfig.baseUrl;
        document.getElementById('apiTimeout').value = this.apiConfig.timeout;
    }
    
    populateFormDropdowns() {
        // Populate categories dropdown
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = '<option value="">Select Category</option>' +
            this.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        
        // Populate domains dropdown
        const domainSelect = document.getElementById('productDomain');
        domainSelect.innerHTML = '<option value="">Select Domain</option>' +
            this.domains.map(domain => `<option value="${domain.name}">${domain.name}</option>`).join('');
    }
    
    openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        if (productId) {
            // Edit mode
            const product = this.products.find(p => p.id === productId);
            if (product) {
                title.textContent = 'Edit Product';
                this.populateProductForm(product);
            }
        } else {
            // Add mode
            title.textContent = 'Add New Product';
            form.reset();
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeProductModal() {
        const modal = document.getElementById('productModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    populateProductForm(product) {
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productDomain').value = product.domain || '';
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productTags').value = (product.tags || []).join(', ');
        document.getElementById('productSpecs').value = JSON.stringify(product.specifications || {}, null, 2);
        document.getElementById('productFeatures').value = (product.features || []).join(', ');
    }
    
    async handleProductSubmit(e) {
        e.preventDefault();
        
        const saveButton = document.getElementById('saveProductBtn');
        const saveButtonText = document.getElementById('saveButtonText');
        const saveButtonLoader = document.getElementById('saveButtonLoader');
        
        // Show loading state
        saveButtonText.classList.add('hidden');
        saveButtonLoader.classList.remove('hidden');
        saveButton.disabled = true;
        
        try {
            const formData = this.getProductFormData();
            
            const response = await this.apiCall('/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.success) {
                this.showToast('Product saved successfully', 'success');
                this.closeProductModal();
                await this.loadDashboardData();
                if (this.currentSection === 'products') {
                    await this.loadProductsTable();
                }
            } else {
                throw new Error(response.error || 'Failed to save product');
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showToast(error.message || 'Failed to save product', 'error');
        } finally {
            // Reset loading state
            saveButtonText.classList.remove('hidden');
            saveButtonLoader.classList.add('hidden');
            saveButton.disabled = false;
        }
    }
    
    getProductFormData() {
        const tags = document.getElementById('productTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        const features = document.getElementById('productFeatures').value
            .split(',')
            .map(feature => feature.trim())
            .filter(feature => feature.length > 0);
        
        let specifications = {};
        try {
            const specsText = document.getElementById('productSpecs').value.trim();
            if (specsText) {
                specifications = JSON.parse(specsText);
            }
        } catch (error) {
            console.warn('Invalid JSON in specifications field');
        }
        
        return {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value.trim(),
            domain: document.getElementById('productDomain').value,
            image_url: document.getElementById('productImage').value.trim(),
            tags: tags,
            specifications: specifications,
            features: features
        };
    }
    
    async editProduct(productId) {
        this.openProductModal(productId);
    }
    
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        try {
            const response = await this.apiCall(`/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            if (response.success) {
                this.showToast('Product deleted successfully', 'success');
                await this.loadDashboardData();
                if (this.currentSection === 'products') {
                    await this.loadProductsTable();
                }
            } else {
                throw new Error(response.error || 'Failed to delete product');
            }
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showToast(error.message || 'Failed to delete product', 'error');
        }
    }
    
    handleProductSearch(e) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadProductsTable();
        }, 300);
    }
    
    async saveApiSettings() {
        const baseUrl = document.getElementById('apiBaseUrl').value.trim();
        const timeout = parseInt(document.getElementById('apiTimeout').value);
        
        if (!baseUrl || !timeout) {
            this.showToast('Please fill in all API settings', 'error');
            return;
        }
        
        this.apiConfig.baseUrl = baseUrl;
        this.apiConfig.timeout = timeout;
        
        // Save to localStorage
        localStorage.setItem('admin_api_config', JSON.stringify(this.apiConfig));
        
        this.showToast('API settings saved successfully', 'success');
    }
    
    async migrateData() {
        if (!confirm('This will migrate data from search.js to the D1 database. Continue?')) {
            return;
        }
        
        try {
            const response = await this.apiCall('/products/migrate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            if (response.success) {
                this.showToast(`Migration completed: ${response.migrated} products migrated`, 'success');
                await this.loadDashboardData();
            } else {
                throw new Error(response.error || 'Migration failed');
            }
            
        } catch (error) {
            console.error('Migration error:', error);
            this.showToast(error.message || 'Migration failed', 'error');
        }
    }
    
    async backupData() {
        try {
            const response = await this.apiCall('/products/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            if (response.success) {
                // Create and download backup file
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `phedel-backup-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                
                URL.revokeObjectURL(url);
                this.showToast('Backup downloaded successfully', 'success');
            } else {
                throw new Error(response.error || 'Backup failed');
            }
            
        } catch (error) {
            console.error('Backup error:', error);
            this.showToast(error.message || 'Backup failed', 'error');
        }
    }
    
    async clearCache() {
        if (!confirm('This will clear all cached data. Continue?')) {
            return;
        }
        
        try {
            // Clear localStorage cache
            const keysToKeep = ['admin_token', 'admin_api_config'];
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Clear API cache if available
            const response = await this.apiCall('/cache/clear', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            this.showToast('Cache cleared successfully', 'success');
            
        } catch (error) {
            console.error('Clear cache error:', error);
            this.showToast('Cache cleared locally', 'warning');
        }
    }
    
    async logout() {
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        try {
            await this.apiCall('/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }
        
        localStorage.removeItem('admin_token');
        this.redirectToLogin();
    }
    
    redirectToLogin() {
        // For now, just reload the page
        // In a real implementation, you would redirect to a login page
        window.location.reload();
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContainer = document.getElementById('mainContainer');
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainContainer.classList.remove('hidden');
        }, 1000);
    }
    
    async apiCall(endpoint, options = {}) {
        // Use endpoint directly if it's a full URL, otherwise use baseUrl + endpoint
        const url = endpoint.startsWith('http') ? endpoint : `${this.apiConfig.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: this.apiConfig.timeout
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);
            
            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Handle authentication on page load
if (!localStorage.getItem('admin_token')) {
    // Redirect to login or show login form
    showLoginForm();
}

// Login form functionality
function showLoginForm() {
    // Check if login modal already exists to prevent duplicate IDs
    if (document.getElementById('loginModal')) {
        return;
    }
    
    const loginHtml = `
        <div id="loginModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
                <h2>Admin Login</h2>
                <form id="loginForm">
                    <div style="margin-bottom: 1rem;">
                        <label>Username:</label>
                        <input type="text" id="username" value="admin" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;" required>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Password:</label>
                        <input type="password" id="password" placeholder="Try: admin123, password, admin" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;" required>
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Login</button>
                </form>
                <div id="loginError" style="color: red; margin-top: 1rem; display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loginHtml);
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('https://phedel-search-auth-api.krishnamurthym.workers.dev/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (response.ok && result.token) {
                localStorage.setItem('admin_token', result.token);
                document.getElementById('loginModal').remove();
                window.location.reload();
            } else {
                document.getElementById('loginError').style.display = 'block';
                document.getElementById('loginError').textContent = result.message || 'Login failed';
            }
        } catch (error) {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('loginError').textContent = 'Connection error. Please try again.';
        }
    });
}