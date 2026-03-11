import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { SECTION_FILES, getCategoriesWithCounts, getSectionsByCategory } from "../lib/constants";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

// ─── SVG ICONS ──────────────────────────────────────
const I = {
  Layout: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
  Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  ShoppingBag: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>,
};

// ─── MAIN COMPONENT ─────────────────────────────────
export default function CroSections() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Filter only CRO categories
  const categories = getCategoriesWithCounts().filter(c => c.id.startsWith('cro-'));

  const activeSections = activeCategory ? getSectionsByCategory(activeCategory) : [];
  const activeCatInfo = categories.find(c => c.id === activeCategory);

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
      `}</style>

      <div style={S.container}>
        {/* ------------- HERO SECTION ------------- */}
        <div className="dark mb-10 w-full rounded-2xl overflow-hidden shadow-2xl" style={{ isolation: 'isolate' }}>
            <main className="relative pt-16 pb-16 overflow-hidden bg-[#022c22] font-display text-slate-100 w-full" style={{ fontFamily: 'Inter' }}>
                <section className="relative z-10 max-w-4xl mx-auto px-6 text-center hero-gradient">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                        <I.Zap width={14} height={14} /> Built for Conversions
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">
                        CRO Section Library
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-emerald-100/70 font-light leading-relaxed mb-8">
                        27 elite UX/UI components proven to lift conversion rates by up to 40%. Fully editable native Shopify sections built with premium design principles.
                    </p>
                </section>
            </main>
        </div>

        {/* Category Grid */}
        {
          !activeCategory && (
            <>
              <div style={S.sectionHeaderSplit}>
                <h2 style={{ ...S.title, fontSize: 20 }}>Select Category</h2>
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
          )
        }

        {/* Section List */}
        {
          activeCategory && (
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
          )
        }
      </div >
    </div >
  );
}

// ─── STYLES ─────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px 20px' },
  container: { maxWidth: 880, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  sectionHeaderSplit: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },

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
};
