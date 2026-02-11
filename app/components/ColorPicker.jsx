import { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

export default function ColorPicker({ label, value, onChange, showGradient = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('solid'); // solid, gradient
    const [gradient, setGradient] = useState({
        type: 'linear',
        angle: 90,
        colors: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
        ],
    });

    const handleGradientChange = () => {
        const { type, angle, colors } = gradient;
        const colorStops = colors
            .map(c => `${c.color} ${c.position}%`)
            .join(', ');

        const gradientString = type === 'linear'
            ? `linear-gradient(${angle}deg, ${colorStops})`
            : `radial-gradient(circle, ${colorStops})`;

        onChange(gradientString);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="relative">
                {/* Color Preview Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                >
                    <div
                        className="w-10 h-10 rounded-md border-2 border-gray-200 shadow-inner"
                        style={{ background: value }}
                    />
                    <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900">
                            {activeTab === 'solid' ? value : 'Gradient'}
                        </div>
                        <div className="text-xs text-gray-500">Click to change</div>
                    </div>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Color Picker Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-full min-w-[300px]">
                        {/* Tabs */}
                        {showGradient && (
                            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('solid')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'solid'
                                            ? 'bg-white text-blue-600 shadow'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Solid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('gradient')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'gradient'
                                            ? 'bg-white text-blue-600 shadow'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Gradient
                                </button>
                            </div>
                        )}

                        {activeTab === 'solid' ? (
                            <div className="space-y-4">
                                <HexColorPicker color={value} onChange={onChange} style={{ width: '100%' }} />

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">HEX</label>
                                        <HexColorInput
                                            color={value}
                                            onChange={onChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Preset Colors */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Presets</label>
                                    <div className="grid grid-cols-8 gap-2">
                                        {[
                                            '#000000', '#ffffff', '#667eea', '#764ba2', '#f093fb', '#4facfe',
                                            '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3',
                                            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
                                        ].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => onChange(preset)}
                                                className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-blue-500 hover:scale-110 transition-all"
                                                style={{ backgroundColor: preset }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Gradient Type */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setGradient({ ...gradient, type: 'linear' })}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${gradient.type === 'linear'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Linear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGradient({ ...gradient, type: 'radial' })}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${gradient.type === 'radial'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Radial
                                        </button>
                                    </div>
                                </div>

                                {/* Angle Slider (for linear) */}
                                {gradient.type === 'linear' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            Angle: {gradient.angle}°
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={gradient.angle}
                                            onChange={(e) => {
                                                setGradient({ ...gradient, angle: parseInt(e.target.value) });
                                                handleGradientChange();
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}

                                {/* Color Stops */}
                                <div className="space-y-2">
                                    {gradient.colors.map((stop, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <HexColorPicker
                                                color={stop.color}
                                                onChange={(color) => {
                                                    const newColors = [...gradient.colors];
                                                    newColors[index].color = color;
                                                    setGradient({ ...gradient, colors: newColors });
                                                    handleGradientChange();
                                                }}
                                                style={{ width: '100px', height: '100px' }}
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={stop.position}
                                                    onChange={(e) => {
                                                        const newColors = [...gradient.colors];
                                                        newColors[index].position = parseInt(e.target.value);
                                                        setGradient({ ...gradient, colors: newColors });
                                                        handleGradientChange();
                                                    }}
                                                    className="w-full"
                                                />
                                                <div className="text-xs text-gray-600 mt-1">{stop.position}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGradientChange}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Apply Gradient
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
