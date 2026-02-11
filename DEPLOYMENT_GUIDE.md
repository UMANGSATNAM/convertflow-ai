# ConvertFlow AI - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Shopify Partner account
- PostgreSQL database (production-ready)
- Domain with SSL certificate
- Node.js 18+ on server
- Git repository

---

## 📋 Step-by-Step Deployment

### Step 1: Environment Setup

#### Create Production Environment File
```bash
cp .env.example .env
```

#### Configure Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/convertflow_ai_prod
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Shopify App Credentials
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_APP_URL=https://yourapp.com
SHOPIFY_SCOPES=read_products,write_themes,write_orders

#Node Environment
NODE_ENV=production

# Session Secret
SESSION_SECRET=your_secure_random_string_min_32_chars

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_ga_id
```

---

### Step 2: Database Setup

#### 1. Create Production Database
```sql
CREATE DATABASE convertflow_ai_prod;
CREATE USER convertflow_admin WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE convertflow_ai_prod TO convertflow_admin;
```

#### 2. Run Schema Migration
```bash
psql -U convertflow_admin -d convertflow_ai_prod -f database/schema.sql
```

#### 3. Seed Section Library
```bash
psql -U convertflow_admin -d convertflow_ai_prod -f database/seed-all-sections.sql
```

#### 4. Verify Data
```sql
SELECT category, COUNT(*) FROM sections GROUP BY category;
-- Should show 10 sections per category (100+ total)
```

---

### Step 3: Build Application

#### Install Dependencies
```bash
npm ci --production
```

#### Build Assets
```bash
npm run build
```

#### Verify Build
```bash
ls -lah build/
# Should contain compiled JavaScript and CSS
```

---

### Step 4: Deploy to Hosting

#### Option A: VPS (DigitalOcean, AWS EC2, etc.)

**1. Setup Server**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/convertflow-ai.git
cd convertflow-ai
```

**2. Configure PM2**
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'convertflow-ai',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

**3. Start Application**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**4. Setup Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name yourapp.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5. Setup SSL with Certbot**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourapp.com
```

#### Option B: Platform as a Service (Heroku, Render, etc.)

**Heroku Example:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create convertflow-ai-prod

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SESSION_SECRET=your_secret

# Deploy
git push heroku main

# Run migrations
heroku run psql -f database/schema.sql
heroku run psql -f database/seed-all-sections.sql
```

---

### Step 5: Shopify App Configuration

#### 1. Create Production App
1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Apps → Create app → Public app
3. Fill in details:
   - App name: ConvertFlow AI
   - App URL: `https://yourapp.com`
   - Allowed redirection URLs: `https://yourapp.com/auth/callback`

#### 2. Set API Scopes
```
read_themes
write_themes
read_products
write_content
read_customers (optional)
```

#### 3. Configure Subscription Billing
- Go to Billing → Create plan
- Name: Premium Plan
- Price: $20/month
- Trial: 7 days (optional)

#### 4. Setup Webhooks
```
app/uninstalled → https://yourapp.com/webhooks/app-uninstalled
subscriptions/update → https://yourapp.com/webhooks/subscription-update
subscriptions/cancel → https://yourapp.com/webhooks/subscription-cancel
```

---

### Step 6: Testing in Production

#### Smoke Tests
```bash
# Health check
curl https://yourapp.com/health

# Database connectivity
curl https://yourapp.com/api/health/db

# Shopify OAuth
# Visit app URL and authorize with test store
```

#### Test User Flow
1. Install app on test store
2. Authorize OAuth
3. Subscribe to premium
4. Customize a section
5. Install to theme
6. Verify section in Shopify theme editor

---

### Step 7: Monitoring Setup

#### Error Tracking (Sentry)
```javascript
// app/entry.server.jsx
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

#### Analytics (Google Analytics)
```javascript
// app/root.jsx
<script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.ANALYTICS_ID}`}></script>
```

#### Uptime Monitoring
- Setup [UptimeRobot](https://uptimerobot.com)
- Monitor: `https://yourapp.com/health`
- Alert via email/SMS on downtime

---

## 🔐 Security Checklist

- [ ] All environment variables secured
- [ ] Database password rotated
- [ ] SSL certificate active (HTTPS)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
- [ ] CSRF tokens for forms
- [ ] Session cookies secure & httpOnly

---

## 📊 Performance Optimization

### Database
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_sections_category ON sections(category);
CREATE INDEX idx_customizations_shop ON customizations(shop_id);
CREATE INDEX idx_subscription_history_shop ON subscription_history(shop_id);
```

### Caching
```javascript
// Implement Redis for production caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached(key, fetchFn, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}
```

### CDN (Optional)
- Use Cloudflare for static assets
- Configure caching rules
- Enable Brotli compression

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to server
        run: |
          ssh user@yourserver.com 'cd /var/www/convertflow-ai && git pull && npm ci && npm run build && pm2 restart convertflow-ai'
```

---

## 📝 Post-Deployment

### Verify Deployment
- [ ] App loads without errors
- [ ] Database connections stable
- [ ] OAuth flow working
- [ ] Subscription creation successful
- [ ] Section installation functional
- [ ] Mobile responsive
- [ ] No console errors

### Monitor for 24 Hours
- Check error logs hourly
- Monitor database performance
- Watch memory/CPU usage
- Verify uptime (99.9% target)

### Backup Strategy
```bash
# Daily database backup
0 2 * * * pg_dump -U convertflow_admin convertflow_ai_prod > /backups/db_$(date +\%Y\%m\%d).sql

# Weekly full backup
0 3 * * 0 tar -czf /backups/full_$(date +\%Y\%m\%d).tar.gz /var/www/convertflow-ai
```

---

## 🆘 Rollback Plan

If deployment fails:

1. **Revert Code**
```bash
git revert HEAD
git push heroku main
```

2. **Restore Database**
```bash
psql convertflow_ai_prod < /backups/db_YYYYMMDD.sql
```

3. **Restart Services**
```bash
pm2 restart convertflow-ai
```

---

## 📞 Support

**Deployment Issues:**
- Check logs: `pm2 logs convertflow-ai`
- Database: `psql -U convertflow_admin -d convertflow_ai_prod`
- Server: `systemctl status nginx`

**Emergency Contact:**
- Technical Lead: [your email]
- DevOps: [devops email]

---

**Deployment Checklist Complete** ✅  
**Production Ready** 🚀
