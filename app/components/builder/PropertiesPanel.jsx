import React from 'react';
import { X } from "lucide-react";
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { PolarisSchemaGenerator } from './architect/PolarisSchemaGenerator';

export function PropertiesPanel({ 
    selectedBlockId, 
    selectedTemplateId, 
    onClearSelection, 
    templateSchema, 
    settings, 
    setSettings, 
    placement, 
    setPlacement,
    onRemoveBlock
}) {
    // If nothing selected, show the empty state instructions
    if (!selectedBlockId && !selectedTemplateId) {
        return (
            <aside style={{
                width: 320, minWidth: 320, height: '100%',
                background: '#ffffff', borderLeft: '1px solid #e5e7eb',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
                color: '#374151', padding: '24px 20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>Add elements</h3>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: '#4b5563', margin: '0 0 32px' }}>
                    Select, drag, and drop your element variants of choice into the canvas.
                </p>

                <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>ConvertFlow elements</h4>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: '#6b7280', margin: '0 0 32px' }}>
                    ConvertFlow elements are the building blocks you can inject into any theme. They include a variety of functions to elevate your storefront's conversion rate.
                </p>

                <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>Shopify elements</h4>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: '#6b7280', margin: 0 }}>
                    Shopify elements directly display content from Shopify like product and collection information, blog posts, meta data, etc.
                </p>
            </aside>
        );
    }

    return (
        <aside style={{
            width: 320, minWidth: 320, height: '100%',
            background: '#ffffff', borderLeft: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                        {templateSchema.name || (selectedBlockId ? 'Edit Section' : 'Customize Section')}
                    </h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0, wordBreak: 'break-all' }}>
                        ID: {(selectedBlockId || selectedTemplateId).slice(0, 16)}...
                    </p>
                </div>
                <button onClick={onClearSelection} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    <X size={16} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Placement Block for New Templates */}
                {!selectedBlockId && (
                    <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Inject Position</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[['top', 'Below Header'], ['bottom', 'Above Footer']].map(([v, label]) => (
                                <button 
                                    key={v} 
                                    style={{ 
                                        flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6, cursor: 'pointer',
                                        background: placement === v ? '#1f2937' : '#f3f4f6',
                                        color: placement === v ? '#ffffff' : '#4b5563',
                                        transition: 'all 0.15s'
                                    }} 
                                    onClick={() => setPlacement(v)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State for Schema */}
                {templateSchema.settings.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#8c9196', fontSize: 13 }}>Loading parameters...</div>
                ) : (
                    <AppProvider i18n={{}}>
                        <div style={{ padding: '20px' }}>
                            <PolarisSchemaGenerator 
                                schema={templateSchema}
                                settingsData={settings}
                                onSettingChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))}
                                onBlockAdd={(type) => { console.log('Add block:', type) }}
                                onBlockRemove={(id) => { console.log('Remove block:', id) }}
                            />
                        </div>
                    </AppProvider>
                )}
            </div>

            {/* Sticky Bottom Actions */}
            {selectedBlockId && (
                <div style={{ 
                    padding: '16px 20px', 
                    borderTop: '1px solid #e5e7eb', 
                    background: '#ffffff',
                    display: 'flex', 
                    flexDirection: 'column' 
                }}>
                    <button 
                        onClick={() => onRemoveBlock(selectedBlockId)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', 
                            background: 'transparent', border: 'none', 
                            fontSize: 13, fontWeight: 500, color: '#ef4444', 
                            cursor: 'pointer', alignSelf: 'flex-start'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Remove section
                    </button>
                </div>
            )}
        </aside>
    );
}


