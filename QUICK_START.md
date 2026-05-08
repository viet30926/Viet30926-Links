# ⚡ Quick Start - Viet30926Links

Bắt đầu nhanh trong 5 phút!

## 🚀 Cài Đặt (2 phút)

### 1. Clone and Enter Directory
```bash
cd Viet30926-Links
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Login to Cloudflare
```bash
wrangler login
# Browser sẽ mở, authorize, done!
```

### 4. Create KV Namespace
```bash
# Development namespace
wrangler kv:namespace create VIET30926_DB --preview

# Copy the ID from output, update wrangler.toml:
# [[env.development.kv_namespaces]]
# binding = "VIET30926_DB"
# id = "YOUR_ID_HERE"
```

### 5. Setup API Key (Local)
```bash
# Create .dev.vars file
cp .dev.vars.example .dev.vars

# Edit .dev.vars (any text editor)
API_KEY=my-test-key-12345
```

---

## 🧪 Test Locally (1 phút)

```bash
# Start local server
npm run dev
# Output: Ready on http://127.0.0.1:8787/
```

### Test Dashboard
```bash
# In another terminal:
curl http://127.0.0.1:8787/
# Should return HTML dashboard
```

### Test Shorten
```bash
curl -X POST http://127.0.0.1:8787/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-test-key-12345" \
  -d '{"url": "https://google.com", "slug": "google"}'

# Response:
# {"slug":"google","shortUrl":"http://127.0.0.1:8787/google",...}
```

### Test Redirect
```bash
curl -L http://127.0.0.1:8787/google
# Should redirect to Google
```

✅ **Done! Local testing works!**

---

## 🌍 Deploy to Production (2 phút)

### 1. Create Production KV
```bash
wrangler kv:namespace create VIET30926_DB

# Copy ID, update wrangler.toml:
# [[env.production.kv_namespaces]]
# binding = "VIET30926_DB"
# id = "YOUR_PROD_ID_HERE"
```

### 2. Set API Key
```bash
wrangler secret put API_KEY --env production
# Paste your API key: prod-secret-key-12345
```

### 3. Deploy
```bash
npm run deploy:prod

# Output: Deployed to https://viet30926-links.xxx.workers.dev
```

### 4. Test Production
```bash
export URL="https://viet30926-links.xxx.workers.dev"
export KEY="prod-secret-key-12345"

# Test shorten
curl -X POST $URL/shorten \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d '{"url": "https://github.com", "slug": "github"}'

# Test redirect
curl -L $URL/github
```

✅ **Done! Deployed to production!**

---

## 📚 Learn More

- **Full Setup:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **API Docs:** See [README.md](README.md)
- **Testing:** See [API_TESTING.md](API_TESTING.md)

---

## 🆘 Common Issues

### "Cannot find namespace"
→ Check KV ID in wrangler.toml matches output from `wrangler kv:namespace list`

### "Unauthorized: Invalid API key"
→ Check .dev.vars file exists with correct API_KEY value

### Deployment fails
→ Run `wrangler login` again

---

## 💡 Pro Tips

```bash
# View logs
npm run logs:prod

# List all shortened links
wrangler kv:key list --namespace-id=YOUR_ID --env production

# Restart local dev
npm run dev
```

---

**That's it! You're ready to shorten links! 🎉**
