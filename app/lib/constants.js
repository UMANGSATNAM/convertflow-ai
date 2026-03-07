export const SECTION_CATEGORIES = [
    {
        id: 'header',
        name: 'Header',
        description: 'Navigation bars and branding',
        icon: 'Layout',
    }
];

export const SECTION_FILES = {
    'cf-header-premium': {
        category: 'header',
        name: 'Premium Header',
        file: 'cf-header-premium.liquid'
    }
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
