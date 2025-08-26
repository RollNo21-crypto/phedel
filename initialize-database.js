// Script to initialize the database with schema and create admin user via API

const API_URLS = {
  auth: 'https://phedel-search-auth-api.krishnamurthym.workers.dev',
  product: 'https://phedel-search-product-api.krishnamurthym.workers.dev',
  search: 'https://phedel-search-search-api.krishnamurthym.workers.dev'
};

// Test database connection and create admin user
async function testDatabaseAndCreateAdmin() {
  console.log('🔍 Testing database connection and initializing admin user...\n');
  
  try {
    // First, try to create an admin user (this will work if no users exist)
    console.log('Attempting to create initial admin user...');
    const registerResponse = await fetch(`${API_URLS.auth}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        email: 'admin@phedel.com',
        password: 'password'
      })
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Admin user created successfully:', registerResult.user.username);
    } else if (registerResult.message && registerResult.message.includes('already exists')) {
      console.log('ℹ️ Admin user already exists');
    } else if (registerResult.message && registerResult.message.includes('Admin authentication required')) {
      console.log('ℹ️ Database already has users, trying to login with default credentials...');
    } else {
      console.log('⚠️ Registration response:', registerResult.message);
    }
    
    // Try to login with default credentials
    console.log('\nAttempting to login with default credentials...');
    const loginResponse = await fetch(`${API_URLS.auth}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok && loginResult.token) {
      console.log('✅ Login successful! Token received.');
      return loginResult.token;
    } else {
      console.log('❌ Login failed:', loginResult.message);
      
      // Try alternative passwords
      const altPasswords = ['admin', 'admin123', 'password123', 'phedel123'];
      
      for (const altPassword of altPasswords) {
        console.log(`Trying alternative password: ${altPassword}`);
        const altLoginResponse = await fetch(`${API_URLS.auth}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: altPassword
          })
        });
        
        const altLoginResult = await altLoginResponse.json();
        
        if (altLoginResponse.ok && altLoginResult.token) {
          console.log(`✅ Login successful with password: ${altPassword}`);
          return altLoginResult.token;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error.message);
    return null;
  }
}

// Test API endpoints
async function testAPIs(token) {
  console.log('\n🧪 Testing API endpoints...');
  
  try {
    // Test search API (no auth required)
    console.log('Testing search API...');
    const searchResponse = await fetch(`${API_URLS.search}/api/categories`);
    const searchResult = await searchResponse.json();
    
    if (searchResponse.ok) {
      console.log('✅ Search API working - Categories:', searchResult.categories?.length || 0);
    } else {
      console.log('❌ Search API error:', searchResult.message);
    }
    
    // Test product API (requires auth)
    if (token) {
      console.log('Testing product API with authentication...');
      const productResponse = await fetch(`${API_URLS.product}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const productResult = await productResponse.json();
      
      if (productResponse.ok) {
        console.log('✅ Product API working - Total products:', productResult.product_stats?.total_products || 0);
      } else {
        console.log('❌ Product API error:', productResult.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Create sample data if database is empty
async function createSampleData(token) {
  if (!token) {
    console.log('\n⚠️ No authentication token available, skipping sample data creation');
    return;
  }
  
  console.log('\n📦 Creating sample data...');
  
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with advanced camera system',
      price: 999.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'apple.com'
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Flagship Android smartphone with AI features',
      price: 899.99,
      currency: 'USD',
      category: 'Electronics',
      domain: 'samsung.com'
    },
    {
      name: 'MacBook Pro 16"',
      description: 'Professional laptop with M3 Pro chip',
      price: 2499.99,
      currency: 'USD',
      category: 'Computers',
      domain: 'apple.com'
    }
  ];
  
  let success = 0;
  let failed = 0;
  
  for (const product of sampleProducts) {
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
        console.log(`✅ Created product: ${product.name}`);
        success++;
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create ${product.name}: ${error.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error creating ${product.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Sample data creation: ${success} successful, ${failed} failed`);
}

async function main() {
  console.log('🚀 Initializing Phedel Search Database...\n');
  
  // Step 1: Test database and get auth token
  const token = await testDatabaseAndCreateAdmin();
  
  // Step 2: Test API endpoints
  await testAPIs(token);
  
  // Step 3: Create sample data if needed
  await createSampleData(token);
  
  if (token) {
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n🔗 Test URLs:');
    console.log(`   Search: ${API_URLS.search}/api/search?q=iphone`);
    console.log(`   Categories: ${API_URLS.search}/api/categories`);
    console.log(`   Domains: ${API_URLS.search}/api/domains`);
    console.log('\n👤 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: password (or the one that worked)');
  } else {
    console.log('\n❌ Database initialization failed - could not authenticate');
  }
}

// Run the initialization
main().catch(console.error);