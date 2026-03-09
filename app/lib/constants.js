export const SECTION_CATEGORIES = [
    { id: 'header', name: 'Header', description: 'Navigation bars and branding', icon: 'Layout' },
    { id: 'announcement', name: 'Announcement Bars', description: '10 creative announcement styles', icon: 'Megaphone' },
    { id: 'hero', name: 'Hero Sections', description: '10 premium hero banners', icon: 'Image' }
];

export const SECTION_FILES = {
    'cf-header-premium': { category: 'header', name: 'Premium Header', file: 'cf-header-premium.liquid' },
    'cf-header-advanced': { category: 'header', name: 'Advanced Header (Gradient & Fonts)', file: 'cf-header-advanced.liquid' },

    'cf-announce-01': { category: 'announcement', name: '01 · Gradient Marquee', file: 'cf-announce-01.liquid' },
    'cf-announce-02': { category: 'announcement', name: '02 · Minimal Dark Bar', file: 'cf-announce-02.liquid' },
    'cf-announce-03': { category: 'announcement', name: '03 · Countdown Timer Bar', file: 'cf-announce-03.liquid' },
    'cf-announce-04': { category: 'announcement', name: '04 · Glassmorphism Bar', file: 'cf-announce-04.liquid' },
    'cf-announce-05': { category: 'announcement', name: '05 · Neon Glow Bar', file: 'cf-announce-05.liquid' },
    'cf-announce-06': { category: 'announcement', name: '06 · Emoji Marquee Bar', file: 'cf-announce-06.liquid' },
    'cf-announce-07': { category: 'announcement', name: '07 · Split Promo Bar', file: 'cf-announce-07.liquid' },
    'cf-announce-08': { category: 'announcement', name: '08 · Animated Wave Bar', file: 'cf-announce-08.liquid' },
    'cf-announce-09': { category: 'announcement', name: '09 · Bold Full-Width Bar', file: 'cf-announce-09.liquid' },
    'cf-announce-10': { category: 'announcement', name: '10 · Multi-Line Icon Bar', file: 'cf-announce-10.liquid' },

    'cf-hero-01': { category: 'hero', name: '01 · Gradient Hero', file: 'cf-hero-01.liquid' },
    'cf-hero-02': { category: 'hero', name: '02 · Split Hero', file: 'cf-hero-02.liquid' },
    'cf-hero-03': { category: 'hero', name: '03 · Fullscreen Image Hero', file: 'cf-hero-03.liquid' },
    'cf-hero-04': { category: 'hero', name: '04 · Stats Hero', file: 'cf-hero-04.liquid' },
    'cf-hero-05': { category: 'hero', name: '05 · Gradient Text Hero', file: 'cf-hero-05.liquid' },
    'cf-hero-06': { category: 'hero', name: '06 · Email Capture Hero', file: 'cf-hero-06.liquid' },
    'cf-hero-07': { category: 'hero', name: '07 · Video + Features Hero', file: 'cf-hero-07.liquid' },
    'cf-hero-08': { category: 'hero', name: '08 · Dark SaaS Hero', file: 'cf-hero-08.liquid' },
    'cf-hero-09': { category: 'hero', name: '09 · Flash Sale Hero', file: 'cf-hero-09.liquid' },
    'cf-hero-10': { category: 'hero', name: '10 · Product Showcase Hero', file: 'cf-hero-10.liquid' },
};

export function getSectionsByCategory(categoryId) {
    return Object.entries(SECTION_FILES)
        .filter(([_, meta]) => meta.category === categoryId)
        .map(([id, meta]) => ({ id, ...meta }));
}

export function getCategoriesWithCounts() {
    return SECTION_CATEGORIES.map(cat => ({
        ...cat,
        count: Object.values(SECTION_FILES).filter(s => s.category === cat.id).length,
    }));
}
