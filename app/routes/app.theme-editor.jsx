import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useCallback, useRef } from "react";
import { authenticate } from "../shopify.server";
import { getInstalledSections } from "../utils/real-theme-installer.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const result = await getInstalledSections(admin, session);
    return json(result);
};

const SECTION_ICONS = {
    'cf-announcement': '📢',
    'cf-hero': '🖼️',
    'cf-featured-collection': '🛍️',
    'cf-trust-badges': '🛡️',
    'cf-testimonials': '⭐',
    'cf-rich-text': '📝',
    'cf-newsletter': '📧',
    'cf-image-with-text': '🖼️',
    'cf-faq': '❓',
    'cf-footer-cta': '🚀',
};

const SECTION_LABELS = {
    'cf-announcement': 'Announcement Bar',
    'cf-hero': 'Hero Banner',
    'cf-featured-collection': 'Featured Products',
    'cf-trust-badges': 'Trust Badges',
    'cf-testimonials': 'Customer Reviews',
    'cf-rich-text': 'Brand Story',
    'cf-newsletter': 'Newsletter Signup',
    'cf-image-with-text': 'Image With Text',
    'cf-faq': 'FAQ Section',
    'cf-footer-cta': 'Footer Call to Action',
};

const COLOR_SETTINGS = {
    'cf-hero': [
        { id: 'heading_color', label: 'Heading Color' },
        { id: 'accent_color', label: 'Accent Color' },
        { id: 'btn_bg', label: 'Button Color' },
    ],
    'cf-announcement': [
        { id: 'bg_color', label: 'Background' },
        { id: 'text_color', label: 'Text Color' },
    ],
    'cf-featured-collection': [
        { id: 'accent_color', label: 'Accent Color' },
        { id: 'btn_color', label: 'Button Color' },
    ],
    'cf-trust-badges': [
        { id: 'icon_color', label: 'Icon Color' },
        { id: 'icon_bg', label: 'Icon Background' },
    ],
    'cf-testimonials': [
        { id: 'accent_color', label: 'Accent Color' },
        { id: 'star_color', label: 'Star Color' },
    ],
    'cf-footer-cta': [
        { id: 'bg_color', label: 'Background' },
        { id: 'btn_bg', label: 'Button Color' },
    ],
};

const TEXT_SETTINGS = {
    'cf-announcement': [{ id: 'announcement_text', label: 'Announcement Text', tag: 'input' }],
    'cf-hero': [
        { id: 'eyebrow', label: 'Eyebrow Text', tag: 'input' },
        { id: 'btn1_text', label: 'Button Label', tag: 'input' },
    ],
    'cf-featured-collection': [
        { id: 'title', label: 'Section Title', tag: 'input' },
        { id: 'subtitle', label: 'Subtitle', tag: 'input' },
    ],
    'cf-footer-cta': [
        { id: 'heading', label: 'Heading', tag: 'input' },
        { id: 'btn1_text', label: 'Button Label', tag: 'input' },
    ],
    'cf-newsletter': [
        { id: 'title', label: 'Title', tag: 'input' },
        { id: 'subtitle', label: 'Subtitle', tag: 'input' },
    ],
};

export default function ThemeEditor() {
    const data = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [sections, setSections] = useState(data?.sections || []);
    const [selected, setSelected] = useState(null);
    const [dragIdx, setDragIdx] = useState(null);
    const [overIdx, setOverIdx] = useState(null);
    const [pendingSettings, setPendingSettings] = useState({});
    const [saved, setSaved] = useState(false);
    const dragRef = useRef(null);

    const shop = data?.shop;
    const previewUrl = shop ? `https://${shop}` : null;

    // Drag and drop handlers
    const handleDragStart = (e, idx) => {
        setDragIdx(idx);
        dragRef.current = idx;
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    };
    const handleDrop = (e, toIdx) => {
        e.preventDefault();
        const fromIdx = dragRef.current;
        if (fromIdx === null || fromIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
        const next = [...sections];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        setSections(next);
        setDragIdx(null);
        setOverIdx(null);
        // Auto-save order
        fetcher.submit(
            JSON.stringify({ action: 'reorder', order: next.map(s => s.key) }),
            { method: 'POST', action: '/api/theme-layout', encType: 'application/json' }
        );
    };
    const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

    // Settings handlers
    const handleColorChange = (settingId, value) => {
        setPendingSettings(prev => ({ ...prev, [settingId]: value }));
    };
    const handleTextChange = (settingId, value) => {
        setPendingSettings(prev => ({ ...prev, [settingId]: value }));
    };
    const handleSaveSettings = () => {
        if (!selected || Object.keys(pendingSettings).length === 0) return;
        fetcher.submit(
            JSON.stringify({ action: 'update_settings', sectionKey: selected.key, settings: pendingSettings }),
            { method: 'POST', action: '/api/theme-layout', encType: 'application/json' }
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setPendingSettings({});
    };

    const colorFields = selected ? (COLOR_SETTINGS[selected.key] || []) : [];
    const textFields = selected ? (TEXT_SETTINGS[selected.key] || []) : [];

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .te-root { display: flex; flex-direction: column; height: 100vh; font-family: 'Inter', sans-serif; background: #0a0a0f; color: #fff; overflow: hidden; }
        .te-topbar { background: #111118; border-bottom: 1px solid #ffffff12; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-shrink: 0; }
        .te-topbar__left { display: flex; align-items: center; gap: 12px; }
        .te-topbar__back { background: none; border: 1px solid #ffffff22; color: #9ca3af; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; }
        .te-topbar__title { font-size: 16px; font-weight: 800; color: #fff; }
        .te-topbar__sub { font-size: 12px; color: #6b7280; }
        .te-topbar__actions { display: flex; gap: 10px; align-items: center; }
        .te-topbar__preview-btn { background: #1f2937; color: #9ca3af; border: 1px solid #ffffff0f; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; font-family: 'Inter',sans-serif; transition: all .2s; }
        .te-topbar__preview-btn:hover { background: #374151; color: #fff; }
        .te-topbar__save-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity .2s; }
        .te-topbar__save-btn:hover { opacity: .85; }
        .te-topbar__save-btn.saved { background: linear-gradient(135deg, #4ade80, #22c55e); }
        .te-body { display: grid; grid-template-columns: 260px 1fr 280px; flex: 1; overflow: hidden; }
        /* LEFT PANEL */
        .te-left { border-right: 1px solid #ffffff0f; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #374151 transparent; }
        .te-left::-webkit-scrollbar { width: 4px; } .te-left::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        .te-left__header { padding: 16px; border-bottom: 1px solid #ffffff0f; }
        .te-left__title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; }
        .te-left__hint { font-size: 11px; color: #4b5563; margin-top: 3px; }
        .te-section-list { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .te-section-item {
            display: flex; align-items: center; gap: 10px;
            background: #111118; border: 1px solid #ffffff0f; border-radius: 10px;
            padding: 10px 12px; cursor: grab; transition: all .2s;
            user-select: none;
        }
        .te-section-item:hover { border-color: #6366f155; background: #1a1a2a; }
        .te-section-item.selected { border-color: #6366f1; background: #1e1b4b; }
        .te-section-item.dragging { opacity: .4; }
        .te-section-item.dragover { border-color: #a5b4fc; border-style: dashed; }
        .te-section-item__drag { color: #374151; font-size: 14px; cursor: grab; }
        .te-section-item__icon { font-size: 18px; flex-shrink: 0; }
        .te-section-item__info { flex: 1; min-width: 0; }
        .te-section-item__name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .te-section-item__key { font-size: 10px; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* CENTER PANEL */
        .te-center { display: flex; flex-direction: column; align-items: stretch; overflow: hidden; }
        .te-preview-wrap { flex: 1; overflow: hidden; position: relative; background: #1a1a2a; }
        .te-preview-iframe { width: 100%; height: 100%; border: none; }
        .te-preview-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: #0a0a0f; }
        .te-preview-overlay__icon { font-size: 48px; }
        .te-preview-overlay__title { font-size: 18px; font-weight: 700; color: #e2e8f0; }
        .te-preview-overlay__sub { font-size: 14px; color: #6b7280; text-align: center; max-width: 320px; line-height: 1.5; }
        .te-preview-overlay__btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; font-family: 'Inter', sans-serif; }
        /* RIGHT PANEL */
        .te-right { border-left: 1px solid #ffffff0f; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #374151 transparent; }
        .te-right::-webkit-scrollbar { width: 4px; } .te-right::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        .te-right__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; padding: 24px; text-align: center; }
        .te-right__empty-icon { font-size: 40px; }
        .te-right__empty-title { font-size: 14px; font-weight: 700; color: #6b7280; }
        .te-right__empty-sub { font-size: 12px; color: #4b5563; }
        .te-panel { padding: 16px; }
        .te-panel__header { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #ffffff0f; }
        .te-panel__icon { font-size: 24px; }
        .te-panel__title { font-size: 15px; font-weight: 800; color: #e2e8f0; }
        .te-panel__sub { font-size: 11px; color: #6b7280; }
        .te-field-group { margin-bottom: 18px; }
        .te-field-group__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 10px; }
        .te-color-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .te-color-swatch { width: 32px; height: 32px; border-radius: 8px; border: 2px solid #ffffff22; cursor: pointer; overflow: hidden; flex-shrink: 0; position: relative; }
        .te-color-swatch input[type=color] { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); opacity: 0; cursor: pointer; }
        .te-color-label { font-size: 13px; color: #9ca3af; flex: 1; }
        .te-text-field { width: 100%; background: #111118; border: 1px solid #ffffff12; border-radius: 8px; padding: 9px 12px; color: #e2e8f0; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color .2s; }
        .te-text-field:focus { border-color: #6366f1; }
        .te-textarea-field { width: 100%; background: #111118; border: 1px solid #ffffff12; border-radius: 8px; padding: 9px 12px; color: #e2e8f0; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; resize: vertical; min-height: 80px; transition: border-color .2s; }
        .te-textarea-field:focus { border-color: #6366f1; }
        .te-apply-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; margin-top: 8px; transition: opacity .2s; }
        .te-apply-btn:hover { opacity: .85; }
        .te-shopify-note { background: #1f2937; border: 1px solid #374151; border-radius: 10px; padding: 14px; margin-top: 16px; }
        .te-shopify-note__title { font-size: 12px; font-weight: 700; color: #60a5fa; margin-bottom: 6px; }
        .te-shopify-note__text { font-size: 12px; color: #9ca3af; line-height: 1.5; }
        .te-shopify-note__link { color: #60a5fa; text-decoration: none; font-weight: 600; }
        @media(max-width: 900px) { .te-body { grid-template-columns: 200px 1fr; } .te-right { display: none; } }
        @media(max-width: 640px) { .te-body { grid-template-columns: 1fr; } .te-left { display: none; } }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="te-root">
                {/* TOPBAR */}
                <div className="te-topbar">
                    <div className="te-topbar__left">
                        <button className="te-topbar__back" onClick={() => navigate('/app/themes')}>← Themes</button>
                        <div>
                            <div className="te-topbar__title">✏️ Theme Editor</div>
                            <div className="te-topbar__sub">
                                {data?.themeName ? `Editing: ${data.themeName}` : 'Drag to reorder • Click to customize'}
                            </div>
                        </div>
                    </div>
                    <div className="te-topbar__actions">
                        {previewUrl && (
                            <a className="te-topbar__preview-btn" href={previewUrl} target="_blank" rel="noopener noreferrer">
                                👁️ Live Preview
                            </a>
                        )}
                        <button
                            className={`te-topbar__save-btn ${saved ? 'saved' : ''}`}
                            onClick={handleSaveSettings}
                            disabled={Object.keys(pendingSettings).length === 0}
                        >
                            {saved ? '✓ Saved!' : '💾 Apply Changes'}
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="te-body">
                    {/* LEFT — Section List */}
                    <div className="te-left">
                        <div className="te-left__header">
                            <div className="te-left__title">Homepage Sections</div>
                            <div className="te-left__hint">Drag to reorder</div>
                        </div>
                        {sections.length === 0 ? (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#4b5563', fontSize: '13px', lineHeight: 1.6 }}>
                                No CF sections installed yet.<br />
                                <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => navigate('/app/themes')}>
                                    Install a theme first →
                                </span>
                            </div>
                        ) : (
                            <div className="te-section-list">
                                {sections.map((sec, idx) => (
                                    <div
                                        key={sec.id}
                                        className={`te-section-item
                                            ${selected?.id === sec.id ? 'selected' : ''}
                                            ${dragIdx === idx ? 'dragging' : ''}
                                            ${overIdx === idx ? 'dragover' : ''}
                                        `}
                                        draggable
                                        onDragStart={e => handleDragStart(e, idx)}
                                        onDragOver={e => handleDragOver(e, idx)}
                                        onDrop={e => handleDrop(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => {
                                            setSelected(sec);
                                            setPendingSettings({});
                                        }}
                                    >
                                        <span className="te-section-item__drag">⠿</span>
                                        <span className="te-section-item__icon">{SECTION_ICONS[sec.key] || '📄'}</span>
                                        <div className="te-section-item__info">
                                            <div className="te-section-item__name">{SECTION_LABELS[sec.key] || sec.label}</div>
                                            <div className="te-section-item__key">{sec.key}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CENTER — Live Preview */}
                    <div className="te-center">
                        <div className="te-preview-wrap">
                            {previewUrl ? (
                                <iframe
                                    className="te-preview-iframe"
                                    src={previewUrl}
                                    title="Live Store Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            ) : (
                                <div className="te-preview-overlay">
                                    <div className="te-preview-overlay__icon">🌐</div>
                                    <div className="te-preview-overlay__title">Live Preview</div>
                                    <div className="te-preview-overlay__sub">
                                        Install a theme first, then your live store will appear here.
                                    </div>
                                    <button className="te-preview-overlay__btn" onClick={() => navigate('/app/themes')}>
                                        Browse Themes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Customizer Panel */}
                    <div className="te-right">
                        {!selected ? (
                            <div className="te-right__empty">
                                <div className="te-right__empty-icon">👈</div>
                                <div className="te-right__empty-title">Select a section</div>
                                <div className="te-right__empty-sub">Click any section on the left to customize its colors and text</div>
                            </div>
                        ) : (
                            <div className="te-panel">
                                <div className="te-panel__header">
                                    <div className="te-panel__icon">{SECTION_ICONS[selected.key] || '📄'}</div>
                                    <div>
                                        <div className="te-panel__title">{SECTION_LABELS[selected.key] || selected.label}</div>
                                        <div className="te-panel__sub">Customize appearance</div>
                                    </div>
                                </div>

                                {colorFields.length > 0 && (
                                    <div className="te-field-group">
                                        <div className="te-field-group__label">Colors</div>
                                        {colorFields.map(field => (
                                            <div key={field.id} className="te-color-row">
                                                <div
                                                    className="te-color-swatch"
                                                    style={{ background: pendingSettings[field.id] || selected.settings[field.id] || '#6366f1' }}
                                                >
                                                    <input
                                                        type="color"
                                                        value={pendingSettings[field.id] || selected.settings[field.id] || '#6366f1'}
                                                        onChange={e => handleColorChange(field.id, e.target.value)}
                                                    />
                                                </div>
                                                <span className="te-color-label">{field.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {textFields.length > 0 && (
                                    <div className="te-field-group">
                                        <div className="te-field-group__label">Text Content</div>
                                        {textFields.map(field => (
                                            <div key={field.id} style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{field.label}</div>
                                                {field.tag === 'textarea' ? (
                                                    <textarea
                                                        className="te-textarea-field"
                                                        value={pendingSettings[field.id] ?? (selected.settings[field.id] || '')}
                                                        onChange={e => handleTextChange(field.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="te-text-field"
                                                        value={pendingSettings[field.id] ?? (selected.settings[field.id] || '')}
                                                        onChange={e => handleTextChange(field.id, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(colorFields.length > 0 || textFields.length > 0) && (
                                    <button className="te-apply-btn" onClick={handleSaveSettings}>
                                        ✅ Apply to Live Store
                                    </button>
                                )}

                                <div className="te-shopify-note">
                                    <div className="te-shopify-note__title">💡 Full Customization</div>
                                    <div className="te-shopify-note__text">
                                        For complete control (fonts, layout, images), open{' '}
                                        <a
                                            className="te-shopify-note__link"
                                            href={data?.shop ? `https://${data.shop}/admin/themes` : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Shopify Theme Editor →
                                        </a>
                                        {' '}and look for the CF sections.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
