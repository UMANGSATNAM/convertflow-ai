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
        case 'url':
            return (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-polaris-text">{setting.label || setting.id}</label>
                    <input 
                        type="text" 
                        value={v}
                        onChange={(e) => onChange(setting.id, e.target.value)}
                        placeholder={setting.placeholder || (setting.type === 'url' ? 'https://' : '')}
                        className="w-full border border-polaris-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                    />
                </div>
            );

        case 'checkbox':
            return (
                <div className="flex items-start gap-3 pt-2">
                    <div className="relative flex items-center h-5">
                        <input 
                            type="checkbox" 
                            checked={Boolean(v)}
                            onChange={(e) => onChange(setting.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-white border-polaris-border rounded focus:ring-primary focus:ring-offset-0 cursor-pointer" 
                        />
                    </div>
                    <div className="text-sm">
                        <label className="font-medium text-polaris-text">{setting.label || setting.id}</label>
                    </div>
                </div>
            );

        case 'select':
        case 'text_alignment':
            return (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-polaris-text">{setting.label || setting.id}</label>
                    <div className="relative">
                        <select 
                            value={v} 
                            onChange={(e) => onChange(setting.id, e.target.value)}
                            className="w-full bg-white border border-polaris-border rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-1 focus:ring-primary appearance-none outline-none"
                        >
                            {(setting.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1.5 pointer-events-none text-polaris-subdued">unfold_more</span>
                    </div>
                </div>
            );

        case 'range':
            return (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-polaris-text">{setting.label || setting.id}</label>
                        <span className="text-xs text-polaris-subdued">{Number(v)}{setting.unit || ''}</span>
                    </div>
                    <input 
                        type="range" 
                        min={setting.min || 0}
                        max={setting.max || 100}
                        step={setting.step || 1}
                        value={Number(v)}
                        onChange={(e) => onChange(setting.id, Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-polaris-border rounded-lg appearance-none cursor-pointer" 
                    />
                </div>
            );

        case 'color':
        case 'color_background':
            return (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-polaris-text">{setting.label || setting.id}</label>
                    <div className="flex items-center gap-3 border border-polaris-border rounded-lg px-3 py-2">
                        <div className="relative w-6 h-6 rounded border border-black/10 overflow-hidden cursor-pointer">
                            <input 
                                type="color" 
                                value={v || '#000000'}
                                onChange={e => onChange(setting.id, e.target.value)}
                                className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer"
                            />
                        </div>
                        <span className="text-sm text-polaris-text uppercase">{v || '#000000'}</span>
                    </div>
                </div>
            );

        case 'image_picker':
        case 'image':
            const handleImageUpload = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => onChange(setting.id, reader.result);
                reader.readAsDataURL(file);
            };

            return (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-polaris-text">{setting.label || setting.id}</label>
                    
                    {v ? (
                        <div className="relative border border-polaris-border rounded-xl aspect-[16/9] bg-polaris-bg overflow-hidden group">
                            <img src={v} alt="Preview" className="w-full h-full object-contain" />
                            <button
                                onClick={() => onChange(setting.id, '')}
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 rounded p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    ) : (
                        <label className="border-2 border-dashed border-polaris-border rounded-xl aspect-[16/9] flex flex-col items-center justify-center bg-polaris-bg hover:border-primary transition-colors cursor-pointer group">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <span className="material-symbols-outlined text-4xl text-polaris-subdued mb-2 group-hover:text-primary">image</span>
                            <span className="text-xs font-semibold text-polaris-subdued group-hover:text-primary transition-colors">Select image</span>
                        </label>
                    )}
                </div>
            );

        default:
            return null;
    }
}
