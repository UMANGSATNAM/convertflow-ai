import React, { useState } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { Button, Icon, Text } from '@shopify/polaris';
import { ChevronLeftIcon, ThemeEditIcon } from '@shopify/polaris-icons';

export function TemplatePicker() {
    const { categories, setActiveTab, setPreviewTemplateId, fetcher } = useThemeEditor();
    const [activeCategory, setActiveCategory] = useState(null);

    const handleAddSection = (sectionId) => {
        fetcher.submit(
            { intent: "inject_section", sectionId, placement: "bottom" },
            { method: "post" }
        );
        setActiveTab('sections'); // Go back to outline
    };

    if (activeCategory) {
        return (
            <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--p-color-border)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--p-color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button variant="plain" icon={ChevronLeftIcon} onClick={() => setActiveCategory(null)} />
                    <Text variant="headingMd" as="h3">{activeCategory.name}</Text>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {/* Grid implementation for visual previews */}
                    <Text tone="subdued">Select a template below to add it to your theme.</Text>
                    {/* Note: In a fully wired environment, this maps over the category templates */}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeCategory.sections.map(sec => (
                            <Button key={sec.file} fullWidth onClick={() => handleAddSection(sec.file)} textAlign="left">
                                {sec.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--p-color-border)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--p-color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button variant="plain" icon={ChevronLeftIcon} onClick={() => setActiveTab('sections')} />
                <Text variant="headingMd" as="h3">Add section</Text>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {(categories || []).map(cat => (
                    <div
                        key={cat.id}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--p-color-bg-surface-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        <Icon source={ThemeEditIcon} color="subdued" />
                        <Text variant="bodyMd" as="span">{cat.name}</Text>
                    </div>
                ))}
            </div>
        </aside>
    );
}
