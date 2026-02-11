# ConvertFlow AI - Shopify Theme Builder & Conversion Suite

A premium Shopify app providing 100+ conversion-optimized sections with one-click installation and zero theme conflicts.

## 🚀 Project Overview

ConvertFlow AI is a subscription-based ($20/month) Shopify app built with Remix.js that allows merchants to:
- Browse 100+ premium sections across 10 categories
- Customize sections with a visual editor
- Install sections directly into their theme with one click
- Manage subscriptions through Shopify Billing API

## 📁 Project Structure

```
convertflow-ai/
├── app/
│   ├── routes/              # Remix routes
│   │   ├── app.dashboard.jsx        # Main dashboard
│   │   ├── app.subscribe.jsx        # Subscription page
│   │   ├── app.sections.$category.jsx  # Category detail page
│   │   └── app.sections.$id.customize.jsx  # Section customization
│   ├── styles/              # CSS styles
│   │   └── global.css       # Tailwind global styles
│   ├── utils/               # Utility functions
│   │   └── billing.server.js  # Billing integration
│   ├── db.server.js         # Database configuration
│   ├── shopify.server.js    # Shopify API config
│   └── root.jsx             # App root component
├── database/
│   └── schema.sql           # PostgreSQL schema
├── .env.example             # Environment variables template
├── tailwind.config.js       # Tailwind CSS config
└── package.json             # Dependencies
```

## 🛠️ Tech Stack

- **Framework**: Remix.js (Shopify recommended)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **API**: Shopify GraphQL Admin API
- **Billing**: Shopify Recurring Billing API

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Shopify Partner account

### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Initialize database**:
   ```bash
   psql -U postgres -d convertflow_ai -f database/schema.sql
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

- **shops** - Store shop information and subscription status
- **sections** - Library of 100+ premium sections
- **customizations** - User customizations for sections
- **subscription_history** - Billing event tracking

## 💰 Subscription Model

- **Price**: $20/month
- **Billing**: Shopify Recurring Billing API
- **Features**: Full access to 100+ sections

## 📝 Key Files

- **`app/db.server.js`** - Database helper functions
- **`app/utils/billing.server.js`** - Subscription management
- **`database/schema.sql`** - PostgreSQL schema

---

**Built for Shopify Merchants**
