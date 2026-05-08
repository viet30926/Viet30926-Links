# 🚀 Hướng Dẫn Triển Khai Viet30926Links

Tài liệu chi tiết để triển khai Viet30926Links trên Cloudflare Workers.

## 📋 Bước 1: Chuẩn Bị

### 1.1 Cài Đặt Tools
```bash
# Cài Node.js (nếu chưa có)
# Macbook:
brew install node

# Ubuntu/Debian:
sudo apt update && sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

### 1.2 Cài Đặt Wrangler
```bash
npm install -g wrangler

# Verify
wrangler --version
```

### 1.3 Tạo Cloudflare Account
- Đến https://dash.cloudflare.com
- Sign up hoặc login
- Xác nhận email

---

## 🔧 Bước 2: Cấu Hình Cloudflare

### 2.1 Login với Wrangler
```bash
wrangler login
# Mở browser, authorize
# Bạn sẽ nhận thông báo khi hoàn thành
```

### 2.2 Tạo KV Namespace

#### a) Tạo Namespace cho Development
```bash
wrangler kv:namespace create VIET30926_DB --preview
```

Output sẽ giống như:
```
✓ Created namespace for preview VIET30926_DB
Preview Namespace ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Sao chép ID này**, chúng ta sẽ dùng nó sau.

#### b) Tạo Namespace cho Production
```bash
wrangler kv:namespace create VIET30926_DB
```

Output sẽ giống như:
```
✓ Created namespace VIET30926_DB
Namespace ID: z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

**Sao chép ID này** cho production.

### 2.3 Cấu Hình wrangler.toml

Mở file `wrangler.toml` và update:

```toml
name = "viet30926-links"
main = "worker.js"
compatibility_date = "2024-12-16"
compatibility_flags = ["nodejs_compat"]

# PREVIEW (Development)
[[env.development.kv_namespaces]]
binding = "VIET30926_DB"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"  # Your preview ID
preview_id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# PRODUCTION
[[env.production.kv_namespaces]]
binding = "VIET30926_DB"
id = "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"  # Your production ID

[env.production]
vars = { ENVIRONMENT = "production" }

[env.development]
vars = { ENVIRONMENT = "development" }
```

---

## 🔐 Bước 3: Cấu Hình API Key

### 3.1 Development (Local Testing)

Tạo file `.dev.vars` từ template:
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
API_KEY=my-super-secret-dev-key
```

**⚠️ IMPORTANT:** Đừng commit `.dev.vars` vào Git (đã có trong `.gitignore`)

### 3.2 Production (Deployment)

```bash
# Thiết lập API Key cho production
wrangler secret put API_KEY --env production

# Terminal sẽ yêu cầu:
# ? Enter a secret:
# [Nhập API key của bạn]
# [Nhấn Enter]

# Verify key đã được thiết lập
wrangler secret list --env production
# Output:
# API_KEY (encrypted)
```

**⚠️ SECURITY:** Không ai khác có thể xem API key sau khi set. Hãy chọn key mạnh!

Ví dụ API key mạnh:
```
prod-viet30926-links-sk-2024-dJy7mK9pL2qW8xC3vB5nM
```

---

## 🧪 Bước 4: Local Testing

### 4.1 Chạy Worker Locally
```bash
npm run dev
# hoặc
wrangler dev
```

Output:
```
▲ [1.234s] Ready on http://127.0.0.1:8787/
```

### 4.2 Test Dashboard
```bash
# Mở browser:
http://127.0.0.1:8787/
# Hoặc dùng curl:
curl http://127.0.0.1:8787/
```

### 4.3 Test Shorten Endpoint
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://www.google.com/search?q=cloudflare+workers",
    "slug": "google-search"
  }'

# Response (200 OK):
{
  "slug": "google-search",
  "shortUrl": "http://127.0.0.1:8787/google-search",
  "originalUrl": "https://www.google.com/search?q=cloudflare+workers",
  "expiresIn": "30 days"
}
```

### 4.4 Test Redirect
```bash
curl -L http://127.0.0.1:8787/google-search
# Sẽ redirect đến Google search
```

### 4.5 Test Error Cases

#### Test 1: Invalid API Key
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{"url": "https://example.com"}'

# Response (401):
{"error":"Unauthorized: Invalid API key"}
```

#### Test 2: Slug Already Exists
```bash
# Create first
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{"url": "https://example.com", "slug": "test"}'

# Try again with same slug
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{"url": "https://example.com/other", "slug": "test"}'

# Response (409):
{"error":"Slug already taken"}
```

#### Test 3: Invalid URL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{"url": "not-a-valid-url"}'

# Response (400):
{"error":"Invalid URL format"}
```

### 4.6 Kiểm Tra Logs
```bash
# Bạn sẽ thấy logs trong terminal khi chạy wrangler dev:
[LOG] Dashboard accessed
[LOG] Shorten request received
[LOG] URL shortened successfully. Slug: google-search
[LOG] Redirect request for slug: google-search
```

---

## 🚀 Bước 5: Triển Khai lên Production

### 5.1 Xác Nhận Cấu Hình
```bash
# Kiểm tra:
# 1. wrangler.toml với đúng KV IDs
# 2. API_KEY được set: wrangler secret list --env production
```

### 5.2 Deploy
```bash
# Deploy lên production
wrangler deploy --env production

# Output:
# ✓ Uploaded viet30926-links (1.23 MB)
# ✓ Deployed to https://viet30926-links.{your-account}.workers.dev
```

### 5.3 Ghi Nhớ URL
```
https://viet30926-links.{your-account}.workers.dev
```

Thay `{your-account}` với subdomain thực tế của bạn.

### 5.4 Test Production

```bash
# Test Dashboard
curl https://viet30926-links.{your-account}.workers.dev/

# Test Shorten
curl -X POST https://viet30926-links.{your-account}.workers.dev/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: prod-viet30926-links-sk-2024-dJy7mK9pL2qW8xC3vB5nM" \
  -d '{"url": "https://example.com/long"}'
```

---

## 📊 Bước 6: Monitoring & Maintenance

### 6.1 Xem Logs Realtime
```bash
# Production logs
npm run logs:prod
# hoặc
wrangler tail --env production

# Development logs
npm run logs
# hoặc
wrangler tail --env development

# Include errors only
wrangler tail --status error --env production

# Follow logs (live taili)
wrangler tail --follow --env production
```

### 6.2 Kiểm Tra KV Storage
```bash
# List tất cả keys trong KV
wrangler kv:key list --namespace-id z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4 --env production

# Đếm số lượng keys
wrangler kv:key list --namespace-id z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4 --env production | jq length

# Lấy giá trị của một key
wrangler kv:key get "google-search" --namespace-id z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4 --env production

# Xóa một key
wrangler kv:key delete "old-slug" --namespace-id z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4 --env production
```

### 6.3 Monitoring Dashboard

Truy cập Cloudflare Dashboard:
1. Đến https://dash.cloudflare.com
2. Chọn tài khoản
3. Chọn "Workers & Pages"
4. Chọn "viet30926-links"
5. Tab "Analytics & Logs"

Xem:
- Requests count
- Error rates
- Tail logs in real-time

---

## 🆘 Troubleshooting

### Issue: "Unauthorized: Invalid API key"

**Check:**
```bash
# 1. Verify API_KEY đã được set
wrangler secret list --env production

# 2. Verify header key phải là "x-api-key" (lowercase, hyphen)
curl -X POST https://... \
  -H "x-api-key: your-actual-key" \
  ...

# 3. Nếu lấy key local từ .dev.vars, verify file tồn tại
cat .dev.vars | grep API_KEY
```

### Issue: "Cannot find namespace"

**Check:**
```bash
# 1. Verify ID trong wrangler.toml đúng
cat wrangler.toml | grep "id ="

# 2. Verify namespace tồn tại
wrangler kv:namespace list

# 3. Nếu không có, tạo mới
wrangler kv:namespace create VIET30926_DB
```

### Issue: Deployment fails with auth error

**Fix:**
```bash
# Re-login
wrangler logout
wrangler login

# Then deploy again
wrangler deploy --env production
```

### Issue: KV data not persisting

**Check:**
```bash
# 1. Verify binding name = VIET30926_DB (case-sensitive)
cat wrangler.toml

# 2. Verify KV ID is correct
wrangler kv:namespace list

# 3. Check TTL trong header - 30 days = 2592000 seconds
# Default TTL trong code: constant DEFAULT_EXPIRATION_DAYS = 30
```

---

## ✅ Deployment Checklist

- [ ] Node.js & npm installed
- [ ] Wrangler CLI installed
- [ ] Cloudflare account created
- [ ] `wrangler login` executed
- [ ] KV Namespace created (dev + prod)
- [ ] KV IDs added to wrangler.toml
- [ ] API_KEY set locally (.dev.vars)
- [ ] API_KEY set in Cloudflare (secret)
- [ ] Local testing passed (`npm run dev`)
- [ ] `wrangler deploy --env production` successful
- [ ] Production URL noted
- [ ] Production testing passed
- [ ] Logs accessible via `wrangler tail`

---

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   - Add your domain in Cloudflare Dashboard
   - Create route: `links.yourdomain.com/*` → Worker

2. **Monitor Analytics**
   - Check Cloudflare Analytics & Logs regularly
   - Monitor error rates

3. **Rotate API Key**
   - Every 90 days: `wrangler secret put API_KEY --env production`

4. **Backup Links** (Optional)
   - Periodically export KV data
   - For critical links, keep local backups

---

## 📞 Support

Issues? Check:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [KV API Reference](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

---

**Last Updated:** 2024-12-16  
**Version:** 1.0.0
