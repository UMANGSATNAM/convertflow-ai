import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { createSubscription, SUBSCRIPTION_PLAN } from "../utils/billing.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    return json({
        shop,
        plan: SUBSCRIPTION_PLAN,
    });
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    try {
        const { confirmationUrl } = await createSubscription(admin, shop);
        return redirect(confirmationUrl);
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
};

export default function Subscribe() {
    const { shop, plan } = useLoaderData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Unlock Premium Features
                    </h1>
                    <p className="text-xl text-gray-600">
                        Get instant access to 100+ high-converting sections
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <div className="flex items-center justify-between text-white">
                            <div>
                                <h2 className="text-2xl font-bold">{plan.name}</h2>
                                <p className="mt-1 text-blue-100">Everything you need to boost conversions</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold">${plan.price}</div>
                                <div className="text-blue-100 text-sm">per month</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-900">What's Included:</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: '✅', text: '100+ Premium Sections' },
                                    { icon: '🎨', text: 'Full Customization Control' },
                                    { icon: '⚡', text: 'One-Click Installation' },
                                    { icon: '🚀', text: 'Zero Theme Conflicts' },
                                    { icon: '📱', text: 'Mobile Responsive' },
                                    { icon: '⚙️', text: 'Easy Color & Font Editor' },
                                    { icon: '🎯', text: 'Conversion Optimized' },
                                    { icon: '🔄', text: 'Regular Updates' },
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                                        <span className="text-gray-700 mt-1">{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Categories:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    'Header & Navigation',
                                    'Announcement Bars',
                                    'Hero Sections',
                                    'Product Pages',
                                    'Urgency Tools',
                                    'Retention Tools',
                                    'Trust Badges',
                                    'Footer Sections',
                                    'Custom CTAs',
                                    'And More...',
                                ].map((category, index) => (
                                    <div key={index} className="category-badge text-center">
                                        {category}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form method="post" className="mt-8">
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold py-4 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                            >
                                Subscribe Now - ${plan.price}/month
                            </button>
                            <p className="mt-4 text-center text-sm text-gray-500">
                                Cancel anytime. No hidden fees.
                            </p>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/app"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
