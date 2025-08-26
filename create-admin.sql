-- Create admin user for local database
INSERT OR REPLACE INTO admin_users (username, password_hash, email, role, created_at, updated_at) 
VALUES ('admin', 'admin_hash', 'admin@phedel.com', 'admin', datetime('now'), datetime('now'));