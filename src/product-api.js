// Product Management API Worker for Cloudflare D1 + Workers
// Provides CRUD operations for products with admin authentication

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public endpoints (no auth required)
      if (path === '/api/products' && request.method === 'GET') {
        return await handleGetProducts(request, env, corsHeaders);
      }
      
      if (path.startsWith('/api/products/') && request.method === 'GET') {
        const productId = path.split('/')[3];
        return await handleGetProduct(productId, env, corsHeaders);
      }

      // Admin endpoints (auth required)
      const authResult = await verifyAdminAuth(request, env);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: authResult.message }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (path === '/api/admin/products' && request.method === 'POST') {
        return await handleCreateProduct(request, env, corsHeaders, authResult.user);
      }
      
      if (path.startsWith('/api/admin/products/') && request.method === 'PUT') {
        const productId = path.split('/')[4];
        return await handleUpdateProduct(productId, request, env, corsHeaders, authResult.user);
      }
      
      if (path.startsWith('/api/admin/products/') && request.method === 'DELETE') {
        const productId = path.split('/')[4];
        return await handleDeleteProduct(productId, env, corsHeaders, authResult.user);
      }
      
      if (path === '/api/admin/products/bulk' && request.method === 'POST') {
        return await handleBulkImport(request, env, corsHeaders, authResult.user);
      }
      
      if (path === '/api/admin/analytics' && request.method === 'GET') {
        return await handleAnalytics(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Product API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// Get products with pagination and filtering
async function handleGetProducts(request, env, corsHeaders) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const category = url.searchParams.get('category') || '';
  const domain = url.searchParams.get('domain') || '';
  const offset = (page - 1) * limit;

  let sql = `
    SELECT 
      p.*,
      c.name as category_name,
      d.name as domain_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN domains d ON p.domain_id = d.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (category) {
    sql += ` AND c.name = ?`;
    params.push(category);
  }
  
  if (domain) {
    sql += ` AND d.name = ?`;
    params.push(domain);
  }
  
  sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const products = await env.DB.prepare(sql).bind(...params).all();
  
  // Get total count
  let countSql = `
    SELECT COUNT(*) as total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN domains d ON p.domain_id = d.id
    WHERE 1=1
  `;
  
  const countParams = [];
  if (category) {
    countSql += ` AND c.name = ?`;
    countParams.push(category);
  }
  if (domain) {
    countSql += ` AND d.name = ?`;
    countParams.push(domain);
  }
  
  const countResult = await env.DB.prepare(countSql).bind(...countParams).first();
  const totalCount = countResult?.total || 0;

  const response = {
    products: products.results || [],
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Get single product with full details
async function handleGetProduct(productId, env, corsHeaders) {
  const product = await env.DB.prepare(`
    SELECT 
      p.*,
      c.name as category_name,
      d.name as domain_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN domains d ON p.domain_id = d.id
    WHERE p.id = ?
  `).bind(productId).first();

  if (!product) {
    return new Response(
      JSON.stringify({ error: 'Product not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get specifications
  const specifications = await env.DB.prepare(`
    SELECT spec_name, spec_value
    FROM product_specifications
    WHERE product_id = ?
    ORDER BY spec_name
  `).bind(productId).all();

  // Get features
  const features = await env.DB.prepare(`
    SELECT feature_name
    FROM product_features
    WHERE product_id = ?
    ORDER BY feature_name
  `).bind(productId).all();

  // Get tags
  const tags = await env.DB.prepare(`
    SELECT tag_name
    FROM product_tags
    WHERE product_id = ?
    ORDER BY tag_name
  `).bind(productId).all();

  const response = {
    ...product,
    specifications: specifications.results || [],
    features: (features.results || []).map(f => f.feature_name),
    tags: (tags.results || []).map(t => t.tag_name)
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create new product (admin only)
async function handleCreateProduct(request, env, corsHeaders, user) {
  const data = await request.json();
  
  // Validate required fields
  const requiredFields = ['name', 'description', 'price', 'currency'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return new Response(
        JSON.stringify({ error: 'Validation Error', message: `${field} is required` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    // Get or create category
    let categoryId = null;
    if (data.category) {
      const category = await env.DB.prepare(`
        SELECT id FROM categories WHERE name = ?
      `).bind(data.category).first();
      
      if (category) {
        categoryId = category.id;
      } else {
        const newCategory = await env.DB.prepare(`
          INSERT INTO categories (name) VALUES (?) RETURNING id
        `).bind(data.category).first();
        categoryId = newCategory.id;
      }
    }

    // Get or create domain
    let domainId = null;
    if (data.domain) {
      const domain = await env.DB.prepare(`
        SELECT id FROM domains WHERE name = ?
      `).bind(data.domain).first();
      
      if (domain) {
        domainId = domain.id;
      } else {
        const newDomain = await env.DB.prepare(`
          INSERT INTO domains (name) VALUES (?) RETURNING id
        `).bind(data.domain).first();
        domainId = newDomain.id;
      }
    }

    // Create product
    const product = await env.DB.prepare(`
      INSERT INTO products (
        name, description, price, currency, image_data, gallery_images, product_url,
        category_id, domain_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `).bind(
      data.name,
      data.description,
      data.price,
      data.currency,
      data.image_data || null,
      data.gallery_images ? JSON.stringify(data.gallery_images) : null,
      data.product_url || null,
      categoryId,
      domainId
    ).first();

    const productId = product.id;

    // Add specifications
    if (data.specifications && Array.isArray(data.specifications)) {
      for (const spec of data.specifications) {
        if (spec.name && spec.value) {
          await env.DB.prepare(`
            INSERT INTO product_specifications (product_id, spec_name, spec_value)
            VALUES (?, ?, ?)
          `).bind(productId, spec.name, spec.value).run();
        }
      }
    }

    // Add features
    if (data.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        if (feature) {
          await env.DB.prepare(`
            INSERT INTO product_features (product_id, feature_name)
            VALUES (?, ?)
          `).bind(productId, feature).run();
        }
      }
    }

    // Add tags
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        if (tag) {
          await env.DB.prepare(`
            INSERT INTO product_tags (product_id, tag_name)
            VALUES (?, ?)
          `).bind(productId, tag).run();
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, product, message: 'Product created successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return new Response(
      JSON.stringify({ error: 'Database Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Update product (admin only)
async function handleUpdateProduct(productId, request, env, corsHeaders, user) {
  const data = await request.json();
  
  try {
    // Check if product exists
    const existingProduct = await env.DB.prepare(`
      SELECT id FROM products WHERE id = ?
    `).bind(productId).first();
    
    if (!existingProduct) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update product basic info
    const updateFields = [];
    const updateParams = [];
    
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(data.description);
    }
    if (data.price !== undefined) {
      updateFields.push('price = ?');
      updateParams.push(data.price);
    }
    if (data.currency !== undefined) {
      updateFields.push('currency = ?');
      updateParams.push(data.currency);
    }
    if (data.image_data !== undefined) {
      updateFields.push('image_data = ?');
      updateParams.push(data.image_data);
    }
    if (data.gallery_images !== undefined) {
      updateFields.push('gallery_images = ?');
      updateParams.push(data.gallery_images ? JSON.stringify(data.gallery_images) : null);
    }
    if (data.product_url !== undefined) {
      updateFields.push('product_url = ?');
      updateParams.push(data.product_url);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = datetime(\'now\')');
      updateParams.push(productId);
      
      await env.DB.prepare(`
        UPDATE products SET ${updateFields.join(', ')} WHERE id = ?
      `).bind(...updateParams).run();
    }

    // Update specifications
    if (data.specifications !== undefined) {
      await env.DB.prepare(`DELETE FROM product_specifications WHERE product_id = ?`).bind(productId).run();
      
      if (Array.isArray(data.specifications)) {
        for (const spec of data.specifications) {
          if (spec.name && spec.value) {
            await env.DB.prepare(`
              INSERT INTO product_specifications (product_id, spec_name, spec_value)
              VALUES (?, ?, ?)
            `).bind(productId, spec.name, spec.value).run();
          }
        }
      }
    }

    // Update features
    if (data.features !== undefined) {
      await env.DB.prepare(`DELETE FROM product_features WHERE product_id = ?`).bind(productId).run();
      
      if (Array.isArray(data.features)) {
        for (const feature of data.features) {
          if (feature) {
            await env.DB.prepare(`
              INSERT INTO product_features (product_id, feature_name)
              VALUES (?, ?)
            `).bind(productId, feature).run();
          }
        }
      }
    }

    // Update tags
    if (data.tags !== undefined) {
      await env.DB.prepare(`DELETE FROM product_tags WHERE product_id = ?`).bind(productId).run();
      
      if (Array.isArray(data.tags)) {
        for (const tag of data.tags) {
          if (tag) {
            await env.DB.prepare(`
              INSERT INTO product_tags (product_id, tag_name)
              VALUES (?, ?)
            `).bind(productId, tag).run();
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Product updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update product error:', error);
    return new Response(
      JSON.stringify({ error: 'Database Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Delete product (admin only)
async function handleDeleteProduct(productId, env, corsHeaders, user) {
  try {
    // Check if product exists
    const existingProduct = await env.DB.prepare(`
      SELECT id FROM products WHERE id = ?
    `).bind(productId).first();
    
    if (!existingProduct) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete related data (cascade)
    await env.DB.prepare(`DELETE FROM product_specifications WHERE product_id = ?`).bind(productId).run();
    await env.DB.prepare(`DELETE FROM product_features WHERE product_id = ?`).bind(productId).run();
    await env.DB.prepare(`DELETE FROM product_tags WHERE product_id = ?`).bind(productId).run();
    
    // Delete product
    await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(productId).run();

    return new Response(
      JSON.stringify({ success: true, message: 'Product deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete product error:', error);
    return new Response(
      JSON.stringify({ error: 'Database Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Bulk import products (admin only)
async function handleBulkImport(request, env, corsHeaders, user) {
  const data = await request.json();
  
  if (!data.products || !Array.isArray(data.products)) {
    return new Response(
      JSON.stringify({ error: 'Invalid data format', message: 'products array is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const [index, productData] of data.products.entries()) {
    try {
      // Create a mock request for handleCreateProduct
      const mockRequest = {
        json: async () => productData
      };
      
      const response = await handleCreateProduct(mockRequest, env, corsHeaders, user);
      
      if (response.status === 201) {
        results.success++;
      } else {
        results.failed++;
        const errorData = await response.json();
        results.errors.push({
          index,
          product: productData.name || 'Unknown',
          error: errorData.message || 'Unknown error'
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        index,
        product: productData.name || 'Unknown',
        error: error.message
      });
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Get analytics data (admin only)
async function handleAnalytics(request, env, corsHeaders) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days')) || 30;
  
  // Top searches
  const topSearches = await env.DB.prepare(`
    SELECT query, COUNT(*) as count, AVG(result_count) as avg_results
    FROM search_analytics
    WHERE search_date >= datetime('now', '-${days} days')
    AND query IS NOT NULL AND query != ''
    GROUP BY query
    ORDER BY count DESC
    LIMIT 20
  `).all();

  // Search trends
  const searchTrends = await env.DB.prepare(`
    SELECT DATE(search_date) as date, COUNT(*) as searches
    FROM search_analytics
    WHERE search_date >= datetime('now', '-${days} days')
    GROUP BY DATE(search_date)
    ORDER BY date DESC
  `).all();

  // Category popularity
  const categoryStats = await env.DB.prepare(`
    SELECT category, COUNT(*) as searches
    FROM search_analytics
    WHERE search_date >= datetime('now', '-${days} days')
    AND category IS NOT NULL
    GROUP BY category
    ORDER BY searches DESC
    LIMIT 10
  `).all();

  // Product counts
  const productStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_this_week,
      COUNT(CASE WHEN updated_at >= datetime('now', '-7 days') THEN 1 END) as updated_this_week
    FROM products
  `).first();

  const analytics = {
    period_days: days,
    top_searches: topSearches.results || [],
    search_trends: searchTrends.results || [],
    category_stats: categoryStats.results || [],
    product_stats: productStats || {}
  };

  return new Response(JSON.stringify(analytics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Verify admin authentication
async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, message: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    // Check if session exists and is valid
    const session = await env.DB.prepare(`
      SELECT s.*, u.username, u.email
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Update last activity
    await env.DB.prepare(`
      UPDATE admin_sessions 
      SET last_activity = datetime('now')
      WHERE token = ?
    `).bind(token).run();

    return {
      success: true,
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, message: 'Authentication error' };
  }
}