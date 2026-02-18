import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request }) => {
  console.log("👉 Dashboard Loader Hit:", request.url);
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  console.log("✅ Authenticated Shop:", shop);

  // Check subscription status
  const hasSubscription = await hasActiveSubscription(shop);

  // Get shop from database
  let shopRecord = await db.shops.findByDomain(shop);

  // If shop doesn't exist, create it
  if (!shopRecord) {
    console.log("Creating new shop record for:", shop);
    shopRecord = await db.shops.create(shop, session.accessToken);
  }

  // Get all sections grouped by category
  let allSections = await db.sections.getAll();

  // Auto-seed if empty (fallback for deployment)
  if (allSections.length === 0) {
    console.log("⚠️ No sections found. Seeding initial content...");
    // Redirect to seed route which handles insertion
    // Actually, let's just do it here or better, instruct user to seed
    // For now, return empty list, user can visit /app/seed
  }

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
    apiKey: process.env.SHOPIFY_API_KEY
  });
};

export default function Dashboard() {
  const { shop, hasSubscription, categories, totalSections } = useLoaderData();
  const navigate = useNavigate();

  const categoryList = Object.keys(categories);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ConvertFlow AI</h1>
              <p className="mt-1 text-sm text-gray-500">
                Build stunning, high-converting sections in seconds
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasSubscription ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Premium Active
                  </span>
                  <span className="text-sm text-gray-600">${shop?.subscription_status === 'active' ? '20/mo' : ''}</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/app/subscribe')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Upgrade to Premium - $20/mo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="dashboard-card bg-white overflow-hidden shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500">Total Sections</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalSections}+</p>
            <p className="mt-1 text-sm text-gray-600">Premium conversion sections</p>
          </div>
          <div className="dashboard-card bg-white overflow-hidden shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500">Categories</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{categoryList.length}</p>
            <p className="mt-1 text-sm text-gray-600">Different section types</p>
          </div>
          <div className="dashboard-card bg-white overflow-hidden shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500">Variations</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">10+</p>
            <p className="mt-1 text-sm text-gray-600">Per category</p>
          </div>
        </div>
      </div>

      {/* Section Library */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Section Library</h2>
          <p className="mt-2 text-sm text-gray-600">
            Browse our collection of high-converting sections and add them to your store
          </p>
        </div>

        {!hasSubscription && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🚀 Unlock All {totalSections}+ Premium Sections
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Get instant access to our entire library of conversion-optimized sections for just $20/month
                </p>
              </div>
              <button
                onClick={() => navigate('/app/subscribe')}
                className="flex-shrink-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        )}

        {/* Category Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryList.map((category) => (
            <div
              key={category}
              onClick={() => navigate(`/app/sections/${category.toLowerCase().replace(/\s+/g, '-')}`)}
              className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {getCategoryIcon(category)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {category}
                  </h3>
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {categories[category].length} variations
                  </span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categoryList.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sections available</h3>
            <p className="mt-1 text-sm text-gray-500">Database needs seeding. Go to <a href="/app/seed" className="text-blue-600 hover:text-blue-500">/app/seed</a> to populate.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get category icon
function getCategoryIcon(category) {
  const icons = {
    'Header & Sticky Navigation': '🧭',
    'Announcement Bars': '📢',
    'Hero Sections': '🎯',
    'Product & Info Pages': '🛍️',
    'Urgency Tools': '⚡',
    'Retention Tools': '🎁',
  };
  return icons[category] || '📦';
}
