export const SECTION_CATEGORIES = [
    { id: 'header', name: 'Header', description: 'Navigation bars and branding', icon: 'Layout' },
    { id: 'marquee', name: 'Marquee / Tickers', description: 'Infinite scrolling announcement bands', icon: 'Type' },
    { id: 'promo', name: 'Promo Posters', description: 'Large format promotional banners', icon: 'Image' },
    { id: 'announcement', name: 'Announcement Bars', description: '10 creative announcement styles', icon: 'Megaphone' },
    { id: 'hero', name: 'Hero Sections', description: '10 premium hero banners', icon: 'Image' }
];

export const SECTION_FILES = {
    'cf-head-01': { category: 'header', name: '01 · Luxury Header', file: 'cf-head-01.liquid' },
    'cf-head-02': { category: 'header', name: '02 · Streetwear Header', file: 'cf-head-02.liquid' },
    'cf-head-03': { category: 'header', name: '03 · Tech Header', file: 'cf-head-03.liquid' },
    'cf-head-04': { category: 'header', name: '04 · Health Header', file: 'cf-head-04.liquid' },
    'cf-head-05': { category: 'header', name: '05 · Beauty Header', file: 'cf-head-05.liquid' },
    'cf-head-06': { category: 'header', name: '06 · Automotive Header', file: 'cf-head-06.liquid' },
    'cf-head-07': { category: 'header', name: '07 · SaaS Header', file: 'cf-head-07.liquid' },
    'cf-head-08': { category: 'header', name: '08 · Kids Header', file: 'cf-head-08.liquid' },
    'cf-head-09': { category: 'header', name: '09 · Furniture Header', file: 'cf-head-09.liquid' },
    'cf-head-10': { category: 'header', name: '10 · Fitness Header', file: 'cf-head-10.liquid' },

    'cf-marquee-01': { category: 'marquee', name: '01 · Luxury Marquee', file: 'cf-marquee-01.liquid' },
    'cf-marquee-02': { category: 'marquee', name: '02 · Streetwear Marquee', file: 'cf-marquee-02.liquid' },
    'cf-marquee-03': { category: 'marquee', name: '03 · Tech Marquee', file: 'cf-marquee-03.liquid' },
    'cf-marquee-04': { category: 'marquee', name: '04 · Health Marquee', file: 'cf-marquee-04.liquid' },
    'cf-marquee-05': { category: 'marquee', name: '05 · Beauty Marquee', file: 'cf-marquee-05.liquid' },
    'cf-marquee-06': { category: 'marquee', name: '06 · Automotive Marquee', file: 'cf-marquee-06.liquid' },
    'cf-marquee-07': { category: 'marquee', name: '07 · SaaS Marquee', file: 'cf-marquee-07.liquid' },
    'cf-marquee-08': { category: 'marquee', name: '08 · Kids Marquee', file: 'cf-marquee-08.liquid' },
    'cf-marquee-09': { category: 'marquee', name: '09 · Furniture Marquee', file: 'cf-marquee-09.liquid' },
    'cf-marquee-10': { category: 'marquee', name: '10 · Fitness Marquee', file: 'cf-marquee-10.liquid' },

    'cf-promo-01': { category: 'promo', name: '01 · Luxury Promo', file: 'cf-promo-01.liquid' },
    'cf-promo-02': { category: 'promo', name: '02 · Streetwear Promo', file: 'cf-promo-02.liquid' },
    'cf-promo-03': { category: 'promo', name: '03 · Tech Promo', file: 'cf-promo-03.liquid' },
    'cf-promo-04': { category: 'promo', name: '04 · Health Promo', file: 'cf-promo-04.liquid' },
    'cf-promo-05': { category: 'promo', name: '05 · Beauty Promo', file: 'cf-promo-05.liquid' },
    'cf-promo-06': { category: 'promo', name: '06 · Automotive Promo', file: 'cf-promo-06.liquid' },
    'cf-promo-07': { category: 'promo', name: '07 · SaaS Promo', file: 'cf-promo-07.liquid' },
    'cf-promo-08': { category: 'promo', name: '08 · Kids Promo', file: 'cf-promo-08.liquid' },
    'cf-promo-09': { category: 'promo', name: '09 · Furniture Promo', file: 'cf-promo-09.liquid' },
    'cf-promo-10': { category: 'promo', name: '10 · Fitness Promo', file: 'cf-promo-10.liquid' },

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
