# 🚀 Viet30926Links - URL Shortener

Một hệ thống rút gọn link hiện đại & nhanh chóng được xây dựng trên **Cloudflare Workers**, tối ưu hóa để chạy tại Edge với hiệu suất tuyệt vời.

## ✨ Tính Năng

### Theo dõi Cơ bản
- ✅ **GET /** - Dashboard HTML hiện đại với giao diện đẹp
- ✅ **POST /shorten** - Tạo link rút gọn với xác thực API Key
- ✅ **GET /:slug** - Redirect 302 tới URL gốc
- ✅ **404 Page** - Trang lỗi có style Viet30926Links

### Tính Năng Nâng Cao
- 🔐 **Xác thực API Key** - Header `x-api-key` bắt buộc
- 📦 **KV Storage** - Lưu trữ link trong Cloudflare KV Namespace
- ⏰ **TTL Mặc định** - Links tự động hết hạn sau 30 ngày
- 🎨 **Dashboard Interaktif** - UI đẹp mắt, responsive design
- 📝 **Slug tùy chỉnh** - Hỗ trợ slug tùy chỉnh hoặc tự động sinh
- 🚀 **Edge Performance** - Chạy tại Edge, độ trễ cực thấp
- 🛡️ **Error Handling** - Try-Catch toàn diện
- 📊 **Logging** - Console logs để theo dõi

## 🛠️ Cài Đặt & Triển Khai

### 1. Prerequisites
- Node.js 16+ 
- `wrangler` CLI: `npm install -g wrangler`
- Cloudflare account

### 2. Clone Repository
```bash
git clone <repo-url>
cd Viet30926-Links
```

### 3. Cấu Hình Cloudflare

#### Tạo KV Namespace
```bash
# Preview Namespace (testing)
wrangler kv:namespace create VIET30926_DB --preview

# Production Namespace
wrangler kv:namespace create VIET30926_DB

# Lấy ID từ output và update trong wrangler.toml
```

#### Cấu Hình API Key
```bash
# Set secret API_KEY
wrangler secret put API_KEY --env production
# Nhập API key của bạn tại terminal prompt
# Ví dụ: super-secret-key-12345
```

### 4. Update wrangler.toml
Substitute `your_kv_namespace_id_here` với ID thực từ bước trên:
```toml
[[kv_namespaces]]
binding = "VIET30926_DB"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"  # Replace this
```

### 5. Deploy
```bash
# Deploy tới production
wrangler deploy --env production

# Hoặc deploy tới development
wrangler deploy --env development

# Local testing
wrangler dev
```

## 📖 API Documentation

### 1. GET / - Dashboard
Truy cập giao diện chính của hệ thống.

**Request:**
```bash
curl https://your-worker.workers.dev/
```

**Response:** HTML Dashboard

---

### 2. POST /shorten - Tạo Link Rút Gọn

**Request:**
```bash
curl -X POST https://your-worker.workers.dev/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "url": "https://example.com/very/long/url/that/needs/shortening",
    "slug": "mylink"
  }'
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | ✅ Yes | URL gốc cần rút gọn (phải là URL hợp lệ) |
| `slug` | string | ❌ Optional | Slug tùy chỉnh (1-20 chars: a-z, A-Z, 0-9, -, _) |

**Response Success (200):**
```json
{
  "slug": "mylink",
  "shortUrl": "https://your-worker.workers.dev/mylink",
  "originalUrl": "https://example.com/very/long/url/that/needs/shortening",
  "expiresIn": "30 days"
}
```

**Response Errors:**
- `400` - URL hoặc slug không hợp lệ
- `401` - API key không đúng
- `409` - Slug đã tồn tại
- `500` - Lỗi server

**Examples:**

```bash
# Với slug tự động
curl -X POST https://your-worker.workers.dev/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"url": "https://example.com/long/url"}'

# Với custom slug
curl -X POST https://your-worker.workers.dev/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "url": "https://example.com/long/url",
    "slug": "viet2024"
  }'
```

---

### 3. GET /:slug - Redirect

**Request:**
```bash
curl -L https://your-worker.workers.dev/mylink
```

**Response:**
- `302 Found` - Redirect tới URL gốc (nếu slug tồn tại)
- `404 Not Found` - Slug không tồn tại hoặc đã hết hạn

---

## 🔐 Bảo Mật

### API Key Management

**Production Setup:**
```bash
# Đặt API key securely
wrangler secret put API_KEY --env production

# Verify (không hiển thị giá trị)
wrangler secret list --env production
```

**Rotation Best Practices:**
- Change API key định kỳ (ví dụ: mỗi 90 ngày)
- Không commit secrets vào Git
- Dùng `.gitignore` cho các file sensitive

---

## 📊 Console Logging

Worker sử dụng console logs để tracking, viewable qua:

```bash
# Xem realtime logs
wrangler tail --env production

# Hoặc qua Cloudflare Dashboard
# Workers > your-worker > Real-time logs
```

**Log Examples:**
```
[LOG] Dashboard accessed
[LOG] Shorten request received
[LOG] URL shortened successfully. Slug: mylink
[LOG] Redirect request for slug: mylink
[WARN] Unauthorized shorten request - invalid API key
[ERROR] Failed to save to KV: ...
```

---

## 🎯 Code Structure

```
worker.js
├── Helper Functions
│   ├── generateSlug() - Random 6-char slug
│   ├── isValidUrl() - URL validation
│   └── isValidSlug() - Slug validation
├── UI Generation
│   ├── generateDashboard() - Main UI
│   └── generate404() - 404 page
└── Request Handler
    ├── GET / → Dashboard
    ├── POST /shorten → Create link
    ├── GET /:slug → Redirect
    └── Error Handling & Logging
```

---

## 🚀 Optimization Tips

### Edge Performance

Worker đã được tối ưu hóa cho Edge:
- ✅ Minimal dependencies
- ✅ Efficient KV lookups
- ✅ Inline styling (no external CSS)
- ✅ Fast redirect responses
- ✅ Minimal JSON operations

### Monitoring & Scaling

```bash
# View analytics
# Cloudflare Dashboard > Analytics & Logs

# Monitor errors
wrangler tail --status error --env production

# Check storage usage
wrangler kv:key list --namespace-id=<id> | wc -l
```

---

## 📋 Checklist Deployment

- [ ] Create KV Namespace
- [ ] Set API_KEY secret
- [ ] Update wrangler.toml with KV ID
- [ ] Run `wrangler deploy --env production`
- [ ] Verify dashboard loads at `https://your-worker.workers.dev/`
- [ ] Test shorten endpoint with curl
- [ ] Test redirect with created link
- [ ] Check logs: `wrangler tail --env production`

---

## 🐛 Troubleshooting

### Issue: "Unauthorized: Invalid API key"
**Solution:** 
- Verify API key is set: `wrangler secret list`
- Check header: `x-api-key` (not `x-api-Key` or `X-API-KEY`)
- Make sure using correct key from production

### Issue: Slug already taken (409)
**Solution:** 
- Choose different slug
- Or let system auto-generate (omit slug param)

### Issue: "Invalid URL format"
**Solution:**
- URL must start with `http://` or `https://`
- Example: `https://example.com` ✅ vs `example.com` ❌

### Issue: Links not persisting
**Solution:**
- Verify KV namespace binding in wrangler.toml
- Check KV namespace exists: `wrangler kv:namespace list`
- View stored keys: `wrangler kv:key list --namespace-id=<id>`

---

## 📝 Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VIET30926_DB` | KV Binding | ✅ | KV Namespace binding for storage |
| `API_KEY` | Secret | ✅ | API key for authentication |

---

## 🌍 Usage Example (JavaScript/Node.js)

```javascript
const API_KEY = 'your-api-key';
const WORKER_URL = 'https://your-worker.workers.dev';

async function shortenUrl(longUrl, customSlug = null) {
  const payload = { url: longUrl };
  if (customSlug) payload.slug = customSlug;

  const response = await fetch(`${WORKER_URL}/shorten`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const result = await shortenUrl('https://example.com/long/url');
  console.log('Short URL:', result.shortUrl);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## 📄 License

MIT

---

## 👨‍💻 Author

**Viet30926Links System**  
Built with ❤️ for Edge Performance

---

## 🔗 Useful Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [KV Storage API](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)

---

**Last Updated:** 2024-12-16  
**Version:** 1.0.0