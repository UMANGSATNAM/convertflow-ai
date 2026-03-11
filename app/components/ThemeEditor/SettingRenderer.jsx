import React from 'react';
import { TextField, Checkbox, Select, RangeSlider } from '@shopify/polaris';

/**
 * Dynamically renders Polaris UI components based on Shopify Section Schema types
 * (@type {text | textarea | image_picker | color | range | checkbox | select | url})
 */
export function SettingRenderer({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    switch (setting.type) {
        case 'text':
        case 'textarea':
        case 'color_background':
            return (
                <TextField
                    label={setting.label || setting.id}
                    value={v}
                    onChange={(val) => onChange(setting.id, val)}
                    multiline={setting.type === 'textarea'}
                    placeholder={setting.placeholder || ''}
                    autoComplete="off"
                />
            );

        case 'url':
            return (
                <TextField
                    label={setting.label || setting.id}
                    value={v}
                    onChange={(val) => onChange(setting.id, val)}
                    placeholder="https://"
                    autoComplete="off"
                />
            );

        case 'checkbox':
            return (
                <Checkbox
                    label={setting.label || setting.id}
                    checked={Boolean(v)}
                    onChange={(val) => onChange(setting.id, val)}
                />
            );

        case 'select':
            return (
                <Select
                    label={setting.label || setting.id}
                    options={setting.options || []}
                    value={v}
                    onChange={(val) => onChange(setting.id, val)}
                />
            );

        case 'range':
            return (
                <RangeSlider
                    label={setting.label || setting.id}
                    min={setting.min}
                    max={setting.max}
                    step={setting.step || 1}
                    value={Number(v)}
                    onChange={(val) => onChange(setting.id, Number(val))}
                    output
                    suffix={setting.unit || ''}
                />
            );

        case 'color':
            // Basic HTML5 Color picker layered with Polaris for speed 
            // (Polaris ColorPicker is HSV and highly complex for simple CSS hex vars)
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--p-color-text)' }}>{setting.label || setting.id}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={v || '#000000'}
                            onChange={e => onChange(setting.id, e.target.value)}
                            style={{ width: '36px', height: '36px', padding: 0, border: '1px solid var(--p-color-border)', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <code style={{ fontSize: '13px', background: 'var(--p-color-bg-surface-secondary)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--p-color-border)', flex: 1 }}>
                            {v || '#000000'}
                        </code>
                    </div>
                </div>
            );

        case 'image_picker':
            const handleImageUpload = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => onChange(setting.id, reader.result);
                reader.readAsDataURL(file);
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--p-color-text)' }}>{setting.label || setting.id}</label>
                    <div style={{ border: '1px dashed var(--p-color-border)', borderRadius: '8px', background: 'var(--p-color-bg-surface-secondary)', padding: '8px', textAlign: 'center' }}>
                        {v ? (
                            <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '4px', overflow: 'hidden', background: '#fff', border: '1px solid var(--p-color-border)' }}>
                                <img src={v} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <button
                                    onClick={() => onChange(setting.id, '')}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0', cursor: 'pointer', color: 'var(--p-color-text-secondary)', fontSize: '13px' }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                <span>Upload Image</span>
                            </label>
                        )}
                    </div>
                </div>
            );

        default:
            return null;
    }
}
