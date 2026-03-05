/**
 * 50 Real Niche Theme Configurations for ConvertFlow AI
 * Each theme defines: name, niche, colors, fonts, and section order with default settings
 */

const FONT_PAIRS = [
    { heading: 'Poppins', body: 'Inter' },
    { heading: 'Playfair Display', body: 'Lato' },
    { heading: 'Montserrat', body: 'Open Sans' },
    { heading: 'Raleway', body: 'Roboto' },
    { heading: 'DM Serif Display', body: 'DM Sans' },
    { heading: 'Oswald', body: 'Source Sans Pro' },
    { heading: 'Cormorant Garamond', body: 'Nunito' },
    { heading: 'Space Grotesk', body: 'Inter' },
];

const SECTION_ORDER = [
    'cf-announcement', 'cf-hero', 'cf-trust-badges',
    'cf-featured-collection', 'cf-image-with-text',
    'cf-testimonials', 'cf-rich-text', 'cf-faq', 'cf-footer-cta'
];

export const NICHE_THEMES = [
    // ==================== FITNESS ====================
    {
        name: 'Beast Mode', niche_category: 'Fitness',
        description: 'High-energy dark theme for fitness and gym brands. Neon accents on black.',
        color_primary: '#22d3ee', color_secondary: '#0e7490', color_background: '#0a0a0a', color_text: '#f1f5f9',
        font_heading: 'Oswald', font_body: 'Source Sans Pro',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0a0a0a', heading_color: '#ffffff', accent_color: '#22d3ee', btn_bg: '#22d3ee', btn_text_color: '#000000' },
            'cf-announcement': { bg_color: '#22d3ee', text_color: '#000000', announcement_text: '💪 FREE PROTEIN WITH ORDERS OVER $75 — SHOP NOW!' },
            'cf-featured-collection': { bg_color: '#111111', card_bg: '#1a1a1a', title_color: '#f1f5f9', accent_color: '#22d3ee', btn_color: '#22d3ee', btn_text: '#000000' },
            'cf-trust-badges': { bg_color: '#0d0d0d', icon_bg: '#22d3ee22', icon_color: '#22d3ee', title_color: '#f1f5f9', desc_color: '#94a3b8' },
            'cf-testimonials': { bg_color: '#0a0a0a', card_bg: '#141414', accent_color: '#22d3ee', card_border: '#1e293b', title_color: '#fff' },
            'cf-footer-cta': { bg_color: '#111111', btn_bg: '#22d3ee', btn_text: '#000000', glow_color: '#22d3ee', heading_color: '#fff' }
        }
    },
    {
        name: 'Sunrise Yoga', niche_category: 'Fitness',
        description: 'Calm, earthy tones for yoga and meditation brands.',
        color_primary: '#d97706', color_secondary: '#92400e', color_background: '#fffbeb', color_text: '#1c1917',
        font_heading: 'Cormorant Garamond', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fffbeb', heading_color: '#1c1917', accent_color: '#d97706', btn_bg: '#d97706' },
            'cf-announcement': { bg_color: '#1c1917', text_color: '#fde68a', announcement_text: '🌅 New Summer Collection — Free Flow Yoga Wear Is Here' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#d97706', heading_color: '#fff' }
        }
    },
    {
        name: 'Iron Republic', niche_category: 'Fitness',
        description: 'Bold industrial theme for powerlifting and gym equipment.',
        color_primary: '#ef4444', color_secondary: '#b91c1c', color_background: '#111827', color_text: '#f9fafb',
        font_heading: 'Oswald', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#111827', heading_color: '#fff', accent_color: '#ef4444', btn_bg: '#ef4444' },
            'cf-announcement': { bg_color: '#ef4444', text_color: '#fff', announcement_text: '🏋️ GEAR UP — 30% OFF ALL EQUIPMENT THIS WEEK ONLY' },
            'cf-footer-cta': { bg_color: '#0d1117', btn_bg: '#ef4444', heading_color: '#fff', glow_color: '#ef4444' }
        }
    },

    // ==================== BEAUTY ====================
    {
        name: 'Velvet Rose', niche_category: 'Beauty',
        description: 'Luxurious rose-gold palette for premium beauty brands.',
        color_primary: '#ec4899', color_secondary: '#be185d', color_background: '#fff1f2', color_text: '#1f2937',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fff1f2', heading_color: '#831843', accent_color: '#ec4899', btn_bg: '#ec4899' },
            'cf-announcement': { bg_color: '#ec4899', text_color: '#fff', announcement_text: '💄 Shop New Arrivals — Beauty that speaks for itself' },
            'cf-featured-collection': { bg_color: '#fff5f7', accent_color: '#ec4899', btn_color: '#ec4899' },
            'cf-footer-cta': { bg_color: '#1f2937', btn_bg: '#ec4899', heading_color: '#fff', glow_color: '#ec4899' }
        }
    },
    {
        name: 'Clean Skin', niche_category: 'Beauty',
        description: 'Minimalist white and sage for organic skincare.',
        color_primary: '#4ade80', color_secondary: '#15803d', color_background: '#f0fdf4', color_text: '#14532d',
        font_heading: 'DM Serif Display', font_body: 'DM Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#f0fdf4', heading_color: '#14532d', accent_color: '#16a34a', btn_bg: '#16a34a' },
            'cf-announcement': { bg_color: '#14532d', text_color: '#d1fae5', announcement_text: '🌿 100% Natural. 100% Clean. Free shipping on first order.' },
            'cf-footer-cta': { bg_color: '#052e16', btn_bg: '#16a34a', heading_color: '#f0fdf4' }
        }
    },
    {
        name: 'Glow Lab', niche_category: 'Beauty',
        description: 'Bright and clinical for skincare science brands.',
        color_primary: '#8b5cf6', color_secondary: '#6d28d9', color_background: '#faf5ff', color_text: '#1e1b4b',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#faf5ff', heading_color: '#1e1b4b', accent_color: '#8b5cf6', btn_bg: '#8b5cf6' },
            'cf-announcement': { bg_color: '#8b5cf6', text_color: '#fff', announcement_text: '✨ Science-Backed Skincare — See Results in 14 Days or Your Money Back' },
            'cf-footer-cta': { bg_color: '#1e1b4b', btn_bg: '#8b5cf6', heading_color: '#fff', glow_color: '#8b5cf6' }
        }
    },
    {
        name: 'Nude Cosmetics', niche_category: 'Beauty',
        description: 'Warm neutral tones for cosmetics and makeup brands.',
        color_primary: '#d4956a', color_secondary: '#a16207', color_background: '#fdf8f0', color_text: '#292524',
        font_heading: 'Cormorant Garamond', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fdf8f0', heading_color: '#292524', accent_color: '#d4956a', btn_bg: '#d4956a' },
            'cf-footer-cta': { bg_color: '#292524', btn_bg: '#d4956a', heading_color: '#fdf8f0' }
        }
    },

    // ==================== PETS ====================
    {
        name: 'Good Dog', niche_category: 'Pets',
        description: 'Friendly and warm for dog accessories and treats.',
        color_primary: '#f59e0b', color_secondary: '#d97706', color_background: '#fffbeb', color_text: '#1c1917',
        font_heading: 'Poppins', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fffbeb', heading_color: '#1c1917', accent_color: '#f59e0b', btn_bg: '#f59e0b', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#f59e0b', text_color: '#000', announcement_text: '🐕 Free Treats with Every Order Over $30 — Your Pup Deserves the Best!' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#f59e0b', heading_color: '#fff', btn_text: '#000' }
        }
    },
    {
        name: 'Purr Luxe', niche_category: 'Pets',
        description: 'Elegant grey and gold for premium cat accessories.',
        color_primary: '#a78bfa', color_secondary: '#7c3aed', color_background: '#fafafa', color_text: '#1f2937',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1f2937', accent_color: '#a78bfa', btn_bg: '#7c3aed' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#fff', announcement_text: '🐈 Spoil Your Feline Friend — Free Shipping on All Accessories' },
            'cf-footer-cta': { bg_color: '#1f2937', btn_bg: '#a78bfa', heading_color: '#fff' }
        }
    },
    {
        name: 'Wild & Free', niche_category: 'Pets',
        description: 'Nature-inspired for natural and organic pet food.',
        color_primary: '#10b981', color_secondary: '#059669', color_background: '#f0fdf4', color_text: '#064e3b',
        font_heading: 'Montserrat', font_body: 'Open Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#064e3b', accent_color: '#10b981', btn_bg: '#10b981' },
            'cf-announcement': { bg_color: '#064e3b', text_color: '#d1fae5', announcement_text: '🌿 100% Natural Ingredients — No Fillers, No Preservatives' },
            'cf-footer-cta': { bg_color: '#022c22', btn_bg: '#10b981', heading_color: '#fff' }
        }
    },

    // ==================== TECH ====================
    {
        name: 'Cyber Store', niche_category: 'Tech',
        description: 'Dark futuristic theme for tech gadgets.',
        color_primary: '#06b6d4', color_secondary: '#0891b2', color_background: '#020617', color_text: '#f1f5f9',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#020617', heading_color: '#f1f5f9', accent_color: '#06b6d4', btn_bg: '#06b6d4', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#06b6d4', text_color: '#000', announcement_text: '⚡ Flash Sale — Up to 40% OFF Latest Gadgets. Today Only!' },
            'cf-featured-collection': { bg_color: '#0f172a', card_bg: '#1e293b', title_color: '#f1f5f9', accent_color: '#06b6d4' },
            'cf-footer-cta': { bg_color: '#020617', btn_bg: '#06b6d4', heading_color: '#fff', glow_color: '#06b6d4', btn_text: '#000' }
        }
    },
    {
        name: 'Smart Living', niche_category: 'Tech',
        description: 'Clean minimal theme for smart home devices.',
        color_primary: '#6366f1', color_secondary: '#4f46e5', color_background: '#fafafa', color_text: '#111827',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#111827', accent_color: '#6366f1', btn_bg: '#6366f1' },
            'cf-announcement': { bg_color: '#6366f1', text_color: '#fff', announcement_text: '🏠 Smart Home Sale — Automate Your Life, Save Big' },
            'cf-footer-cta': { bg_color: '#111827', btn_bg: '#6366f1', heading_color: '#fff', glow_color: '#6366f1' }
        }
    },
    {
        name: 'SoundWave', niche_category: 'Tech',
        description: 'Premium audio brand with vibrant gradients.',
        color_primary: '#f97316', color_secondary: '#ea580c', color_background: '#fff7ed', color_text: '#1c1917',
        font_heading: 'Montserrat', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#f97316', btn_bg: '#f97316' },
            'cf-announcement': { bg_color: '#1c1917', text_color: '#fed7aa', announcement_text: '🎧 Hear the Difference — Free Shipping on All Headphones' },
            'cf-footer-cta': { bg_color: '#0c0a09', btn_bg: '#f97316', heading_color: '#fff', glow_color: '#f97316' }
        }
    },
    {
        name: 'NeoGadget', niche_category: 'Tech',
        description: 'Mobile accessories with clean white aesthetic.',
        color_primary: '#3b82f6', color_secondary: '#2563eb', color_background: '#ffffff', color_text: '#111827',
        font_heading: 'Poppins', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#111827', accent_color: '#3b82f6', btn_bg: '#3b82f6' },
            'cf-footer-cta': { bg_color: '#1e3a8a', btn_bg: '#60a5fa', heading_color: '#fff' }
        }
    },

    // ==================== FASHION ====================
    {
        name: 'Street Culture', niche_category: 'Fashion',
        description: 'Bold urban streetwear theme.',
        color_primary: '#f97316', color_secondary: '#ea580c', color_background: '#111111', color_text: '#f5f5f5',
        font_heading: 'Oswald', font_body: 'Source Sans Pro',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#111111', heading_color: '#f5f5f5', accent_color: '#f97316', btn_bg: '#f97316' },
            'cf-announcement': { bg_color: '#f97316', text_color: '#000', announcement_text: '🔥 NEW DROP! Limited Edition Streetwear — Available Now' },
            'cf-featured-collection': { bg_color: '#0a0a0a', card_bg: '#1a1a1a', title_color: '#f5f5f5', accent_color: '#f97316' },
            'cf-footer-cta': { bg_color: '#0a0a0a', btn_bg: '#f97316', heading_color: '#fff', glow_color: '#f97316' }
        }
    },
    {
        name: 'Femme Luxe', niche_category: 'Fashion',
        description: 'Sophisticated women fashion with blush pink tones.',
        color_primary: '#f43f5e', color_secondary: '#be123c', color_background: '#fff1f2', color_text: '#1f2937',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fff1f2', heading_color: '#881337', accent_color: '#f43f5e', btn_bg: '#f43f5e' },
            'cf-announcement': { bg_color: '#1f2937', text_color: '#fecdd3', announcement_text: '💋 New Collection Arrived — Elegance at Every Price Point' },
            'cf-footer-cta': { bg_color: '#1f2937', btn_bg: '#f43f5e', heading_color: '#fff' }
        }
    },
    {
        name: 'Arctic Wave', niche_category: 'Fashion',
        description: 'Cool minimal theme for winter and outerwear.',
        color_primary: '#0ea5e9', color_secondary: '#0284c7', color_background: '#f0f9ff', color_text: '#0c4a6e',
        font_heading: 'Raleway', font_body: 'Open Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#0c4a6e', accent_color: '#0ea5e9', btn_bg: '#0ea5e9' },
            'cf-announcement': { bg_color: '#0c4a6e', text_color: '#e0f2fe', announcement_text: '❄️ Winter Collection Is Here — Stay Warm, Look Sharp' },
            'cf-footer-cta': { bg_color: '#0c4a6e', btn_bg: '#38bdf8', heading_color: '#fff' }
        }
    },
    {
        name: 'Luxe Leather', niche_category: 'Fashion',
        description: 'Dark premium theme for luxury bags and accessories.',
        color_primary: '#d4aa70', color_secondary: '#92681a', color_background: '#0d0d0d', color_text: '#f5f5f4',
        font_heading: 'Cormorant Garamond', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0d0d0d', heading_color: '#f5f5f4', accent_color: '#d4aa70', btn_bg: '#d4aa70', btn_text_color: '#000' },
            'cf-footer-cta': { bg_color: '#0d0d0d', btn_bg: '#d4aa70', heading_color: '#fff', btn_text: '#000' }
        }
    },
    {
        name: 'Sun & Sand', niche_category: 'Fashion',
        description: 'Tropical swimwear with vivid beach vibes.',
        color_primary: '#f59e0b', color_secondary: '#d97706', color_background: '#fffbeb', color_text: '#1c1917',
        font_heading: 'Montserrat', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#f59e0b', btn_bg: '#f59e0b', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#1c1917', text_color: '#fde68a', announcement_text: '🌊 Summer Sale — Free Shipping on Swimwear' },
            'cf-footer-cta': { bg_color: '#0c0a09', btn_bg: '#f59e0b', heading_color: '#fff', btn_text: '#000' }
        }
    },

    // ==================== ACCESSORIES ====================
    {
        name: 'Shine Theory', niche_category: 'Accessories',
        description: 'Elegant gold and black for jewelry brands.',
        color_primary: '#eab308', color_secondary: '#ca8a04', color_background: '#0a0a0a', color_text: '#fafafa',
        font_heading: 'Cormorant Garamond', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0a0a0a', heading_color: '#fafafa', accent_color: '#eab308', btn_bg: '#eab308', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#eab308', text_color: '#000', announcement_text: '💎 New Collection: Handcrafted Fine Jewelry — Shop Now' },
            'cf-featured-collection': { bg_color: '#111', card_bg: '#1a1a1a', title_color: '#fafafa', accent_color: '#eab308' },
            'cf-footer-cta': { bg_color: '#050505', btn_bg: '#eab308', heading_color: '#fff', btn_text: '#000', glow_color: '#eab308' }
        }
    },
    {
        name: 'Timepiece Co.', niche_category: 'Accessories',
        description: 'Classic and refined for high-end watches.',
        color_primary: '#1e40af', color_secondary: '#1e3a8a', color_background: '#f8fafc', color_text: '#0f172a',
        font_heading: 'DM Serif Display', font_body: 'DM Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#0f172a', accent_color: '#1e40af', btn_bg: '#1e40af' },
            'cf-announcement': { bg_color: '#0f172a', text_color: '#bfdbfe', announcement_text: '⌚ Luxury Watches — Precision Crafted for Discerning Collectors' },
            'cf-footer-cta': { bg_color: '#0f172a', btn_bg: '#1e40af', heading_color: '#fff' }
        }
    },
    {
        name: 'Shard Optics', niche_category: 'Accessories',
        description: 'Sun-drenched lifestyle brand for designer sunglasses.',
        color_primary: '#e11d48', color_secondary: '#be123c', color_background: '#fff8f1', color_text: '#1c1917',
        font_heading: 'Raleway', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#e11d48', btn_bg: '#e11d48' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#e11d48', heading_color: '#fff' }
        }
    },

    // ==================== HOME ====================
    {
        name: 'Casa Elegance', niche_category: 'Home',
        description: 'Warm earthy tones for premium home decor.',
        color_primary: '#b45309', color_secondary: '#92400e', color_background: '#fdfaf6', color_text: '#1c1917',
        font_heading: 'Cormorant Garamond', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#fdfaf6', heading_color: '#1c1917', accent_color: '#b45309', btn_bg: '#b45309' },
            'cf-announcement': { bg_color: '#1c1917', text_color: '#fed7aa', announcement_text: '🏡 Transform Your Space — New Home Decor Collection Live Now' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#b45309', heading_color: '#fff' }
        }
    },
    {
        name: 'Nordic Minimal', niche_category: 'Home',
        description: 'Clean Scandinavian aesthetic for modern furniture.',
        color_primary: '#475569', color_secondary: '#334155', color_background: '#ffffff', color_text: '#1e293b',
        font_heading: 'DM Serif Display', font_body: 'DM Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1e293b', accent_color: '#475569', btn_bg: '#1e293b' },
            'cf-announcement': { bg_color: '#1e293b', text_color: '#cbd5e1', announcement_text: '🪵 Artisanal Furniture — Handcrafted for Modern Living' },
            'cf-footer-cta': { bg_color: '#1e293b', btn_bg: '#475569', heading_color: '#fff' }
        }
    },
    {
        name: 'Le Kitchen', niche_category: 'Home',
        description: 'Warm and inviting for kitchenware and cooking brands.',
        color_primary: '#dc2626', color_secondary: '#b91c1c', color_background: '#fff7ed', color_text: '#1c1917',
        font_heading: 'Poppins', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#dc2626', btn_bg: '#dc2626' },
            'cf-announcement': { bg_color: '#dc2626', text_color: '#fff', announcement_text: '🍳 Kitchen Sale — Cook Like a Pro at Home' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#dc2626', heading_color: '#fff' }
        }
    },
    {
        name: 'Slumber Co.', niche_category: 'Home',
        description: 'Soft pastels and luxury feel for bedding brands.',
        color_primary: '#a78bfa', color_secondary: '#7c3aed', color_background: '#faf5ff', color_text: '#1e1b4b',
        font_heading: 'Raleway', font_body: 'Open Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1e1b4b', accent_color: '#a78bfa', btn_bg: '#7c3aed' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#ede9fe', announcement_text: '🛏️ Sleep Better Tonight — Premium Bedding, Free Shipping' },
            'cf-footer-cta': { bg_color: '#1e1b4b', btn_bg: '#a78bfa', heading_color: '#fff' }
        }
    },

    // ==================== HEALTH ====================
    {
        name: 'Gainz Lab', niche_category: 'Health',
        description: 'Science-forward supplement brand with clinical blue.',
        color_primary: '#2563eb', color_secondary: '#1d4ed8', color_background: '#f0f4ff', color_text: '#1e3a8a',
        font_heading: 'Montserrat', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1e3a8a', accent_color: '#2563eb', btn_bg: '#2563eb' },
            'cf-announcement': { bg_color: '#1e3a8a', text_color: '#bfdbfe', announcement_text: '💊 Buy 2 Get 1 Free on All Supplements — Limited Stock' },
            'cf-footer-cta': { bg_color: '#1e3a8a', btn_bg: '#2563eb', heading_color: '#fff' }
        }
    },
    {
        name: 'Vital Roots', niche_category: 'Health',
        description: 'Natural and organic vitamins with earthy green tones.',
        color_primary: '#16a34a', color_secondary: '#15803d', color_background: '#f0fdf4', color_text: '#14532d',
        font_heading: 'DM Serif Display', font_body: 'DM Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#14532d', accent_color: '#16a34a', btn_bg: '#16a34a' },
            'cf-announcement': { bg_color: '#14532d', text_color: '#bbf7d0', announcement_text: '🌱 Whole Food Vitamins — No Synthetics, Just Nature' },
            'cf-footer-cta': { bg_color: '#14532d', btn_bg: '#4ade80', heading_color: '#fff', btn_text: '#14532d' }
        }
    },
    {
        name: 'Plant Powered', niche_category: 'Health',
        description: 'Modern vegan nutrition brand with purple gradients.',
        color_primary: '#9333ea', color_secondary: '#7e22ce', color_background: '#fdf4ff', color_text: '#3b0764',
        font_heading: 'Poppins', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#3b0764', accent_color: '#9333ea', btn_bg: '#9333ea' },
            'cf-announcement': { bg_color: '#9333ea', text_color: '#f3e8ff', announcement_text: '🌱 Vegan & Cruelty-Free — Fuel Your Goals, Naturally' },
            'cf-footer-cta': { bg_color: '#3b0764', btn_bg: '#c084fc', heading_color: '#fff', btn_text: '#3b0764' }
        }
    },
    {
        name: 'MediCare Plus', niche_category: 'Health',
        description: 'Clinical and trustworthy for pharmacy and health products.',
        color_primary: '#0891b2', color_secondary: '#0e7490', color_background: '#ecfeff', color_text: '#164e63',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#164e63', accent_color: '#0891b2', btn_bg: '#0891b2' },
            'cf-footer-cta': { bg_color: '#164e63', btn_bg: '#0891b2', heading_color: '#fff' }
        }
    },

    // ==================== FOOD ====================
    {
        name: 'Brew & Roast', niche_category: 'Food',
        description: 'Warm amber tones for premium coffee brands.',
        color_primary: '#92400e', color_secondary: '#78350f', color_background: '#1c0a00', color_text: '#fef3c7',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#1c0a00', heading_color: '#fef3c7', accent_color: '#d97706', btn_bg: '#d97706', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#d97706', text_color: '#000', announcement_text: '☕ Fresh Roast Delivered Weekly — Subscribe & Save 15%' },
            'cf-featured-collection': { bg_color: '#150700', card_bg: '#1f0c00', title_color: '#fef3c7', accent_color: '#d97706' },
            'cf-footer-cta': { bg_color: '#0d0500', btn_bg: '#d97706', heading_color: '#fef3c7', btn_text: '#000', glow_color: '#d97706' }
        }
    },
    {
        name: 'Zen Tea House', niche_category: 'Food',
        description: 'Elegant matcha-inspired design for artisan tea brands.',
        color_primary: '#4d7c0f', color_secondary: '#3f6212', color_background: '#f7fee7', color_text: '#1a2e05',
        font_heading: 'Cormorant Garamond', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1a2e05', accent_color: '#4d7c0f', btn_bg: '#4d7c0f' },
            'cf-announcement': { bg_color: '#1a2e05', text_color: '#d9f99d', announcement_text: '🍵 Artisan Teas from the Himalayas — Free Sample Box on First Order' },
            'cf-footer-cta': { bg_color: '#1a2e05', btn_bg: '#65a30d', heading_color: '#f0fdf4' }
        }
    },
    {
        name: 'Bite Club', niche_category: 'Food',
        description: 'Playful and bold for gourmet snacks and chips.',
        color_primary: '#ef4444', color_secondary: '#dc2626', color_background: '#fff7ed', color_text: '#1c1917',
        font_heading: 'Oswald', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#ef4444', btn_bg: '#ef4444' },
            'cf-announcement': { bg_color: '#ef4444', text_color: '#fff', announcement_text: '🍿 Snack Attack Sale — Mix 3 Bags, Save 25%' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#ef4444', heading_color: '#fff', glow_color: '#ef4444' }
        }
    },
    {
        name: 'Dark &amp; Rich', niche_category: 'Food',
        description: 'Luxurious dark chocolate brand aesthetic.',
        color_primary: '#7c3aed', color_secondary: '#6d28d9', color_background: '#1c0a2e', color_text: '#faf5ff',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#1c0a2e', heading_color: '#faf5ff', accent_color: '#a78bfa', btn_bg: '#7c3aed' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#f3e8ff', announcement_text: '🍫 Artisan Chocolate — Ethically Sourced. Exquisitely Crafted.' },
            'cf-footer-cta': { bg_color: '#0d001a', btn_bg: '#9333ea', heading_color: '#faf5ff', glow_color: '#9333ea' }
        }
    },

    // ==================== KIDS ====================
    {
        name: 'Tiny Threads', niche_category: 'Kids',
        description: 'Bright and playful for baby and kids clothing.',
        color_primary: '#f97316', color_secondary: '#ec4899', color_background: '#fff9f0', color_text: '#1c1917',
        font_heading: 'Poppins', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#f97316', btn_bg: '#f97316' },
            'cf-announcement': { bg_color: '#f97316', text_color: '#fff', announcement_text: '👶 New Tiny Threads Drop — Adorable Styles for Little Ones' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#f97316', heading_color: '#fff' }
        }
    },
    {
        name: 'Wonder Minds', niche_category: 'Kids',
        description: 'Fun and educational for kids learning toys.',
        color_primary: '#8b5cf6', color_secondary: '#7c3aed', color_background: '#f5f3ff', color_text: '#1e1b4b',
        font_heading: 'Poppins', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1e1b4b', accent_color: '#8b5cf6', btn_bg: '#8b5cf6' },
            'cf-announcement': { bg_color: '#8b5cf6', text_color: '#ede9fe', announcement_text: '🧠 Toys That Teach — Learn, Play, Grow!' },
            'cf-footer-cta': { bg_color: '#1e1b4b', btn_bg: '#a78bfa', heading_color: '#fff', btn_text: '#1e1b4b' }
        }
    },
    {
        name: 'Bloom Baby', niche_category: 'Kids',
        description: 'Soft pastels for maternity and newborn care.',
        color_primary: '#ec4899', color_secondary: '#db2777', color_background: '#fdf2f8', color_text: '#500724',
        font_heading: 'Raleway', font_body: 'Open Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#500724', accent_color: '#ec4899', btn_bg: '#ec4899' },
            'cf-announcement': { bg_color: '#be185d', text_color: '#fce7f3', announcement_text: '🌸 Gentle Care for Your Little Miracle — Free Gift on Orders $50+' },
            'cf-footer-cta': { bg_color: '#500724', btn_bg: '#ec4899', heading_color: '#fff' }
        }
    },

    // ==================== OUTDOORS ====================
    {
        name: 'Summit Gear', niche_category: 'Outdoors',
        description: 'Rugged outdoor survival and hiking gear.',
        color_primary: '#16a34a', color_secondary: '#15803d', color_background: '#0c1a0e', color_text: '#d1fae5',
        font_heading: 'Oswald', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0c1a0e', heading_color: '#d1fae5', accent_color: '#4ade80', btn_bg: '#16a34a' },
            'cf-announcement': { bg_color: '#16a34a', text_color: '#fff', announcement_text: '🏔️ Adventure Ready — Free Tent with Orders Over $200' },
            'cf-featured-collection': { bg_color: '#0f1f11', card_bg: '#172618', title_color: '#d1fae5', accent_color: '#4ade80' },
            'cf-footer-cta': { bg_color: '#060e07', btn_bg: '#16a34a', heading_color: '#d1fae5', glow_color: '#4ade80' }
        }
    },
    {
        name: 'Trail Blazer', niche_category: 'Outdoors',
        description: 'Earthy orange and brown for camping lifestyle.',
        color_primary: '#ea580c', color_secondary: '#9a3412', color_background: '#fff7ed', color_text: '#431407',
        font_heading: 'Montserrat', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#431407', accent_color: '#ea580c', btn_bg: '#ea580c' },
            'cf-announcement': { bg_color: '#431407', text_color: '#fed7aa', announcement_text: '🏕️ Explore More — Camping Gear That Goes the Distance' },
            'cf-footer-cta': { bg_color: '#431407', btn_bg: '#f97316', heading_color: '#fff' }
        }
    },
    {
        name: 'Ride On', niche_category: 'Outdoors',
        description: 'Dynamic theme for cycling and biking gear.',
        color_primary: '#facc15', color_secondary: '#eab308', color_background: '#111111', color_text: '#f9fafb',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#111111', heading_color: '#f9fafb', accent_color: '#facc15', btn_bg: '#facc15', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#facc15', text_color: '#000', announcement_text: '🚴 Cycling Gear Sale — Up to 35% Off This Weekend' },
            'cf-footer-cta': { bg_color: '#111111', btn_bg: '#facc15', heading_color: '#fff', btn_text: '#000', glow_color: '#eab308' }
        }
    },

    // ==================== AUTOMOTIVE ====================
    {
        name: 'Pit Stop Shop', niche_category: 'Automotive',
        description: 'High performance auto parts and accessories.',
        color_primary: '#ef4444', color_secondary: '#dc2626', color_background: '#0a0a0a', color_text: '#f5f5f5',
        font_heading: 'Oswald', font_body: 'Source Sans Pro',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0a0a0a', heading_color: '#f5f5f5', accent_color: '#ef4444', btn_bg: '#ef4444' },
            'cf-announcement': { bg_color: '#ef4444', text_color: '#fff', announcement_text: '🏎️ Auto Parts Sale — Free Shipping on Orders Over $100' },
            'cf-footer-cta': { bg_color: '#050505', btn_bg: '#ef4444', heading_color: '#fff', glow_color: '#ef4444' }
        }
    },
    {
        name: 'Detail Kings', niche_category: 'Automotive',
        description: 'Premium car detailing products with sleek dark theme.',
        color_primary: '#3b82f6', color_secondary: '#1d4ed8', color_background: '#0f172a', color_text: '#e2e8f0',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0f172a', heading_color: '#e2e8f0', accent_color: '#3b82f6', btn_bg: '#3b82f6' },
            'cf-announcement': { bg_color: '#1d4ed8', text_color: '#fff', announcement_text: '✨ Show-Ready Results — Professional Car Care at Home' },
            'cf-footer-cta': { bg_color: '#060f1e', btn_bg: '#3b82f6', heading_color: '#fff', glow_color: '#3b82f6' }
        }
    },

    // ==================== HOBBIES ====================
    {
        name: 'Page Turner', niche_category: 'Hobbies',
        description: 'Cozy bookstore aesthetic for books and stationery.',
        color_primary: '#78350f', color_secondary: '#92400e', color_background: '#fdf8f0', color_text: '#1c1917',
        font_heading: 'Playfair Display', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#78350f', btn_bg: '#78350f' },
            'cf-announcement': { bg_color: '#1c1917', text_color: '#fde68a', announcement_text: '📚 New Arrivals Every Monday — Free Bookmark with Every Order' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#78350f', heading_color: '#fff7ed' }
        }
    },
    {
        name: 'Canvas & Co.', niche_category: 'Hobbies',
        description: 'Artistic and creative for art supplies and prints.',
        color_primary: '#7c3aed', color_secondary: '#5b21b6', color_background: '#fdf4ff', color_text: '#1e1b4b',
        font_heading: 'Raleway', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1e1b4b', accent_color: '#7c3aed', btn_bg: '#7c3aed' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#f3e8ff', announcement_text: '🎨 Bring Your Vision to Life — Art Supplies & Prints' },
            'cf-footer-cta': { bg_color: '#1e1b4b', btn_bg: '#7c3aed', heading_color: '#fdf4ff' }
        }
    },
    {
        name: 'Stitch & Style', niche_category: 'Hobbies',
        description: 'Warm, handmade feel for crafts and DIY products.',
        color_primary: '#ec4899', color_secondary: '#be185d', color_background: '#fdf2f8', color_text: '#831843',
        font_heading: 'Cormorant Garamond', font_body: 'Open Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#831843', accent_color: '#ec4899', btn_bg: '#ec4899' },
            'cf-announcement': { bg_color: '#831843', text_color: '#fce7f3', announcement_text: '🧵 Handmade with Love — New Craft Supplies In Stock' },
            'cf-footer-cta': { bg_color: '#4a0427', btn_bg: '#ec4899', heading_color: '#fff' }
        }
    },
    {
        name: 'Melody House', niche_category: 'Hobbies',
        description: 'Musical brand with dark vintage tones.',
        color_primary: '#f59e0b', color_secondary: '#d97706', color_background: '#0c0a09', color_text: '#faf9f7',
        font_heading: 'Montserrat', font_body: 'Roboto',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0c0a09', heading_color: '#faf9f7', accent_color: '#f59e0b', btn_bg: '#f59e0b', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#f59e0b', text_color: '#000', announcement_text: '🎸 Make Music — Instruments & Accessories for Every Level' },
            'cf-footer-cta': { bg_color: '#060504', btn_bg: '#f59e0b', heading_color: '#fff', btn_text: '#000', glow_color: '#f59e0b' }
        }
    },

    // ==================== SPORTS ====================
    {
        name: 'Shred Society', niche_category: 'Sports',
        description: 'Surf and skate culture with bold neon energy.',
        color_primary: '#06b6d4', color_secondary: '#0891b2', color_background: '#0a0a0a', color_text: '#f0fdfa',
        font_heading: 'Oswald', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#0a0a0a', heading_color: '#f0fdfa', accent_color: '#06b6d4', btn_bg: '#06b6d4', btn_text_color: '#000' },
            'cf-announcement': { bg_color: '#06b6d4', text_color: '#000', announcement_text: '🏄 New Drop — Skate & Surf Gear Just Hit the Floor' },
            'cf-footer-cta': { bg_color: '#050505', btn_bg: '#06b6d4', heading_color: '#fff', btn_text: '#000', glow_color: '#06b6d4' }
        }
    },
    {
        name: 'Green & Fairway', niche_category: 'Sports',
        description: 'Premium golf accessories with classic green.',
        color_primary: '#166534', color_secondary: '#14532d', color_background: '#f0fdf4', color_text: '#14532d',
        font_heading: 'Cormorant Garamond', font_body: 'Lato',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#14532d', accent_color: '#166534', btn_bg: '#166534' },
            'cf-announcement': { bg_color: '#14532d', text_color: '#bbf7d0', announcement_text: '⛳ Tee Time Gear — Premium Golf Accessories for Serious Players' },
            'cf-footer-cta': { bg_color: '#052e16', btn_bg: '#16a34a', heading_color: '#fff' }
        }
    },

    // ==================== GAMING ====================
    {
        name: 'Neon Arena', niche_category: 'Gaming',
        description: 'Electric gaming brand with RGB-inspired neon colors.',
        color_primary: '#a855f7', color_secondary: '#9333ea', color_background: '#030014', color_text: '#e2e8f0',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { bg_color: '#030014', heading_color: '#e2e8f0', accent_color: '#a855f7', btn_bg: '#7c3aed' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#f3e8ff', announcement_text: '🎮 Game On — New Gaming Gear Just Dropped. Free Shipping!' },
            'cf-featured-collection': { bg_color: '#050020', card_bg: '#0d0030', title_color: '#e2e8f0', accent_color: '#a855f7' },
            'cf-footer-cta': { bg_color: '#020010', btn_bg: '#a855f7', heading_color: '#e2e8f0', glow_color: '#a855f7' }
        }
    },
    {
        name: 'Board Masters', niche_category: 'Gaming',
        description: 'Fun and inviting for board games and puzzles.',
        color_primary: '#f97316', color_secondary: '#ea580c', color_background: '#fffbeb', color_text: '#1c1917',
        font_heading: 'Poppins', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#1c1917', accent_color: '#f97316', btn_bg: '#f97316' },
            'cf-announcement': { bg_color: '#f97316', text_color: '#fff', announcement_text: '🎲 Game Night Ready — New Board Games & Puzzles In Stock' },
            'cf-footer-cta': { bg_color: '#1c1917', btn_bg: '#f97316', heading_color: '#fff' }
        }
    },

    // ==================== MISC ====================
    {
        name: 'Green Earth', niche_category: 'Misc',
        description: 'Sustainable brand with eco-friendly green and earth tones.',
        color_primary: '#16a34a', color_secondary: '#15803d', color_background: '#f0fdf4', color_text: '#064e3b',
        font_heading: 'DM Serif Display', font_body: 'DM Sans',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#064e3b', accent_color: '#16a34a', btn_bg: '#16a34a' },
            'cf-announcement': { bg_color: '#064e3b', text_color: '#bbf7d0', announcement_text: '♻️ Shop Sustainably — Every Purchase Plants a Tree' },
            'cf-footer-cta': { bg_color: '#022c22', btn_bg: '#4ade80', heading_color: '#fff', btn_text: '#022c22' }
        }
    },
    {
        name: 'Box of Wonders', niche_category: 'Misc',
        description: 'Playful and exciting for subscription box brands.',
        color_primary: '#8b5cf6', color_secondary: '#7c3aed', color_background: '#faf5ff', color_text: '#2e1065',
        font_heading: 'Poppins', font_body: 'Nunito',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#2e1065', accent_color: '#8b5cf6', btn_bg: '#8b5cf6' },
            'cf-announcement': { bg_color: '#7c3aed', text_color: '#f3e8ff', announcement_text: '📦 Subscribe & Save — Curated Boxes Delivered Monthly' },
            'cf-footer-cta': { bg_color: '#2e1065', btn_bg: '#a855f7', heading_color: '#fff', glow_color: '#a855f7' }
        }
    },
    {
        name: 'Drop Ship Pro', niche_category: 'Misc',
        description: 'Clean and conversion-focused for trending products.',
        color_primary: '#6366f1', color_secondary: '#4f46e5', color_background: '#ffffff', color_text: '#111827',
        font_heading: 'Space Grotesk', font_body: 'Inter',
        section_order: SECTION_ORDER,
        section_defaults: {
            'cf-hero': { heading_color: '#111827', accent_color: '#6366f1', btn_bg: '#6366f1' },
            'cf-announcement': { bg_color: '#6366f1', text_color: '#fff', announcement_text: '🔥 Trending Now — Viral Products at Unbeatable Prices' },
            'cf-footer-cta': { bg_color: '#111827', btn_bg: '#6366f1', heading_color: '#fff', glow_color: '#6366f1' }
        }
    }
];
