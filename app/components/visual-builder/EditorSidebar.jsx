import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronDown, Layout, Type, AlignLeft,
    MousePointerClick, Image, Space, Minus, Columns,
    Layers, Plus, Search, Trash2, Copy, Eye, EyeOff,
    LayoutTemplate, LayoutGrid, FileText
} from 'lucide-react';
import { useVisualBuilderStore } from '../../store/visualBuilderStore';
import { ELEMENT_CONFIGS } from '../../store/elementConfigs';

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

// --- Main Sidebar ---
export default function EditorSidebar() {
    const { elements, leftPanelTab, setLeftPanelTab, leftPanelOpen } = useVisualBuilderStore();
    const root = elements[0];

    if (!leftPanelOpen) return null;

    const tabs = [
        { id: 'tree', label: 'Page content', icon: Layers },
        { id: 'elements', label: 'Add element', icon: Plus },
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
            </div>
        </motion.div>
    );
}
