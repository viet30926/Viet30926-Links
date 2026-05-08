# 🧪 API Testing Guide for Viet30926Links

Complete guide ngành test Viet30926Links API với các ví dụ cụ thể.

## 🔧 Tools Cần Thiết

### Cách 1: CURL (Command Line)
```bash
# macOS / Linux
brew install curl
# hoặc
apt install curl

# Windows
# Đã có sẵn trong PowerShell
```

### Cách 2: Postman (GUI)
- Download: https://www.postman.com/downloads/
- Hoặc dùng web version: https://web.postman.co/

### Cách 3: VS Code REST Client Extension
- Extension: REST Client (Huachao Mao)
- Create `.rest` files để test

### Cách 4: JavaScript/Node.js
```bash
# Sử dụng fetch API hoặc libraries
npm install axios
```

---

## 🏠 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Trả về Dashboard HTML |
| POST | `/shorten` | Tạo link rút gọn |
| GET | `/:slug` | Redirect tới URL gốc |

---

## 📝 Setup Variables

### Environment Variables

Trước khi test, set các biến:

```bash
# Development
export WORKER_URL="http://127.0.0.1:8787"
export API_KEY="my-super-secret-dev-key"

# Production
export WORKER_URL="https://viet30926-links.{your-account}.workers.dev"
export API_KEY="prod-viet30926-links-sk-2024-dJy7mK9pL2qW8xC3vB5nM"
```

### Postman Setup

1. **Create Collection:** "Viet30926Links"
2. **Create Environment:** "Dev" và "Production"

```json
{
  "WORKER_URL": "http://127.0.0.1:8787",
  "API_KEY": "my-super-secret-dev-key"
}
```

---

## 🌐 Test 1: GET / - Dashboard

### Using CURL
```bash
curl http://127.0.0.1:8787/
```

### Using Postman
- **Method:** GET
- **URL:** {{WORKER_URL}}/
- **Send:** (No body needed)

### Using JavaScript
```javascript
const response = await fetch('http://127.0.0.1:8787/');
const html = await response.text();
console.log(html.substring(0, 100)); // First 100 chars
```

### Expected Response
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML Dashboard page

---

## 📤 Test 2: POST /shorten - Basic

### Success Case: Auto-generated Slug

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://www.google.com"
  }'
```

#### Using Postman
- **Method:** POST
- **URL:** {{WORKER_URL}}/shorten
- **Headers:**
  ```
  Content-Type: application/json
  x-api-key: {{API_KEY}}
  ```
- **Body (JSON):**
  ```json
  {
    "url": "https://www.google.com"
  }
  ```

#### Using JavaScript
```javascript
const response = await fetch('http://127.0.0.1:8787/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'my-super-secret-dev-key'
  },
  body: JSON.stringify({
    url: 'https://www.google.com'
  })
});

const data = await response.json();
console.log(data);
```

#### Expected Response (200)
```json
{
  "slug": "aBcDeF",
  "shortUrl": "http://127.0.0.1:8787/aBcDeF",
  "originalUrl": "https://www.google.com",
  "expiresIn": "30 days"
}
```

---

## 📤 Test 3: POST /shorten - Custom Slug

### Request with Custom Slug

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://github.com/viet30926",
    "slug": "my-github"
  }'
```

#### Using Postman
- Same as above, but add `slug` field in JSON body

#### Using JavaScript
```javascript
const response = await fetch('http://127.0.0.1:8787/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'my-super-secret-dev-key'
  },
  body: JSON.stringify({
    url: 'https://github.com/viet30926',
    slug: 'my-github'
  })
});

const data = await response.json();
console.log(data);
```

#### Expected Response (200)
```json
{
  "slug": "my-github",
  "shortUrl": "http://127.0.0.1:8787/my-github",
  "originalUrl": "https://github.com/viet30926",
  "expiresIn": "30 days"
}
```

---

## 🔗 Test 4: GET /:slug - Redirect

### Test Valid Slug

#### Using CURL (with -L to follow redirect)
```bash
curl -L http://127.0.0.1:8787/my-github
# Will show Google page if link is correct
```

#### Using CURL (show redirect info)
```bash
curl -i http://127.0.0.1:8787/my-github
# Will show:
# HTTP/1.1 302 Found
# Location: https://github.com/viet30926
```

#### Using Postman
- **Method:** GET
- **URL:** {{WORKER_URL}}/my-github
- **Follow redirects:** ON

#### Using JavaScript
```javascript
const response = await fetch('http://127.0.0.1:8787/my-github', {
  redirect: 'follow'
});

const locationHeader = response.headers.get('location');
console.log('Redirect to:', locationHeader);
console.log('Status:', response.status);
```

#### Expected Response
- **Status:** 302 Found
- **Header:** `Location: https://github.com/viet30926`

---

## ❌ Test 5: Error Cases

### Error 1: Missing API Key

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

#### Expected Response (401)
```json
{
  "error": "Unauthorized: Invalid API key"
}
```

---

### Error 2: Invalid API Key

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{
    "url": "https://example.com"
  }'
```

#### Expected Response (401)
```json
{
  "error": "Unauthorized: Invalid API key"
}
```

---

### Error 3: Missing URL Parameter

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "slug": "my-link"
  }'
```

#### Expected Response (400)
```json
{
  "error": "URL is required"
}
```

---

### Error 4: Invalid URL Format

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "not-a-valid-url"
  }'
```

#### Expected Response (400)
```json
{
  "error": "Invalid URL format"
}
```

**Valid URLs:**
```
https://example.com ✓
http://example.com ✓
https://example.com/path?query=value ✓

example.com ✗
not-a-url ✗
ftp://example.com ✗ (not supported)
```

---

### Error 5: Invalid Slug Format

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://example.com",
    "slug": "slug with spaces!"
  }'
```

#### Expected Response (400)
```json
{
  "error": "Invalid slug format. Only alphanumeric, hyphens, underscores (max 20 chars)"
}
```

**Valid Slugs:**
```
my-link ✓
my_link ✓
MyLink ✓
link123 ✓
a ✓
12345678901234567890 ✓ (20 chars max)

my link ✗ (space)
my-link! ✗ (special char)
slug@123 ✗ (@ not allowed)
123456789012345678901 ✗ (21 chars, too long)
```

---

### Error 6: Slug Already Taken

#### Setup
First, create a link:
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://google.com",
    "slug": "mylink"
  }'
```

#### Then try to create again with same slug
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://github.com",
    "slug": "mylink"
  }'
```

#### Expected Response (409)
```json
{
  "error": "Slug already taken"
}
```

---

### Error 7: Invalid JSON

#### Using CURL
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-dev-key" \
  -d '{
    "url": "https://example.com"
    broken json
  }'
```

#### Expected Response (400)
```json
{
  "error": "Invalid JSON format"
}
```

---

### Error 8: Slug Not Found (404)

#### Using CURL
```bash
curl -i http://127.0.0.1:8787/non-existent-slug
```

#### Expected Response
- **Status:** 404 Not Found
- **Body:** HTML 404 page with Viet30926Links branding

---

## 📊 Batch Testing

### Testing Multiple Links

#### Using CURL Script
```bash
#!/bin/bash

API_KEY="my-super-secret-dev-key"
BASE_URL="http://127.0.0.1:8787"

# Array of URLs to test
declare -a urls=(
  "https://google.com"
  "https://github.com"
  "https://cloudflare.com"
  "https://javascript.info"
)

for url in "${urls[@]}"; do
  echo "Creating link for: $url"
  
  response=$(curl -s -X POST $BASE_URL/shorten \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"url\": \"$url\"}")
  
  short_url=$(echo $response | grep -o '"shortUrl":"[^"]*' | cut -d'"' -f4)
  echo "Short URL: $short_url"
  echo "---"
done
```

Run the script:
```bash
chmod +x test_batch.sh
./test_batch.sh
```

---

### Testing with Different Slugs

#### Using CURL
```bash
for slug in test1 test2 test3 mylink custom-slug; do
  curl -X POST http://127.0.0.1:8787/shorten \
    -H "Content-Type: application/json" \
    -H "x-api-key: my-super-secret-dev-key" \
    -d "{\"url\": \"https://example.com/$slug\", \"slug\": \"$slug\"}"
  
  echo ""
done
```

---

## 🧠 Using .rest Files (VS Code)

Create file: `test.rest`

```rest
@baseUrl = http://127.0.0.1:8787
@apiKey = my-super-secret-dev-key

### Test 1: Get Dashboard
GET {{baseUrl}}/

### Test 2: Shorten with auto slug
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: {{apiKey}}

{
  "url": "https://www.google.com"
}

### Test 3: Shorten with custom slug
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: {{apiKey}}

{
  "url": "https://github.com/viet30926",
  "slug": "my-github"
}

### Test 4: Redirect test
GET {{baseUrl}}/my-github

### Test 5: Error - invalid API key
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: wrong-key

{
  "url": "https://example.com"
}

### Test 6: Error - missing URL
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: {{apiKey}}

{
  "slug": "test"
}

### Test 7: Error - invalid URL
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: {{apiKey}}

{
  "url": "invalid-url"
}

### Test 8: Error - invalid slug
POST {{baseUrl}}/shorten
Content-Type: application/json
x-api-key: {{apiKey}}

{
  "url": "https://example.com",
  "slug": "slug with spaces"
}

### Test 9: Error - 404
GET {{baseUrl}}/does-not-exist
```

Then use VS Code REST Client extension to send requests.

---

## 📈 Performance Testing

### Load Testing with Apache Bench

```bash
# Install ab
apt install apache2-utils  # Ubuntu/Debian
brew install httpd         # macOS

# Test GET / endpoint
ab -n 1000 -c 10 http://127.0.0.1:8787/

## Test POST endpoint (more complex)
# Create test file: test-data.json
echo '{
  "url": "https://example.com",
  "slug": "test"
}' > test-data.json

# Use Apache Bench alternative for POST:
# ApacheBench doesn't support custom headers easily for POST
# Use wrk instead:
```

### Load Testing with wrk

```bash
# Install wrk
git clone https://github.com/wg/wrk.git
cd wrk
make

# Test GET /
./wrk -t4 -c100 -d30s http://127.0.0.1:8787/

# Create POST script for custom requests
# file: post.lua
request = function()
   wrk.method = "POST"
   wrk.headers["Content-Type"] = "application/json"
   wrk.headers["x-api-key"] = "my-super-secret-dev-key"
   wrk.body = '{"url":"https://example.com"}'
   return wrk.format(nil)
end

# Run:
./wrk -t4 -c100 -d30s -s post.lua http://127.0.0.1:8787/shorten
```

---

## 🔍 Monitoring During Tests

### Check Request Logs
```bash
# In another terminal, watch logs
wrangler tail --follow
```

### Check API Key Usage
```bash
# Verify requests are authenticated
wrangler tail --status ok --follow

# Check for auth errors
wrangler tail --status error --follow
```

---

## 📋 Complete Test Checklist

- [ ] GET / returns 200 with HTML
- [ ] POST /shorten with auto slug returns 200
- [ ] POST /shorten with custom slug returns 200
- [ ] GET /:slug redirects with 302
- [ ] GET /non-existent returns 404
- [ ] Missing API key returns 401
- [ ] Wrong API key returns 401
- [ ] Missing URL returns 400
- [ ] Invalid URL returns 400
- [ ] Invalid slug returns 400
- [ ] Duplicate slug returns 409
- [ ] Invalid JSON returns 400
- [ ] All error responses have proper JSON error field
- [ ] Links persist across requests
- [ ] TTL is properly set (30 days)
- [ ] Performance acceptable (<200ms p95)

---

## 🎓 Best Practices

1. **Always include Content-Type header**
   ```
   Content-Type: application/json
   ```

2. **Always include x-api-key header**
   ```
   x-api-key: your-api-key
   ```

3. **URLs must be valid HTTP(S) URLs**
   ```
   ✓ https://example.com
   ✓ https://example.com/path?query=value
   ✗ example.com
   ```

4. **Slugs must follow format: [a-zA-Z0-9_-]{1,20}**
   ```
   ✓ my-link
   ✓ my_link
   ✓ MyLink123
   ✗ my link (spaces)
   ✗ my-link! (special chars)
   ```

5. **Check response status codes**
   ```
   200 = Success
   400 = Client error (invalid input)
   401 = Unauthorized (API key)
   409 = Conflict (slug taken)
   404 = Not found
   500 = Server error
   ```

---

**Last Updated:** 2024-12-16  
**Version:** 1.0.0
