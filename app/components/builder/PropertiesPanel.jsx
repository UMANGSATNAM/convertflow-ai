import React from 'react';
import { X } from "lucide-react";

export function PropertiesPanel({ 
    selectedBlockId, 
    selectedTemplateId, 
    onClearSelection, 
    templateSchema, 
    settings, 
    setSettings, 
    placement, 
    setPlacement 
}) {
    if (!selectedBlockId && !selectedTemplateId) return null;

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onClearSelection} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', color: '#4b5563', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {templateSchema.name || (selectedBlockId ? 'Edit Section' : 'Customize Section')}
                    </h3>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px 0' }}>
                
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {templateSchema.settings.map(s => (
                            <SettingRow
                                key={s.id}
                                setting={s}
                                value={settings[s.id]}
                                onChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
function SettingRow({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            onChange(setting.id, reader.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ padding: '20px', borderBottom: '1px solid #f9fafb' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>{setting.label || setting.id}</label>
            
            {/* Color Swatch */}
            {setting.type === 'color' && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, padding: 0, border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: v || '#000000' }}>
                        <input type="color" value={v || '#000000'} onChange={e => onChange(setting.id, e.target.value)} style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    <code style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace', flex: 1, background: '#f9fafb', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        {v || '#000000'}
                    </code>
                </div>
            )}
            
            {/* Text Input */}
            {(setting.type === 'text' || setting.type === 'textarea' || setting.type === 'color_background') && (
                <input type="text" value={v} placeholder={setting.placeholder || ''} onChange={e => onChange(setting.id, e.target.value)} style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 4,
                    color: '#111827', outline: 'none', transition: 'border-color 0.2s',
                }} />
            )}

            {/* Image Upload Box */}
            {setting.type === 'image_picker' && (
                <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, background: '#f9fafb', padding: 8, textAlign: 'center' }}>
                    {v ? (
                        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 6, overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb' }}>
                            <img src={v} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button onClick={() => onChange(setting.id, '')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <X size={14} color="#ef4444" />
                            </button>
                        </div>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            <span>Upload Image</span>
                        </label>
                    )}
                </div>
            )}

            {/* Range Slider */}
            {setting.type === 'range' && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input type="range" min={setting.min} max={setting.max} step={setting.step || 1} value={v} onChange={e => onChange(setting.id, Number(e.target.value))} style={{ flex: 1, accentColor: '#4f46e5' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', minWidth: 40, textAlign: 'right' }}>{v}{setting.unit || ''}</span>
                </div>
            )}

            {/* Checkbox Toggle */}
            {setting.type === 'checkbox' && (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Enabled</span>
                    <input type="checkbox" checked={Boolean(v)} onChange={e => onChange(setting.id, e.target.checked)} style={{ accentColor: '#4f46e5', width: 16, height: 16 }} />
                </label>
            )}

            {/* Select Box */}
            {setting.type === 'select' && (
                <select value={v} onChange={e => onChange(setting.id, e.target.value)} style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 4,
                    color: '#111827', outline: 'none', cursor: 'pointer'
                }}>
                    {(setting.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            )}
        </div>
    );
}
