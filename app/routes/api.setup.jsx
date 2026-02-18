import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const action = url.searchParams.get("action"); // 'setup', 'seed', 'unlock'

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // --- SEEDING LOGIC ---
        if (action === "seed") {
            console.log("🌱 Running MASSIVE Database Seeding...");

            // 1. Clear existing sections to avoid duplicates/conflicts during this major update
            // (Optional: remove this if you want to preserve old ones, but for a clean slate it's better)
            await db.query("DELETE FROM sections");
            // Reset auto-increment if possible, or just let it grow. DELETE is fine.

            // 2. Define Section Arrays
            const categories = {
                HERO: 'Hero Sections',
                ANNOUNCEMENT: 'Announcement Bars',
                HEADER: 'Header & Sticky Navigation',
                PRODUCT: 'Product & Info Pages',
                URGENCY: 'Urgency Tools',
                RETENTION: 'Retention Tools'
            };

            const sections = [];

            // --- HELPER TO GENERATE SECTIONS ---
            const createLiquidCode = (settings) => {
                return `
{%- style -%}
  #shopify-section-{{ section.id }} {
    padding-top: {{ section.settings.paddingTop }}px;
    padding-bottom: {{ section.settings.paddingBottom }}px;
    background: {{ section.settings.backgroundColor }};
    color: {{ section.settings.textColor }};
    text-align: {{ section.settings.alignment }};
  }
  #shopify-section-{{ section.id }} h2 {
    color: {{ section.settings.textColor }};
    font-family: {{ section.settings.headingFont.family }}, serif;
    font-weight: {{ section.settings.headingFont.weight }};
  }
  #shopify-section-{{ section.id }} .btn-primary {
    background: {{ section.settings.primaryColor }};
    color: #fff;
    padding: 12px 24px;
    border-radius: {{ section.settings.borderRadius }}px;
    text-decoration: none;
    display: inline-block;
    font-weight: bold;
    transition: transform 0.2s;
  }
  #shopify-section-{{ section.id }} .btn-primary:hover {
     transform: translateY(-2px);
     filter: brightness(110%);
  }
{%- endstyle -%}

<div class="section-container">
  {% if section.settings.heading != blank %}
    <h2 class="text-3xl mb-4">{{ section.settings.heading }}</h2>
  {% endif %}
  
  {% if section.settings.description != blank %}
    <div class="rte mb-6 text-lg opacity-90">{{ section.settings.description }}</div>
  {% endif %}

  {% if section.settings.buttonText != blank %}
    <a href="#" class="btn-primary">{{ section.settings.buttonText }}</a>
  {% endif %}
  
  {% if section.settings.image != blank %}
     <img src="{{ section.settings.image }}" alt="" 
          style="max-width:100%; height:auto; border-radius: {{ section.settings.borderRadius }}px; margin-top: 20px;">
  {% endif %}
</div>

{% schema %}
${JSON.stringify({ settings: settings })}
{% endschema %}
`;
            };

            const createSection = (name, category, varNum, settings) => {
                // Ensure default objects for nested properties if missing
                if (!settings.headingFont) settings.headingFont = { family: "Playfair Display", weight: 700 };
                if (!settings.bodyFont) settings.bodyFont = { family: "Inter", weight: 400 };

                // Escape single quotes in SQL
                const safeName = name.replace(/'/g, "''");
                const safeLiquid = createLiquidCode(settings).replace(/'/g, "''");
                const safeSchema = JSON.stringify({ settings: settings }).replace(/'/g, "''");

                return `('${safeName}', '${category}', ${varNum}, '${safeLiquid}', '${safeSchema}', null, true)`;
            };

            // --- 1. HERO SECTIONS (10 Variations) ---
            const heroVariations = [
                { name: "Split Hero with Video", desc: "High conversion split layout", align: "center", bg: "#ffffff", text: "#1a202c", primary: "#1e3a8a" },
                { name: "Parallax Hero", desc: "Immersive 3D effect", align: "center", bg: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", text: "#ffffff", primary: "#d97706" },
                { name: "Minimal Split Hero", desc: "Clean and focused", align: "left", bg: "#f8fafc", text: "#0f172a", primary: "#000000" },
                { name: "Full Screen Video Hero", desc: "Impactful first impression", align: "center", bg: "#000000", text: "#ffffff", primary: "#ffffff" },
                { name: "Overlay Text Hero", desc: "Text over image focus", align: "center", bg: "#1a202c", text: "#f7fafc", primary: "#3b82f6" },
                { name: "Slider Hero Classic", desc: "Multiple message slider", align: "left", bg: "#fff", text: "#333", primary: "#d97706" },
                { name: "Gradient Mesh Hero", desc: "Modern gradient background", align: "center", bg: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)", text: "#fff", primary: "#333" },
                { name: "Product Focus Hero", desc: "Highlight a single product", align: "right", bg: "#f3f4f6", text: "#111827", primary: "#4f46e5" },
                { name: "Countdown Hero", desc: "Urgency driven layout", align: "center", bg: "#7f1d1d", text: "#fef2f2", primary: "#fca5a5" },
                { name: "Vertical Split Hero", desc: "Unique vertical navigation", align: "left", bg: "#fff", text: "#000", primary: "#000" }
            ];

            heroVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.HERO, i + 1, {
                    heading: v.name, description: v.desc, buttonText: "Shop Now",
                    backgroundColor: v.bg, textColor: v.text, primaryColor: v.primary,
                    alignment: v.align, paddingTop: 100, paddingBottom: 100, borderRadius: 0
                }));
            });

            // --- 2. ANNOUNCEMENT BARS (10 Variations) ---
            const announceVariations = [
                { name: "Scrolling Text Bar", bg: "#1e3a8a", text: "#fff" },
                { name: "Countdown Timer Bar", bg: "#000", text: "#facc15" },
                { name: "Sliding Messages Bar", bg: "#f3f4f6", text: "#1f2937" },
                { name: "Free Shipping Progress", bg: "#fff", text: "#000" },
                { name: "Email Capture Bar", bg: "#d97706", text: "#fff" },
                { name: "Holiday Sale Bar", bg: "#dc2626", text: "#fff" },
                { name: "Top Border Bar", bg: "#fff", text: "#1e3a8a" },
                { name: "Transparent Floating Bar", bg: "transparent", text: "#fff" },
                { name: "Double Stacked Bar", bg: "#1e1e1e", text: "#fff" },
                { name: "Social Icons Bar", bg: "#f8fafc", text: "#64748b" }
            ];
            announceVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.ANNOUNCEMENT, i + 1, {
                    heading: "Special Announcement Text Here", backgroundColor: v.bg, textColor: v.text,
                    paddingTop: 10, paddingBottom: 10, alignment: "center"
                }));
            });

            // --- 3. HEADER & NAVIGATION (10 Variations) ---
            const headerVariations = [
                { name: "Transparent Overlay Header", bg: "transparent", text: "#000" },
                { name: "Mega Menu Header", bg: "#fff", text: "#333" },
                { name: "Minimal Center Logo", bg: "#fff", text: "#000" },
                { name: "Sticky Scroll Header", bg: "#f8f9fa", text: "#1e3a8a" },
                { name: "Sidebar Drawer Navigation", bg: "#fff", text: "#333" },
                { name: "Search Focused Header", bg: "#fff", text: "#333" },
                { name: "Promo Top Header", bg: "#1e3a8a", text: "#fff" },
                { name: "Split Navigation (Logo Middle)", bg: "#fff", text: "#000" },
                { name: "Dark Mode Header", bg: "#111", text: "#eee" },
                { name: "Border Bottom Minimal", bg: "#fff", text: "#333" }
            ];
            headerVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.HEADER, i + 1, {
                    backgroundColor: v.bg, textColor: v.text, primaryColor: "#d97706",
                    paddingTop: 20, paddingBottom: 20
                }));
            });

            // --- 4. PRODUCT & INFO (10 Variations) ---
            const productVariations = [
                { name: "Trust Badge Grid", bg: "#f8fafc" },
                { name: "Accordion FAQ", bg: "#fff" },
                { name: "Feature Highlights Row", bg: "#fff" },
                { name: "Comparison Table", bg: "#f3f4f6" },
                { name: "Author/Founder Bio", bg: "#fff" },
                { name: "Logo Showcase (As Seen On)", bg: "#fafafa" },
                { name: "Testimonial Slider", bg: "#1e3a8a" },
                { name: "Video Product Demo", bg: "#000" },
                { name: "Specifications List", bg: "#fff" },
                { name: "Related Products Carousel", bg: "#fff" }
            ];
            productVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.PRODUCT, i + 1, {
                    heading: v.name, description: "Boost social proof and trust.", backgroundColor: v.bg, textColor: "#333",
                    paddingTop: 60, paddingBottom: 60, alignment: "center"
                }));
            });

            // --- 5. URGENCY TOOLS (10 Variations) ---
            const urgencyVariations = [
                { name: "Cart Timer Popup", bg: "#fff" },
                { name: "Stock Left Counter", bg: "#fee2e2" },
                { name: "Recent Sales Popup", bg: "#fff" },
                { name: "Low Stock Warning Bar", bg: "#fef3c7" },
                { name: "Flash Sale Countdown Large", bg: "#000" },
                { name: "Order Within X Get by Y", bg: "#f0f9ff" },
                { name: "Bestseller Badge", bg: "#d97706" },
                { name: "Viewing Now Counter", bg: "#fff" },
                { name: "Checkout Reserve Timer", bg: "#fff" },
                { name: "Sold Out Soon Badge", bg: "#dc2626" }
            ];
            urgencyVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.URGENCY, i + 1, {
                    heading: v.name, description: "Create FOMO instantly.", backgroundColor: v.bg,
                    primaryColor: "#d97706", textColor: "#111", paddingTop: 15, paddingBottom: 15, borderRadius: 4
                }));
            });

            // --- 6. RETENTION TOOLS (10 Variations) ---
            const retentionVariations = [
                { name: "Exit Intent Popup", bg: "#fff" },
                { name: "Newsletter Modal", bg: "#1e3a8a" },
                { name: "Spin to Win Wheel", bg: "#fff" },
                { name: "Scratch Card Offer", bg: "#f3f4f6" },
                { name: "Post Purchase Upsell", bg: "#fff" },
                { name: "Win Back Email Capture", bg: "#fff" },
                { name: "VIP Club Invite", bg: "#000" },
                { name: "Feedback Request", bg: "#fafafa" },
                { name: "Social Share Prompt", bg: "#fff" },
                { name: "Gamified Progress Bar", bg: "#fff" }
            ];
            retentionVariations.forEach((v, i) => {
                sections.push(createSection(v.name, categories.RETENTION, i + 1, {
                    heading: v.name, description: "Retain customers longer.", backgroundColor: v.bg,
                    primaryColor: "#1e3a8a", textColor: v.bg === '#1e3a8a' || v.bg === '#000' ? '#fff' : '#333',
                    paddingTop: 40, paddingBottom: 40, borderRadius: 8
                }));
            });


            // Batch Insert
            // We'll insert in chunks to avoid query length limits if necessary, but 60 rows should be fine.
            const query = `
                INSERT INTO sections 
                (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) 
                VALUES 
                ${sections.join(',\n')};
            `;

            await db.query(query);

            return json({ message: "MASSIVE SEED COMPLETE! 60+ Sections Added.", count: sections.length });
        }

        // --- UNLOCK LOGIC (Dev) ---
        if (action === "unlock") {
            const result = await db.query("UPDATE shops SET subscription_status = 'active'");
            return json({ message: "Unlocked Premium Features!", shopsUpdated: result.rowCount || 1 });
        }

        // --- SETUP LOGIC (Default) ---
        console.log("🛠️ Running Emergency Database Setup...");
        const tables = [
            `CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) UNIQUE NOT NULL,
                access_token TEXT,
                subscription_status VARCHAR(50) DEFAULT 'inactive',
                subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_shops_domain (shop_domain)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                variation_number INT NOT NULL,
                liquid_code TEXT NOT NULL,
                schema_json JSON NOT NULL,
                preview_image VARCHAR(500),
                is_premium BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_variation (category, variation_number),
                INDEX idx_sections_category (category)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS customizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT,
                section_id INT,
                custom_settings JSON,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
                INDEX idx_customizations_shop (shop_id)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS subscription_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT,
                event_type VARCHAR(50) NOT NULL,
                subscription_id VARCHAR(255),
                amount DECIMAL(10, 2),
                currency VARCHAR(10),
                event_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                INDEX idx_subscription_history_shop (shop_id)
            ) ENGINE=InnoDB;`
        ];

        for (const q of tables) await db.query(q);
        const res = await db.query("SHOW TABLES");
        return json({ message: "Setup Success! Tables created. Use &action=seed to populate content.", tables: res.rows });

    } catch (error) {
        console.error("❌ Setup/Seed Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};
