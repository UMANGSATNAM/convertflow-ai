-- CreateTable: Users and Shop mappings
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT,
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Section Library
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    variation_number INT NOT NULL,
    liquid_code TEXT NOT NULL,
    schema_json JSONB NOT NULL,
    preview_image VARCHAR(500),
    is_premium BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, variation_number)
);

-- CreateTable: User Customizations
CREATE TABLE IF NOT EXISTS customizations (
    id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
    section_id INT REFERENCES sections(id) ON DELETE CASCADE,
    custom_settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Subscription History
CREATE TABLE IF NOT EXISTS subscription_history (
    id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_sections_category ON sections(category);
CREATE INDEX idx_customizations_shop ON customizations(shop_id);
CREATE INDEX idx_subscription_history_shop ON subscription_history(shop_id);
