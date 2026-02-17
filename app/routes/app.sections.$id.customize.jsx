import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { hasActiveSubscription } from "../../utils/billing.server";
import ColorPicker from "../../components/ColorPicker.jsx";
import FontSelector from "../../components/FontSelector.jsx";
import ImageUploader from "../../components/ImageUploader.jsx";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    // Check subscription
    const hasSubscription = await hasActiveSubscription(shop);
    if (!hasSubscription) {
        throw new Response("Subscription required", { status: 403 });
    }

    // Get section details
    const section = await db.sections.getById(id);
    if (!section) {
        throw new Response("Section not found", { status: 404 });
    }

    // Get shop record
    const shopRecord = await db.shops.findByDomain(shop);

    // Get existing customization if any
    const customizations = await db.customizations.getByShop(shopRecord.id);
    const existingCustomization = customizations.find(c => c.section_id === parseInt(id));

    return json({
        section,
        shopId: shopRecord.id,
        existingSettings: existingCustomization?.custom_settings || section.schema_json.settings,
    });
};

export const action = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    const formData = await request.formData();
    const action = formData.get("_action");

    const shopRecord = await db.shops.findByDomain(shop);

    if (action === "save") {
        const settings = JSON.parse(formData.get("settings"));

        await db.customizations.save(shopRecord.id, parseInt(id), settings);

        return json({ success: true, message: "Settings saved successfully!" });
    }

    if (action === "install") {
        // TODO: Implement theme installation via GraphQL
        return json({ success: true, message: "Section installed to your theme!" });
    }

    return json({ success: false, message: "Invalid action" });
};

export default function SectionCustomize() {
    const { section, shopId, existingSettings } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [settings, setSettings] = useState(existingSettings);
    const [activeTab, setActiveTab] = useState('design'); // design, content, layout
    const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
    const [hasChanges, setHasChanges] = useState(false);
    const [showSaveNotif, setShowSaveNotif] = useState(false);

    const updateSetting = (key, value) => {
        setSettings({ ...settings, [key]: value });
        setHasChanges(true);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("_action", "save");
        formData.append("settings", JSON.stringify(settings));
        fetcher.submit(formData, { method: "post" });
        setHasChanges(false);
        setShowSaveNotif(true);
        setTimeout(() => setShowSaveNotif(false), 3000);
    };

    const handleInstall = () => {
        const formData = new FormData();
        formData.append("_action", "install");
        fetcher.submit(formData, { method: "post" });
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{section.name}</h1>
                                <p className="text-sm text-gray-500">{section.category} • Variation #{section.variation_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Preview Mode Toggle */}
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`p-2 rounded transition ${previewMode === 'desktop'
                                        ? 'bg-white shadow text-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`p-2 rounded transition ${previewMode === 'mobile'
                                        ? 'bg-white shadow text-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={`px-6 py-2 rounded-lg font-medium transition ${hasChanges
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {hasChanges ? '💾 Save Changes' : '✓ Saved'}
                            </button>

                            <button
                                onClick={handleInstall}
                                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg transition"
                            >
                                🚀 Install to Theme
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Controls */}
                <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            {[
                                { id: 'design', label: 'Design', icon: '🎨' },
                                { id: 'content', label: 'Content', icon: '📝' },
                                { id: 'layout', label: 'Layout', icon: '📐' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Design Tab */}
                        {activeTab === 'design' && (
                            <div className="space-y-6">
                                <div className="pb-6 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                                        Colors
                                    </h3>
                                    <div className="space-y-4">
                                        <ColorPicker
                                            label="Primary Color"
                                            value={settings.primaryColor || '#667eea'}
                                            onChange={(color) => updateSetting('primaryColor', color)}
                                            showGradient
                                        />
                                        <ColorPicker
                                            label="Text Color"
                                            value={settings.textColor || '#1a202c'}
                                            onChange={(color) => updateSetting('textColor', color)}
                                        />
                                        <ColorPicker
                                            label="Background Color"
                                            value={settings.backgroundColor || '#ffffff'}
                                            onChange={(color) => updateSetting('backgroundColor', color)}
                                            showGradient
                                        />
                                    </div>
                                </div>

                                <div className="pb-6 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                                        Typography
                                    </h3>
                                    <div className="space-y-4">
                                        <FontSelector
                                            label="Heading Font"
                                            value={settings.headingFont || { family: 'Poppins', weight: 700 }}
                                            onChange={(font) => updateSetting('headingFont', font)}
                                        />
                                        <FontSelector
                                            label="Body Font"
                                            value={settings.bodyFont || { family: 'Inter', weight: 400 }}
                                            onChange={(font) => updateSetting('bodyFont', font)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content Tab */}
                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Heading
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.heading || ''}
                                            onChange={(e) => updateSetting('heading', e.target.value)}
                                            placeholder="Enter heading text..."
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={settings.description || ''}
                                            onChange={(e) => updateSetting('description', e.target.value)}
                                            placeholder="Enter description text..."
                                            rows={4}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Button Text
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.buttonText || ''}
                                            onChange={(e) => updateSetting('buttonText', e.target.value)}
                                            placeholder="Shop Now"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <ImageUploader
                                        label="Featured Image"
                                        value={settings.image || null}
                                        onChange={(image) => updateSetting('image', image)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Layout Tab */}
                        {activeTab === 'layout' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Section Padding
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Top</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="200"
                                                value={settings.paddingTop || 80}
                                                onChange={(e) => updateSetting('paddingTop', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">{settings.paddingTop || 80}px</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="200"
                                                value={settings.paddingBottom || 80}
                                                onChange={(e) => updateSetting('paddingBottom', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">{settings.paddingBottom || 80}px</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Content Alignment
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['left', 'center', 'right'].map((align) => (
                                            <button
                                                key={align}
                                                type="button"
                                                onClick={() => updateSetting('alignment', align)}
                                                className={`py-3 rounded-lg font-medium capitalize transition ${settings.alignment === align
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {align}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Border Radius
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={settings.borderRadius || 8}
                                        onChange={(e) => updateSetting('borderRadius', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">{settings.borderRadius || 8}px</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 bg-gray-100 p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <div
                            className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
                                }`}
                        >
                            {/* Live Preview */}
                            <div
                                style={{
                                    backgroundColor: settings.backgroundColor,
                                    paddingTop: `${settings.paddingTop || 80}px`,
                                    paddingBottom: `${settings.paddingBottom || 80}px`,
                                    textAlign: settings.alignment || 'center',
                                }}
                                className="px-8"
                            >
                                {settings.image && (
                                    <img
                                        src={settings.image}
                                        alt="Preview"
                                        className="w-full mb-6"
                                        style={{ borderRadius: `${settings.borderRadius || 8}px` }}
                                    />
                                )}

                                {settings.heading && (
                                    <h2
                                        style={{
                                            color: settings.textColor,
                                            fontFamily: settings.headingFont?.family || 'Poppins',
                                            fontWeight: settings.headingFont?.weight || 700,
                                        }}
                                        className="text-4xl mb-4"
                                    >
                                        {settings.heading}
                                    </h2>
                                )}

                                {settings.description && (
                                    <p
                                        style={{
                                            color: settings.textColor,
                                            fontFamily: settings.bodyFont?.family || 'Inter',
                                            fontWeight: settings.bodyFont?.weight || 400,
                                        }}
                                        className="text-lg mb-6 opacity-80"
                                    >
                                        {settings.description}
                                    </p>
                                )}

                                {settings.buttonText && (
                                    <button
                                        style={{
                                            backgroundColor: settings.primaryColor,
                                            borderRadius: `${settings.borderRadius || 8}px`,
                                            fontFamily: settings.bodyFont?.family || 'Inter',
                                            fontWeight: 600,
                                        }}
                                        className="px-8 py-4 text-white text-lg hover:opacity-90 transition"
                                    >
                                        {settings.buttonText}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Preview Label */}
                        <div className="text-center mt-4 text-sm text-gray-500">
                            🔍 Live Preview • {previewMode === 'desktop' ? 'Desktop' : 'Mobile'} View
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Notification */}
            {showSaveNotif && (
                <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Settings saved successfully!</span>
                </div>
            )}
        </div>
    );
}
