// Section categories and configuration
// This is the single source of truth for all section types

export const SECTION_CATEGORIES = [
    { id: 'header', name: 'Header', description: 'Navigation and branding', count: 1 },
    { id: 'hero', name: 'Hero', description: 'Above-the-fold sections', count: 0 },
    { id: 'product-showcase', name: 'Product Showcase', description: 'Featured products', count: 0 },
    { id: 'collection-grid', name: 'Collection Grid', description: 'Collection displays', count: 0 },
    { id: 'testimonials', name: 'Testimonials', description: 'Customer reviews', count: 0 },
    { id: 'faq', name: 'FAQ', description: 'Frequently asked questions', count: 0 },
    { id: 'features', name: 'Feature Highlights', description: 'Key selling points', count: 0 },
    { id: 'announcement', name: 'Announcement Bar', description: 'Top-of-page alerts', count: 0 },
    { id: 'newsletter', name: 'Newsletter', description: 'Email signup forms', count: 0 },
    { id: 'trust', name: 'Trust Badges', description: 'Security and trust signals', count: 0 },
    { id: 'comparison', name: 'Comparison Table', description: 'Product comparisons', count: 0 },
    { id: 'before-after', name: 'Before / After', description: 'Visual transformations', count: 0 },
    { id: 'video', name: 'Video Section', description: 'Video content', count: 0 },
    { id: 'brand-story', name: 'Brand Story', description: 'About your brand', count: 0 },
];

// Section files registry — maps section files to their metadata
export const SECTION_FILES = {
    'header-01-split-nav': {
        category: 'header',
        name: 'Header 01: Split Nav',
        file: 'header-01-split-nav.liquid',
        description: 'Centered logo with split navigation and icon group',
    },
};
