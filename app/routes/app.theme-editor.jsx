import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ─── SVG Icons (Lucide-style, zero emojis) ─────────────────────────
const icons = {
    header: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
    hero: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    announcement: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>',
    features: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
    testimonials: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    cta: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    trust: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    product: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    productGrid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    stats: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    footer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    paint: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m6.8 14-3.5 3.5a2.1 2.1 0 0 0 3 3L9.8 17"/><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20"/></svg>',
    type: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    spacing: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M6 2v2"/><path d="M6 20v2"/><path d="M18 2v2"/><path d="M18 20v2"/><path d="M2 6h2"/><path d="M2 18h2"/><path d="M20 6h2"/><path d="M20 18h2"/></svg>',
    install: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    swap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

// ─── Category → Icon mapping ────────────────────────────────────────
const sectionTypeMap = [
    { category: "Headers & Navigation", label: "Header", icon: "header", desc: "Navigation bar, logo, menu links" },
    { category: "Announcement Bars", label: "Announcement Bar", icon: "announcement", desc: "Top banner for promotions & alerts" },
    { category: "Hero Sections", label: "Hero Banner", icon: "hero", desc: "Main hero with headline & CTA" },
    { category: "Feature Sections", label: "Features", icon: "features", desc: "Showcase product features & benefits" },
    { category: "Product Highlights", label: "Product Showcase", icon: "product", desc: "Highlight specific products" },
    { category: "Product Grid", label: "Product Grid", icon: "productGrid", desc: "Display products in grid layout" },
    { category: "Testimonials", label: "Testimonials", icon: "testimonials", desc: "Customer reviews & social proof" },
    { category: "Trust Badges", label: "Trust & Guarantees", icon: "trust", desc: "Trust badges, guarantees, awards" },
    { category: "CTA Sections", label: "Call to Action", icon: "cta", desc: "Drive conversions with strong CTAs" },
    { category: "Stats & Metrics", label: "Stats & Numbers", icon: "stats", desc: "Display key metrics & achievements" },
    { category: "Footer Sections", label: "Footer", icon: "footer", desc: "Footer navigation & info" },
];

// ─── Loader ─────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const allSections = await db.sections.getAll();

    const categories = {};
    allSections.forEach(s => {
        if (!categories[s.category]) categories[s.category] = [];
        categories[s.category].push(s);
    });

    return json({ shop, categories, totalSections: allSections.length });
};

// ─── Action (Install to Theme) ──────────────────────────────────────
export const action = async ({ request }) => {
    const { session, admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "install") {
        const sectionId = formData.get("sectionId");
        const placement = formData.get("placement") || "homepage";

        try {
            const section = await db.sections.getById(sectionId);
            if (!section) return json({ error: "Section not found" }, { status: 404 });

            // Get active theme
            const themeRes = await admin.graphql(`{ themes(first: 5, roles: [MAIN]) { nodes { id name } } }`);
            const themeData = await themeRes.json();
            const mainTheme = themeData?.data?.themes?.nodes?.[0];
            if (!mainTheme) return json({ error: "No active theme found" }, { status: 404 });

            const themeId = mainTheme.id.replace("gid://shopify/OnlineStoreTheme/", "");
            const sectionKey = `cf-section-${section.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${section.id}`;

            const liquidCode = `{% comment %} ConvertFlow AI — ${section.name} {% endcomment %}\n${section.html_code}\n{% schema %}\n{\n  "name": "${section.name}",\n  "settings": []\n}\n{% endschema %}`;

            const assetKey = `sections/${sectionKey}.liquid`;
            const shopDomain = session.shop;
            const token = session.accessToken;
            const restUrl = `https://${shopDomain}/admin/api/2024-01/themes/${themeId}/assets.json`;

            const putRes = await fetch(restUrl, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
                body: JSON.stringify({ asset: { key: assetKey, value: liquidCode } }),
            });

            if (!putRes.ok) {
                const errBody = await putRes.text();
                return json({ error: `Install failed: ${putRes.status} ${errBody}` }, { status: 500 });
            }

            return json({ success: true, message: `"${section.name}" installed successfully!`, assetKey });
        } catch (err) {
            return json({ error: err.message }, { status: 500 });
        }
    }

    if (intent === "save") {
        const sectionId = formData.get("sectionId");
        const settings = formData.get("settings");
        const shop = session.shop;

        try {
            let shopRecord = await db.shops.findByDomain(shop);
            if (!shopRecord) shopRecord = await db.shops.create(shop, session.accessToken);
            await db.customizations.save(shopRecord.id, sectionId, JSON.parse(settings));
            return json({ success: true, message: "Customization saved!" });
        } catch (err) {
            return json({ error: err.message }, { status: 500 });
        }
    }

    return json({ error: "Unknown intent" }, { status: 400 });
};

// ─── Main Component ─────────────────────────────────────────────────
export default function ThemeEditor() {
    const { shop, categories, totalSections } = useLoaderData();
    const submit = useSubmit();

    // State
    const [selectedType, setSelectedType] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [toast, setToast] = useState(null);
    const [previewDevice, setPreviewDevice] = useState("desktop");

    // Edit state
    const [editValues, setEditValues] = useState({
        heading: "", description: "", buttonText: "",
        primaryColor: "#6366f1", bgColor: "#ffffff", textColor: "#111111",
        padding: 48, borderRadius: 12,
    });

    const iframeRef = useRef(null);

    // Show toast
    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // When a section is selected, extract defaults from HTML
    useEffect(() => {
        if (selectedSection) {
            const html = selectedSection.html_code || "";
            const h2Match = html.match(/<h[12][^>]*>([^<]+)</);
            const pMatch = html.match(/<p[^>]*>([^<]{10,})/);
            const btnMatch = html.match(/<(?:button|a)[^>]*class="[^"]*btn[^"]*"[^>]*>([^<]+)/);

            setEditValues(prev => ({
                ...prev,
                heading: h2Match ? h2Match[1].trim() : prev.heading,
                description: pMatch ? pMatch[1].trim() : prev.description,
                buttonText: btnMatch ? btnMatch[1].trim() : prev.buttonText,
            }));
        }
    }, [selectedSection]);

    // Update iframe preview live
    useEffect(() => {
        if (!iframeRef.current || !selectedSection) return;
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        try {
            // Inject CSS overrides
            let styleEl = doc.getElementById("cf-live-overrides");
            if (!styleEl) {
                styleEl = doc.createElement("style");
                styleEl.id = "cf-live-overrides";
                doc.head.appendChild(styleEl);
            }
            styleEl.textContent = `
        * { --cf-primary: ${editValues.primaryColor}; --cf-bg: ${editValues.bgColor}; --cf-text: ${editValues.textColor}; }
        [class*="cf-"] { padding-top: ${editValues.padding}px !important; padding-bottom: ${editValues.padding}px !important; border-radius: ${editValues.borderRadius}px !important; }
        [class*="cf-"] h1, [class*="cf-"] h2 { color: ${editValues.textColor} !important; }
        [class*="cf-"] p { color: ${editValues.textColor}99 !important; }
        [class*="cf-"] a, [class*="cf-"] button { background: ${editValues.primaryColor} !important; border-radius: ${editValues.borderRadius}px !important; }
      `;

            // Update text content
            const h2s = doc.querySelectorAll("h1, h2");
            if (h2s.length > 0 && editValues.heading) h2s[0].textContent = editValues.heading;
            const ps = doc.querySelectorAll("p");
            if (ps.length > 0 && editValues.description) ps[0].textContent = editValues.description;
            const btns = doc.querySelectorAll("button, a[class*='btn']");
            if (btns.length > 0 && editValues.buttonText) btns[0].textContent = editValues.buttonText;
        } catch (e) { /* cross-origin safety */ }
    }, [editValues, selectedSection]);

    // Handle install
    const handleInstall = () => {
        if (!selectedSection) return;
        const fd = new FormData();
        fd.append("intent", "install");
        fd.append("sectionId", selectedSection.id);
        fd.append("placement", "homepage");
        submit(fd, { method: "post" });
        showToast(`Installing "${selectedSection.name}" to your theme...`);
    };

    // Handle save customizations
    const handleSave = () => {
        if (!selectedSection) return;
        const fd = new FormData();
        fd.append("intent", "save");
        fd.append("sectionId", selectedSection.id);
        fd.append("settings", JSON.stringify(editValues));
        submit(fd, { method: "post" });
        showToast("Customization saved!");
    };

    // Get sections for selected type
    const currentSections = selectedType ? (categories[selectedType.category] || []) : [];

    // Preview HTML
    const getPreviewHtml = (section) => {
        const html = section?.html_code || "<p>No preview</p>";
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#f8f9fa;}</style></head><body>${html}</body></html>`;
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .te-root { font-family: 'Inter', sans-serif; background: #0a0a0f; min-height: 100vh; color: #e5e5e5; }

        /* ─── Top Bar ─── */
        .te-topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: rgba(17,17,24,0.95); border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
        .te-topbar-left { display: flex; align-items: center; gap: 12px; }
        .te-logo { font-size: 16px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px; }
        .te-shop { font-size: 12px; color: #6b7280; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 6px; }
        .te-topbar-right { display: flex; align-items: center; gap: 8px; }
        .te-btn-sm { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .te-btn-ghost { background: transparent; color: #9ca3af; border: 1px solid rgba(255,255,255,0.08); }
        .te-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .te-btn-primary { background: #6366f1; color: #fff; }
        .te-btn-primary:hover { background: #5558e6; transform: translateY(-1px); }
        .te-btn-success { background: #22c55e; color: #fff; }
        .te-btn-success:hover { background: #16a34a; }

        /* ─── Main Layout ─── */
        .te-main { display: flex; height: calc(100vh - 53px); }

        /* ─── Left Sidebar ─── */
        .te-sidebar { width: 280px; background: rgba(17,17,24,0.6); border-right: 1px solid rgba(255,255,255,0.06); overflow-y: auto; flex-shrink: 0; }
        .te-sidebar-header { padding: 20px 16px 12px; }
        .te-sidebar-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 4px; }
        .te-sidebar-sub { font-size: 11px; color: #4b5563; }
        .te-section-list { padding: 0 8px 16px; }

        .te-section-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 2px; border: 1px solid transparent; }
        .te-section-item:hover { background: rgba(255,255,255,0.04); }
        .te-section-item.active { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
        .te-section-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .te-section-item:not(.active) .te-section-icon { background: rgba(255,255,255,0.04); color: #6b7280; }
        .te-section-item.active .te-section-icon { background: rgba(99,102,241,0.15); color: #818cf8; }
        .te-section-info { flex: 1; min-width: 0; }
        .te-section-name { font-size: 13px; font-weight: 600; color: #e5e5e5; }
        .te-section-desc { font-size: 11px; color: #6b7280; margin-top: 1px; }
        .te-section-count { font-size: 10px; font-weight: 700; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 7px; border-radius: 100px; flex-shrink: 0; }

        /* ─── Center: Preview or Grid ─── */
        .te-center { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* Browse mode — section grid */
        .te-browse { padding: 24px; overflow-y: auto; }
        .te-browse-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .te-browse-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .te-browse-count { font-size: 13px; color: #6b7280; }
        .te-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .te-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; cursor: pointer; transition: all 0.3s; position: relative; }
        .te-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .te-card-preview { height: 200px; overflow: hidden; position: relative; background: #1a1a2e; }
        .te-card-preview iframe { width: 200%; height: 200%; border: none; transform: scale(0.5); transform-origin: top left; pointer-events: none; }
        .te-card-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 50%, rgba(0,0,0,0.6)); opacity: 0; transition: opacity 0.3s; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 16px; }
        .te-card:hover .te-card-overlay { opacity: 1; }
        .te-card-btn { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .te-card-info { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
        .te-card-name { font-size: 13px; font-weight: 600; color: #e5e5e5; }
        .te-card-score { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
        .te-score-high { background: rgba(34,197,94,0.1); color: #22c55e; }
        .te-score-mid { background: rgba(234,179,8,0.1); color: #eab308; }

        /* Edit Mode — Preview + Panel */
        .te-edit { display: flex; flex: 1; overflow: hidden; }
        .te-preview-area { flex: 1; display: flex; flex-direction: column; background: #111118; }
        .te-preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(17,17,24,0.8); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .te-device-btns { display: flex; gap: 4px; }
        .te-device-btn { width: 32px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 11px; }
        .te-device-btn.active { background: rgba(99,102,241,0.15); color: #818cf8; border-color: rgba(99,102,241,0.3); }
        .te-preview-frame { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 20px; overflow: auto; }
        .te-iframe-wrap { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4); transition: width 0.3s; }
        .te-iframe-wrap.desktop { width: 100%; }
        .te-iframe-wrap.tablet { width: 768px; }
        .te-iframe-wrap.mobile { width: 390px; }
        .te-iframe-wrap iframe { width: 100%; min-height: 500px; border: none; }

        /* ─── Right Panel — Editor ─── */
        .te-panel { width: 320px; background: rgba(17,17,24,0.8); border-left: 1px solid rgba(255,255,255,0.06); overflow-y: auto; flex-shrink: 0; }
        .te-panel-section { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .te-panel-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .te-field { margin-bottom: 12px; }
        .te-field label { display: block; font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 5px; }
        .te-field input[type="text"], .te-field textarea { width: 100%; padding: 9px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e5e5e5; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
        .te-field input[type="text"]:focus, .te-field textarea:focus { border-color: rgba(99,102,241,0.5); }
        .te-field textarea { resize: vertical; min-height: 60px; }

        .te-color-field { display: flex; align-items: center; gap: 8px; }
        .te-color-swatch { width: 32px; height: 32px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; overflow: hidden; flex-shrink: 0; }
        .te-color-swatch input { width: 48px; height: 48px; border: none; cursor: pointer; margin: -8px; }
        .te-color-hex { flex: 1; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e5e5e5; font-size: 12px; font-family: monospace; }

        .te-range-field { }
        .te-range-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .te-range-value { font-size: 12px; font-weight: 700; color: #818cf8; }
        .te-range-field input[type="range"] { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.08); border-radius: 4px; outline: none; }
        .te-range-field input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; }

        /* ─── Welcome State ─── */
        .te-welcome { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
        .te-welcome-icon { width: 80px; height: 80px; background: rgba(99,102,241,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .te-welcome h2 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
        .te-welcome p { font-size: 14px; color: #6b7280; max-width: 400px; line-height: 1.6; }

        /* ─── Toast ─── */
        .te-toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #fff; z-index: 1000; animation: te-slide-up 0.3s ease-out; display: flex; align-items: center; gap: 8px; }
        .te-toast.success { background: #22c55e; }
        .te-toast.error { background: #ef4444; }
        @keyframes te-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* ─── Section type badge in browse ─── */
        .te-badge-row { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .te-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(99,102,241,0.1); color: #818cf8; display: flex; align-items: center; gap: 4px; }

        /* ─── Action bar at bottom of panel ─── */
        .te-actions { padding: 16px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
        .te-btn-lg { padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
        .te-btn-lg:hover { transform: translateY(-1px); }
      `}} />

            <div className="te-root">
                {/* ─── Top Bar ─── */}
                <div className="te-topbar">
                    <div className="te-topbar-left">
                        <span className="te-logo">ConvertFlow AI</span>
                        <span className="te-shop">{shop}</span>
                    </div>
                    <div className="te-topbar-right">
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{totalSections} sections available</span>
                    </div>
                </div>

                <div className="te-main">
                    {/* ─── Left Sidebar — Section Types ─── */}
                    <div className="te-sidebar">
                        <div className="te-sidebar-header">
                            <div className="te-sidebar-title">Theme Sections</div>
                            <div className="te-sidebar-sub">Click a section to browse alternatives</div>
                        </div>
                        <div className="te-section-list">
                            {sectionTypeMap.map((type) => {
                                const count = (categories[type.category] || []).length;
                                return (
                                    <div
                                        key={type.category}
                                        className={`te-section-item ${selectedType?.category === type.category ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedType(type);
                                            setSelectedSection(null);
                                            setEditMode(false);
                                        }}
                                    >
                                        <div className="te-section-icon" dangerouslySetInnerHTML={{ __html: icons[type.icon] }} />
                                        <div className="te-section-info">
                                            <div className="te-section-name">{type.label}</div>
                                            <div className="te-section-desc">{type.desc}</div>
                                        </div>
                                        {count > 0 && <span className="te-section-count">{count}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── Center Area ─── */}
                    <div className="te-center">
                        {!selectedType && !editMode && (
                            <div className="te-welcome">
                                <div className="te-welcome-icon" dangerouslySetInnerHTML={{ __html: icons.swap }} />
                                <h2>Choose a Section to Replace</h2>
                                <p>Select a section type from the left sidebar to browse premium alternatives. Click any design to preview and customize it before installing to your theme.</p>
                            </div>
                        )}

                        {selectedType && !editMode && (
                            <div className="te-browse">
                                <div className="te-browse-header">
                                    <div>
                                        <div className="te-badge-row">
                                            <span className="te-badge" dangerouslySetInnerHTML={{ __html: icons[selectedType.icon] + " " + selectedType.label }} />
                                        </div>
                                        <div className="te-browse-title">Choose a {selectedType.label} Design</div>
                                        <div className="te-browse-count">{currentSections.length} premium designs available</div>
                                    </div>
                                </div>
                                <div className="te-grid">
                                    {currentSections.map((section) => (
                                        <div key={section.id} className="te-card" onClick={() => { setSelectedSection(section); setEditMode(true); }}>
                                            <div className="te-card-preview">
                                                <iframe
                                                    srcDoc={getPreviewHtml(section)}
                                                    title={section.name}
                                                    sandbox="allow-same-origin"
                                                    loading="lazy"
                                                />
                                                <div className="te-card-overlay">
                                                    <button className="te-card-btn" dangerouslySetInnerHTML={{ __html: icons.eye + ' Preview & Edit' }} />
                                                </div>
                                            </div>
                                            <div className="te-card-info">
                                                <span className="te-card-name">{section.name}</span>
                                                <span className={`te-card-score ${(section.conversion_score || 85) >= 90 ? "te-score-high" : "te-score-mid"}`}>
                                                    {section.conversion_score || 85}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editMode && selectedSection && (
                            <div className="te-edit">
                                {/* Preview */}
                                <div className="te-preview-area">
                                    <div className="te-preview-toolbar">
                                        <button className="te-btn-sm te-btn-ghost" onClick={() => setEditMode(false)} dangerouslySetInnerHTML={{ __html: icons.back + ' Back to designs' }} />
                                        <div className="te-device-btns">
                                            {["desktop", "tablet", "mobile"].map((d) => (
                                                <button
                                                    key={d}
                                                    className={`te-device-btn ${previewDevice === d ? "active" : ""}`}
                                                    onClick={() => setPreviewDevice(d)}
                                                >
                                                    {d === "desktop" ? "D" : d === "tablet" ? "T" : "M"}
                                                </button>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{selectedSection.name}</span>
                                    </div>
                                    <div className="te-preview-frame">
                                        <div className={`te-iframe-wrap ${previewDevice}`}>
                                            <iframe
                                                ref={iframeRef}
                                                srcDoc={getPreviewHtml(selectedSection)}
                                                title="Preview"
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel — Editor */}
                                <div className="te-panel">
                                    {/* Content Fields */}
                                    <div className="te-panel-section">
                                        <div className="te-panel-label" dangerouslySetInnerHTML={{ __html: icons.type + ' Content' }} />
                                        <div className="te-field">
                                            <label>Heading Text</label>
                                            <input type="text" value={editValues.heading} onChange={(e) => setEditValues(v => ({ ...v, heading: e.target.value }))} placeholder="Enter heading..." />
                                        </div>
                                        <div className="te-field">
                                            <label>Description</label>
                                            <textarea value={editValues.description} onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))} placeholder="Enter description..." />
                                        </div>
                                        <div className="te-field">
                                            <label>Button Text</label>
                                            <input type="text" value={editValues.buttonText} onChange={(e) => setEditValues(v => ({ ...v, buttonText: e.target.value }))} placeholder="Enter button text..." />
                                        </div>
                                    </div>

                                    {/* Colors */}
                                    <div className="te-panel-section">
                                        <div className="te-panel-label" dangerouslySetInnerHTML={{ __html: icons.paint + ' Colors' }} />
                                        {[
                                            { key: "primaryColor", label: "Button / Accent Color" },
                                            { key: "bgColor", label: "Background Color" },
                                            { key: "textColor", label: "Text Color" },
                                        ].map(({ key, label }) => (
                                            <div className="te-field" key={key}>
                                                <label>{label}</label>
                                                <div className="te-color-field">
                                                    <div className="te-color-swatch">
                                                        <input type="color" value={editValues[key]} onChange={(e) => setEditValues(v => ({ ...v, [key]: e.target.value }))} />
                                                    </div>
                                                    <input className="te-color-hex" type="text" value={editValues[key]} onChange={(e) => setEditValues(v => ({ ...v, [key]: e.target.value }))} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Spacing */}
                                    <div className="te-panel-section">
                                        <div className="te-panel-label" dangerouslySetInnerHTML={{ __html: icons.spacing + ' Spacing' }} />
                                        {[
                                            { key: "padding", label: "Section Padding", min: 0, max: 120, unit: "px" },
                                            { key: "borderRadius", label: "Border Radius", min: 0, max: 40, unit: "px" },
                                        ].map(({ key, label, min, max, unit }) => (
                                            <div className="te-field te-range-field" key={key}>
                                                <div className="te-range-header">
                                                    <label>{label}</label>
                                                    <span className="te-range-value">{editValues[key]}{unit}</span>
                                                </div>
                                                <input type="range" min={min} max={max} value={editValues[key]} onChange={(e) => setEditValues(v => ({ ...v, [key]: parseInt(e.target.value) }))} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="te-actions">
                                        <button className="te-btn-lg te-btn-primary" onClick={handleSave} dangerouslySetInnerHTML={{ __html: icons.check + ' Save Customization' }} />
                                        <button className="te-btn-lg te-btn-success" onClick={handleInstall} dangerouslySetInnerHTML={{ __html: icons.install + ' Install to Theme' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Toast ─── */}
                {toast && (
                    <div className={`te-toast ${toast.type}`}>
                        <span dangerouslySetInnerHTML={{ __html: icons.check }} />
                        {toast.msg}
                    </div>
                )}
            </div>
        </>
    );
}
