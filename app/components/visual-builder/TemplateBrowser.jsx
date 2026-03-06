import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, Eye, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { TEMPLATES, TEMPLATE_NICHES, TEMPLATE_STYLES, SECTION_TYPES } from '../../store/templateRegistry';

// ─── Color Preview Dots ───
function ColorDots({ colors }) {
    return (
        <div className="flex gap-1">
            {colors.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white/20" style={{ background: c }} />
            ))}
        </div>
    );
}

// ─── Template Card ───
function TemplateCard({ template, index, onPreview, onSelect }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-all duration-200"
        >
            {/* Preview Area */}
            <div
                className="h-52 relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${template.previewColors[0]}, ${template.previewColors[2] || template.previewColors[1]})`,
                }}
            >
                {/* Decorative elements showing the style */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl mb-2 opacity-90">{SECTION_TYPES.find(s => s.id === template.sectionType)?.icon || '📄'}</div>
                        <p className="text-xs font-semibold text-white/80 tracking-wider uppercase">{template.sectionType}</p>
                    </div>
                </div>

                {/* Color dots */}
                <div className="absolute bottom-3 left-3">
                    <ColorDots colors={template.previewColors} />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(template); }}
                        className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold rounded-lg hover:bg-white/30 transition-all"
                    >
                        Preview
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(template); }}
                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-elevated transition-all"
                    >
                        Select
                    </button>
                </div>

                {/* Premium badge */}
                {template.isPremium && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400/90 text-black text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Sparkles size={10} /> PRO
                    </div>
                )}
            </div>

            {/* Card Info */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-txt-primary mb-1 truncate">{template.name}</h3>
                <p className="text-[11px] text-txt-tertiary leading-relaxed line-clamp-2 mb-3">{template.description}</p>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-txt-tertiary font-medium">
                        Used on {template.usageCount.toLocaleString()} pages
                    </span>
                    <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-surface-secondary text-[10px] font-medium text-txt-secondary rounded-md border border-border-light capitalize">
                            {template.style}
                        </span>
                        <span className="px-2 py-0.5 bg-surface-secondary text-[10px] font-medium text-txt-secondary rounded-md border border-border-light capitalize">
                            {template.niche}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Filter Dropdown ───
function FilterDropdown({ label, options, value, onChange, allLabel = 'All' }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${value ? 'border-accent text-accent bg-accent/5' : 'border-border text-txt-secondary hover:border-border-light'
                    }`}
            >
                {label}{value ? `: ${options.find(o => o.id === value)?.label || value}` : ''}
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute top-full mt-1 z-50 w-52 bg-surface border border-border rounded-xl shadow-float py-1 max-h-60 overflow-y-auto"
                    >
                        <button
                            onClick={() => { onChange(null); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-secondary transition-colors ${!value ? 'text-accent font-semibold' : 'text-txt-secondary'}`}
                        >
                            {allLabel}
                        </button>
                        {options.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-secondary transition-colors flex items-center gap-2 ${value === opt.id ? 'text-accent font-semibold' : 'text-txt-secondary'}`}
                            >
                                {opt.emoji && <span>{opt.emoji}</span>}
                                {opt.label}
                                {value === opt.id && <Check size={12} className="ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Template Browser ───
export default function TemplateBrowser({ onSelect, onClose }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterNiche, setFilterNiche] = useState(null);
    const [filterStyle, setFilterStyle] = useState(null);
    const [filterSection, setFilterSection] = useState(null);

    const filteredTemplates = useMemo(() => {
        return TEMPLATES.filter(t => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesSearch = t.name.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.tags.some(tag => tag.includes(q));
                if (!matchesSearch) return false;
            }
            if (filterNiche && t.niche !== filterNiche) return false;
            if (filterStyle && t.style !== filterStyle) return false;
            if (filterSection && t.sectionType !== filterSection) return false;
            return true;
        });
    }, [searchQuery, filterNiche, filterStyle, filterSection]);

    const activeFilterCount = [filterNiche, filterStyle, filterSection].filter(Boolean).length;

    const handlePreview = (template) => {
        // For now, log preview — in the future, open a modal
        console.log('Preview template:', template.id);
    };

    const handleSelect = (template) => {
        onSelect(template);
    };

    const clearFilters = () => {
        setFilterNiche(null);
        setFilterStyle(null);
        setFilterSection(null);
        setSearchQuery('');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-surface flex flex-col"
        >
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-surface px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-surface-secondary rounded-lg text-txt-secondary transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-txt-primary">Page templates</h2>
                            <p className="text-xs text-txt-tertiary">
                                Find, preview and select pre-built page templates.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-secondary rounded-lg text-txt-secondary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search + Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-tertiary" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent/15 transition-all"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <FilterDropdown
                        label="Type"
                        options={SECTION_TYPES}
                        value={filterSection}
                        onChange={setFilterSection}
                    />
                    <FilterDropdown
                        label="Industry"
                        options={TEMPLATE_NICHES}
                        value={filterNiche}
                        onChange={setFilterNiche}
                    />
                    <FilterDropdown
                        label="Style"
                        options={TEMPLATE_STYLES}
                        value={filterStyle}
                        onChange={setFilterStyle}
                    />

                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Results count */}
                <p className="mt-3 text-xs text-txt-tertiary">
                    {filteredTemplates.length} of {TEMPLATES.length} templates
                </p>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-sm text-txt-secondary font-medium mb-1">No templates found</p>
                        <p className="text-xs text-txt-tertiary">Try adjusting your filters or search query</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredTemplates.map((template, i) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                index={i}
                                onPreview={handlePreview}
                                onSelect={handleSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
