import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { category } = params;

    // Check subscription
    const hasSubscription = await hasActiveSubscription(shop);

    // Decode category from URL
    const decodedCategory = category.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Get sections for this category
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{category}</h1>
                            <p className="mt-1 text-sm text-gray-500">{sections.length} variations available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!hasSubscription && (
                    <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <button
                                        onClick={() => navigate('/app/subscribe')}
                                        className="font-medium underline hover:text-yellow-600"
                                    >
                                        Subscribe now
                                    </button>
                                    {' '}to customize and install these sections.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="section-preview"
                            onClick={() => hasSubscription && navigate(`/app/sections/${section.id}/customize`)}
                        >
                            {/* Preview Image */}
                            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200">
                                {section.preview_image ? (
                                    <img
                                        src={section.preview_image}
                                        alt={section.name}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center text-gray-400">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Section Info */}
                            <div className="p-4 bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{section.name}</h3>
                                        <p className="mt-1 text-sm text-gray-500">Variation #{section.variation_number}</p>
                                    </div>
                                    {section.is_premium && (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            Premium
                                        </span>
                                    )}
                                </div>

                                {hasSubscription && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/app/sections/${section.id}/customize`);
                                        }}
                                        className="mt-4 w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
                                    >
                                        Customize & Install
                                    </button>
                                )}
                            </div>

                            {!hasSubscription && (
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/app/subscribe');
                                        }}
                                        className="bg-white text-gray-900 font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition"
                                    >
                                        🔒 Unlock Section
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {sections.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No sections found</h3>
                        <p className="mt-1 text-sm text-gray-500">Check back later for new sections.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
