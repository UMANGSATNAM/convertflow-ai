import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection, publishAllSnippets, publishAllLocales, publishConfig } from "../lib/shopify.server";
import { SECTION_FILES, getCategoriesWithCounts, getSectionsByCategory } from "../lib/constants";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "publish_section") {
    const sectionId = formData.get("sectionId");
    const sectionMeta = SECTION_FILES[sectionId];
    if (!sectionMeta) return json({ ok: false, error: "Section not found" }, { status: 404 });

    const liquid = readSectionFile(sectionMeta.file);
    if (!liquid) return json({ ok: false, error: "Section file missing on server" }, { status: 404 });

    try {
      const result = await publishSection(session.shop, session.accessToken, `cf-${sectionId}`, liquid);
      return json({ ok: true, sectionId, message: `Published ${sectionMeta.name}` });
    } catch (e) {
      return json({ ok: false, sectionId, error: e.message }, { status: 500 });
    }
  }

  if (intent === "publish_snippets") {
    try {
      const result = await publishAllSnippets(session.shop, session.accessToken);
      return json({ ok: true, intent: "snippets", message: `Snippets: ${result.success}/${result.total} uploaded` });
    } catch (e) {
      return json({ ok: false, intent: "snippets", error: e.message }, { status: 500 });
    }
  }

  if (intent === "publish_locales") {
    try {
      const result = await publishAllLocales(session.shop, session.accessToken);
      return json({ ok: true, intent: "locales", message: `Locales: ${result.success}/${result.total} uploaded` });
    } catch (e) {
      return json({ ok: false, intent: "locales", error: e.message }, { status: 500 });
    }
  }

  if (intent === "publish_config") {
    try {
      await publishConfig(session.shop, session.accessToken);
      return json({ ok: true, intent: "config", message: "Theme config uploaded" });
    } catch (e) {
      return json({ ok: false, intent: "config", error: e.message }, { status: 500 });
    }
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

// ─── ICONS (SVG) ────────────────────────────────────
const Icons = {
  Layout: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
  Image: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  ShoppingBag: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>,
  Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  MessageSquare: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  Award: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
  FileText: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  Mail: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg>,
  Share2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  Play: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  HelpCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Layers: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  AlertCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  ChevronDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
};

// ─── MAIN COMPONENT ─────────────────────────────────
export default function AppIndex() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const [activeCategory, setActiveCategory] = useState(null);
  const categories = getCategoriesWithCounts();
  const result = fetcher.data;
  const publishingIntent = fetcher.state !== "idle" ? fetcher.formData?.get("intent") : null;

  const activeSections = activeCategory ? getSectionsByCategory(activeCategory) : [];
  const activeCatInfo = categories.find(c => c.id === activeCategory);

  return (
    <div style={S.page}>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                .cat-card:hover { border-color: #818cf8 !important; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(79,70,229,0.08) !important; }
                .sec-card:hover { border-color: #c7d2fe !important; }
                .pub-btn:hover { background: #4338ca !important; }
                .setup-btn:hover { background: #f5f3ff !important; border-color: #818cf8 !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Section Builder</h1>
            <p style={S.subtitle}>Connected to <strong>{shop}</strong></p>
          </div>
        </div>

        {/* Toast */}
        {result && (
          <div style={{ ...S.toast, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', borderColor: result.ok ? '#bbf7d0' : '#fecaca' }}>
            {result.ok
              ? <><Icons.Check width={14} height={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> {result.message}</>
              : <><Icons.AlertCircle width={14} height={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> {result.error}</>
            }
          </div>
        )}

        {/* Setup Dependencies Card */}
        {!activeCategory && (
          <div style={S.setupCard}>
            <div style={S.setupHeader}>
              <Icons.Layers width={18} height={18} style={{ color: '#6366f1' }} />
              <div>
                <p style={S.setupTitle}>Setup Theme Dependencies</p>
                <p style={S.setupDesc}>Install required snippets, translations, and config before publishing sections</p>
              </div>
            </div>
            <div style={S.setupActions}>
              <fetcher.Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="intent" value="publish_snippets" />
                <button type="submit" className="setup-btn" disabled={publishingIntent === 'publish_snippets'}
                  style={{ ...S.setupBtn, opacity: publishingIntent === 'publish_snippets' ? 0.7 : 1 }}>
                  {publishingIntent === 'publish_snippets'
                    ? <><span style={S.miniSpinner} /> Uploading 393 snippets...</>
                    : <><Icons.Upload width={13} height={13} /> Snippets (393 files)</>}
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="intent" value="publish_locales" />
                <button type="submit" className="setup-btn" disabled={publishingIntent === 'publish_locales'}
                  style={{ ...S.setupBtn, opacity: publishingIntent === 'publish_locales' ? 0.7 : 1 }}>
                  {publishingIntent === 'publish_locales'
                    ? <><span style={S.miniSpinner} /> Uploading 57 locales...</>
                    : <><Icons.Upload width={13} height={13} /> Locales (57 files)</>}
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="intent" value="publish_config" />
                <button type="submit" className="setup-btn" disabled={publishingIntent === 'publish_config'}
                  style={{ ...S.setupBtn, opacity: publishingIntent === 'publish_config' ? 0.7 : 1 }}>
                  {publishingIntent === 'publish_config'
                    ? <><span style={S.miniSpinner} /> Uploading...</>
                    : <><Icons.Upload width={13} height={13} /> Theme Config</>}
                </button>
              </fetcher.Form>
            </div>
          </div>
        )}

        {/* Category Grid */}
        {!activeCategory && (
          <>
            <p style={S.sectionLabel}>Choose a section category</p>
            <div style={S.catGrid}>
              {categories.map(cat => {
                const Icon = Icons[cat.icon] || Icons.Grid;
                return (
                  <button key={cat.id} className="cat-card" onClick={() => setActiveCategory(cat.id)} style={S.catCard}>
                    <Icon width={22} height={22} style={{ color: '#6366f1', marginBottom: 8 }} />
                    <span style={S.catName}>{cat.name}</span>
                    <span style={S.catDesc}>{cat.description}</span>
                    <span style={S.catCount}>{cat.count} section{cat.count !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Section List */}
        {activeCategory && (
          <>
            <button onClick={() => setActiveCategory(null)} style={S.backBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back to categories
            </button>

            <div style={S.catHeader}>
              <div>
                <h2 style={S.catTitle}>{activeCatInfo?.name}</h2>
                <p style={S.catSubtitle}>{activeSections.length} section{activeSections.length !== 1 ? 's' : ''} available</p>
              </div>
            </div>

            <div style={S.secGrid}>
              {activeSections.map(sec => (
                <div key={sec.id} className="sec-card" style={S.secCard}>
                  <div style={S.secInfo}>
                    <p style={S.secName}>{sec.name}</p>
                    <p style={S.secFile}>{sec.file}</p>
                  </div>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="publish_section" />
                    <input type="hidden" name="sectionId" value={sec.id} />
                    <button
                      type="submit"
                      className="pub-btn"
                      disabled={publishingIntent === 'publish_section' && fetcher.formData?.get('sectionId') === sec.id}
                      style={{ ...S.publishBtn, opacity: (publishingIntent === 'publish_section' && fetcher.formData?.get('sectionId') === sec.id) ? 0.7 : 1 }}
                    >
                      {(publishingIntent === 'publish_section' && fetcher.formData?.get('sectionId') === sec.id) ? (
                        <span style={S.btnInner}>
                          <span style={{ width: 14, height: 14, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                        </span>
                      ) : result?.ok && result.sectionId === sec.id ? (
                        <span style={S.btnInner}><Icons.Check width={14} height={14} /> Published</span>
                      ) : (
                        <span style={S.btnInner}><Icons.Upload width={14} height={14} /> Publish</span>
                      )}
                    </button>
                  </fetcher.Form>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#fafafa', fontFamily: "'Inter', -apple-system, sans-serif", padding: '32px 20px' },
  container: { maxWidth: 880, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' },
  subtitle: { fontSize: 13, color: '#666', margin: 0 },
  sectionLabel: { fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16 },
  toast: { padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid', marginBottom: 20, display: 'flex', alignItems: 'center' },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  catCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  catName: { fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 4 },
  catDesc: { fontSize: 11, color: '#888', marginBottom: 8, lineHeight: '1.3' },
  catCount: { fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 10 },

  backBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px', margin: 0 },
  catHeader: { marginBottom: 16 },
  catTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 4px' },
  catSubtitle: { fontSize: 13, color: '#888', margin: 0 },

  secGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  secCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, transition: 'border-color 0.2s' },
  secInfo: { flex: 1, minWidth: 0 },
  secName: { fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 2px' },
  secFile: { fontSize: 11, color: '#aaa', margin: 0, fontFamily: 'monospace' },

  publishBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
  btnInner: { display: 'flex', alignItems: 'center', gap: 5 },

  setupCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  setupHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  setupTitle: { fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 2px' },
  setupDesc: { fontSize: 12, color: '#888', margin: 0 },
  setupActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  setupBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fafafa', color: '#333', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' },
  miniSpinner: { width: 12, height: 12, border: '2px solid #ccc', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' },
};
