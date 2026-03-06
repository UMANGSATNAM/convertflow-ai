import React, { useState } from 'react';
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";
import { AnimatePresence } from 'framer-motion';

import DashboardHeader from '../components/visual-builder/DashboardHeader';
import PageCard from '../components/visual-builder/PageCard';
import EmptyState from '../components/visual-builder/EmptyState';
import TemplateBrowser from '../components/visual-builder/TemplateBrowser';

// Ensure the visual_pages table exists
async function ensureTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS visual_pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) NOT NULL,
                title VARCHAR(500) NOT NULL DEFAULT 'Untitled Page',
                page_type VARCHAR(50) NOT NULL DEFAULT 'landing',
                status VARCHAR(20) NOT NULL DEFAULT 'draft',
                elements_json LONGTEXT,
                template_id VARCHAR(100),
                thumbnail VARCHAR(1000),
                shopify_page_id BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_shop (shop_domain),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    } catch (e) {
        console.log('[VisualBuilder] Table init:', e.message);
    }
}

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    await ensureTable();

    let pages = [];
    try {
        const result = await db.query(
            'SELECT * FROM visual_pages WHERE shop_domain = ? ORDER BY updated_at DESC',
            [shop]
        );
        pages = result.rows;
    } catch (e) {
        console.error('[VisualBuilder] Failed to load pages:', e.message);
    }

    return json({ pages, shop });
};

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const intent = formData.get("intent");
    await ensureTable();

    if (intent === "create") {
        const title = formData.get("title") || "Untitled Page";
        const pageType = formData.get("pageType") || "landing";
        const templateId = formData.get("templateId") || null;

        const defaultElements = JSON.stringify([
            {
                id: 'root',
                type: 'Root',
                label: 'Page body',
                children: [],
                settings: {
                    styles: {
                        backgroundColor: '#ffffff',
                        minHeight: '100vh',
                        padding: '0px'
                    }
                }
            }
        ]);

        await db.query(
            'INSERT INTO visual_pages (shop_domain, title, page_type, template_id, elements_json) VALUES (?, ?, ?, ?, ?)',
            [shop, title, pageType, templateId, defaultElements]
        );

        const result = await db.query(
            'SELECT id FROM visual_pages WHERE shop_domain = ? ORDER BY id DESC LIMIT 1',
            [shop]
        );

        return json({ success: true, pageId: result.rows[0]?.id });
    }

    if (intent === "duplicate") {
        const pageId = formData.get("pageId");
        const original = await db.query(
            'SELECT * FROM visual_pages WHERE id = ? AND shop_domain = ?',
            [pageId, shop]
        );

        if (original.rows[0]) {
            const page = original.rows[0];
            await db.query(
                'INSERT INTO visual_pages (shop_domain, title, page_type, elements_json) VALUES (?, ?, ?, ?)',
                [shop, `${page.title} (Copy)`, page.page_type, page.elements_json]
            );
        }

        return json({ success: true });
    }

    if (intent === "delete") {
        const pageId = formData.get("pageId");
        await db.query(
            'DELETE FROM visual_pages WHERE id = ? AND shop_domain = ?',
            [pageId, shop]
        );
        return json({ success: true });
    }

    return json({ error: "Invalid intent" }, { status: 400 });
};

export default function VisualBuilderDashboard() {
    const { pages } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const [searchQuery, setSearchQuery] = useState('');
    const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open template browser instead of creating immediately
    const handleCreateNew = () => {
        setShowTemplateBrowser(true);
    };

    // When a template is selected, create the page and navigate
    const handleTemplateSelect = (template) => {
        setShowTemplateBrowser(false);
        fetcher.submit(
            {
                intent: "create",
                title: template ? template.name : "Untitled Page",
                pageType: "landing",
                templateId: template ? template.id : "",
            },
            { method: "POST" }
        );
    };

    // After creation, navigate to editor
    React.useEffect(() => {
        if (fetcher.data?.pageId) {
            navigate(`/app/visual-builder/${fetcher.data.pageId}`);
        }
    }, [fetcher.data]);

    const handleEdit = (pageId) => {
        navigate(`/app/visual-builder/${pageId}`);
    };

    const handleDuplicate = (pageId) => {
        fetcher.submit(
            { intent: "duplicate", pageId: String(pageId) },
            { method: "POST" }
        );
    };

    const handleDelete = (pageId) => {
        if (confirm('Are you sure you want to delete this page?')) {
            fetcher.submit(
                { intent: "delete", pageId: String(pageId) },
                { method: "POST" }
            );
        }
    };

    return (
        <div className="min-h-screen bg-surface-secondary font-sans">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <DashboardHeader
                    pageCount={pages.length}
                    onCreateNew={handleCreateNew}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {filteredPages.length === 0 && searchQuery === '' ? (
                    <EmptyState onCreateNew={handleCreateNew} />
                ) : filteredPages.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-sm text-txt-secondary">No pages matching "<strong>{searchQuery}</strong>"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredPages.map((page, i) => (
                            <PageCard
                                key={page.id}
                                page={page}
                                index={i}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Template Browser Overlay */}
            <AnimatePresence>
                {showTemplateBrowser && (
                    <TemplateBrowser
                        onSelect={handleTemplateSelect}
                        onClose={() => setShowTemplateBrowser(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
