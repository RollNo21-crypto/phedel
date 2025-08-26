// Search API Worker for Cloudflare D1 + Workers
// Provides advanced search functionality with fuzzy matching and relevance scoring

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/search' && request.method === 'GET') {
        return await handleSearch(request, env, corsHeaders);
      }
      
      if (path === '/api/suggestions' && request.method === 'GET') {
        return await handleSuggestions(request, env, corsHeaders);
      }
      
      if (path === '/api/categories' && request.method === 'GET') {
        return await handleCategories(request, env, corsHeaders);
      }
      
      if (path === '/api/domains' && request.method === 'GET') {
        return await handleDomains(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Search API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// Advanced search handler with fuzzy matching and relevance scoring
async function handleSearch(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || '';
  const domain = url.searchParams.get('domain') || '';
  const minPrice = parseFloat(url.searchParams.get('minPrice')) || 0;
  const maxPrice = parseFloat(url.searchParams.get('maxPrice')) || 999999;
  const sortBy = url.searchParams.get('sortBy') || 'relevance';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const offset = (page - 1) * limit;

  let results = [];
  let totalCount = 0;

  if (query.trim()) {
    // Use FTS5 for full-text search with advanced ranking
    const ftsQuery = prepareFTSQuery(query);
    
    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        d.name as domain_name,
        ps.specifications,
        pf.features,
        pt.tags,
        products_fts.rank
      FROM products_fts 
      JOIN products p ON products_fts.rowid = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN domains d ON p.domain_id = d.id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(spec_name || ': ' || spec_value, '; ') as specifications
        FROM product_specifications GROUP BY product_id
      ) ps ON p.id = ps.product_id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(feature_name, '; ') as features
        FROM product_features GROUP BY product_id
      ) pf ON p.id = pf.product_id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(tag_name, ', ') as tags
        FROM product_tags GROUP BY product_id
      ) pt ON p.id = pt.product_id
      WHERE products_fts MATCH ?
    `;
    
    const params = [ftsQuery];
    
    // Add filters
    if (category) {
      sql += ` AND c.name = ?`;
      params.push(category);
    }
    
    if (domain) {
      sql += ` AND d.name = ?`;
      params.push(domain);
    }
    
    sql += ` AND p.price BETWEEN ? AND ?`;
    params.push(minPrice, maxPrice);
    
    // Add sorting
    switch (sortBy) {
      case 'price_asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'name':
        sql += ` ORDER BY p.name ASC`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      default: // relevance
        sql += ` ORDER BY products_fts.rank ASC, p.name ASC`;
    }
    
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const searchResults = await env.DB.prepare(sql).bind(...params).all();
    results = searchResults.results || [];
    
    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM products_fts 
      JOIN products p ON products_fts.rowid = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN domains d ON p.domain_id = d.id
      WHERE products_fts MATCH ?
      ${category ? 'AND c.name = ?' : ''}
      ${domain ? 'AND d.name = ?' : ''}
      AND p.price BETWEEN ? AND ?
    `;
    
    const countParams = [ftsQuery];
    if (category) countParams.push(category);
    if (domain) countParams.push(domain);
    countParams.push(minPrice, maxPrice);
    
    const countResult = await env.DB.prepare(countSql).bind(...countParams).first();
    totalCount = countResult?.total || 0;
    
  } else {
    // Browse all products with filters
    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        d.name as domain_name,
        ps.specifications,
        pf.features,
        pt.tags
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN domains d ON p.domain_id = d.id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(spec_name || ': ' || spec_value, '; ') as specifications
        FROM product_specifications GROUP BY product_id
      ) ps ON p.id = ps.product_id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(feature_name, '; ') as features
        FROM product_features GROUP BY product_id
      ) pf ON p.id = pf.product_id
      LEFT JOIN (
        SELECT product_id, GROUP_CONCAT(tag_name, ', ') as tags
        FROM product_tags GROUP BY product_id
      ) pt ON p.id = pt.product_id
      WHERE p.price BETWEEN ? AND ?
    `;
    
    const params = [minPrice, maxPrice];
    
    if (category) {
      sql += ` AND c.name = ?`;
      params.push(category);
    }
    
    if (domain) {
      sql += ` AND d.name = ?`;
      params.push(domain);
    }
    
    // Add sorting
    switch (sortBy) {
      case 'price_asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'name':
        sql += ` ORDER BY p.name ASC`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      default:
        sql += ` ORDER BY p.name ASC`;
    }
    
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const browseResults = await env.DB.prepare(sql).bind(...params).all();
    results = browseResults.results || [];
    
    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN domains d ON p.domain_id = d.id
      WHERE p.price BETWEEN ? AND ?
    `;
    
    const countParams = [minPrice, maxPrice];
    if (category) {
      countSql += ` AND c.name = ?`;
      countParams.push(category);
    }
    if (domain) {
      countSql += ` AND d.name = ?`;
      countParams.push(domain);
    }
    
    const countResult = await env.DB.prepare(countSql).bind(...countParams).first();
    totalCount = countResult?.total || 0;
  }

  // Log search analytics
  if (query.trim()) {
    await logSearchAnalytics(env, query, category, domain, results.length);
  }

  // Format results
  const formattedResults = results.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    image_data: product.image_data,
    gallery_images: product.gallery_images ? JSON.parse(product.gallery_images) : [],
    product_url: product.product_url,
    category: product.category_name,
    domain: product.domain_name,
    specifications: product.specifications ? product.specifications.split('; ') : [],
    features: product.features ? product.features.split('; ') : [],
    tags: product.tags ? product.tags.split(', ') : [],
    created_at: product.created_at,
    updated_at: product.updated_at
  }));

  const response = {
    results: formattedResults,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    filters: {
      query,
      category,
      domain,
      minPrice,
      maxPrice,
      sortBy
    }
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Search suggestions handler
async function handleSuggestions(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit')) || 10;

  if (!query.trim()) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get product name suggestions
  const productSuggestions = await env.DB.prepare(`
    SELECT DISTINCT name
    FROM products
    WHERE name LIKE ? OR name LIKE ?
    ORDER BY name
    LIMIT ?
  `).bind(`${query}%`, `%${query}%`, limit).all();

  // Get category suggestions
  const categorySuggestions = await env.DB.prepare(`
    SELECT DISTINCT name
    FROM categories
    WHERE name LIKE ? OR name LIKE ?
    ORDER BY name
    LIMIT 5
  `).bind(`${query}%`, `%${query}%`).all();

  const suggestions = [
    ...productSuggestions.results.map(p => ({ type: 'product', text: p.name })),
    ...categorySuggestions.results.map(c => ({ type: 'category', text: c.name }))
  ].slice(0, limit);

  return new Response(JSON.stringify({ suggestions }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Categories handler
async function handleCategories(request, env, corsHeaders) {
  const categories = await env.DB.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id, c.name
    ORDER BY c.name
  `).all();

  return new Response(JSON.stringify({ categories: categories.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Domains handler
async function handleDomains(request, env, corsHeaders) {
  const domains = await env.DB.prepare(`
    SELECT d.*, COUNT(p.id) as product_count
    FROM domains d
    LEFT JOIN products p ON d.id = p.domain_id
    GROUP BY d.id, d.name
    ORDER BY d.name
  `).all();

  return new Response(JSON.stringify({ domains: domains.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Prepare FTS query with advanced matching
function prepareFTSQuery(query) {
  // Clean and tokenize the query
  const tokens = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);

  if (tokens.length === 0) return '';

  // Build FTS query with prefix matching and phrase matching
  const ftsTerms = [];
  
  // Add exact phrase matching (highest priority)
  if (tokens.length > 1) {
    ftsTerms.push(`"${tokens.join(' ')}"`);  
  }
  
  // Add individual terms with prefix matching
  tokens.forEach(token => {
    if (token.length >= 2) {
      ftsTerms.push(`${token}*`);
    }
  });
  
  return ftsTerms.join(' OR ');
}

// Log search analytics
async function logSearchAnalytics(env, query, category, domain, resultCount) {
  try {
    await env.DB.prepare(`
      INSERT INTO search_analytics (query, category, domain, result_count, search_date)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(query, category || null, domain || null, resultCount).run();
  } catch (error) {
    console.error('Analytics logging error:', error);
  }
}