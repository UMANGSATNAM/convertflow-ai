import React, { useState, useMemo } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { getSectionsByCategory } from '../../lib/constants';

export function TemplatePicker() {
    const { categories, setActiveTab, addSection, setPreviewTemplateId } = useThemeEditor();
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Get sections for the active category
    const activeSections = useMemo(() => {
        if (!activeCategoryId) return [];
        return getSectionsByCategory(activeCategoryId);
    }, [activeCategoryId]);

    // Filter sections by search query
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return activeSections;
        const q = searchQuery.toLowerCase();
        return activeSections.filter(s => s.name.toLowerCase().includes(q));
    }, [activeSections, searchQuery]);

    // Active category object
    const activeCategory = (categories || []).find(c => c.id === activeCategoryId);

    // -- Section Detail View --
    if (activeCategory) {
        return (
            <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
                {/* Header with back button */}
                <div className="p-3 border-b border-polaris-border flex items-center gap-2">
                    <button
                        onClick={() => { setActiveCategoryId(null); setSearchQuery(''); }}
                        className="text-polaris-subdued hover:text-polaris-text transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h3 className="text-sm font-semibold text-polaris-text flex-1">{activeCategory.name}</h3>
                    <span className="text-xs text-polaris-subdued bg-polaris-bg px-2 py-0.5 rounded-full">{filteredSections.length}</span>
                </div>

                {/* Search within category */}
                <div className="p-3 border-b border-polaris-border">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-2 text-polaris-subdued text-base">search</span>
                        <input
                            type="text"
                            placeholder="Filter sections..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full border border-polaris-border rounded-lg py-1.5 pl-8 pr-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Section List */}
                <div className="flex-1 overflow-y-auto sidebar-scroll">
                    {filteredSections.length === 0 ? (
                        <div className="p-6 text-center">
                            <span className="material-symbols-outlined text-3xl text-polaris-subdued mb-2">search_off</span>
                            <p className="text-sm text-polaris-subdued">No sections found</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredSections.map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => addSection(sec.id)}
                                    onMouseEnter={() => setPreviewTemplateId(sec.id)}
                                    onMouseLeave={() => setPreviewTemplateId(null)}
                                    className="w-full flex items-center gap-3 p-2.5 hover:bg-polaris-bg rounded-lg group text-left transition-colors"
                                >
                                    <span className="material-symbols-outlined text-polaris-subdued group-hover:text-primary transition-colors">add_circle</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-polaris-text block truncate">{sec.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        );
    }

    // -- Category List View --
    return (
        <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-polaris-border flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('sections')}
                    className="text-polaris-subdued hover:text-polaris-text transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h3 className="text-sm font-semibold text-polaris-text">Add section</h3>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto sidebar-scroll">
                <div className="p-2 space-y-1">
                    {(categories || []).map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryId(cat.id)}
                            className="w-full flex items-center justify-between p-2.5 hover:bg-polaris-bg rounded-lg group text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-polaris-subdued">dashboard_customize</span>
                                <span className="text-sm text-polaris-text">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-polaris-subdued bg-polaris-bg px-2 py-0.5 rounded-full">{cat.count}</span>
                                <span className="material-symbols-outlined text-polaris-subdued opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
