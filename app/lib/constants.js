// Section categories and complete file registry
// Single source of truth for all available sections

export const SECTION_CATEGORIES = [
    {
        id: 'header',
        name: 'Header',
        description: 'Navigation bars and branding',
        icon: 'Layout',
    },
    {
        id: 'hero',
        name: 'Hero & Banners',
        description: 'Above-the-fold hero sections and image banners',
        icon: 'Image',
    },
    {
        id: 'product',
        name: 'Product Showcase',
        description: 'Featured products and product grids',
        icon: 'ShoppingBag',
    },
    {
        id: 'collection',
        name: 'Collection',
        description: 'Collection lists and lookbooks',
        icon: 'Grid',
    },
    {
        id: 'testimonial',
        name: 'Testimonials & Reviews',
        description: 'Customer reviews and social proof',
        icon: 'MessageSquare',
    },
    {
        id: 'brand',
        name: 'Brand & Trust',
        description: 'Brand sliders, logos, and trust signals',
        icon: 'Award',
    },
    {
        id: 'content',
        name: 'Content & Text',
        description: 'Rich text, custom sections, and press banners',
        icon: 'FileText',
    },
    {
        id: 'newsletter',
        name: 'Newsletter',
        description: 'Email signup and countdown sections',
        icon: 'Mail',
    },
    {
        id: 'social',
        name: 'Social Media',
        description: 'Instagram feeds and TikTok embeds',
        icon: 'Share2',
    },
    {
        id: 'video',
        name: 'Video',
        description: 'Video blocks and carousels',
        icon: 'Play',
    },
    {
        id: 'faq',
        name: 'FAQ & Info',
        description: 'Collapsible content, FAQs, and policies',
        icon: 'HelpCircle',
    },
    {
        id: 'banner',
        name: 'Promotional Banners',
        description: 'Special banners, marquees, and spotlights',
        icon: 'Zap',
    },
    {
        id: 'footer',
        name: 'Footer',
        description: 'Footer sections and store locators',
        icon: 'Layers',
    },
];

// Complete section file registry — maps every .liquid file to its metadata
export const SECTION_FILES = {
    // ─── HEADER ──────────────────────────────────────────
    'header-01-split-nav': { category: 'header', name: 'Header 01: Split Nav', file: 'header-01-split-nav.liquid' },
    'header-advanced': { category: 'header', name: 'Header: Advanced', file: 'header-advanced.liquid' },
    'header-basic': { category: 'header', name: 'Header: Basic', file: 'header-basic.liquid' },
    'header-classic': { category: 'header', name: 'Header: Classic', file: 'header-classic.liquid' },
    'header-minimal': { category: 'header', name: 'Header: Minimal', file: 'header-minimal.liquid' },
    'header-simple': { category: 'header', name: 'Header: Simple', file: 'header-simple.liquid' },
    'header-single-line': { category: 'header', name: 'Header: Single Line', file: 'header-single-line.liquid' },
    'header-utility': { category: 'header', name: 'Header: Utility', file: 'header-utility.liquid' },
    'header-navigation-basic': { category: 'header', name: 'Header Nav: Basic', file: 'header-navigation-basic.liquid' },
    'header-navigation-compact': { category: 'header', name: 'Header Nav: Compact', file: 'header-navigation-compact.liquid' },
    'header-navigation-full': { category: 'header', name: 'Header Nav: Full Elements', file: 'header-navigation-full-elements.liquid' },
    'header-navigation-hamburger': { category: 'header', name: 'Header Nav: Hamburger', file: 'header-navigation-hamburger.liquid' },
    'header-navigation-left': { category: 'header', name: 'Header Nav: Left Aligned', file: 'header-navigation-left-aligned.liquid' },
    'header-navigation-plain': { category: 'header', name: 'Header Nav: Plain', file: 'header-navigation-plain.liquid' },
    'header-navigation-utility': { category: 'header', name: 'Header Nav: Utility', file: 'header-navigation-utility.liquid' },
    'header-navigation-vertical': { category: 'header', name: 'Header Nav: Vertical Menu', file: 'header-navigation-vertical-menu.liquid' },

    // ─── HERO & BANNERS ─────────────────────────────────
    'image-banner': { category: 'hero', name: 'Image Banner', file: 'image-banner.liquid' },
    'slide-show': { category: 'hero', name: 'Slideshow', file: 'slide-show.liquid' },
    'custom-image-banner': { category: 'hero', name: 'Custom Image Banner', file: 'custom-image-banner.liquid' },
    'custom-image-banner-2': { category: 'hero', name: 'Custom Image Banner 2', file: 'custom-image-banner-2.liquid' },
    'counter-positions-banner': { category: 'hero', name: 'Counter Positions Banner', file: 'counter-positions-image-banner.liquid' },
    'puzzled-image-banner': { category: 'hero', name: 'Puzzled Image Banner', file: 'puzzled-image-banner.liquid' },
    'sticky-scrolling-banner': { category: 'hero', name: 'Sticky Scrolling Banner', file: 'sticky-scrolling-banner.liquid' },
    'image-comparison': { category: 'hero', name: 'Image Comparison (Before/After)', file: 'image-comparison.liquid' },
    'multilayer-image': { category: 'hero', name: 'Multi-Layer Image', file: 'multilayer-image.liquid' },

    // ─── PRODUCT ─────────────────────────────────────────
    'featured-product': { category: 'product', name: 'Featured Product', file: 'featured-product.liquid' },
    'featured-product-unsymmetrical': { category: 'product', name: 'Featured Product Asymmetric', file: 'featured-product-unsymmetrical.liquid' },
    'featured-collection': { category: 'product', name: 'Featured Collection', file: 'featured-collection.liquid' },
    'custom-product-widget': { category: 'product', name: 'Custom Product Widget', file: 'custom-product-widget.liquid' },
    'product-block': { category: 'product', name: 'Product Block', file: 'product-block.liquid' },
    'product-block-02': { category: 'product', name: 'Product Block 02', file: 'product-block-02.liquid' },
    'product-block-vertical': { category: 'product', name: 'Product Block Vertical', file: 'product-block-vertical.liquid' },
    'product-tab-block': { category: 'product', name: 'Product Tab Block', file: 'product-tab-block.liquid' },
    'product-recently-viewed': { category: 'product', name: 'Recently Viewed Products', file: 'product-recently-viewed.liquid' },
    'product-recommendations': { category: 'product', name: 'Product Recommendations', file: 'product-recommendations.liquid' },
    'spotlight-products': { category: 'product', name: 'Spotlight Products', file: 'spotlight-products.liquid' },
    'promo-banner-product-grid': { category: 'product', name: 'Promo Banner + Product Grid', file: 'promo-banner-with-product-grid.liquid' },

    // ─── COLLECTION ──────────────────────────────────────
    'collection-list': { category: 'collection', name: 'Collection List', file: 'collection-list.liquid' },
    'large-lookbook-banners': { category: 'collection', name: 'Large Lookbook Banners', file: 'large-lookbook-banners.liquid' },
    'lookbook-with-collection': { category: 'collection', name: 'Lookbook with Collection', file: 'lookbook-with-collection.liquid' },

    // ─── TESTIMONIALS & REVIEWS ──────────────────────────
    'customer-review-block': { category: 'testimonial', name: 'Customer Review Block', file: 'customer-review-block.liquid' },
    'customer-testimonial': { category: 'testimonial', name: 'Customer Testimonial', file: 'customer-testimonial.liquid' },

    // ─── BRAND & TRUST ───────────────────────────────────
    'brand-slider': { category: 'brand', name: 'Brand Slider', file: 'brand-slider.liquid' },
    'brand-slider-2': { category: 'brand', name: 'Brand Slider 2', file: 'brand-slider-2.liquid' },
    'brand-tab-block': { category: 'brand', name: 'Brand Tab Block', file: 'brand-tab-block.liquid' },
    'custom-service-block': { category: 'brand', name: 'Service Block (Trust/Features)', file: 'custom-service-block.liquid' },

    // ─── CONTENT & TEXT ──────────────────────────────────
    'rich-text': { category: 'content', name: 'Rich Text', file: 'rich-text.liquid' },
    'custom-text-block': { category: 'content', name: 'Custom Text Block', file: 'custom-text-block.liquid' },
    'custom-press-banner': { category: 'content', name: 'Press Banner', file: 'custom-press-banner.liquid' },
    'custom-section': { category: 'content', name: 'Custom Section', file: 'custom-section.liquid' },
    'announcement-bar': { category: 'content', name: 'Announcement Bar', file: 'announcement-bar.liquid' },

    // ─── NEWSLETTER ──────────────────────────────────────
    'newsletter': { category: 'newsletter', name: 'Newsletter', file: 'newsletter.liquid' },
    'newsletter-banner-collapsible': { category: 'newsletter', name: 'Newsletter with Banner', file: 'newsletter-with-banner-collapsible.liquid' },
    'newsletter-countdown': { category: 'newsletter', name: 'Newsletter with Countdown', file: 'newsletter-with-countdown.liquid' },

    // ─── SOCIAL MEDIA ────────────────────────────────────
    'instagram': { category: 'social', name: 'Instagram Feed', file: 'instagram.liquid' },
    'instagram-grid': { category: 'social', name: 'Instagram Grid', file: 'instagram-grid.liquid' },
    'instagram-special': { category: 'social', name: 'Instagram Special', file: 'instagram-special.liquid' },
    'tiktok-embedder': { category: 'social', name: 'TikTok Embedder', file: 'tiktok-embedder.liquid' },

    // ─── VIDEO ───────────────────────────────────────────
    'video-block': { category: 'video', name: 'Video Block', file: 'video-block.liquid' },
    'video-carousel': { category: 'video', name: 'Video Carousel', file: 'video-carousel.liquid' },

    // ─── FAQ & INFO ──────────────────────────────────────
    'faqs': { category: 'faq', name: 'FAQ', file: 'faqs.liquid' },
    'collapsible-content': { category: 'faq', name: 'Collapsible Content', file: 'collapsible-content.liquid' },
    'policies-block': { category: 'faq', name: 'Policies Block', file: 'policies-block.liquid' },

    // ─── PROMOTIONAL BANNERS ─────────────────────────────
    'special-banner': { category: 'banner', name: 'Special Banner', file: 'special-banner.liquid' },
    'spotlight-block': { category: 'banner', name: 'Spotlight Block', file: 'spotlight-block.liquid' },
    'slidable-spotlight': { category: 'banner', name: 'Slidable Spotlight', file: 'slidable-spotlight.liquid' },
    'marquee': { category: 'banner', name: 'Marquee', file: 'marquee.liquid' },

    // ─── FOOTER ──────────────────────────────────────────
    'footer-01': { category: 'footer', name: 'Footer 01', file: 'footer-01.liquid' },
    'footer-02': { category: 'footer', name: 'Footer 02', file: 'footer-02.liquid' },
    'footer-03': { category: 'footer', name: 'Footer 03', file: 'footer-03.liquid' },
    'footer-04': { category: 'footer', name: 'Footer 04', file: 'footer-04.liquid' },
    'footer-05': { category: 'footer', name: 'Footer 05', file: 'footer-05.liquid' },
    'footer-06': { category: 'footer', name: 'Footer 06', file: 'footer-06.liquid' },
    'footer-07': { category: 'footer', name: 'Footer 07', file: 'footer-07.liquid' },
    'google-map': { category: 'footer', name: 'Google Map', file: 'google-map.liquid' },
    'store-locator': { category: 'footer', name: 'Store Locator', file: 'store-locator.liquid' },

    // ─── BLOG ────────────────────────────────────────────
    'featured-blog': { category: 'content', name: 'Featured Blog', file: 'featured-blog.liquid' },
    'blog-post-slider': { category: 'content', name: 'Blog Post Slider', file: 'blog-post-slider.liquid' },
    'blog-posts-list': { category: 'content', name: 'Blog Posts List', file: 'blog-posts-list.liquid' },
    'search-block': { category: 'content', name: 'Search Block', file: 'search-block.liquid' },
};

// Helper: get sections for a category
export function getSectionsByCategory(categoryId) {
    return Object.entries(SECTION_FILES)
        .filter(([_, meta]) => meta.category === categoryId)
        .map(([id, meta]) => ({ id, ...meta }));
}

// Helper: get category with count
export function getCategoriesWithCounts() {
    return SECTION_CATEGORIES.map(cat => ({
        ...cat,
        count: Object.values(SECTION_FILES).filter(s => s.category === cat.id).length,
    }));
}
