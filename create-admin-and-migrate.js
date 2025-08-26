// Script to create admin user, login, and run migration with proper authentication

const API_URLS = {
  auth: 'https://phedel-search-auth-api.krishnamurthym.workers.dev',
  product: 'https://phedel-search-product-api.krishnamurthym.workers.dev',
  search: 'https://phedel-search-search-api.krishnamurthym.workers.dev'
};

// Admin credentials (using default from schema.sql)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@phedel.com',
  password: 'password'
};

// Sample data to migrate
const SAMPLE_DATA = {
  categories: [
    { name: 'Electronics' },
    { name: 'Clothing' },
    { name: 'Books' },
    { name: 'Home & Garden' },
    { name: 'Sports' }
  ],
  domains: [
    { name: 'amazon.com' },
    { name: 'ebay.com' },
    { name: 'walmart.com' },
    { name: 'target.com' }
  ],
  products: [
    {
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with advanced camera system',
      price: 999.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'amazon.com',
      specifications: [
        { name: 'Storage', value: '128GB' },
        { name: 'Color', value: 'Space Black' }
      ],
      features: ['Face ID', '5G Connectivity', 'Wireless Charging'],
      tags: ['smartphone', 'apple', 'premium']
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Flagship Android smartphone with AI features',
      price: 899.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'amazon.com',
      specifications: [
        { name: 'Storage', value: '256GB' },
        { name: 'Color', value: 'Phantom Black' }
      ],
      features: ['S Pen Support', 'AI Photography', 'Fast Charging'],
      tags: ['smartphone', 'samsung', 'android']
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with air cushioning',
      price: 150.00,
      currency: 'USD',
      category: 'Sports',
      domain: 'nike.com',
      specifications: [
        { name: 'Size', value: '10' },
        { name: 'Color', value: 'Black/White' }
      ],
      features: ['Air Max Technology', 'Breathable Mesh', 'Durable Sole'],
      tags: ['shoes', 'running', 'nike']
    },
    {
      name: 'MacBook Pro 16"',
      description: 'Professional laptop with M3 Pro chip',
      price: 2499.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'apple.com',
      specifications: [
        { name: 'Processor', value: 'M3 Pro' },
        { name: 'RAM', value: '18GB' },
        { name: 'Storage', value: '512GB SSD' }
      ],
      features: ['Retina Display', 'Touch Bar', 'All-day Battery'],
      tags: ['laptop', 'apple', 'professional']
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Premium noise-canceling wireless headphones',
      price: 399.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'sony.com',
      specifications: [
        { name: 'Battery Life', value: '30 hours' },
        { name: 'Color', value: 'Black' }
      ],
      features: ['Active Noise Canceling', 'Quick Charge', 'Touch Controls'],
      tags: ['headphones', 'sony', 'wireless']
    }
  ]
};

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    const response = await fetch(`${API_URLS.auth}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin user created successfully:', result.user.username);
      return true;
    } else {
      if (result.message && result.message.includes('already exists')) {
        console.log('ℹ️ Admin user already exists, proceeding to login...');
        return true;
      }
      console.error('❌ Failed to create admin user:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

async function loginAdmin() {
  console.log('Logging in admin user...');
  
  try {
    const response = await fetch(`${API_URLS.auth}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.token) {
      console.log('✅ Admin login successful');
      return result.token;
    } else {
      console.error('❌ Failed to login admin:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error logging in admin:', error.message);
    return null;
  }
}

async function migrateCategories(token) {
  console.log('\nMigrating categories...');
  let success = 0;
  let failed = 0;
  
  for (const category of SAMPLE_DATA.categories) {
    try {
      const response = await fetch(`${API_URLS.product}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Sample Product for ${category.name}`,
          description: `Sample product to create ${category.name} category`,
          price: 1.00,
          currency: 'USD',
          category: category.name
        })
      });
      
      if (response.ok) {
        console.log(`✅ Category created: ${category.name}`);
        success++;
        // Delete the sample product
        const result = await response.json();
        if (result.product && result.product.id) {
          await fetch(`${API_URLS.product}/api/admin/products/${result.product.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create category ${category.name}: ${error.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error creating category ${category.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`Categories: ${success} successful, ${failed} failed`);
  return { success, failed };
}

async function migrateDomains(token) {
  console.log('\nMigrating domains...');
  let success = 0;
  let failed = 0;
  
  for (const domain of SAMPLE_DATA.domains) {
    try {
      const response = await fetch(`${API_URLS.product}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Sample Product for ${domain.name}`,
          description: `Sample product to create ${domain.name} domain`,
          price: 1.00,
          currency: 'USD',
          domain: domain.name
        })
      });
      
      if (response.ok) {
        console.log(`✅ Domain created: ${domain.name}`);
        success++;
        // Delete the sample product
        const result = await response.json();
        if (result.product && result.product.id) {
          await fetch(`${API_URLS.product}/api/admin/products/${result.product.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create domain ${domain.name}: ${error.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error creating domain ${domain.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`Domains: ${success} successful, ${failed} failed`);
  return { success, failed };
}

async function migrateProducts(token) {
  console.log('\nMigrating products...');
  let success = 0;
  let failed = 0;
  
  for (const product of SAMPLE_DATA.products) {
    try {
      const response = await fetch(`${API_URLS.product}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        console.log(`✅ Product created: ${product.name}`);
        success++;
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create product ${product.name}: ${error.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error creating product ${product.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`Products: ${success} successful, ${failed} failed`);
  return { success, failed };
}

async function main() {
  console.log('🚀 Starting admin login and data migration...\n');
  
  // Step 1: Login to get token (skip user creation since default admin exists)
  const token = await loginAdmin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    return;
  }
  
  // Step 3: Migrate data
  const categoryResults = await migrateCategories(token);
  const domainResults = await migrateDomains(token);
  const productResults = await migrateProducts(token);
  
  // Summary
  const totalSuccess = categoryResults.success + domainResults.success + productResults.success;
  const totalFailed = categoryResults.failed + domainResults.failed + productResults.failed;
  const totalItems = totalSuccess + totalFailed;
  
  console.log('\n📊 Migration Summary:');
  console.log(`Total items processed: ${totalItems}`);
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);
  
  if (totalSuccess > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n🔍 You can now test the search functionality at:');
    console.log('   - Search API: ' + API_URLS.search + '/api/search?q=iphone');
    console.log('   - Categories: ' + API_URLS.search + '/api/categories');
    console.log('   - Domains: ' + API_URLS.search + '/api/domains');
  } else {
    console.log('\n❌ Migration failed - no items were successfully migrated');
  }
}

// Run the migration
main().catch(console.error);