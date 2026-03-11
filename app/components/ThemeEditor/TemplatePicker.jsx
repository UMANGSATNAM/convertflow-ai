import React, { useState, useMemo } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { getSectionsByCategory } from '../../lib/constants';
import { PAGE_TEMPLATES } from '../../lib/page-templates';

export function TemplatePicker() {
    const {
        categories, activeTab, setActiveTab,
        addSection, insertSection, swapSection, applyTitan,
        setPreviewTemplateId, previewTemplateId,
        insertTargetId, setInsertTargetId,
        swapTargetId, setSwapTargetId,
        fetcher
    } = useThemeEditor();

    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isSwapMode = activeTab === 'swap';
    const isTitanMode = activeTab === 'titan';
    const isBusy = fetcher.state !== 'idle';

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

    const activeCategory = (categories || []).find(c => c.id === activeCategoryId);

    // Titan templates split
    const homeTemplates = PAGE_TEMPLATES.filter(t => t.type === 'home');
    const pdpTemplates = PAGE_TEMPLATES.filter(t => t.type === 'product');

    // ── Handlers ────────────────────────────────────────────────

    const handleSectionClick = (sec) => {
        setPreviewTemplateId(sec.id);
    };

    const handleAddSection = (secId) => {
        if (isSwapMode && swapTargetId) {
            // Swap mode: replace the target block
            swapSection(swapTargetId, secId);
        } else if (insertTargetId) {
            // Insert-at mode: insert after the target block
            insertSection(secId, insertTargetId);
        } else {
            // Default: append to bottom
            addSection(secId);
        }
        setPreviewTemplateId(null);
    };

    const handleApplyTitan = (titanId) => {
        applyTitan(titanId);
    };

    const handleBack = () => {
        setPreviewTemplateId(null);
        setInsertTargetId(null);
        setSwapTargetId(null);
        if (activeCategoryId) {
            setActiveCategoryId(null);
            setSearchQuery('');
        } else {
            setActiveTab('sections');
        }
    };

    // ══════════════════════════════════════════════════════════════
    // TITAN TEMPLATES VIEW
    // ══════════════════════════════════════════════════════════════
    if (isTitanMode) {
        return (
            <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
                <div className="p-3 border-b border-polaris-border flex items-center gap-2">
                    <button onClick={handleBack} className="text-polaris-subdued hover:text-polaris-text transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h3 className="text-sm font-semibold text-polaris-text flex-1">Titan Templates</h3>
                </div>

                <div className="flex-1 overflow-y-auto sidebar-scroll">
                    {/* Home Templates */}
                    <div className="p-3">
                        <p className="text-xs font-bold text-polaris-subdued uppercase tracking-wider mb-3">Home Pages</p>
                        <div className="space-y-2">
                            {homeTemplates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => handleApplyTitan(tpl.id)}
                                    disabled={isBusy}
                                    className="w-full text-left p-3 rounded-lg border border-polaris-border hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-polaris-text group-hover:text-primary transition-colors">{tpl.name}</span>
                                        <span className="text-[10px] text-polaris-subdued bg-polaris-bg px-1.5 py-0.5 rounded-full">{tpl.sections.length}s</span>
                                    </div>
                                    <p className="text-xs text-polaris-subdued leading-relaxed">{tpl.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-polaris-border mx-3"></div>

                    {/* Product Templates */}
                    <div className="p-3">
                        <p className="text-xs font-bold text-polaris-subdued uppercase tracking-wider mb-3">Product Pages</p>
                        <div className="space-y-2">
                            {pdpTemplates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => handleApplyTitan(tpl.id)}
                                    disabled={isBusy}
                                    className="w-full text-left p-3 rounded-lg border border-polaris-border hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-polaris-text group-hover:text-primary transition-colors">{tpl.name}</span>
                                        <span className="text-[10px] text-polaris-subdued bg-polaris-bg px-1.5 py-0.5 rounded-full">{tpl.sections.length}s</span>
                                    </div>
                                    <p className="text-xs text-polaris-subdued leading-relaxed">{tpl.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION DETAIL VIEW (category selected)
    // ══════════════════════════════════════════════════════════════
    if (activeCategory) {
        return (
            <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-polaris-border flex items-center gap-2">
                    <button onClick={handleBack} className="text-polaris-subdued hover:text-polaris-text transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h3 className="text-sm font-semibold text-polaris-text flex-1">{activeCategory.name}</h3>
                    <span className="text-xs text-polaris-subdued bg-polaris-bg px-2 py-0.5 rounded-full">{filteredSections.length}</span>
                </div>

                {/* Mode indicator */}
                {(isSwapMode || insertTargetId) && (
                    <div className="px-3 py-2 bg-primary/5 border-b border-primary/20">
                        <p className="text-xs font-semibold text-primary">
                            {isSwapMode ? 'Select a section to swap in' : 'Select a section to insert'}
                        </p>
                    </div>
                )}

                {/* Search */}
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
                                <div key={sec.id} className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSectionClick(sec)}
                                        className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg group text-left transition-colors ${
                                            previewTemplateId === sec.id
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-polaris-bg'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined transition-colors ${
                                            previewTemplateId === sec.id ? 'text-primary' : 'text-polaris-subdued group-hover:text-primary'
                                        }`}>visibility</span>
                                        <span className="text-sm text-polaris-text truncate">{sec.name}</span>
                                    </button>

                                    <button
                                        onClick={() => handleAddSection(sec.id)}
                                        className="p-2 text-polaris-subdued hover:text-primary hover:bg-polaris-bg rounded-lg transition-colors shrink-0"
                                        title={isSwapMode ? 'Swap in this section' : 'Add to page'}
                                    >
                                        <span className="material-symbols-outlined">
                                            {isSwapMode ? 'swap_horiz' : 'add_circle'}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom action bar */}
                {previewTemplateId && (
                    <div className="p-3 border-t border-polaris-border bg-blue-50">
                        <button
                            onClick={() => handleAddSection(previewTemplateId)}
                            className="w-full bg-primary text-black py-2 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            {isSwapMode ? 'Swap this section' : '+ Add this section'}
                        </button>
                    </div>
                )}
            </aside>
        );
    }

    // ══════════════════════════════════════════════════════════════
    // CATEGORY LIST VIEW (default)
    // ══════════════════════════════════════════════════════════════
    return (
        <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
            <div className="p-3 border-b border-polaris-border flex items-center gap-2">
                <button onClick={handleBack} className="text-polaris-subdued hover:text-polaris-text transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h3 className="text-sm font-semibold text-polaris-text">
                    {isSwapMode ? 'Swap section' : 'Add section'}
                </h3>
            </div>

            {/* Mode indicator */}
            {(isSwapMode || insertTargetId) && (
                <div className="px-3 py-2 bg-primary/5 border-b border-primary/20">
                    <p className="text-xs font-semibold text-primary">
                        {isSwapMode ? 'Choose a replacement section' : 'Choose a section to insert'}
                    </p>
                </div>
            )}

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
