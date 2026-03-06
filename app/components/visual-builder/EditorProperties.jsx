import React from 'react';
import { motion } from 'framer-motion';
import { useVisualBuilderStore } from '../../store/visualBuilderStore';
import { X, Palette, Type, Box, MousePointerClick, Link, Image } from 'lucide-react';

// --- Reusable input components ---
function InputField({ label, value, onChange, type = 'text', placeholder }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-txt-tertiary uppercase tracking-wider">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-txt-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
            />
        </div>
    );
}

function ColorField({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-txt-tertiary uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border rounded-lg text-xs text-txt-primary outline-none focus:border-accent transition-all"
                />
            </div>
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-txt-tertiary uppercase tracking-wider">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-txt-primary outline-none focus:border-accent transition-all"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// --- Section wrapper ---
function PanelSection({ title, icon: Icon, children, defaultOpen = true }) {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <div className="border-b border-border">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-txt-primary hover:bg-surface-secondary transition-colors"
            >
                {Icon && <Icon size={14} className="text-txt-tertiary" />}
                <span className="flex-1 text-left">{title}</span>
                <span className={`text-txt-tertiary transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
            </button>
            {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
        </div>
    );
}

// --- Main Properties Panel ---
export default function EditorProperties() {
    const { selectedId, elements, updateElement, rightPanelOpen } = useVisualBuilderStore();

    if (!rightPanelOpen) return null;

    // Find the selected element
    const findNode = (nodes, id) => {
        for (const n of nodes) {
            if (n.id === id) return n;
            if (n.children?.length) {
                const found = findNode(n.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const selected = selectedId ? findNode(elements, selectedId) : null;

    if (!selected) {
        return (
            <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-[280px] bg-surface border-l border-border h-full flex flex-col shrink-0"
            >
                <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 bg-surface-tertiary rounded-xl flex items-center justify-center mb-4">
                        <MousePointerClick size={22} className="text-txt-tertiary" />
                    </div>
                    <h3 className="text-sm font-semibold text-txt-primary mb-1">Customize your pages</h3>
                    <p className="text-xs text-txt-tertiary leading-relaxed">
                        Select an element from the canvas or page outline to view its settings here.
                    </p>
                </div>
            </motion.div>
        );
    }

    const styles = selected.settings?.styles || {};
    const updateStyle = (prop, value) => {
        updateElement(selected.id, { styles: { [prop]: value } });
    };
    const updateProp = (prop, value) => {
        updateElement(selected.id, { [prop]: value });
    };

    return (
        <motion.div
            key={selected.id}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="w-[280px] bg-surface border-l border-border h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-surface-secondary flex items-center justify-between">
                <span className="text-xs font-semibold text-txt-primary">{selected.label || selected.type}</span>
                <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-md font-medium">{selected.type}</span>
            </div>

            {/* Content properties */}
            {(selected.type === 'Heading' || selected.type === 'Paragraph' || selected.type === 'Button') && (
                <PanelSection title="Content" icon={Type}>
                    <InputField
                        label="Text"
                        value={selected.settings?.text}
                        onChange={(v) => updateProp('text', v)}
                    />
                    {selected.type === 'Heading' && (
                        <SelectField
                            label="Tag"
                            value={selected.settings?.tag}
                            onChange={(v) => updateProp('tag', v)}
                            options={[
                                { value: 'h1', label: 'H1' },
                                { value: 'h2', label: 'H2' },
                                { value: 'h3', label: 'H3' },
                                { value: 'h4', label: 'H4' },
                            ]}
                        />
                    )}
                    {selected.type === 'Button' && (
                        <InputField
                            label="Link URL"
                            value={selected.settings?.url}
                            onChange={(v) => updateProp('url', v)}
                            placeholder="https://..."
                        />
                    )}
                </PanelSection>
            )}

            {selected.type === 'Image' && (
                <PanelSection title="Image" icon={Image}>
                    <InputField
                        label="Image URL"
                        value={selected.settings?.src}
                        onChange={(v) => updateProp('src', v)}
                        placeholder="https://..."
                    />
                    <InputField
                        label="Alt Text"
                        value={selected.settings?.alt}
                        onChange={(v) => updateProp('alt', v)}
                        placeholder="Image description"
                    />
                </PanelSection>
            )}

            {/* Typography */}
            {(selected.type === 'Heading' || selected.type === 'Paragraph' || selected.type === 'Button') && (
                <PanelSection title="Typography" icon={Type} defaultOpen={false}>
                    <InputField label="Font Size" value={styles.fontSize} onChange={(v) => updateStyle('fontSize', v)} placeholder="16px" />
                    <SelectField
                        label="Font Weight"
                        value={styles.fontWeight}
                        onChange={(v) => updateStyle('fontWeight', v)}
                        options={[
                            { value: '400', label: 'Regular' },
                            { value: '500', label: 'Medium' },
                            { value: '600', label: 'Semibold' },
                            { value: '700', label: 'Bold' },
                            { value: '800', label: 'Extra Bold' },
                        ]}
                    />
                    <SelectField
                        label="Text Align"
                        value={styles.textAlign}
                        onChange={(v) => updateStyle('textAlign', v)}
                        options={[
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' },
                        ]}
                    />
                    <InputField label="Line Height" value={styles.lineHeight} onChange={(v) => updateStyle('lineHeight', v)} placeholder="1.5" />
                </PanelSection>
            )}

            {/* Colors */}
            <PanelSection title="Colors" icon={Palette} defaultOpen={false}>
                {selected.type !== 'Image' && selected.type !== 'Spacer' && selected.type !== 'Divider' && (
                    <ColorField label="Text" value={styles.color} onChange={(v) => updateStyle('color', v)} />
                )}
                <ColorField label="Background" value={styles.backgroundColor} onChange={(v) => updateStyle('backgroundColor', v)} />
            </PanelSection>

            {/* Spacing */}
            <PanelSection title="Spacing" icon={Box} defaultOpen={false}>
                <InputField label="Padding" value={styles.padding} onChange={(v) => updateStyle('padding', v)} placeholder="20px" />
                <InputField label="Margin" value={styles.margin} onChange={(v) => updateStyle('margin', v)} placeholder="0px" />
                {(selected.type === 'Row' || selected.type === 'Column') && (
                    <InputField label="Gap" value={styles.gap} onChange={(v) => updateStyle('gap', v)} placeholder="20px" />
                )}
            </PanelSection>

            {/* Size */}
            <PanelSection title="Size" icon={Box} defaultOpen={false}>
                <InputField label="Width" value={styles.width} onChange={(v) => updateStyle('width', v)} placeholder="100%" />
                <InputField label="Height" value={styles.height || styles.minHeight} onChange={(v) => updateStyle('minHeight', v)} placeholder="auto" />
                {selected.type === 'Image' && (
                    <InputField label="Border Radius" value={styles.borderRadius} onChange={(v) => updateStyle('borderRadius', v)} placeholder="0px" />
                )}
                {selected.type === 'Button' && (
                    <InputField label="Border Radius" value={styles.borderRadius} onChange={(v) => updateStyle('borderRadius', v)} placeholder="6px" />
                )}
            </PanelSection>
        </motion.div>
    );
}
