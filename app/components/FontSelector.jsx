import { useState, useEffect } from 'react';

// Popular Google Fonts
const GOOGLE_FONTS = [
    { name: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700] },
    { name: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700] },
    { name: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700] },
    { name: 'Montserrat', category: 'sans-serif', weights: [400, 500, 600, 700, 800] },
    { name: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700] },
    { name: 'Lato', category: 'sans-serif', weights: [400, 700] },
    { name: 'Raleway', category: 'sans-serif', weights: [400, 500, 600, 700] },
    { name: 'Playfair Display', category: 'serif', weights: [400, 600, 700] },
    { name: 'Merriweather', category: 'serif', weights: [400, 700] },
    { name: 'PT Serif', category: 'serif', weights: [400, 700] },
    { name: 'Lora', category: 'serif', weights: [400, 600, 700] },
    { name: 'Inconsolata', category: 'monospace', weights: [400, 700] },
    { name: 'Fira Code', category: 'monospace', weights: [400, 500, 700] },
    { name: 'Oswald', category: 'display', weights: [400, 600, 700] },
    { name: 'Bebas Neue', category: 'display', weights: [400] },
];

export default function FontSelector({ label, value, onChange, showWeight = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFont, setSelectedFont] = useState(value?.family || 'Inter');
    const [selectedWeight, setSelectedWeight] = useState(value?.weight || 400);
    const [filterCategory, setFilterCategory] = useState('all');
    const [loadedFonts, setLoadedFonts] = useState(new Set(['Inter']));

    const filteredFonts = GOOGLE_FONTS.filter(font => {
        const matchesSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || font.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Load Google Font dynamically
    const loadFont = (fontName) => {
        if (loadedFonts.has(fontName)) return;

        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700;800&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        setLoadedFonts(new Set([...loadedFonts, fontName]));
    };

    const handleFontSelect = (font) => {
        setSelectedFont(font.name);
        loadFont(font.name);
        onChange({
            family: font.name,
            weight: selectedWeight,
            category: font.category,
        });
    };

    useEffect(() => {
        // Load initial font
        loadFont(selectedFont);
    }, []);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="relative">
                {/* Font Preview Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                >
                    <div className="text-left">
                        <div
                            className="text-lg font-medium text-gray-900"
                            style={{ fontFamily: selectedFont }}
                        >
                            {selectedFont}
                        </div>
                        <div className="text-xs text-gray-500">
                            {GOOGLE_FONTS.find(f => f.name === selectedFont)?.category || 'sans-serif'}
                            {showWeight && ` • ${selectedWeight}`}
                        </div>
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

                {/* Font Picker Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-full">
                        {/* Search */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search fonts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {['all', 'sans-serif', 'serif', 'monospace', 'display'].map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setFilterCategory(category)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${filterCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {category === 'all' ? 'All' : category}
                                </button>
                            ))}
                        </div>

                        {/* Font List */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {filteredFonts.map((font) => (
                                <button
                                    key={font.name}
                                    type="button"
                                    onClick={() => handleFontSelect(font)}
                                    onMouseEnter={() => loadFont(font.name)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${selectedFont === font.name
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'hover:bg-gray-50 border-2 border-transparent'
                                        }`}
                                >
                                    <div
                                        className="text-base font-medium text-gray-900"
                                        style={{ fontFamily: font.name }}
                                    >
                                        {font.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{font.category}</div>
                                </button>
                            ))}
                        </div>

                        {/* Weight Selector */}
                        {showWeight && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Font Weight</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {GOOGLE_FONTS.find(f => f.name === selectedFont)?.weights.map((weight) => (
                                        <button
                                            key={weight}
                                            type="button"
                                            onClick={() => {
                                                setSelectedWeight(weight);
                                                onChange({
                                                    family: selectedFont,
                                                    weight: weight,
                                                    category: GOOGLE_FONTS.find(f => f.name === selectedFont)?.category,
                                                });
                                            }}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition ${selectedWeight === weight
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={{ fontFamily: selectedFont, fontWeight: weight }}
                                        >
                                            {weight}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Preview Text */}
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: selectedFont, fontWeight: selectedWeight }}
                >
                    The quick brown fox jumps over the lazy dog
                </p>
                <p
                    className="text-sm text-gray-600 mt-2"
                    style={{ fontFamily: selectedFont, fontWeight: selectedWeight }}
                >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789
                </p>
            </div>
        </div>
    );
}
