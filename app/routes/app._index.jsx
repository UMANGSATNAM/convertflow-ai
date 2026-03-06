import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection, checkDepsInstalled, installAllDeps } from "../lib/shopify.server";
import { SECTION_FILES, getCategoriesWithCounts, getSectionsByCategory } from "../lib/constants";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const depsInstalled = await checkDepsInstalled(session.shop, session.accessToken);
  return json({ shop: session.shop, depsInstalled });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "install_deps") {
    try {
      const result = await installAllDeps(session.shop, session.accessToken);
      return json({ ok: true, intent: "deps", message: `Setup complete! ${result.totalFiles} files installed (${result.snippets} snippets, ${result.locales} locales)` });
    } catch (e) {
      return json({ ok: false, intent: "deps", error: e.message }, { status: 500 });
    }
  }

  if (intent === "publish_section") {
    const sectionId = formData.get("sectionId");
    const sectionMeta = SECTION_FILES[sectionId];
    if (!sectionMeta) return json({ ok: false, error: "Section not found" }, { status: 404 });

    const liquid = readSectionFile(sectionMeta.file);
    if (!liquid) return json({ ok: false, error: "Section file missing on server" }, { status: 404 });

    try {
      await publishSection(session.shop, session.accessToken, `cf-${sectionId}`, liquid);
      return json({ ok: true, sectionId, message: `Published ${sectionMeta.name}` });
    } catch (e) {
      return json({ ok: false, sectionId, error: e.message }, { status: 500 });
    }
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

// ─── SVG ICONS ──────────────────────────────────────
const I = {
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
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
};

// ─── MAIN COMPONENT ─────────────────────────────────
export default function AppIndex() {
  const { shop, depsInstalled } = useLoaderData();
  const fetcher = useFetcher();
  const [activeCategory, setActiveCategory] = useState(null);
  const [setupTriggered, setSetupTriggered] = useState(false);
  const categories = getCategoriesWithCounts();
  const result = fetcher.data;

  const isPublishing = fetcher.state !== "idle";
  const publishingIntent = isPublishing ? fetcher.formData?.get("intent") : null;

  const activeSections = activeCategory ? getSectionsByCategory(activeCategory) : [];
  const activeCatInfo = categories.find(c => c.id === activeCategory);

  // Auto-trigger dependency installation on first load
  useEffect(() => {
    if (!depsInstalled && !setupTriggered && fetcher.state === "idle") {
      setSetupTriggered(true);
      fetcher.submit({ intent: "install_deps" }, { method: "post" });
    }
  }, [depsInstalled, setupTriggered, fetcher.state]);

  const setupDone = depsInstalled || (result?.ok && result?.intent === "deps");
  const isSettingUp = publishingIntent === "install_deps";

  return (
    <div style={S.page}>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                .cat-card:hover { border-color: #818cf8 !important; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(79,70,229,0.08) !important; }
                .sec-card:hover { border-color: #c7d2fe !important; }
                .pub-btn:hover { background: #4338ca !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes progress { 0% { width: 5%; } 50% { width: 60%; } 100% { width: 95%; } }
            `}</style>

      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>Section Builder</h1>
          <p style={S.subtitle}>Connected to <strong>{shop}</strong></p>
        </div>

        {/* Setup Progress / Installing */}
        {isSettingUp && (
          <div style={S.setupCard}>
            <div style={S.setupRow}>
              <span style={S.spinner} />
              <div>
                <p style={S.setupTitle}>Installing theme dependencies...</p>
                <p style={S.setupDesc}>Uploading 393 snippets + 57 locales + config to your theme. This takes 2-3 minutes on first run.</p>
              </div>
            </div>
            <div style={S.progressTrack}>
              <div style={S.progressBar} />
            </div>
          </div>
        )}

        {/* Setup Complete Toast */}
        {result?.intent === "deps" && !isSettingUp && (
          <div style={{ ...S.toast, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', borderColor: result.ok ? '#bbf7d0' : '#fecaca' }}>
            {result.ok
              ? <><I.Check width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.message}</>
              : <><I.X width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> Setup failed: {result.error}</>
            }
          </div>
        )}

        {/* Section Publish Toast */}
        {result && result.intent !== "deps" && result.sectionId && !isSettingUp && (
          <div style={{ ...S.toast, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', borderColor: result.ok ? '#bbf7d0' : '#fecaca' }}>
            {result.ok
              ? <><I.Check width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.message} — now in your Theme Editor</>
              : <><I.X width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.error}</>
            }
          </div>
        )}

        {/* Hero Section (Bento Grid) */}
        {!activeCategory && !isSettingUp && (
          <div style={S.heroContainer}>
            <div style={S.heroHeader}>
              <h2 style={S.heroTitle}>Build High-Converting Pages Faster</h2>
              <p style={S.heroSubtitle}>Premium sections designed for clarity, conversion, and perfect mobile responsiveness.</p>
            </div>

            <div style={S.bentoGrid}>
              {/* Feature 1 (Wide) */}
              <div style={S.bentoCardWide}>
                <div style={S.bentoContent}>
                  <h3 style={S.bentoTitle}>Full Structural Control for Conversion</h3>
                  <p style={S.bentoDesc}><strong>ConvertFlow AI</strong> lets you control add-to-cart visibility, trust badge placement, product information hierarchy, and CTA prominence seamlessly.</p>
                </div>
                <div style={S.bentoImageMock}>
                  <div style={S.mockWindow}>
                    <div style={S.mockHeader}>
                      <span style={S.mockDotRed} />
                      <span style={S.mockDotYellow} />
                      <span style={S.mockDotGreen} />
                    </div>
                    <div style={S.mockBody}>
                      <div style={S.mockSidebar}>
                        <div style={S.mockBlock} /><div style={S.mockBlock} /><div style={S.mockBlock} />
                      </div>
                      <div style={S.mockCanvas}>
                        <div style={S.mockHero} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={S.mockSectionHalf} /><div style={S.mockSectionHalf} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 (Square) */}
              <div style={S.bentoCardSquare1}>
                <h3 style={S.bentoTitle}>Built to Work With Shopify's Ecosystem</h3>
                <p style={S.bentoDesc}>Seamlessly integrate with Shopify themes and apps without slowing down performance. 100% native Liquid blocks.</p>
                <div style={S.mockIntegrations}>
                  <div style={S.mockTag}><I.Zap width={12} height={12} /> Live App Block</div>
                  <div style={S.mockTag}><I.Layout width={12} height={12} /> Theme Editor</div>
                </div>
              </div>

              {/* Bottom Row */}
              <div style={S.bentoCardTall}>
                <h3 style={S.bentoTitle}>Customize for Clarity, Not Just Design</h3>
                <p style={S.bentoDesc}>Structure product information to reduce confusion and increase purchase confidence.</p>
                <ul style={S.bentoList}>
                  <li><I.Check width={12} height={12} style={{ color: '#6366f1' }} /> Parameter for almost every style</li>
                  <li><I.Check width={12} height={12} style={{ color: '#6366f1' }} /> Global styles</li>
                  <li><I.Check width={12} height={12} style={{ color: '#6366f1' }} /> Option Swatches</li>
                  <li><I.Check width={12} height={12} style={{ color: '#6366f1' }} /> Custom Code Editor</li>
                </ul>
              </div>

              <div style={S.bentoCardTallAI}>
                <div style={S.aiBadge}><span style={{ fontSize: 14 }}>✨</span> New: AI Sales Page</div>
                <p style={S.bentoDesc}>Build personalized sales pages designed to improve add-to-cart rate by aligning content with visitor intent.</p>
                <div style={S.mockAiBox}>
                  <div style={S.mockAiLine} />
                  <div style={S.mockAiLine} />
                  <div style={{ ...S.mockAiLine, width: '60%' }} />
                </div>
              </div>

              <div style={S.bentoCardTallLight}>
                <h3 style={S.bentoTitle}>Responsive for Mobile Conversion</h3>
                <p style={S.bentoDesc}>Ensure your key conversion elements remain visible and optimized across devices.</p>
                <div style={S.mockDevices}>
                  <I.Layout width={16} height={16} />
                  <I.Grid width={16} height={16} />
                  <I.Image width={16} height={16} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Grid */}
        {!activeCategory && !isSettingUp && (
          <>
            <div style={S.sectionHeaderSplit}>
              <h2 style={{ ...S.title, fontSize: 20 }}>Section Components Library</h2>
              <p style={S.sectionLabel}>Choose a section category</p>
            </div>
            <div style={S.catGrid}>
              {categories.map(cat => {
                const Icon = I[cat.icon] || I.Grid;
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
              <h2 style={S.catTitle}>{activeCatInfo?.name}</h2>
              <p style={S.catSubtitle}>{activeSections.length} section{activeSections.length !== 1 ? 's' : ''} available</p>
            </div>

            <div style={S.secGrid}>
              {activeSections.map(sec => {
                const isBusy = publishingIntent === 'publish_section' && fetcher.formData?.get('sectionId') === sec.id;
                const isDone = result?.ok && result?.sectionId === sec.id;
                return (
                  <div key={sec.id} className="sec-card" style={S.secCard}>
                    <div style={S.secInfo}>
                      <p style={S.secName}>{sec.name}</p>
                      <p style={S.secFile}>{sec.file}</p>
                    </div>
                    <Link to={`/app/editor/${sec.id}`} className="pub-btn" style={{ ...S.publishBtn, background: '#4f46e5', textDecoration: 'none' }}>
                      <span style={S.btnInner}>
                        <I.Layout width={14} height={14} /> Customize & Inject
                      </span>
                    </Link>
                  </div>
                );
              })}
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

  setupCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  setupRow: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  setupTitle: { fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 4px' },
  setupDesc: { fontSize: 12, color: '#888', margin: 0, lineHeight: '1.4' },
  spinner: { width: 20, height: 20, border: '2.5px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0, marginTop: 2 },
  progressTrack: { height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 3, animation: 'progress 90s ease-out forwards' },

  heroContainer: { marginBottom: 40, padding: '40px 0 0' },
  heroHeader: { textAlign: 'center', marginBottom: 32 },
  heroTitle: { fontSize: 32, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', margin: '0 0 12px' },
  heroSubtitle: { fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto', lineHeight: 1.5 },

  bentoGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gridTemplateRows: 'auto auto', gap: 16 },
  bentoCardWide: { background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden', position: 'relative' },
  bentoCardSquare1: { background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 },
  bentoCardTall: { background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 },
  bentoCardTallAI: { background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' },
  bentoCardTallLight: { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 },

  bentoTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 },
  bentoDesc: { fontSize: 14, color: '#4b5563', margin: 0, lineHeight: 1.5 },
  bentoList: { margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#4b5563', fontWeight: 500 },

  bentoImageMock: { flex: 1, minHeight: 180, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  mockWindow: { flex: 1, display: 'flex', flexDirection: 'column' },
  mockHeader: { height: 28, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, background: '#f9fafb' },
  mockDotRed: { width: 8, height: 8, borderRadius: '50%', background: '#ef4444' },
  mockDotYellow: { width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' },
  mockDotGreen: { width: 8, height: 8, borderRadius: '50%', background: '#10b981' },
  mockBody: { flex: 1, display: 'flex' },
  mockSidebar: { width: 60, borderRight: '1px solid #e5e7eb', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  mockCanvas: { flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  mockBlock: { height: 20, background: '#f3f4f6', borderRadius: 4 },
  mockHero: { height: 60, background: '#e0e7ff', borderRadius: 6 },
  mockSectionHalf: { flex: 1, height: 40, background: '#f3f4f6', borderRadius: 6 },

  mockIntegrations: { display: 'flex', gap: 8, marginTop: 'auto' },
  mockTag: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#1d4ed8' },

  aiBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#c026d3', width: 'max-content', border: '1px solid #f0abfc' },
  mockAiBox: { marginTop: 'auto', background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #f5d0fe', display: 'flex', flexDirection: 'column', gap: 8 },
  mockAiLine: { height: 8, background: '#fae8ff', borderRadius: 4 },

  mockDevices: { display: 'flex', justifyContent: 'center', gap: 16, marginTop: 'auto', padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', color: '#64748b' },

  sectionHeaderSplit: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },

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

  publishBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  btnInner: { display: 'flex', alignItems: 'center', gap: 5 },
  btnSpinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' },
};
