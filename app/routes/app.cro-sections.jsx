import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { SECTION_FILES, getCategoriesWithCounts, getSectionsByCategory } from "../lib/constants";
import { PAGE_TEMPLATES } from "../lib/page-templates";
import { publishPageTemplate } from "../lib/shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "publish_template") {
    const templateId = formData.get("templateId");
    const template = PAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return json({ ok: false, error: "Template not found" }, { status: 404 });

    try {
      const res = await publishPageTemplate(session.shop, session.accessToken, template);
      return json({ ok: true, templateId, message: `Created template: ${res.assetKey}` });
    } catch (e) {
      return json({ ok: false, templateId, error: e.message }, { status: 500 });
    }
  }

  return json({ ok: false, error: "Unknown action" }, { status: 400 });
};

// ─── SVG ICONS ──────────────────────────────────────
const I = {
  Layout: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
  Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Layers: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
};

// ─── MAIN COMPONENT ─────────────────────────────────
export default function CroSections() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'sections'
  const [activeCategory, setActiveCategory] = useState(null);
  
  const categories = getCategoriesWithCounts().filter(c => c.id.startsWith('cro-'));
  const activeSections = activeCategory ? getSectionsByCategory(activeCategory) : [];
  const activeCatInfo = categories.find(c => c.id === activeCategory);

  const homeTemplates = PAGE_TEMPLATES.filter(t => t.type === 'home');
  const pdpTemplates = PAGE_TEMPLATES.filter(t => t.type === 'product');

  const result = fetcher.data;
  const isPublishing = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "publish_template";

  return (
    <div style={S.page}>
      <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      <script dangerouslySetInnerHTML={{__html: `tailwind.config={darkMode:'class',theme:{extend:{colors:{primary:'#10b981','background-dark':'#022c22'},fontFamily:{display:['Inter','sans-serif']}}}}`}} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .hero-gradient { background: radial-gradient(circle at 50% -20%, rgba(16, 185, 129, 0.15) 0%, rgba(2, 44, 34, 0) 60%); }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .cat-card:hover { border-color: #34d399 !important; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16,185,129,0.08) !important; }
        .sec-card:hover { border-color: #a7f3d0 !important; }
        .pub-btn:hover { background: #059669 !important; }
        .tab-btn { padding: 10px 24px; font-weight: 700; font-size: 14px; border-radius: 100px; cursor: pointer; transition: 0.2s; border: none; }
        .tab-btn.active { background: #10b981; color: white; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
        .tab-btn.inactive { background: transparent; color: #64748b; }
        .tab-btn.inactive:hover { background: #f1f5f9; color: #0f172a; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={S.container}>
        {/* ------------- HERO SECTION ------------- */}
        <div className="dark mb-8 w-full rounded-2xl overflow-hidden shadow-2xl" style={{ isolation: 'isolate' }}>
            <main className="relative pt-16 pb-16 overflow-hidden bg-[#022c22] font-display text-slate-100 w-full" style={{ fontFamily: 'Inter' }}>
                <section className="relative z-10 max-w-4xl mx-auto px-6 text-center hero-gradient">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                        <I.Zap width={14} height={14} /> Built for Conversions
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">
                        CRO Template Library
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-emerald-100/70 font-light leading-relaxed mb-8">
                        Deploy complete, high-converting Landing Pages instantly, or build your own from 36 premium standalone modular sections.
                    </p>
                </section>
            </main>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center', background: '#fff', padding: 8, borderRadius: 100, border: '1px solid #e2e8f0', width: 'max-content', margin: '0 auto 32px' }}>
          <button className={`tab-btn ${activeTab === 'templates' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('templates')}>💎 Full Page Templates (20)</button>
          <button className={`tab-btn ${activeTab === 'sections' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('sections')}>🧩 Modular Sections (36)</button>
        </div>

        {/* Status Toast */}
        {result?.intent !== "deps" && result?.templateId && !isPublishing && (
          <div style={{ ...S.toast, background: result.ok ? '#ecfdf5' : '#fef2f2', color: result.ok ? '#065f46' : '#991b1b', borderColor: result.ok ? '#a7f3d0' : '#fecaca' }}>
            {result.ok
              ? <><I.Check width={16} height={16} style={{ marginRight: 8 }} /> Successfully generated <b>{result.message}</b> in your Shopify Theme!</>
              : <><I.X width={16} height={16} style={{ marginRight: 8 }} /> Failed: {result.error}</>
            }
          </div>
        )}

        {/* ─── TAB: FULL PAGE TEMPLATES ─────────────────────────── */}
        {activeTab === 'templates' && (
          <>
            <div style={{ marginBottom: 40 }}>
              <div style={S.sectionHeaderSplit}>
                <h2 style={S.title}>Home & Landing Pages</h2>
              </div>
              <div style={S.tplGrid}>
                {homeTemplates.map(tpl => <TemplateCard key={tpl.id} tpl={tpl} fetcher={fetcher} isPublishing={isPublishing} />)}
              </div>
            </div>

            <div>
              <div style={S.sectionHeaderSplit}>
                <h2 style={S.title}>Product Pages</h2>
              </div>
              <div style={S.tplGrid}>
                {pdpTemplates.map(tpl => <TemplateCard key={tpl.id} tpl={tpl} fetcher={fetcher} isPublishing={isPublishing} />)}
              </div>
            </div>
          </>
        )}

        {/* ─── TAB: MODULAR SECTIONS ────────────────────────────── */}
        {activeTab === 'sections' && (
          <>
            {!activeCategory && (
              <>
                <div style={S.sectionHeaderSplit}>
                  <h2 style={S.title}>All Sections</h2>
                </div>
                <div style={S.catGrid}>
                  {categories.map(cat => {
                    const Icon = I[cat.icon] || I.Grid;
                    return (
                      <button key={cat.id} className="cat-card" onClick={() => setActiveCategory(cat.id)} style={S.catCard}>
                        <Icon width={28} height={28} style={{ color: '#10b981', marginBottom: 12 }} />
                        <span style={S.catName}>{cat.name}</span>
                        <span style={S.catDesc}>{cat.description}</span>
                        <span style={S.catCount}>{cat.count} variations</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {activeCategory && (
              <>
                <button onClick={() => setActiveCategory(null)} style={S.backBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Back to categories
                </button>

                <div style={S.catHeader}>
                  <h2 style={S.catTitle}>{activeCatInfo?.name}</h2>
                  <div style={{display:'flex', gap: 8, alignItems:'center', marginTop: 4}}>
                      <span style={S.catCount}>{activeSections.length} sections</span>
                      <p style={S.catSubtitle}>{activeCatInfo?.description}</p>
                  </div>
                </div>

                <div style={S.secGrid}>
                  {activeSections.map(sec => {
                    return (
                      <div key={sec.id} className="sec-card" style={S.secCard}>
                        <div style={S.secInfo}>
                          <p style={S.secName}>{sec.name}</p>
                          <p style={S.secFile}>{sec.file}</p>
                        </div>
                        <Link to={`/app/editor/${sec.id}`} className="pub-btn" style={{ ...S.publishBtn, background: '#10b981', textDecoration: 'none' }}>
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
          </>
        )}
      </div >
    </div >
  );
}

function TemplateCard({ tpl, fetcher, isPublishing }) {
  const isBusy = isPublishing && fetcher.formData?.get('templateId') === tpl.id;
  
  return (
    <div style={S.tplCard}>
      <div style={S.tplContent}>
        <div style={S.tplBadge}>{tpl.sections.length} Sections</div>
        <h3 style={S.tplName}>{tpl.name}</h3>
        <p style={S.tplDesc}>{tpl.description}</p>
        
        <div style={S.tplSecList}>
          {tpl.sections.map((sec, i) => (
            <div key={i} style={S.tplSecItem}>
              <div style={S.tplSecDot} /> {SECTION_FILES[sec]?.name || sec}
            </div>
          ))}
        </div>
      </div>
      
      <fetcher.Form method="post" style={{ padding: '0 24px 24px' }}>
        <input type="hidden" name="intent" value="publish_template" />
        <input type="hidden" name="templateId" value={tpl.id} />
        <button type="submit" disabled={isPublishing} style={{...S.tplBtn, opacity: isPublishing ? 0.7 : 1}}> 
          {isBusy ? <span style={S.btnSpinner} /> : <I.Layers width={16} height={16} />}
          {isBusy ? 'Generating Page...' : 'Install Full Page Template'}
        </button>
      </fetcher.Form>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px 20px' },
  container: { maxWidth: 880, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  sectionHeaderSplit: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  toast: { padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, border: '1px solid', marginBottom: 24, display: 'flex', alignItems: 'center' },

  tplGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 },
  tplCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: '0.3s' },
  tplContent: { padding: 24, flex: 1 },
  tplBadge: { display: 'inline-block', background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tplName: { fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.01em' },
  tplDesc: { fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 },
  tplSecList: { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' },
  tplSecItem: { fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 },
  tplSecDot: { width: 6, height: 6, borderRadius: '50%', background: '#10b981' },
  tplBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: '0.2s' },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  catCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  catName: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  catDesc: { fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: '1.4' },
  catCount: { fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: 100 },

  backBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', margin: 0 },
  catHeader: { marginBottom: 24 },
  catTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  catSubtitle: { fontSize: 14, color: '#64748b', margin: 0 },

  secGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  secCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, transition: 'border-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  secInfo: { flex: 1, minWidth: 0 },
  secName: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  secFile: { fontSize: 12, color: '#94a3b8', margin: 0, fontFamily: 'monospace' },

  publishBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
  btnInner: { display: 'flex', alignItems: 'center', gap: 6 },
  btnSpinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' },
};
