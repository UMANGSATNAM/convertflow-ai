-- CreateTable: Users and Shop mappings
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT,
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CreateTable: Section Library
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    variation_number INT NOT NULL,
    liquid_code TEXT NOT NULL,
    schema_json JSON NOT NULL,
    preview_image VARCHAR(500),
    is_premium BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, variation_number)
);

-- CreateTable: User Customizations
CREATE TABLE IF NOT EXISTS customizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT,
    section_id INT,
    custom_settings JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(shop_id, section_id)
);

-- CreateTable: Subscription History
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT,
    event_type VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10),
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_sections_category ON sections(category);
CREATE INDEX idx_customizations_shop ON customizations(shop_id);
CREATE INDEX idx_subscription_history_shop ON subscription_history(shop_id);
