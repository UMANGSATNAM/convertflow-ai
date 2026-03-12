import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection, checkDepsInstalled, installAllDeps, fixAllSections, removeAllCfSections } from "../lib/shopify.server";
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

  if (intent === "fix_all") {
    try {
      const result = await fixAllSections(session.shop, session.accessToken);
      return json({ ok: true, intent: "fix_all", message: `Fixed! Re-uploaded ${result.success} sections with translations removed.` });
    } catch (e) {
      return json({ ok: false, intent: "fix_all", error: e.message }, { status: 500 });
    }
  }

  if (intent === "remove_all_cf") {
    try {
      const result = await removeAllCfSections(session.shop, session.accessToken);
      return json({ ok: true, intent: "remove_all_cf", message: `Removed ${result.removed} injected section(s) from your homepage. Theme is now clean.` });
    } catch (e) {
      return json({ ok: false, intent: "remove_all_cf", error: e.message }, { status: 500 });
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
      <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      <script dangerouslySetInnerHTML={{__html: `tailwind.config={darkMode:'class',theme:{extend:{colors:{primary:'#2525f4','background-dark':'#06060e'},fontFamily:{display:['Inter','sans-serif']}}}}`}} />
      <style>{`
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .hero-gradient { background: radial-gradient(circle at 50% -20%, rgba(37, 37, 244, 0.15) 0%, rgba(6, 6, 14, 0) 60%); }
        .bento-inner-shadow { box-shadow: inset 0 0 20px rgba(0,0,0,0.2); }
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
        {/* ------------- STITCH BENTO LANDING PAGE ------------- */}
        <div className="dark mb-10 w-full rounded-2xl overflow-hidden shadow-2xl" style={{ isolation: 'isolate' }}>
            <main className="relative pt-20 pb-20 overflow-hidden bg-[#06060e] font-display text-slate-100 selection:bg-primary/30 w-full" style={{ fontFamily: 'Inter' }}>
                <section className="relative z-10 max-w-7xl mx-auto px-6 text-center hero-gradient">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                        <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                                        New: AI Theme Editor V2
                                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                                        Supercharge Your <br/> Shopify Store
                                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-10">
                                        Experience the future of e-commerce design. Generate high-converting sections in seconds natively in your Theme Editor.
                                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/app/builder" className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl text-lg hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/40 flex items-center justify-center gap-2" style={{ textDecoration: 'none' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                                            Start Live Editor
                    </Link>
                    <Link to="/app/builder?tab=titan" className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" style={{ textDecoration: 'none' }}>
                                            Browse Readymade Themes
                    </Link>
                    </div>
                </section>
                
                <section className="max-w-7xl mx-auto px-6 mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 grid-rows-2 gap-4 h-auto md:h-[800px]">
                    <div className="md:col-span-2 lg:col-span-3 row-span-1 glass rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group">
                        <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2 text-white">100+ Premium Sections</h3>
                        <p className="text-slate-400 text-sm max-w-[240px]">High-converting UI components ready for your store.</p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 flex gap-4 rotate-[-12deg] group-hover:rotate-[-8deg] transition-transform duration-500">
                        <div className="w-40 h-56 bg-primary/20 rounded-xl border border-white/10 p-2 shadow-2xl flex flex-col gap-2">
                            <div className="w-full h-24 bg-primary/40 rounded-lg"></div>
                            <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                            <div className="h-2 w-1/2 bg-white/20 rounded"></div>
                            <div className="mt-auto h-8 w-full bg-primary rounded-md"></div>
                        </div>
                        <div className="w-40 h-56 bg-slate-800 rounded-xl border border-white/10 p-2 shadow-2xl flex flex-col gap-2">
                        <div className="w-full h-24 bg-slate-700 rounded-lg"></div>
                        <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                        <div className="mt-auto h-8 w-full bg-white/10 rounded-md"></div>
                        </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 row-span-2 glass rounded-2xl p-8 overflow-hidden relative group">
                        <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2 text-white">Visual Theme Editor</h3>
                        <p className="text-slate-400 text-sm mb-8">Click <b>Launch Theme Editor</b> to design without limits.</p>
                        </div>
                        <div className="mt-4 bg-[#0f172a]/50 rounded-xl border border-white/10 h-full p-4 flex flex-col gap-4 shadow-inner">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="h-4 w-32 bg-white/5 rounded"></div>
                        </div>
                        <div className="flex gap-4 h-full">
                        <div className="w-24 shrink-0 flex flex-col gap-2">
                        <div className="h-6 w-full bg-primary/20 rounded border border-primary/30"></div>
                        <div className="h-6 w-full bg-white/5 rounded"></div>
                        <div className="h-6 w-full bg-white/5 rounded"></div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center text-center gap-3">
                        <div className="h-2 w-32 bg-white/20 rounded"></div>
                        <div className="h-2 w-24 bg-white/10 rounded"></div>
                        <div className="mt-4 w-full h-10 bg-primary rounded-lg"></div>
                        </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>
                
                {/* --- READYMADE THEMES SECTION --- */}
                <section className="max-w-7xl mx-auto px-6 mt-20 mb-10">
                    <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Readymade Themes</h2>
                            <p className="text-slate-400">Instantly transform your store with full-page, professionally designed layouts.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Maison Theme Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col">
                            <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" alt="Maison Theme Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20">
                                    5 Sections
                                </div>
                                <div className="absolute bottom-4 left-4 z-20">
                                    <h3 className="text-2xl font-serif italic text-white mb-1">Maison</h3>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <p className="text-sm text-slate-400 mb-6 flex-1">
                                    A refined, editorial-style layout with warm neutrals and striking typography. Perfect for luxury, fashion, and modern homeware brands.
                                </p>
                                <Link 
                                    to="/app/builder?tab=titan&template=cf-maison-home" 
                                    className="w-full py-3 bg-white/10 hover:bg-primary hover:text-white text-slate-200 font-semibold rounded-xl text-center transition-all flex items-center justify-center gap-2"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    Apply Theme
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                
            </main>
        </div>


        {/* Setup Progress / Installing */}
        {
          isSettingUp && (
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
          )
        }

        {/* Setup Complete Toast */}
        {
          result?.intent === "deps" && !isSettingUp && (
            <div style={{ ...S.toast, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', borderColor: result.ok ? '#bbf7d0' : '#fecaca' }}>
              {result.ok
                ? <><I.Check width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.message}</>
                : <><I.X width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> Setup failed: {result.error}</>
              }
            </div>
          )
        }

        {/* Section Publish Toast */}
        {
          result && result.intent !== "deps" && result.sectionId && !isSettingUp && (
            <div style={{ ...S.toast, background: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', borderColor: result.ok ? '#bbf7d0' : '#fecaca' }}>
              {result.ok
                ? <><I.Check width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.message} — now in your Theme Editor</>
                : <><I.X width={14} height={14} style={{ marginRight: 6, flexShrink: 0 }} /> {result.error}</>
              }
            </div>
          )
        }

            <div style={{ paddingBottom: 20 }} />

        {/* Category Grid */}
        {
          !activeCategory && !isSettingUp && (
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
          )
        }
      </div >
    </div >
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

  editorHero: { display: 'flex', background: 'linear-gradient(135deg, #111 0%, #1e1b4b 100%)', borderRadius: 20, padding: 40, marginTop: 10, marginBottom: 30, color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' },
  editorHeroLeft: { flex: 1, paddingRight: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' },
  editorHeroBadge: { background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 16 },
  editorHeroTitle: { fontSize: 32, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.2 },
  editorHeroDesc: { fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', lineHeight: 1.5, maxWidth: 400 },
  editorHeroCta: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#111', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(255,255,255,0.1)' },

  editorHeroRight: { width: 340, flexShrink: 0, position: 'relative' },
  editorMock: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column', transform: 'rotate(1deg) scale(1.05)', transformOrigin: 'right center' },
  editorMockTopbar: { display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 6 },
  editorMockDot: { width: 8, height: 8, borderRadius: 4, background: '#ef4444' },
  editorMockTitle: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' },
  editorMockBody: { display: 'flex', flex: 1 },
  editorMockLeft: { width: 90, borderRight: '1px solid rgba(255,255,255,0.05)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 8 },
  editorMockSection: { fontSize: 9, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: 4, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
  editorMockCenter: { flex: 1, padding: 16 },
  editorMockRight: { width: 80, borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '12px 8px', display: 'flex', flexDirection: 'column' },
  editorMockInjectBtn: { marginTop: 'auto', background: '#818cf8', color: '#fff', textAlign: 'center', padding: '6px', borderRadius: 4, fontSize: 10, fontWeight: 700 },

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

  warnCard: { background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  warnLeft: { display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 },
  warnIcon: { fontSize: 18, flexShrink: 0 },
  warnTitle: { fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 2px' },
  warnDesc: { fontSize: 12, color: '#b45309', margin: 0, lineHeight: 1.4 },
  warnBtn: { background: '#d97706', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },

  actionsCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  actionsLeft: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 200 },
  dangerBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  syncBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  editorBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
};
