/**
 * Viet30926Links - Cloudflare Workers URL Shortener
 * ES Modules Format
 * Optimized for Edge Performance
 */

const DEFAULT_EXPIRATION_DAYS = 30;
const EXPIRATION_TTL = DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60; // in seconds

// Helper: Generate random slug if not provided
function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Helper: Validate URL format
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper: Validate slug format
function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]{1,20}$/.test(slug);
}

// Generate HTML Dashboard
function generateDashboard() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viet30926Links Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .title {
            font-size: 32px;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        
        input[type="text"],
        input[type="url"],
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        input[type="text"]:focus,
        input[type="url"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-primary:active {
            transform: translateY(0);
        }
        
        .result-container {
            background: #f5f9ff;
            border: 2px solid #667eea;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            display: none;
        }
        
        .result-container.show {
            display: block;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .result-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .result-text {
            font-size: 14px;
            color: #333;
            word-break: break-all;
            font-family: monospace;
            background: white;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .copy-btn {
            background: #667eea;
            color: white;
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .copy-btn:hover {
            background: #764ba2;
        }
        
        .copy-btn.copied {
            background: #4caf50;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #c33;
            display: none;
        }
        
        .error-message.show {
            display: block;
            animation: slideIn 0.3s ease;
        }
        
        .success-message {
            background: #efe;
            color: #3c3;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #3c3;
            display: none;
        }
        
        .success-message.show {
            display: block;
            animation: slideIn 0.3s ease;
        }
        
        .info-section {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 6px;
            font-size: 13px;
            color: #555;
            line-height: 1.6;
        }
        
        .info-section p {
            margin-bottom: 8px;
        }
        
        .info-section code {
            background: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            color: #667eea;
        }
        
        .loading {
            display: none;
            text-align: center;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .loading.show {
            display: block;
        }
        
        .spinner {
            display: inline-block;
            width: 4px;
            height: 4px;
            background: #667eea;
            border-radius: 50%;
            animation: spinner 0.8s infinite;
            margin-right: 8px;
        }
        
        @keyframes spinner {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .tab-btn {
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            color: #999;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
        }
        
        .tab-btn.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        
        .tab-btn:hover {
            color: #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
            animation: slideIn 0.3s ease;
        }
        
        .links-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .links-table thead {
            background: #f5f9ff;
        }
        
        .links-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #667eea;
        }
        
        .links-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            color: #666;
            font-size: 13px;
            word-break: break-word;
        }
        
        .links-table tr:hover {
            background: #f9f9f9;
        }
        
        .links-table code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            color: #667eea;
        }
        
        .empty-message {
            text-align: center;
            padding: 40px 20px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀</div>
            <div class="title">Viet30926Links</div>
            <div class="subtitle">Make your URLs shorter, smarter & faster</div>
        </div>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('create')">Create Link</button>
            <button class="tab-btn" onclick="switchTab('view')">View Links</button>
        </div>
        
        <div class="error-message" id="errorMessage"></div>
        <div class="success-message" id="successMessage"></div>
        <div class="loading" id="loadingIndicator">
            <span class="spinner"></span>Processing...
        </div>
        
        <div class="tab-content active" id="createTab">
        <form id="shortenForm">
            <div class="form-group">
                <label for="longUrl">Long URL *</label>
                <input type="url" id="longUrl" placeholder="https://example.com/very/long/path" required>
            </div>
            
            <div class="form-group">
                <label for="customSlug">Custom Slug (optional)</label>
                <input type="text" id="customSlug" placeholder="e.g., my-link">
                <small style="color: #999; font-size: 12px; margin-top: 5px; display: block;">
                    Only letters, numbers, hyphens and underscores (max 20 chars)
                </small>
            </div>
            
            <div class="button-group">
                <button type="submit" class="btn-primary">Shorten URL</button>
            </div>
        </form>
        
        <div class="result-container" id="resultContainer">
            <div class="result-label">Your shortened link:</div>
            <div class="result-text" id="resultLink"></div>
            <button type="button" class="copy-btn" onclick="copyToClipboard()">Copy Link</button>
        </div>
        
        <div class="info-section">
            <p><strong>ℹ️ How to use:</strong></p>
            <p>1. Enter the long URL you want to shorten</p>
            <p>2. (Optional) Create a custom slug</p>
            <p>3. Click "Shorten URL"</p>
            <p><strong>TTL:</strong> Links expire after 30 days</p>
        </div>
        </div>
        
        <div class="tab-content" id="viewTab">
            <div id="linksContainer">
                <div class="empty-message">Loading links...</div>
            </div>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('shortenForm');
        const errorMsg = document.getElementById('errorMessage');
        const successMsg = document.getElementById('successMessage');
        const loadingInd = document.getElementById('loadingIndicator');
        const resultContainer = document.getElementById('resultContainer');
        const resultLink = document.getElementById('resultLink');
        
        function showError(message) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            successMsg.classList.remove('show');
            loadingInd.classList.remove('show');
        }
        
        function showSuccess(message) {
            successMsg.textContent = message;
            successMsg.classList.add('show');
            errorMsg.classList.remove('show');
            loadingInd.classList.remove('show');
        }
        
        function showLoading() {
            loadingInd.classList.add('show');
            errorMsg.classList.remove('show');
            successMsg.classList.remove('show');
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const url = document.getElementById('longUrl').value.trim();
            const slug = document.getElementById('customSlug').value.trim();
            
            if (!url) {
                showError('Please fill in the URL');
                return;
            }
            
            showLoading();
            
            try {
                const response = await fetch('/shorten', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: url,
                        slug: slug || undefined
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showError(data.error || 'Failed to shorten URL');
                    return;
                }
                
                resultLink.textContent = data.shortUrl;
                resultContainer.classList.add('show');
                showSuccess('✓ URL shortened successfully!');
                form.reset();
            } catch (error) {
                showError('Error: ' + error.message);
            }
        });
        
        function copyToClipboard() {
            const text = resultLink.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                btn.textContent = '✓ Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Copy Link';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
        
        function switchTab(tabName) {
            // Hide all tabs
            document.getElementById('createTab').classList.remove('active');
            document.getElementById('viewTab').classList.remove('active');
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            // Load links if viewing
            if (tabName === 'view') {
                loadLinks();
            }
        }
        
        async function loadLinks() {
            const container = document.getElementById('linksContainer');
            container.innerHTML = '<div class="empty-message">Loading links...</div>';
            
            try {
                const response = await fetch('/api/links');
                const data = await response.json();
                
                if (!response.ok || !data.links || data.links.length === 0) {
                    container.innerHTML = '<div class="empty-message">No links created yet</div>';
                    return;
                }
                
                let html = '<table class="links-table"><thead><tr><th>Slug</th><th>Original URL</th></tr></thead><tbody>';
                data.links.forEach(link => {
                    html += `<tr><td><code>${link.slug}</code></td><td>${link.url}</td></tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            } catch (error) {
                container.innerHTML = '<div class="empty-message">Error loading links: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>`;
}

// Generate 404 page
function generate404() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Link Not Found | Viet30926Links</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 60px 40px;
            text-align: center;
        }
        
        .error-code {
            font-size: 120px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
            line-height: 1;
        }
        
        .emoji {
            font-size: 80px;
            margin-bottom: 20px;
        }
        
        .error-title {
            font-size: 28px;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }
        
        .error-message {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .brand {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">😕</div>
        <div class="error-code">404</div>
        <div class="error-title">Link Not Found</div>
        <div class="error-message">
            The shortened link you're looking for doesn't exist or has expired.
            <br>Links expire after 30 days.
        </div>
        <a href="/" class="button">Back to Dashboard</a>
        <div class="brand">
            Powered by Viet30926Links 🚀
        </div>
    </div>
</body>
</html>`;
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
      // Route: GET /api/links - List all links (Public)
      if (pathname === '/api/links' && request.method === 'GET') {
        console.log('[LOG] List links request received');
        
        try {
          // Get list of all keys from KV
          const listResult = await env.VIET30926_DB.list();
          const links = [];
          
          // Fetch the actual URLs for each slug
          for (const key of listResult.keys) {
            const url = await env.VIET30926_DB.get(key.name);
            if (url) {
              links.push({
                slug: key.name,
                url: url
              });
            }
          }
          
          console.log('[LOG] Retrieved', links.length, 'links');
          
          return new Response(
            JSON.stringify({
              total: links.length,
              links: links,
              timestamp: new Date().toISOString()
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (e) {
          console.log('[ERROR] Failed to retrieve links from KV:', e.message);
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve links', links: [] }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: GET /api/stats - System Statistics (Public)
      if (pathname === '/api/stats' && request.method === 'GET') {
        console.log('[LOG] Stats request received');
        
        try {
          // Get list of all keys from KV
          const keys = await env.VIET30926_DB.list();
          const totalLinks = keys.keys.length;
          
          console.log('[LOG] Stats retrieved. Total links:', totalLinks);
          
          return new Response(
            JSON.stringify({
              total_links: totalLinks,
              system_status: 'active',
              timestamp: new Date().toISOString(),
              message: 'Viet30926Links system statistics'
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (e) {
          console.log('[ERROR] Failed to retrieve stats from KV:', e.message);
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve statistics' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: GET / - Dashboard
      if (pathname === '/' && request.method === 'GET') {
        console.log('[LOG] Dashboard accessed');
        return new Response(generateDashboard(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 200
        });
      }
      
      // Route: POST /shorten - Create shortened URL
      if (pathname === '/shorten' && request.method === 'POST') {
        console.log('[LOG] Shorten request received');
        
        // Parse request body
        let body;
        try {
          body = await request.json();
        } catch (e) {
          console.log('[ERROR] Invalid JSON in request body');
          return new Response(
            JSON.stringify({ error: 'Invalid JSON format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const { url: longUrl, slug: customSlug } = body;
        
        // Validate URL
        if (!longUrl || typeof longUrl !== 'string') {
          console.log('[WARN] Missing or invalid URL parameter');
          return new Response(
            JSON.stringify({ error: 'URL is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (!isValidUrl(longUrl)) {
          console.log('[WARN] Invalid URL format:', longUrl);
          return new Response(
            JSON.stringify({ error: 'Invalid URL format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Generate or validate slug
        let slug = customSlug || generateSlug();
        
        if (!isValidSlug(slug)) {
          console.log('[WARN] Invalid slug format:', slug);
          return new Response(
            JSON.stringify({ error: 'Invalid slug format. Only alphanumeric, hyphens, underscores (max 20 chars)' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Check if slug already exists
        const existing = await env.VIET30926_DB.get(slug);
        if (existing) {
          console.log('[WARN] Slug already exists:', slug);
          return new Response(
            JSON.stringify({ error: 'Slug already taken' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Save to KV
        try {
          await env.VIET30926_DB.put(slug, longUrl, {
            expirationTtl: EXPIRATION_TTL
          });
          
          const shortUrl = `${url.origin}/${slug}`;
          console.log('[LOG] URL shortened successfully. Slug:', slug, 'Original:', longUrl);
          
          return new Response(
            JSON.stringify({
              slug: slug,
              shortUrl: shortUrl,
              originalUrl: longUrl,
              expiresIn: `${DEFAULT_EXPIRATION_DAYS} days`
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (e) {
          console.log('[ERROR] Failed to save to KV:', e.message);
          return new Response(
            JSON.stringify({ error: 'Failed to create shortened link' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: GET /:slug - Redirect to original URL
      if (pathname !== '/' && request.method === 'GET') {
        const slug = pathname.substring(1);
        console.log('[LOG] Redirect request for slug:', slug);
        
        try {
          const longUrl = await env.VIET30926_DB.get(slug);
          
          if (!longUrl) {
            console.log('[LOG] Slug not found:', slug);
            return new Response(generate404(), {
              status: 404,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
          
          console.log('[LOG] Redirecting slug:', slug, 'to:', longUrl);
          return new Response(null, {
            status: 302,
            headers: { 'Location': longUrl }
          });
        } catch (e) {
          console.log('[ERROR] Error retrieving slug from KV:', e.message);
          return new Response(generate404(), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }
      
      // Route: All other requests - 404
      console.log('[LOG] Not found:', pathname);
      return new Response(generate404(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
      
    } catch (error) {
      console.log('[ERROR] Unhandled error:', error.message);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
