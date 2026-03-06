import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronDown, Layout, Type, AlignLeft,
    MousePointerClick, Image, Space, Minus, Columns,
    Layers, Plus, Search, Trash2, Copy, Eye, EyeOff,
    LayoutTemplate, LayoutGrid, FileText, Sparkles, Download
} from 'lucide-react';
import { useVisualBuilderStore } from '../../store/visualBuilderStore';
import { ELEMENT_CONFIGS } from '../../store/elementConfigs';
import { TEMPLATES, TEMPLATE_STYLES, SECTION_TYPES } from '../../store/templateRegistry';

const ICONS = {
    Root: Layers,
    Section: LayoutTemplate,
    Row: Layout,
    Column: Columns,
    Heading: Type,
    Paragraph: AlignLeft,
    Button: MousePointerClick,
    Image: Image,
    Spacer: Space,
    Divider: Minus,
};

// --- Page Tree Node ---
function TreeNode({ node, depth = 0 }) {
    const [expanded, setExpanded] = useState(true);
    const { selectedId, setSelectedId, hoveredId, setHoveredId, removeElement, duplicateElement } = useVisualBuilderStore();
    const isSelected = selectedId === node.id;
    const isHovered = hoveredId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const Icon = ICONS[node.type] || FileText;

    return (
        <div>
            <div
                className={`
                    flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded-md text-[13px] group transition-all
                    ${isSelected ? 'bg-accent/10 text-accent font-medium' : 'text-txt-secondary hover:bg-surface-tertiary'}
                    ${isHovered && !isSelected ? 'bg-blue-50' : ''}
                `}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => setSelectedId(node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
            >
                {/* Expand/Collapse Toggle */}
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="p-0.5 hover:bg-surface-tertiary rounded shrink-0"
                    >
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}

                <Icon size={14} className="shrink-0 opacity-60" />
                <span className="truncate flex-1">{node.label || node.settings?.text?.substring(0, 20) || node.type}</span>

                {/* Quick Actions */}
                {node.id !== 'root' && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); duplicateElement(node.id); }}
                            className="p-1 hover:bg-surface rounded text-txt-tertiary hover:text-txt-primary"
                            title="Duplicate"
                        >
                            <Copy size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeElement(node.id); }}
                            className="p-1 hover:bg-red-50 rounded text-txt-tertiary hover:text-red-500"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Children */}
            <AnimatePresence>
                {expanded && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {node.children.map(child => (
                            <TreeNode key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Elements Grid ---
function ElementsGrid() {
    const { addElement, selectedId } = useVisualBuilderStore();
    const elements = Object.entries(ELEMENT_CONFIGS);

    const handleAdd = (type) => {
        const config = ELEMENT_CONFIGS[type];
        const targetId = selectedId || 'root';
        addElement(targetId, {
            type,
            label: config.label,
            settings: { ...config.defaultProps },
            ...(config.isContainer ? { children: [] } : {}),
        });
    };

    return (
        <div className="p-3">
            <p className="text-[10px] uppercase font-bold text-txt-tertiary tracking-wider mb-3">Layout</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
                {elements.filter(([, c]) => c.isContainer).map(([type, config]) => {
                    const Icon = ICONS[type] || FileText;
                    return (
                        <button
                            key={type}
                            onClick={() => handleAdd(type)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-txt-secondary hover:text-accent"
                        >
                            <Icon size={20} strokeWidth={1.5} />
                            <span className="text-[11px] font-medium">{config.label}</span>
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] uppercase font-bold text-txt-tertiary tracking-wider mb-3">Content</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
                {elements.filter(([, c]) => !c.isContainer).map(([type, config]) => {
                    const Icon = ICONS[type] || FileText;
                    return (
                        <button
                            key={type}
                            onClick={() => handleAdd(type)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-txt-secondary hover:text-accent"
                        >
                            <Icon size={20} strokeWidth={1.5} />
                            <span className="text-[11px] font-medium">{config.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// --- Add Section Button ---
function AddSectionButton() {
    const { addElement } = useVisualBuilderStore();

    const handleAddSection = () => {
        addElement('root', {
            type: 'Row',
            label: 'Flex section',
            settings: {
                styles: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    gap: '20px',
                    width: '100%',
                    flexWrap: 'wrap',
                    backgroundColor: 'transparent',
                    minHeight: '120px',
                }
            },
            children: [],
        });
    };

    return (
        <button
            onClick={handleAddSection}
            className="flex items-center gap-2 px-3 py-2 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
        >
            <Plus size={16} />
            <span>Add section</span>
        </button>
    );
}

// --- Templates Panel ---
function TemplatesPanel() {
    const [search, setSearch] = useState('');
    const [activeStyle, setActiveStyle] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const [installing, setInstalling] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const filtered = useMemo(() => {
        return TEMPLATES.filter(t => {
            if (search) {
                const q = search.toLowerCase();
                if (!t.name.toLowerCase().includes(q) && !t.tags.some(tag => tag.includes(q))) return false;
            }
            if (activeStyle && t.style !== activeStyle) return false;
            if (activeType && t.sectionType !== activeType) return false;
            return true;
        });
    }, [search, activeStyle, activeType]);

    const handleInstall = (template) => {
        setInstalling(template.id);
        window.dispatchEvent(new CustomEvent('cf-install-template', { detail: template }));
        setTimeout(() => setInstalling(null), 3000);
    };

    return (
        <div className="p-3 space-y-3">
            {/* Search */}
            <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary" />
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-surface-secondary border border-border rounded-lg text-xs text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent transition-all"
                />
            </div>

            {/* Style filter pills */}
            <div className="flex gap-1 flex-wrap">
                <button
                    onClick={() => setActiveStyle(null)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all ${!activeStyle ? 'bg-accent text-white border-accent' : 'border-border text-txt-tertiary hover:border-accent'
                        }`}
                >All</button>
                {TEMPLATE_STYLES.slice(0, 4).map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveStyle(activeStyle === s.id ? null : s.id)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all ${activeStyle === s.id ? 'bg-accent text-white border-accent' : 'border-border text-txt-tertiary hover:border-accent'
                            }`}
                    >{s.label}</button>
                ))}
            </div>

            {/* Template cards */}
            <div className="space-y-2">
                {filtered.length === 0 && (
                    <p className="text-xs text-txt-tertiary text-center py-4">No templates found</p>
                )}
                {filtered.map(t => {
                    const typeInfo = SECTION_TYPES.find(s => s.id === t.sectionType);
                    return (
                        <div key={t.id} className="group rounded-xl border border-border hover:border-accent/40 transition-all overflow-hidden bg-surface-secondary">
                            {/* Preview bar — clickable for preview */}
                            <div
                                className="h-14 relative cursor-pointer"
                                style={{ background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[2] || t.previewColors[1]})` }}
                                onClick={() => setPreviewTemplate(t)}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg opacity-80">{typeInfo?.icon || '📄'}</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                                    <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-txt-primary truncate">{t.name}</p>
                                        <p className="text-[10px] text-txt-tertiary mt-0.5 capitalize">{t.sectionType} · {t.style}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => setPreviewTemplate(t)}
                                            className="px-1.5 py-1 text-[10px] font-semibold rounded-md border border-border text-txt-secondary hover:border-accent hover:text-accent transition-all"
                                            title="Preview"
                                        >
                                            <Eye size={11} />
                                        </button>
                                        <button
                                            onClick={() => handleInstall(t)}
                                            disabled={installing === t.id}
                                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${installing === t.id
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-accent text-white hover:bg-accent-hover'
                                                }`}
                                        >
                                            {installing === t.id ? '✓ Done' : 'Install'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewTemplate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        onClick={() => setPreviewTemplate(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="relative w-[90vw] h-[85vh] bg-[#111] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#111]">
                                <div>
                                    <p className="text-sm font-semibold text-white">{previewTemplate.name}</p>
                                    <p className="text-xs text-white/50 capitalize">{previewTemplate.sectionType} · {previewTemplate.style} · {previewTemplate.niche}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { handleInstall(previewTemplate); setPreviewTemplate(null); }}
                                        className="px-4 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-all"
                                    >
                                        Install to Theme
                                    </button>
                                    <button
                                        onClick={() => setPreviewTemplate(null)}
                                        className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview iframe */}
                            <div className="flex-1 bg-[#0a0a0a]">
                                <iframe
                                    src={`/app/api/template-preview?file=${encodeURIComponent(previewTemplate.liquidFile)}`}
                                    className="w-full h-full border-none"
                                    title={`Preview: ${previewTemplate.name}`}
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Main Sidebar ---
export default function EditorSidebar() {
    const { elements, leftPanelTab, setLeftPanelTab, leftPanelOpen } = useVisualBuilderStore();
    const root = elements[0];

    if (!leftPanelOpen) return null;

    const tabs = [
        { id: 'tree', label: 'Content', icon: Layers },
        { id: 'elements', label: 'Elements', icon: Plus },
        { id: 'templates', label: 'Templates', icon: Sparkles },
    ];

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[240px] bg-surface border-r border-border h-full flex flex-col shrink-0 overflow-hidden"
        >
            {/* Sidebar Tabs */}
            <div className="flex border-b border-border bg-surface-secondary">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setLeftPanelTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 ${leftPanelTab === tab.id
                            ? 'text-txt-primary border-accent'
                            : 'text-txt-tertiary border-transparent hover:text-txt-secondary'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {leftPanelTab === 'tree' && (
                    <div className="py-2">
                        <TreeNode node={root} />
                        <div className="border-t border-border mt-2 pt-1">
                            <AddSectionButton />
                        </div>
                    </div>
                )}

                {leftPanelTab === 'elements' && <ElementsGrid />}

                {leftPanelTab === 'templates' && <TemplatesPanel />}
            </div>
        </motion.div>
    );
}
