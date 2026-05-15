/**
 * Viet30926Links - Cloudflare Workers URL Shortener
 * Custom Domain: links.viet30926.qzz.io
 * Optimized for Edge Performance & Enhanced Security
 * Links Storage: Permanent (No Expiration)
 */

const CUSTOM_DOMAIN = 'links.viet30926.qzz.io';
const RATE_LIMIT_REQUESTS = 50;
const RATE_LIMIT_WINDOW = 3600; // 1 hour

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

// Helper: Get client IP for rate limiting
function getClientIP(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
}

// Helper: Check API Key
function verifyApiKey(request, apiKey) {
  const headerKey = request.headers.get('x-api-key');
  return headerKey === apiKey;
}

// Generate HTML Dashboard (Simplified)
function generateDashboard() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viet30926Links</title>
    <style>
        * {margin:0;padding:0;box-sizing:border-box}
        body {font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .container {background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:600px;width:100%;padding:40px}
        .header {text-align:center;margin-bottom:40px}
        .logo {font-size:48px;margin-bottom:15px}
        .title {font-size:32px;font-weight:700;color:#333;margin-bottom:8px}
        .subtitle {font-size:14px;color:#666}
        .form-group {margin-bottom:20px}
        label {display:block;margin-bottom:8px;font-weight:600;color:#333;font-size:14px}
        input {width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:6px;font-size:14px;transition:all 0.3s ease}
        input:focus {outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,0.1)}
        button {padding:12px 20px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;transition:all 0.3s ease;width:100%}
        button:hover {transform:translateY(-2px);box-shadow:0 10px 20px rgba(102,126,234,0.3)}
        .result-container {background:#f5f9ff;border:2px solid #667eea;border-radius:6px;padding:20px;margin-bottom:20px;display:none}
        .result-container.show {display:block;animation:slideIn 0.3s ease}
        @keyframes slideIn {from {opacity:0;transform:translateY(-10px)} to {opacity:1;transform:translateY(0)}}
        .result-label {font-size:12px;color:#666;margin-bottom:5px;font-weight:600}
        .result-text {font-size:14px;color:#333;word-break:break-all;font-family:monospace;background:white;padding:10px;border-radius:4px;margin-bottom:10px}
        .copy-btn {background:#667eea;color:white;padding:8px 12px;border:none;border-radius:4px;font-size:12px;cursor:pointer;font-weight:600;transition:all 0.3s ease;width:auto;float:right}
        .copy-btn:hover {background:#764ba2}
        .copy-btn.copied {background:#4caf50}
        .msg {padding:12px;border-radius:6px;margin-bottom:20px;display:none;animation:slideIn 0.3s ease}
        .msg.show {display:block}
        .error {background:#fee;color:#c33;border-left:4px solid #c33}
        .success {background:#efe;color:#3c3;border-left:4px solid #3c3}
        .info {background:#f0f4ff;padding:15px;border-radius:6px;font-size:13px;color:#555;line-height:1.6}
        .info p {margin-bottom:8px}
        .info code {background:white;padding:2px 6px;border-radius:3px;font-family:monospace;color:#667eea}
        small {color:#999;font-size:12px;display:block;margin-top:5px}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀</div>
            <div class="title">Viet30926Links</div>
            <div class="subtitle">Make your URLs shorter, smarter & faster</div>
        </div>
        
        <div id="errorMsg" class="msg error"></div>
        <div id="successMsg" class="msg success"></div>
        
        <form id="shortenForm">
            <div class="form-group">
                <label for="longUrl">URL dài *</label>
                <input type="url" id="longUrl" placeholder="https://example.com/very/long/url" required>
            </div>
            
            <div class="form-group">
                <label for="customSlug">Slug tùy chỉnh (tùy chọn)</label>
                <input type="text" id="customSlug" placeholder="ví dụ: my-link">
                <small>Chỉ chữ cái, số, gạch nối và dấu gạch dưới (tối đa 20 ký tự)</small>
            </div>
            
            <div class="form-group">
                <label for="apiKey">API Key *</label>
                <input type="password" id="apiKey" placeholder="Nhập API key của bạn" required>
                <small>Cần API Key để tạo link rút gọn</small>
            </div>
            
            <button type="submit">Rút gọn URL</button>
        </form>
        
        <div class="result-container" id="resultContainer">
            <div class="result-label">Link rút gọn của bạn:</div>
            <div class="result-text" id="resultLink"></div>
            <button type="button" class="copy-btn" onclick="copyToClipboard()">Sao chép</button>
            <div style="clear:both"></div>
        </div>
        
        <div class="info">
            <p><strong>ℹ️ Cách sử dụng:</strong></p>
            <p>1. Nhập API Key (được cấp bởi quản trị viên)</p>
            <p>2. Nhập URL dài mà bạn muốn rút gọn</p>
            <p>3. (Tùy chọn) Tạo slug tùy chỉnh</p>
            <p>4. Nhấp "Rút gọn URL"</p>
            <p><strong>Lưu trữ:</strong> Links được lưu vĩnh viễn</p>
            <p><strong>Rate Limit:</strong> 50 requests/giờ</p>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('shortenForm');
        const errorMsg = document.getElementById('errorMsg');
        const successMsg = document.getElementById('successMsg');
        const resultContainer = document.getElementById('resultContainer');
        const resultLink = document.getElementById('resultLink');
        
        function showError(msg) {
            errorMsg.textContent = msg;
            errorMsg.classList.add('show');
            successMsg.classList.remove('show');
        }
        
        function showSuccess(msg) {
            successMsg.textContent = msg;
            successMsg.classList.add('show');
            errorMsg.classList.remove('show');
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('longUrl').value.trim();
            const slug = document.getElementById('customSlug').value.trim();
            const apiKey = document.getElementById('apiKey').value.trim();
            
            if (!url) {
                showError('Vui lòng nhập URL');
                return;
            }
            
            if (!apiKey) {
                showError('Vui lòng nhập API Key');
                return;
            }
            
            try {
                const res = await fetch('/shorten', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey
                    },
                    body: JSON.stringify({ url, slug: slug || undefined })
                });
                
                const data = await res.json();
                if (!res.ok) {
                    showError(data.error || 'Lỗi');
                    return;
                }
                
                resultLink.textContent = data.shortUrl;
                resultContainer.classList.add('show');
                showSuccess('✓ URL đã rút gọn thành công!');
                form.reset();
            } catch (e) {
                showError('Lỗi: ' + e.message);
            }
        });
        
        function copyToClipboard() {
            const text = resultLink.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                btn.textContent = '✓ Đã sao chép!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Sao chép';
                    btn.classList.remove('copied');
                }, 2000);
            });
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
    <title>404 - Viet30926Links</title>
    <style>
        * {margin:0;padding:0;box-sizing:border-box}
        body {font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .container {background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%;padding:60px 40px;text-align:center}
        .error-code {font-size:120px;font-weight:700;color:#667eea;margin-bottom:10px;line-height:1}
        .emoji {font-size:80px;margin-bottom:20px}
        .error-title {font-size:28px;font-weight:700;color:#333;margin-bottom:15px}
        .error-message {font-size:16px;color:#666;margin-bottom:30px;line-height:1.6}
        .button {display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;transition:all 0.3s ease}
        .button:hover {transform:translateY(-2px);box-shadow:0 10px 20px rgba(102,126,234,0.3)}
        .brand {margin-top:40px;padding-top:20px;border-top:2px solid #e0e0e0;color:#999;font-size:12px}
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">😕</div>
        <div class="error-code">404</div>
        <div class="error-title">Link không tìm thấy</div>
        <div class="error-message">
            Link rút gọn bạn đang tìm không tồn tại.<br>
            Vui lòng kiểm tra lại slug.
        </div>
        <a href="/" class="button">Quay lại Dashboard</a>
        <div class="brand">Viet30926Links 🚀</div>
    </div>
</body>
</html>`;
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const clientIP = getClientIP(request);
    const apiKey = env.API_KEY || 'default-secret-key';
    
    try {
      // Route: GET / - Dashboard
      if (pathname === '/' && request.method === 'GET') {
        return new Response(generateDashboard(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 200
        });
      }
      
      // Route: POST /shorten - Create shortened URL with API Key
      if (pathname === '/shorten' && request.method === 'POST') {
        // Verify API Key
        if (!verifyApiKey(request, apiKey)) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Invalid or missing API key' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Rate limiting check
        const rateLimitKey = `ratelimit:${clientIP}`;
        const rateLimitData = await env.VIET30926_DB.get(rateLimitKey);
        const now = Math.floor(Date.now() / 1000);
        
        let rateLimitInfo = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
        if (rateLimitData) {
          rateLimitInfo = JSON.parse(rateLimitData);
          if (now < rateLimitInfo.resetTime && rateLimitInfo.count >= RATE_LIMIT_REQUESTS) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Max 50 requests per hour' }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (now >= rateLimitInfo.resetTime) {
            rateLimitInfo = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
          } else {
            rateLimitInfo.count++;
          }
        } else {
          rateLimitInfo = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        }
        
        await env.VIET30926_DB.put(rateLimitKey, JSON.stringify(rateLimitInfo), { 
          expirationTtl: RATE_LIMIT_WINDOW + 10 
        });
        
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const { url: longUrl, slug: customSlug } = body;
        
        if (!longUrl || typeof longUrl !== 'string') {
          return new Response(
            JSON.stringify({ error: 'URL is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (!isValidUrl(longUrl)) {
          return new Response(
            JSON.stringify({ error: 'Invalid URL format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        let slug = customSlug || generateSlug();
        
        if (!isValidSlug(slug)) {
          return new Response(
            JSON.stringify({ error: 'Invalid slug format. Max 20 chars, alphanumeric, hyphens, underscores only' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const existing = await env.VIET30926_DB.get(slug);
        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Slug already taken' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          const linkData = JSON.stringify({
            url: longUrl,
            created: new Date().toISOString(),
            clicks: 0
          });
          
          await env.VIET30926_DB.put(slug, linkData);
          
          const shortUrl = `https://${CUSTOM_DOMAIN}/${slug}`;
          
          return new Response(
            JSON.stringify({
              slug,
              shortUrl,
              originalUrl: longUrl,
              permanent: true,
              createdAt: new Date().toISOString()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: 'Failed to create shortened link' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: GET /api/stats - System Statistics
      if (pathname === '/api/stats' && request.method === 'GET') {
        try {
          const listResult = await env.VIET30926_DB.list();
          const totalLinks = listResult.keys.filter(k => !k.name.startsWith('ratelimit:')).length;
          
          return new Response(
            JSON.stringify({
              total_links: totalLinks,
              system_status: 'active',
              domain: CUSTOM_DOMAIN,
              storage: 'permanent',
              timestamp: new Date().toISOString()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve stats' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: DELETE /api/links/:slug - Delete link with API Key
      if (pathname.startsWith('/api/links/') && request.method === 'DELETE') {
        if (!verifyApiKey(request, apiKey)) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Invalid or missing API key' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const slug = pathname.split('/api/links/')[1];
        
        try {
          const existing = await env.VIET30926_DB.get(slug);
          if (!existing) {
            return new Response(
              JSON.stringify({ error: 'Link not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }
          
          await env.VIET30926_DB.delete(slug);
          
          return new Response(
            JSON.stringify({ message: 'Link deleted successfully', slug }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: 'Failed to delete link' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Route: GET /:slug - Redirect to original URL with click tracking
      if (pathname !== '/' && !pathname.startsWith('/api') && request.method === 'GET') {
        const slug = pathname.substring(1);
        
        try {
          const linkDataStr = await env.VIET30926_DB.get(slug);
          
          if (!linkDataStr) {
            return new Response(generate404(), {
              status: 404,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
          
          const linkData = JSON.parse(linkDataStr);
          const longUrl = linkData.url || linkDataStr; // Backward compatibility
          
          // Track click asynchronously
          ctx.waitUntil(
            (async () => {
              try {
                const updated = JSON.stringify({
                  url: longUrl,
                  created: linkData.created || new Date().toISOString(),
                  clicks: (linkData.clicks || 0) + 1
                });
                await env.VIET30926_DB.put(slug, updated);
              } catch (e) {
                // Silently fail click tracking
              }
            })()
          );
          
          return new Response(null, {
            status: 302,
            headers: { 'Location': longUrl }
          });
        } catch {
          return new Response(generate404(), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }
      
      // Default: 404
      return new Response(generate404(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
      
    } catch {
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
