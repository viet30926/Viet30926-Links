# 🏗️ Architecture & Design - Viet30926Links

Deep dive vào kiến trúc và thiết kế của Viet30926Links Worker.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│           Cloudflare Edge Network                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Viet30926Links Worker                        │  │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │ Request Router                          │  │
│  │  │ ├─ GET / → Dashboard                    │  │
│  │  │ ├─ POST /shorten → Create Link          │  │
│  │  │ ├─ GET /:slug → Redirect                │  │
│  │  │ └─ * → 404                              │  │
│  │  └─────────────────────────────────────────┘  │
│  │                    ↓                           │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │ Business Logic                          │  │
│  │  │ ├─ validateUrl()                        │  │
│  │  │ ├─ validateSlug()                       │  │
│  │  │ └─ generateSlug()                       │  │
│  │  └─────────────────────────────────────────┘  │
│  │                    ↓                           │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │ Storage Layer (KV)                      │  │
│  │  │ binding: VIET30926_DB                   │  │
│  │  │ ttl: 30 days (2592000 sec)              │  │
│  │  └─────────────────────────────────────────┘  │
│  └───────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
         │
         ├─→ Response HTML/JSON → Client
         └─→ Redirect 302 → Original URL
```

---

## 🔄 Request Flow Diagram

### GET / - Dashboard Flow

```
Client Request: GET /
        ↓
    Routing Check
    pathname === '/' && method === GET
        ↓
    Generate HTML Dashboard
    (with inline CSS/JS)
        ↓
    Return Response {
        status: 200,
        headers: {'Content-Type': 'text/html'},
        body: Dashboard HTML
    }
        ↓
    Client receives Dashboard
    (Load in browser)
```

### POST /shorten - Create Link Flow

```
Client Request: POST /shorten
    Headers: x-api-key, Content-Type: application/json
    Body: {"url": "https://...", "slug": "optional"}
        ↓
    API Key Validation
    request.headers.get('x-api-key') === env.API_KEY
        ↓
    [Invalid? → Return 401 Unauthorized]
        ↓
    Parse Request JSON
    body = await request.json()
        ↓
    [Invalid JSON? → Return 400]
        ↓
    Validate URL
    isValidUrl(longUrl)
        ↓
    [Invalid? → Return 400]
        ↓
    Generate/Validate Slug
    slug = customSlug || generateSlug()
    isValidSlug(slug)
        ↓
    [Invalid? → Return 400]
        ↓
    Check Slug Doesn't Exist
    await env.VIET30926_DB.get(slug)
        ↓
    [Already exists? → Return 409 Conflict]
        ↓
    Save to KV
    await env.VIET30926_DB.put(slug, longUrl, {
        expirationTtl: 2592000  // 30 days
    })
        ↓
    Return Success Response {
        status: 200,
        body: {
            slug, shortUrl, originalUrl, expiresIn
        }
    }
```

### GET /:slug - Redirect Flow

```
Client Request: GET /myslug
        ↓
    Extract Slug
    slug = pathname.substring(1)  // "myslug"
        ↓
    Lookup in KV
    longUrl = await env.VIET30926_DB.get(slug)
        ↓
    [Not found? → Return 404 HTML]
        ↓
    Return Redirect Response {
        status: 302,
        headers: {'Location': longUrl}
    }
        ↓
    Browser follows redirect
    → User lands on original URL
```

---

## 💾 Data Storage Design

### KV Namespace Structure

```
KV Store (VIET30926_DB)
│
├─ Key: "google"
│  Value: "https://www.google.com"
│  TTL: 2592000 seconds (30 days)
│  Auto-expires: 2024-01-15
│
├─ Key: "my-github"
│  Value: "https://github.com/viet30926"
│  TTL: 2592000 seconds
│  Auto-expires: 2024-01-15
│
├─ Key: "aBcDeF"
│  Value: "https://example.com/very/long/url"
│  TTL: 2592000 seconds
│  Auto-expires: 2024-01-15
│
└─ Key: "expired-slug"
   Value: (auto-deleted by Cloudflare)
   TTL expired on: 2024-12-16

```

### Why KV for This Use Case?

✅ **Advantages:**
- Ultra-fast reads at Edge (no network latency)
- Automatic TTL expiration (no cleanup needed)
- Global replication (requests served from closest Edge location)
- Built-in redundancy
- No database to manage
- Cheap at scale

❌ **Limitations:**
- No complex querying (only key lookups)
- Limited to string values
- Eventual consistency (slight delay in replication)

---

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────┐
│ POST /shorten Request                   │
└─────────────────────────────────────────┘
                ↓
    Extract Header: x-api-key
                ↓
    Compare with env.API_KEY
    (secret stored in Cloudflare secrets)
                ↓
            ┌───┴───┐
            ↓       ↓
        [Match]  [No Match]
            ↓       ↓
        Continue  Return 401
                ↓
        Proceed to create link
```

### Secrets Management

```
Production Secrets (Cloudflare):
│
└─ API_KEY (encrypted, never exposed)
   Set via: wrangler secret put API_KEY

Development Secrets (.dev.vars):
│
└─ API_KEY (local file, Git-ignored)
   File: .dev.vars (in .gitignore)
```

### Input Validation (Defense in Depth)

```
                    ↓
        API_KEY Check
            ↓
        URL Validation
        ├─ Must be string
        ├─ Must be valid URL format
        └─ new URL(url) doesn't throw
            ↓
        Slug Validation
        ├─ Must match /^[a-zA-Z0-9_-]{1,20}$/
        └─ Prevent injection/special chars
            ↓
        KV Existence Check
        ├─ Prevents slug collision
        └─ Atomic check + insert
            ↓
        Safe to Store
```

---

## ⚡ Performance Optimization

### 1. Edge Computation
```
Traditional URL Shortener:
Client → Network → Server → Database → Network → Client
Latency: 100-500ms

Viet30926Links (Edge):
Client → Nearest Cloudflare Edge ← Database (local to edge)
Latency: 5-50ms
```

### 2. Inline CSS/JavaScript
```javascript
// Instead of external file requests:
// ❌ <link href="styles.css">
// ❌ <script src="app.js"></script>

// ✅ Inline in HTML:
<style>/* all CSS here */</style>
<script>/* all JS here */</script>

// Benefits:
// - 0 additional HTTP requests
// - Faster initial page load
// - No external dependencies
```

### 3. KV Caching
```
KV is naturally cached:
First request → KV lookup → Edge cache
Second request → Served from cache (no KV hit)

Result: Subsequent requests < 1ms
```

### 4. Minimal JSON Overhead
```javascript
// ✅ Only necessary fields
{
  "slug": "mylink",
  "shortUrl": "...",
  "originalUrl": "...",
  "expiresIn": "30 days"
}

// ❌ Avoid unnecessary fields
{
  "id": "abc123",
  "timestamp": "2024-12-08T10:20:30Z",
  "userId": "...",
  "metadata": {...}
}
```

---

## 🛡️ Error Handling Strategy

### Layered Error Handling

```
Try-Catch Block
├─ Outer catch: Catches ALL unexpected errors
│  └─ Returns 500 with error details
│
Request Handler
├─ API Key validation error → 401
├─ JSON parse error → 400
├─ URL validation error → 400
├─ Slug validation error → 400
├─ Slug exists error → 409
├─ KV storage error → 500
└─ 404 for not found routes
```

### Error Response Format

```javascript
// All errors return JSON with 'error' field
{
  "error": "Human-readable error message"
}

// Example responses:
400: {"error": "Invalid URL format"}
401: {"error": "Unauthorized: Invalid API key"}
409: {"error": "Slug already taken"}
404: {"error": "..."}  // HTML page instead
```

### Logging for Debugging

```javascript
// Log types:
[LOG] = Normal operation logged
[WARN] = Potential issues worth attention
[ERROR] = Actual errors occurred

Examples:
[LOG] Dashboard accessed
[LOG] Shorten request received
[LOG] URL shortened successfully
[WARN] Unauthorized shorten request
[ERROR] Failed to save to KV: connection timeout
```

---

## 📈 Scalability Considerations

### Request Scaling

```
How many requests per second?

Cloudflare Free Plan:
- 100,000 requests/day ≈ 1.15 req/sec
- KV: 100,000 read ops/day

Cloudflare Pro:
- Unlimited requests (billed per unit)
- KV: Millions of ops/sec

Typical usage:
- Small: 10-100 req/sec (thousands of links)
- Medium: 100-1,000 req/sec (millions of links)
- Large: 1,000+ req/sec (billions of links)

KV can handle all sizes!
```

### Data Scaling

```
How much data can we store?

KV Storage Limits:
- Value size: Up to 25 MB per key
- For URLs: Easily <1KB per entry
- 1 GB = 1,000,000 typical URL entries
- Cloudflare KV: Unlimited storage (plan-based)

Example:
- 1 million links @ ~100 bytes each
- = ~100 MB KV usage
- = Trivial cost
```

### Geographic Distribution

```
Without Viet30926Links:
User in Tokyo → Server in US → 150ms latency

With Viet30926Links:
User in Tokyo → Tokyo Cloudflare Edge → 5ms latency
User in London → London Edge → 5ms latency
User in Brazil → Brazil Edge → 5ms latency

All automated by Cloudflare!
```

---

## 🔄 Code Flow Summary

### File Structure
```
worker.js (ES Modules)
│
├─ Helper Functions (lines 1-50)
│  ├─ generateSlug()
│  ├─ isValidUrl()
│  └─ isValidSlug()
│
├─ UI Generation (lines 51-400)
│  ├─ generateDashboard()
│  └─ generate404()
│
└─ Request Handler (lines 401-end)
   ├─ Main export default function
   ├─ GET / handler
   ├─ POST /shorten handler
   ├─ GET /:slug handler
   └─ Error handling (try-catch)
```

### Execution Order for POST /shorten

```
1. check if pathname === '/shorten' && method === 'POST'
2. extract API_KEY header
3. compare with env.API_KEY
4. parse request.json()
5. extract url and slug
6. validate url with isValidUrl()
7. generate/validate slug
8. check if slug exists in KV
9. put to KV with TTL
10. return response with shortUrl
11. catch any errors and return 500
```

---

## 🧪 Testing Strategy

### Unit-like Testing (via API)

```
Test Categories:
├─ Happy Path
│  ├─ Create with auto slug
│  └─ Create with custom slug
├─ Redirect
│  ├─ Valid slug
│  └─ Not found
└─ Error Cases
   ├─ Invalid API key
   ├─ Invalid URL
   ├─ Invalid slug
   ├─ Duplicate slug
   └─ Invalid JSON
```

### Edge Cases to Consider

```
✓ Very long URL (> 1000 chars)
✓ Unicode characters in URL
✓ Very long slug (testing max 20)
✓ Single character slug
✓ Slug with numbers only
✓ URL with query parameters
✓ URL with fragments
✓ Case sensitivity (MySlug vs myslug)
✗ Concurrent create same slug
  (KV handles atomically)
```

---

## 🚀 Production Considerations

### Monitoring
```
What to monitor:
- Request rate (should be smooth)
- Error rate (should be < 1%)
- P95 latency (should be < 100ms)
- KV errors

Tools:
- Cloudflare Analytics
- wrangler tail
- Custom logging
```

### Maintenance
```
Regular tasks:
- Monitor KV usage
- Rotate API key (every 90 days)
- Check error logs
- Review security

Optional:
- Archive old data
- Audit link usage
- Update links if needed
```

### Disaster Recovery
```
Backup strategy:
- Export KV data periodically
  (via API or custom script)
- Store in Git or backup service
  
Recovery:
- Redeploy worker
- Restore KV data if needed
- System recovers automatically
```

---

## 📚 Design Patterns Used

### 1. Request Router Pattern
```javascript
if (pathname === '/' && method === 'GET') {
  // Handle GET /
} else if (pathname === '/shorten' && method === 'POST') {
  // Handle POST /shorten
} else {
  // 404
}
```

### 2. Validation Pipeline Pattern
```javascript
// Validate each step, fail fast
if (!apiKey) return 401;
if (!isValidUrl(url)) return 400;
if (!isValidSlug(slug)) return 400;
if (await exists(slug)) return 409;
```

### 3. Edge Computing Pattern
```javascript
// No backend needed
// All compute at edge
// Direct access to KV at edge
// Results: Ultra-fast everywhere
```

### 4. TTL Cleanup Pattern
```javascript
// Instead of scheduled cleanup:
await kv.put(key, value, {
  expirationTtl: 30 * 24 * 60 * 60
});
// Cloudflare auto-deletes after TTL
// No cron, no cleanup code needed
```

---

## 🎯 Future Enhancement Ideas

```
Potential additions:
1. Analytics tracking
   - Track redirect count per link
   - No storage needed (HTTP logs)

2. QR Code generation
   - Generate QR on-the-fly

3. Custom domain support
   - route.com/slug instead of worker domain

4. Link preview
   - OG tags from original URL

5. Admin dashboard
   - Link management (view, delete, expire)
   - API usage stats

6. Rate limiting
   - Per API key rate limits
   - Prevent abuse

7. Webhook notifications
   - Notify when link is used
   - Usage statistics
```

**Note:** Current design supports all of these with minimal changes!

---

## 📖 Design Philosophy

### Principles Used

1. **Simplicity First**
   - Single file, minimal dependencies
   - Easy to understand and modify

2. **Edge First**
   - Everything at edge, nothing in origin
   - No cold starts, instant everywhere

3. **Security by Default**
   - API key required for mutations
   - Input validation on everything
   - Errors don't leak sensitive info

4. **Performance Always**
   - Inline CSS/JS
   - Minimal JSON
   - Natural caching via KV

5. **Observability**
   - Comprehensive logging
   - Error tracking
   - Easy debugging

---

**Last Updated:** 2024-12-16  
**Version:** 1.0.0
