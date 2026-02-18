import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { category } = params;

    const hasSubscription = await hasActiveSubscription(shop);

    const decodedCategory = category.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const sections = await db.sections.getByCategory(decodedCategory);

    return json({
        category: decodedCategory,
        sections,
        hasSubscription,
    });
};

export default function CategorySections() {
    const { category, sections, hasSubscription } = useLoaderData();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 font-['Montserrat']">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1e3a8a] via-[#d97706] to-[#1e3a8a]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/app/dashboard')}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#1e3a8a] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-[#1e3a8a] font-['Playfair_Display']">{category}</h1>
                                <p className="mt-1 text-sm text-gray-500 font-light tracking-wide">{sections.length} premium variations available</p>
                            </div>
                        </div>
                        {!hasSubscription && (
                            <button
                                onClick={() => navigate('/subscribe')}
                                className="flex items-center gap-2 px-5 py-2 bg-[#d97706] text-white text-sm font-bold rounded shadow hover:bg-[#b45309] transition"
                            >
                                <span>🔒 Unlock All</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {!hasSubscription && (
                    <div className="mb-10 bg-gradient-to-r from-[#fffbeb] to-[#fff7ed] border border-[#fcd34d] rounded-lg p-6 flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#92400e] font-['Playfair_Display']">Premium Collection Locked</h3>
                            <p className="mt-1 text-sm text-[#b45309]">
                                You are viewing a preview of our premium {category} templates.
                                <button onClick={() => navigate('/subscribe')} className="ml-1 underline font-bold hover:text-[#78350f]">Upgrade to Premium</button>
                                to unlock customization and installation.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className={`group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col ${!hasSubscription ? 'opacity-90' : ''}`}
                            onClick={() => hasSubscription && navigate(`/app/sections/${section.id}/customize`)}
                        >
                            {/* Preview Area */}
                            <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden group-hover:bg-[#f8fafc] transition-colors">
                                {section.preview_image ? (
                                    <img
                                        src={section.preview_image}
                                        alt={section.name}
                                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-5xl mb-2 opacity-20">✨</div>
                                        </div>
                                    </div>
                                )}

                                {/* Overlay Actions */}
                                <div className={`absolute inset-0 bg-[#1e3a8a]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm`}>
                                    {hasSubscription ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/app/sections/${section.id}/customize`);
                                            }}
                                            className="bg-white text-[#1e3a8a] font-bold py-3 px-8 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
                                        >
                                            Customize Design
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/subscribe');
                                            }}
                                            className="bg-[#d97706] text-white font-bold py-3 px-8 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#b45309]"
                                        >
                                            Unlock Premium &rarr;
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col justify-between relative bg-white">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#1e3a8a] to-[#d97706] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 font-['Playfair_Display'] group-hover:text-[#1e3a8a] transition-colors">
                                            {section.name}
                                        </h3>
                                        {section.is_premium && (
                                            <span className="bg-[#fef3c7] text-[#d97706] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        Premium variation #{section.variation_number}. Optimized for high conversion rates.
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-400 uppercase tracking-widest">
                                    <span>High Conversion</span>
                                    {hasSubscription && <span className="text-green-600">Ready to install</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {sections.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-6xl mb-4">✨</div>
                        <h3 className="text-xl font-medium text-gray-900 font-['Playfair_Display']">Collection Empty</h3>
                        <p className="mt-2 text-gray-500">We are curating the finest sections. Please check back soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
