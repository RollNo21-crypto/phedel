-- PHEDEL Product Search & CMS Database Schema
-- Cloudflare D1 SQLite Database
-- Created: 2024

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Categories table for product organization
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'fas fa-cube',
    description TEXT,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Domains table for high-level product grouping
CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'fas fa-building',
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table - main product information
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description TEXT,
    sku TEXT UNIQUE,
    category_id INTEGER NOT NULL,
    domain_id INTEGER NOT NULL,
    image_data TEXT, -- Base64 encoded primary image
    gallery_images TEXT, -- JSON array of base64 encoded images
    price TEXT DEFAULT 'Contact for pricing',
    availability TEXT DEFAULT 'In Stock',
    rating REAL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    view_count INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    meta_title TEXT,
    meta_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE RESTRICT
);

-- Product specifications table for detailed technical specs
CREATE TABLE IF NOT EXISTS product_specifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    spec_key TEXT NOT NULL,
    spec_value TEXT NOT NULL,
    spec_unit TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, spec_key)
);

-- Product features table
CREATE TABLE IF NOT EXISTS product_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    feature TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product images table for base64 image storage
CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    base64_data TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product tags for search optimization
CREATE TABLE IF NOT EXISTS product_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, tag)
);

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    user_ip TEXT,
    user_agent TEXT,
    referer TEXT,
    clicked_product_id INTEGER,
    search_time_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Popular queries view for analytics
CREATE VIEW IF NOT EXISTS popular_queries AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results,
    COUNT(clicked_product_id) as click_count,
    ROUND(CAST(COUNT(clicked_product_id) AS FLOAT) / COUNT(*) * 100, 2) as ctr_percentage,
    MAX(created_at) as last_searched
FROM search_analytics 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY query 
ORDER BY search_count DESC;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    login_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table for JWT token management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_domain ON products(domain_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_key ON product_specifications(spec_key);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_product ON search_analytics(clicked_product_id);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_domains_active ON domains(is_active);
CREATE INDEX IF NOT EXISTS idx_domains_slug ON domains(slug);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);

-- Insert default domains
INSERT OR IGNORE INTO domains (name, slug, icon, description, sort_order) VALUES
('IT Infrastructure', 'it-infrastructure', 'fas fa-server', 'Enterprise-grade IT infrastructure solutions', 1),
('Telecommunications', 'telecommunications', 'fas fa-broadcast-tower', 'Comprehensive telecommunications infrastructure solutions', 2),
('Infrastructure', 'infrastructure', 'fas fa-building', 'Essential infrastructure components and cable management', 3);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, slug, icon, description, sort_order) VALUES
('Server Racks', 'server-racks', 'fas fa-database', 'Server racks and enclosures', 1),
('Network Cabinets', 'network-cabinets', 'fas fa-network-wired', 'Network cabinets and switching equipment', 2),
('Outdoor Equipment', 'outdoor-equipment', 'fas fa-cloud', 'Weatherproof outdoor telecommunications equipment', 3),
('Fiber Optics', 'fiber-optics', 'fas fa-wifi', 'Fiber optic cables and accessories', 4),
('Security Systems', 'security-systems', 'fas fa-shield-alt', 'CCTV and security equipment racks', 5),
('Cable Management', 'cable-management', 'fas fa-plug', 'Cable trays and management systems', 6),
('Power Solutions', 'power-solutions', 'fas fa-bolt', 'Power distribution and UPS systems', 7);

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT OR IGNORE INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@phedel.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin');

-- Triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
    AFTER UPDATE ON products
    BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
    AFTER UPDATE ON categories
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_domains_timestamp 
    AFTER UPDATE ON domains
    BEGIN
        UPDATE domains SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_admin_users_timestamp 
    AFTER UPDATE ON admin_users
    BEGIN
        UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Full-text search virtual table for products
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name, 
    description, 
    short_description,
    content='products',
    content_rowid='id'
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS products_fts_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, name, description, short_description) 
    VALUES (new.id, new.name, new.description, new.short_description);
END;

CREATE TRIGGER IF NOT EXISTS products_fts_delete AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, short_description) 
    VALUES('delete', old.id, old.name, old.description, old.short_description);
END;

CREATE TRIGGER IF NOT EXISTS products_fts_update AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, short_description) 
    VALUES('delete', old.id, old.name, old.description, old.short_description);
    INSERT INTO products_fts(rowid, name, description, short_description) 
    VALUES (new.id, new.name, new.description, new.short_description);
END;

-- Analytics and reporting views
CREATE VIEW IF NOT EXISTS product_performance AS
SELECT 
    p.id,
    p.name,
    p.view_count,
    p.search_count,
    p.click_count,
    ROUND(CAST(p.click_count AS FLOAT) / NULLIF(p.search_count, 0) * 100, 2) as ctr_percentage,
    c.name as category_name,
    d.name as domain_name,
    p.rating,
    p.is_featured,
    p.created_at
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN domains d ON p.domain_id = d.id
WHERE p.is_active = 1
ORDER BY p.view_count DESC;

-- Search trends view
CREATE VIEW IF NOT EXISTS search_trends AS
SELECT 
    DATE(created_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT query) as unique_queries,
    AVG(results_count) as avg_results_per_search,
    COUNT(clicked_product_id) as total_clicks,
    ROUND(CAST(COUNT(clicked_product_id) AS FLOAT) / COUNT(*) * 100, 2) as overall_ctr
FROM search_analytics 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- Cleanup old search analytics (keep last 90 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_analytics
    AFTER INSERT ON search_analytics
    WHEN (SELECT COUNT(*) FROM search_analytics) > 10000
    BEGIN
        DELETE FROM search_analytics 
        WHERE created_at < datetime('now', '-90 days');
    END;

-- Cleanup expired admin sessions
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
    AFTER INSERT ON admin_sessions
    BEGIN
        DELETE FROM admin_sessions 
        WHERE expires_at < datetime('now');
    END;