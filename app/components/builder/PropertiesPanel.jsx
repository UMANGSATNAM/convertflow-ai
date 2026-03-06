import React from 'react';
import { useBuilderStore } from '../../store/builderStore';

export default function PropertiesPanel() {
    const { selectedId, getElementById, updateElementSettings } = useBuilderStore();

    if (!selectedId) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 h-[calc(100vh-56px)] p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <span className="text-xl opacity-60">👆</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">No Element Selected</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Click on any element in the canvas to edit its properties.</p>
            </div>
        );
    }

    const element = getElementById(selectedId);
    if (!element) return null;

    const { type, settings } = element;

    const handleChange = (field, value) => {
        updateElementSettings(selectedId, { [field]: value });
    };

    const handleStyleChange = (styleKey, value) => {
        updateElementSettings(selectedId, {
            styles: {
                ...settings.styles,
                [styleKey]: value
            }
        });
    };

    const inputClasses = "w-full bg-white border border-gray-200 rounded-md p-2 text-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 transition-all shadow-sm";
    const labelClasses = "block text-gray-600 text-[11px] font-semibold mb-1.5 uppercase tracking-wider";
    const sectionTitleClasses = "text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2";

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-[calc(100vh-56px)] flex flex-col shrink-0 relative z-10 text-sm">

            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-gray-800 uppercase tracking-wider">{type}</h3>
                    <div className="text-[10px] text-gray-500 mt-1 font-mono">{selectedId}</div>
                </div>
                <div className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-bold shadow-sm">
                    Editing
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">

                {/* Content Settings (Text, Src, etc) */}
                {(type === 'Heading' || type === 'Paragraph' || type === 'Button') && (
                    <div className="space-y-4">
                        <h4 className={sectionTitleClasses}>Content</h4>

                        {type === 'Heading' && (
                            <div>
                                <label className={labelClasses}>Tag</label>
                                <select
                                    className={inputClasses}
                                    value={settings.tag || 'h2'}
                                    onChange={(e) => handleChange('tag', e.target.value)}
                                >
                                    <option value="h1">H1 - Main Title</option>
                                    <option value="h2">H2 - Section Title</option>
                                    <option value="h3">H3 - Subtitle</option>
                                    <option value="h4">H4</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className={labelClasses}>Text</label>
                            {type === 'Paragraph' ? (
                                <textarea
                                    className={`${inputClasses} min-h-[100px] resize-y`}
                                    value={settings.text || ''}
                                    onChange={(e) => handleChange('text', e.target.value)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.text || ''}
                                    onChange={(e) => handleChange('text', e.target.value)}
                                />
                            )}
                        </div>

                        {type === 'Button' && (
                            <div>
                                <label className={labelClasses}>Link URL</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.url || '#'}
                                    onChange={(e) => handleChange('url', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {type === 'Image' && (
                    <div className="space-y-4">
                        <h4 className={sectionTitleClasses}>Image Source</h4>
                        <div>
                            <label className={labelClasses}>URL</label>
                            <input
                                type="text"
                                className={`${inputClasses} mb-3`}
                                value={settings.src || ''}
                                onChange={(e) => handleChange('src', e.target.value)}
                            />
                            <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 shadow-inner">
                                <img src={settings.src} alt="Preview" className="max-h-full object-contain" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Alt Text</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={settings.alt || ''}
                                onChange={(e) => handleChange('alt', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Typography Styles */}
                {['Heading', 'Paragraph', 'Button'].includes(type) && (
                    <div className="space-y-4">
                        <h4 className={sectionTitleClasses}>Typography</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>Size</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.styles?.fontSize || ''}
                                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                                    placeholder="e.g. 16px"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Weight</label>
                                <select
                                    className={inputClasses}
                                    value={settings.styles?.fontWeight || '400'}
                                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                                >
                                    <option value="300">Light</option>
                                    <option value="400">Normal</option>
                                    <option value="500">Medium</option>
                                    <option value="600">Semibold</option>
                                    <option value="700">Bold</option>
                                    <option value="800">Extra Bold</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>Align</label>
                                <select
                                    className={inputClasses}
                                    value={settings.styles?.textAlign || 'left'}
                                    onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                    <option value="justify">Justify</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Color</label>
                                <div className="flex border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                    <input
                                        type="color"
                                        className="w-10 h-9 p-0.5 border-none bg-transparent cursor-pointer"
                                        value={settings.styles?.color || '#000000'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent p-2 text-gray-800 text-xs outline-none uppercase font-mono"
                                        value={settings.styles?.color || '#000000'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appearance / Box Model */}
                <div className="space-y-4">
                    <h4 className={sectionTitleClasses}>Appearance</h4>

                    <div>
                        <label className={labelClasses}>Background</label>
                        <div className="flex border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                            <input
                                type="color"
                                className="w-10 h-9 p-0.5 border-none bg-transparent cursor-pointer"
                                value={settings.styles?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            />
                            <input
                                type="text"
                                className="flex-1 bg-transparent p-2 text-gray-800 text-xs outline-none font-mono"
                                value={settings.styles?.backgroundColor || 'transparent'}
                                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            />
                        </div>
                    </div>

                    {type !== 'Root' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>Padding</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.styles?.padding || ''}
                                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                                    placeholder="e.g. 20px"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Margin</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.styles?.margin || ''}
                                    onChange={(e) => handleStyleChange('margin', e.target.value)}
                                    placeholder="e.g. 0 auto"
                                />
                            </div>
                        </div>
                    )}

                    {['Button', 'Image', 'Row', 'Column'].includes(type) && (
                        <div>
                            <label className={labelClasses}>Border Radius</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={settings.styles?.borderRadius || ''}
                                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                                placeholder="e.g. 8px"
                            />
                        </div>
                    )}
                </div>

                {/* Layout Rules */}
                {['Row', 'Column', 'Root'].includes(type) && (
                    <div className="space-y-4">
                        <h4 className={sectionTitleClasses}>Flex Layout</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>Direction</label>
                                <select
                                    className={inputClasses}
                                    value={settings.styles?.flexDirection || 'row'}
                                    onChange={(e) => handleStyleChange('flexDirection', e.target.value)}
                                >
                                    <option value="row">Horizontal</option>
                                    <option value="column">Vertical</option>
                                    <option value="row-reverse">Row Reverse</option>
                                    <option value="column-reverse">Col Reverse</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Gap</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={settings.styles?.gap || ''}
                                    onChange={(e) => handleStyleChange('gap', e.target.value)}
                                    placeholder="e.g. 20px"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Justify Content</label>
                            <select
                                className={inputClasses}
                                value={settings.styles?.justifyContent || 'flex-start'}
                                onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                            >
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                                <option value="space-between">Space Between</option>
                                <option value="space-around">Space Around</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Align Items</label>
                            <select
                                className={inputClasses}
                                value={settings.styles?.alignItems || 'stretch'}
                                onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                            >
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                                <option value="stretch">Stretch</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
