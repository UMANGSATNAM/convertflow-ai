import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    // Check subscription status
    const hasSubscription = await hasActiveSubscription(shop);

    // Get shop from database
    let shopRecord = await db.shops.findByDomain(shop);

    // If shop doesn't exist, create it
    if (!shopRecord) {
        shopRecord = await db.shops.create(shop, session.accessToken);
    }

    // Get all sections grouped by category
    const allSections = await db.sections.getAll();

    // Group sections by category
    const categories = {};
    allSections.forEach(section => {
        if (!categories[section.category]) {
            categories[section.category] = [];
        }
        categories[section.category].push(section);
    });

    return json({
        shop: shopRecord,
        hasSubscription,
        categories,
        totalSections: allSections.length,
    });
};

export default function Dashboard() {
    const { shop, hasSubscription, categories, totalSections } = useLoaderData();
    const navigate = useNavigate();

    const categoryList = Object.keys(categories);

    return (
        <div className="min-h-screen bg-gray-50 font-['Montserrat']">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1e3a8a] via-[#d97706] to-[#1e3a8a]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold text-[#1e3a8a] font-['Playfair_Display'] tracking-tight">
                                ConvertFlow AI
                            </h1>
                            <p className="mt-2 text-lg text-gray-600 font-light">
                                Premium, high-converting sections for the modern brand.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {hasSubscription ? (
                                <div className="flex items-center gap-3 bg-[#f0f9ff] border border-[#bae6fd] px-4 py-2 rounded-lg">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[#0369a1] font-medium tracking-wide text-sm uppercase">Premium Active</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/subscribe')}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-none shadow-md text-white bg-[#1e3a8a] hover:bg-[#1e40af] transition-all duration-300 ring-1 ring-offset-2 ring-[#1e3a8a] hover:ring-offset-4"
                                >
                                    <span className="mr-2">✨</span> Unlock Premium Access
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Stats Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="p-2">
                        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Library</div>
                        <div className="text-4xl font-['Playfair_Display'] font-bold text-[#1e3a8a]">{totalSections}+</div>
                        <div className="text-gray-500 text-sm mt-1">Premium Sections</div>
                    </div>
                    <div className="p-2">
                        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Categories</div>
                        <div className="text-4xl font-['Playfair_Display'] font-bold text-[#d97706]">{categoryList.length}</div>
                        <div className="text-gray-500 text-sm mt-1">Curated Collections</div>
                    </div>
                    <div className="p-2">
                        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Updates</div>
                        <div className="text-4xl font-['Playfair_Display'] font-bold text-[#1e3a8a]">Weekly</div>
                        <div className="text-gray-500 text-sm mt-1">Fresh Designs</div>
                    </div>
                </div>
            </div>

            {/* Section Library */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-['Playfair_Display'] mb-4">
                        Curated Collection
                    </h2>
                    <div className="h-1 w-24 bg-[#d97706] mx-auto rounded-full mb-6"></div>
                    <p className="max-w-2xl mx-auto text-lg text-gray-600">
                        Browse our library of conversion-optimized sections.
                        Each template is crafted to match the quality of $500+ premium themes.
                    </p>
                </div>

                {!hasSubscription && (
                    <div className="mb-12 relative overflow-hidden rounded-2xl bg-[#1e3a8a] shadow-2xl">
                        <div className="absolute inset-0 opacity-10">
                            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                            </svg>
                        </div>
                        <div className="relative p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
                                    Unlock the Full Potential
                                </h3>
                                <p className="text-blue-100 max-w-xl">
                                    Get instant access to all {totalSections}+ premium sections, unlimited customizations, and priority support for just $20/month.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/subscribe')}
                                className="flex-shrink-0 px-8 py-4 bg-[#d97706] text-white font-bold rounded shadow-lg hover:bg-[#b45309] transition-transform transform hover:-translate-y-1 active:translate-y-0"
                            >
                                Get Started Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryList.map((category) => (
                        <div
                            key={category}
                            onClick={() => navigate(`/sections/${category.toLowerCase().replace(/\s+/g, '-')}`)}
                            className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1"
                        >
                            <div className="h-48 bg-gray-50 relative flex items-center justify-center p-8 group-hover:bg-[#f8fafc] transition-colors">
                                <div className="absolute top-4 right-4 opacity-50 font-['Playfair_Display'] text-6xl text-gray-200 pointer-events-none select-none">
                                    {categories[category].length}
                                </div>
                                <div className="text-center relative z-10 transition-transform duration-300 group-hover:scale-110">
                                    <div className="text-5xl mb-4 drop-shadow-sm">
                                        {getCategoryIcon(category)}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 font-['Playfair_Display'] mb-2 group-hover:text-[#d97706] transition-colors">
                                    {category}
                                </h3>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>{categories[category].length} Variations</span>
                                    <span className="group-hover:translate-x-1 transition-transform text-[#1e3a8a] font-medium">Explore &rarr;</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {categoryList.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-6xl mb-4">✨</div>
                        <h3 className="text-xl font-medium text-gray-900 font-['Playfair_Display']">Library Initializing...</h3>
                        <p className="mt-2 text-gray-500">We are curating the finest sections for you.</p>
                        <p className="mt-4 text-xs text-gray-400">Run the seed command if this persists.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 py-8 bg-white mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} ConvertFlow AI. Designed for conversions.
                </div>
            </div>
        </div>
    );
}

// Helper function to get category icon
function getCategoryIcon(category) {
    const icons = {
        'Header & Sticky Navigation': '🧭',
        'Announcement Bars': '📢',
        'Hero Sections': '✨',
        'Product & Info Pages': '🛍️',
        'Urgency Tools': '⚡',
        'Retention Tools': '🎁',
    };
    return icons[category] || '📦';
}
