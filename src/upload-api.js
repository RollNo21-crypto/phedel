// File Upload API Worker for Cloudflare D1 + Workers
// Handles product image uploads with base64 encoding to D1 database

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // All upload endpoints require admin authentication
      const authResult = await verifyAdminAuth(request, env);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: authResult.message }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (path === '/api/upload/image' && request.method === 'POST') {
        return await handleImageUpload(request, env, corsHeaders, authResult.user);
      }
      
      if (path === '/api/upload/bulk-images' && request.method === 'POST') {
        return await handleBulkImageUpload(request, env, corsHeaders, authResult.user);
      }
      
      if (path.startsWith('/api/upload/delete/') && request.method === 'DELETE') {
        const imageId = path.split('/')[4];
        return await handleImageDelete(imageId, env, corsHeaders, authResult.user);
      }
      
      if (path === '/api/upload/list' && request.method === 'GET') {
        return await handleListImages(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Upload API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// Handle single image upload
async function handleImageUpload(request, env, corsHeaders, user) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const productId = formData.get('productId');
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Validation Error', message: 'No image file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid File Type', 
          message: 'Only JPEG, PNG, WebP, and GIF images are allowed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 2MB for base64 storage)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: 'File Too Large', 
          message: 'Image must be smaller than 2MB for database storage' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store in database
    const imageRecord = await env.DB.prepare(`
      INSERT INTO product_images (filename, content_type, size, base64_data, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(file.name, file.type, file.size, dataUrl, user.username).run();

    const imageId = imageRecord.meta.last_row_id;

    // Update product if productId provided
    if (productId) {
      try {
        await env.DB.prepare(`
          UPDATE products 
          SET image_data = ?, updated_at = datetime('now') 
          WHERE id = ?
        `).bind(dataUrl, productId).run();
      } catch (dbError) {
        console.error('Failed to update product image:', dbError);
        // Continue anyway, image was stored successfully
      }
    }

    const response = {
      success: true,
      message: 'Image uploaded successfully',
      image: {
        id: imageId,
        filename: file.name,
        dataUrl: dataUrl,
        size: file.size,
        type: file.type,
        productId: productId || null
      }
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Upload Error', message: 'Failed to upload image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle bulk image upload
async function handleBulkImageUpload(request, env, corsHeaders, user) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');
    
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Validation Error', message: 'No image files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      images: [],
      errors: []
    };

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    for (const [index, file] of files.entries()) {
      try {
        // Validate file
        if (!allowedTypes.includes(file.type)) {
          results.failed++;
          results.errors.push({
            index,
            filename: file.name,
            error: 'Invalid file type'
          });
          continue;
        }

        if (file.size > maxSize) {
          results.failed++;
          results.errors.push({
            index,
            filename: file.name,
            error: 'File too large (max 2MB)'
          });
          continue;
        }

        // Convert to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Store in database
        const imageRecord = await env.DB.prepare(`
          INSERT INTO product_images (filename, content_type, size, base64_data, uploaded_by, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(file.name, file.type, file.size, dataUrl, user.username).run();

        const imageId = imageRecord.meta.last_row_id;
        
        results.success++;
        results.images.push({
          id: imageId,
          filename: file.name,
          dataUrl: dataUrl,
          size: file.size,
          type: file.type,
          originalName: file.name
        });
      } catch (fileError) {
        results.failed++;
        results.errors.push({
          index,
          filename: file.name,
          error: fileError.message
        });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Bulk Upload Error', message: 'Failed to process bulk upload' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle image deletion
async function handleImageDelete(imageId, env, corsHeaders, user) {
  try {
    if (!imageId) {
      return new Response(
        JSON.stringify({ error: 'Validation Error', message: 'Image ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if image exists
    const image = await env.DB.prepare(`
      SELECT id, filename, base64_data FROM product_images WHERE id = ?
    `).bind(imageId).first();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image Not Found', message: 'Image not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from database
    await env.DB.prepare(`DELETE FROM product_images WHERE id = ?`).bind(imageId).run();

    // Update any products using this image
    await env.DB.prepare(`
      UPDATE products 
      SET image_data = NULL, updated_at = datetime('now') 
      WHERE image_data = ?
    `).bind(image.base64_data).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image deleted successfully',
        imageId,
        filename: image.filename
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Delete Error', message: 'Failed to delete image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// List uploaded images
async function handleListImages(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    const images = await env.DB.prepare(`
      SELECT id, filename, content_type, size, uploaded_by, created_at,
             SUBSTR(base64_data, 1, 50) || '...' as preview
      FROM product_images 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const totalCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM product_images
    `).first();

    const response = {
      images: images.results.map(img => ({
        id: img.id,
        filename: img.filename,
        contentType: img.content_type,
        size: img.size,
        uploadedBy: img.uploaded_by,
        createdAt: img.created_at,
        preview: img.preview
      })),
      pagination: {
        limit,
        offset,
        total: totalCount.count,
        hasMore: offset + limit < totalCount.count
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('List images error:', error);
    return new Response(
      JSON.stringify({ error: 'List Error', message: 'Failed to list images' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify admin authentication (reused from other APIs)
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