const fs = require('fs');
const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Update imports
const importMatch = content.match(/import \{ ([^}]+) \} from "lucide-react";/);
if (importMatch) {
    let icons = importMatch[1].split(',').map(s => s.trim());
    const needed = ['Search', 'Settings2', 'Undo', 'Redo', 'Eye', 'ExternalLink', 'Plus', 'Sparkles', 'User', 'MoreHorizontal', 'FileText', 'Move', 'MousePointer2', 'Blocks'];
    needed.forEach(i => { if (!icons.includes(i)) icons.push(i); });
    content = content.replace(importMatch[0], `import { ${[...new Set(icons)].join(', ')} } from "lucide-react";`);
}

const NEW_RETURN = `    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* ── TOPMOST HEADER (PageFly Page Editor) ── */}
            <div style={S.topmostHeader}>
                <div style={S.topmostLeft}>
                    <div style={S.pfLogoMark}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3662e3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <span style={S.topmostTitle}>PageFly Page Editor</span>
                </div>
                <div style={S.topmostRight}>
                    <button
                        className="te-publish-btn"
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                    >
                        Publish
                    </button>
                    <button className="te-close-btn" onClick={() => navigate('/app')}>
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* ── SECONDARY TOOLBAR ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-icon-back" title="Home">
                        <Home size={15} strokeWidth={2.5} />
                    </button>
                    <div style={S.topbarTitleGroup}>
                        <span style={S.topbarPageName}>Untitled</span>
                        <span style={S.statusPill}>Unpublished</span>
                    </div>
                </div>

                <div style={S.topbarRight}>
                    <div style={S.flymateBadge}>
                         <Sparkles size={14} color="#6366f1" fill="#6366f1" style={{marginRight: 4}}/> Flymate
                    </div>
                    
                    <div style={S.deviceToggle}>
                        <button className={"te-dev-btn" + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')}><Monitor size={15} strokeWidth={2.5} /></button>
                        <button className="te-dev-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="5" width="16" height="14" rx="2" ry="2"/></svg></button>
                        <button className={"te-dev-btn" + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')}><Smartphone size={15} strokeWidth={2.5} /></button>
                    </div>
                    
                    <div style={{fontSize: 12, color: '#5c5f62', margin: '0 8px'}}>{device === 'desktop' ? '1443px, 100%' : '375px, 100%'}</div>
                    
                    <button className="te-icon-btn"><Settings2 size={15} strokeWidth={2.5} /></button>
                    <div style={S.divider}></div>
                    <button className="te-icon-btn" disabled><Undo size={15} strokeWidth={2.5} color="#c9cccf" /></button>
                    <button className="te-icon-btn" disabled><Redo size={15} strokeWidth={2.5} color="#c9cccf" /></button>
                    <div style={S.divider}></div>
                    <button className="te-text-action"><Eye size={14} strokeWidth={2.5}/> Preview</button>
                    <button className="te-text-action" style={{color: '#8c9196'}}><ExternalLink size={14} strokeWidth={2.5}/> View live</button>
                </div>
            </header>

            <div style={S.workspace}>
                {/* ── EXTREME LEFT UTILITY BAR ── */}
                <div style={S.utilityBar}>
                    <div style={S.utilityTop}>
                        <button className="te-util-btn active"><Layout size={18} strokeWidth={2}/></button>
                        <button className="te-util-btn"><Sparkles size={18} strokeWidth={2}/></button>
                        <button className="te-util-btn"><Blocks size={18} strokeWidth={2}/></button>
                        <button className="te-util-btn"><FileText size={18} strokeWidth={2}/></button>
                        <button className="te-util-btn"><Settings2 size={18} strokeWidth={2}/></button>
                    </div>
                    <div style={S.utilityBottom}>
                        <button className="te-util-btn"><User size={18} strokeWidth={2}/></button>
                    </div>
                </div>

                {/* ── LEFT SIDEBAR (PageFly Outline) ── */}
                <aside style={S.leftSidebar}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Page content</span>
                                <button className="te-icon-btn" onClick={() => navigate('/app')}><X size={16} strokeWidth={2.5} /></button>
                            </div>

                            <div style={S.outlineList}>
                                <div style={S.searchBox}>
                                    <span style={{fontSize: 13, color:'#202223'}}>PageFly body</span>
                                    <Search size={14} color="#8c9196" strokeWidth={2.5} />
                                </div>
                                
                                {pageBlocks.length === 0 && (
                                    <div style={S.blueHintBox}>
                                        <div style={{display:'flex', gap: 8, color: '#005bd3'}}>
                                            <Eye size={14} strokeWidth={2.5} style={{flexShrink:0, marginTop:2}}/>
                                            <span>Add a section to make this template visible to customers.</span>
                                        </div>
                                        <button className="te-add-sec-link" onClick={() => setLeftView('categories')}>
                                            <Plus size={14} strokeWidth={2.5}/> Add section
                                        </button>
                                    </div>
                                )}
                                
                                {pageBlocks.map((block) => {
                                    const isActive = block.id === activeBlockId;
                                    const label = block.isCf ? (SECTION_FILES[block.type]?.name || block.type) : block.type;
                                    return (
                                        <div
                                            key={block.id}
                                            className={"te-block-row" + (isActive ? ' active' : '')}
                                            onClick={() => {
                                                if (block.isCf) {
                                                    setActiveBlockId(block.id);
                                                    setSelectedTemplateId(null);
                                                }
                                            }}
                                        >
                                            <div style={S.blockRowLeft}>
                                                <span style={S.dragHandle}>
                                                    <ChevronRight size={14} strokeWidth={2.5} />
                                                </span>
                                                <span style={S.blockIcon}>
                                                    {block.isCf ? <Palette size={14} /> : <Layout size={14} />}
                                                </span>
                                                <span style={S.blockLabel}>{label}</span>
                                            </div>
                                            {block.isCf && (
                                                <button
                                                    className="te-del-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(block.id); }}
                                                    title="Remove section"
                                                >
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                <div style={{ marginTop: 24, padding: '0 8px' }}>
                                    <div style={S.contextHeader}>Header</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}>
                                            <Layout size={14} color="#5c5f62" />
                                            <span style={{ fontSize: 13, color: '#5c5f62' }}>Theme header</span>
                                        </div>
                                    </div>
                                    <div style={{ ...S.contextHeader, marginTop: 16 }}>Footer</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}>
                                            <Layout size={14} color="#5c5f62" />
                                            <span style={{ fontSize: 13, color: '#5c5f62' }}>Theme footer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE 1: CATEGORIES */}
                    {leftView === 'categories' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('outline')}>
                                    <ChevronRight size={16} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <span style={S.panelTitle}>Add section</span>
                                <div style={{ width: 28 }}></div>
                            </div>
                            <div style={S.scrollArea}>
                                {cfCats.map(cat => (
                                    <button key={cat.id} className="te-list-item" onClick={() => handleSelectCategory(cat.id)}>
                                        <span style={S.listIcon}>{CAT_SVG[cat.id] || <Layout size={16} strokeWidth={2} />}</span>
                                        <span style={S.listText}>{cat.name}</span>
                                        <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft: 'auto', color: '#8c9196' }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATE 2: TEMPLATES */}
                    {leftView === 'templates' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('categories')}>
                                    <ChevronRight size={16} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <span style={S.panelTitle}>{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</span>
                                <div style={{ width: 28 }}></div>
                            </div>
                            <div style={{ ...S.scrollArea, padding: '12px 0' }}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    return (
                                        <button key={id} className="te-list-item" onClick={() => handleSelectTemplate(id)}>
                                            <span style={S.listIcon}><Palette size={16} strokeWidth={2} /></span>
                                            <span style={S.listText}>{meta?.name || id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>

                {/* ── CENTER CANVAS (Persistent Full Preview) ── */}
                <main style={S.canvas}>
                    <div style={{ ...S.canvasHeader, maxWidth: device === 'mobile' ? '400px' : '100%', display: 'flex', gap: 8 }}>
                        <span style={S.canvasHeaderTab}>No element selected</span>
                    </div>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && pageBlocks.length === 0 && (
                            <div style={S.emptyCanvas}>
                                <div style={S.emptyGraphic}>
                                    <svg viewBox="0 0 100 100" width="80" height="80" fill="none" stroke="#e4e5e7" strokeWidth="2">
                                        <rect x="10" y="20" width="80" height="60" rx="4" />
                                        <path d="M10 32h80M15 26h5M22 26h5M29 26h5" />
                                        <rect x="20" y="45" width="25" height="25" rx="2" fill="#f4f6f8" stroke="none" />
                                        <rect x="55" y="45" width="25" height="4" rx="2" />
                                        <rect x="55" y="55" width="20" height="4" rx="2" />
                                        <rect x="55" y="65" width="15" height="4" rx="2" />
                                    </svg>
                                </div>
                                <h3 style={S.emptyCanvasTitle}>This page is empty</h3>
                                <p style={S.emptyCanvasSub}>Choose a starting point to begin designing your page.</p>
                                <div style={{display: 'flex', gap: 12, marginTop: 16}}>
                                    <button className="te-canvas-btn" onClick={() => setLeftView('categories')}>
                                        <Plus size={14} strokeWidth={2.5}/> Add element
                                    </button>
                                    <button className="te-canvas-btn-dark">
                                        <Sparkles size={14} strokeWidth={2.5}/> Prompt with AI
                                    </button>
                                </div>
                                <p style={{marginTop: 24, fontSize: 13, color: '#5c5f62'}}>
                                    Don't want to start from scratch?<br/>
                                    <span style={{color: '#1a73e8', cursor: 'pointer'}} onClick={() => setLeftView('categories')}>Add a section</span> or <span style={{color: '#1a73e8', cursor: 'pointer'}}>Select a page template</span>
                                </p>
                            </div>
                        )}
                        {(!previewHtml && (!activeBlockId && !selectedTemplateId) && pageBlocks.length > 0) && (
                            <div style={S.previewPlaceholder}>
                                <div className="te-spinner" />
                            </div>
                        )}
                        {previewLoading && (
                            <div style={S.previewOverlay}>
                                <div className="te-spinner" />
                            </div>
                        )}
                        {previewHtml && (
                            <iframe
                                srcDoc={previewHtml}
                                style={{ ...S.previewIframe, opacity: previewLoading ? 0.5 : 1 }}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                title="Live Preview"
                            />
                        )}
                    </div>
                </main>

                {/* ── RIGHT SETTINGS PANEL (Conditional/Static empty state) ── */}
                <aside style={S.rightSidebar}>
                    {!(selectedTemplateId || activeBlockId) ? (
                        <div style={S.panelInner}>
                            <div style={S.rightEmptyState}>
                                <div style={S.rightEmptyIcon}>
                                    <Settings2 size={24} strokeWidth={1.5} color="#202223" />
                                </div>
                                <h3 style={S.rightEmptyTitle}>Customize your pages</h3>
                                <p style={S.rightEmptyText}>Select an element from the canvas or page outline to view its settings here.</p>
                                <p style={S.rightEmptyText}>A PageFly page works as a section in your Shopify theme. To edit theme sections, visit the theme editor. <a href="#" style={{color: '#202223'}}>Learn more</a></p>
                                <button className="te-text-action" style={{padding:0, marginTop:8}}><ExternalLink size={14} strokeWidth={2.5}/> Go to theme editor</button>

                                <div style={S.shortcutsBlock}>
                                    <h4 style={S.shortcutsTitle}>Keyboard shortcuts</h4>
                                    <div style={S.shortcutRow}><div><kbd>hold</kbd> <kbd>ctrl</kbd></div><span>Select multiple</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>shift</kbd> <kbd>S</kbd></div><span>Save & publish</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>S</kbd></div><span>Save</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>shift</kbd> <kbd>Z</kbd></div><span>Redo</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>Z</kbd></div><span>Undo</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>D</kbd></div><span>Duplicate</span></div>
                                    <div style={S.shortcutRow}><div><kbd>delete</kbd></div><span>Delete</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>C</kbd></div><span>Copy style</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>V</kbd></div><span>Paste style</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => {
                                    if (activeBlockId) {
                                        setActiveBlockId(null);
                                        setSettings({});
                                    } else {
                                        setSelectedTemplateId(null);
                                        setSettings({});
                                    }
                                }}>
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                                <span style={S.panelTitle}>
                                    {templateSchema.name || (activeBlockId ? 'Edit Section' : 'Customize Section')}
                                </span>
                                <div style={{ width: 28 }}></div>
                            </div>

                            <div style={S.settingsScroll}>
                                {!activeBlockId && (
                                    <div style={S.settingBlock}>
                                        <label style={S.settingLabel}>Inject Position</label>
                                        <div style={S.placementRow}>
                                            {[['top', 'Below Header'], ['bottom', 'Above Footer']].map(([v, label]) => (
                                                <button key={v} className={"te-place-btn" + (placement === v ? ' active' : '')} onClick={() => setPlacement(v)}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {templateSchema.settings.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#8c9196', fontSize: 13 }}>Loading parameters...</div>
                                ) : (
                                    <div style={S.settingsList}>
                                        {templateSchema.settings.map(s => (
                                            <SettingRow
                                                key={s.id}
                                                setting={s}
                                                value={settings[s.id]}
                                                onChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}`;

content = content.replace(/    return \([\s\S]+?        <\/div>\n    \);\n\}/, NEW_RETURN);

const NEW_STYLES = `const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f4f6f8', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },

    // Topmost Header
    topmostHeader: {
        height: '44px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #e4e5e7', flexShrink: 0, zIndex: 11
    },
    topmostLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    pfLogoMark: { width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    topmostTitle: { fontSize: '13px', fontWeight: '600', color: '#202223' },
    topmostRight: { display: 'flex', alignItems: 'center', gap: '12px' },

    // Secondary Toolbar
    topbar: {
        height: '52px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #e4e5e7', flexShrink: 0, zIndex: 10
    },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    topbarTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' },
    topbarPageName: { fontSize: '14px', fontWeight: '500', color: '#202223' },
    statusPill: { fontSize: '11px', backgroundColor: '#f4f6f8', color: '#5c5f62', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' },

    topbarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    flymateBadge: { display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#202223', backgroundColor: '#eef2ff', padding: '4px 8px', borderRadius: '12px', marginRight: 16 },
    deviceToggle: { display: 'flex', gap: '2px' },
    divider: { width: '1px', height: '24px', backgroundColor: '#e4e5e7', margin: '0 8px' },

    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },

    // Utility Sidebar (Extreme Left)
    utilityBar: {
        width: '56px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexShrink: 0, zIndex: 6
    },
    utilityTop: { display: 'flex', flexDirection: 'column', gap: '8px' },
    utilityBottom: { display: 'flex', flexDirection: 'column', gap: '8px' },

    // Left Sidebar (Page Content / Context)
    leftSidebar: {
        width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5
    },
    panelInner: { display: 'flex', flexDirection: 'column', height: '100%' },
    panelHeader: {
        padding: '16px', borderBottom: '1px solid #e4e5e7',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    panelTitle: { fontSize: '14px', fontWeight: '600', color: '#202223', margin: 0 },

    outlineList: { flex: 1, overflowY: 'auto', padding: '16px 8px' },
    searchBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f4f6f8', marginBottom: '8px' },
    blueHintBox: { backgroundColor: '#f1f8fe', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', border: '1px solid #e1f0fe' },

    // Aesthetic structural row markers
    contextBlock: { padding: '8px', marginBottom: '8px', borderRadius: '6px' },
    contextHeader: { fontSize: '12px', color: '#202223', fontWeight: '600', marginBottom: '4px', paddingLeft: '8px' },

    blockRowLeft: { display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' },
    dragHandle: { color: '#c9cccf', display: 'flex' }, // Now repurposed for Chevron
    blockIcon: { color: '#5c5f62', display: 'flex' },
    blockLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' },

    scrollArea: { flex: 1, overflowY: 'auto' },
    listIcon: { color: '#5c5f62', display: 'flex' },
    listText: { fontSize: '13px', fontWeight: '500' },

    // Center Canvas (Preview iframe)
    canvas: {
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', backgroundColor: '#f4f6f8', overflow: 'hidden', padding: '0 24px 24px 24px'
    },
    canvasHeader: { width: '100%', padding: '8px 0', display: 'flex' },
    canvasHeaderTab: { fontSize: '12px', color: '#5c5f62', fontWeight: 500 },
    previewFrame: {
        flex: 1, width: '100%', maxWidth: '100%', height: '100%',
        backgroundColor: '#fff', position: 'relative', transition: 'width 0.3s ease, max-width 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '4px', border: '1px solid #e4e5e7'
    },
    emptyCanvas: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '4px' },
    emptyCanvasTitle: { fontSize: '20px', fontWeight: '600', color: '#202223', margin: '16px 0 8px 0' },
    emptyCanvasSub: { fontSize: '14px', color: '#5c5f62', margin: '0 0 24px 0' },
    emptyGraphic: { width: 140, height: 110, backgroundColor: '#ffffff', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e4e5e7' },

    previewPlaceholder: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
    previewOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' },
    previewIframe: { width: '100%', height: '100%', border: 'none', transition: 'opacity 0.2s', backgroundColor: '#fff', borderRadius: '4px' },

    // Right Sidebar (Properties/Settings)
    rightSidebar: {
        width: '300px', backgroundColor: '#ffffff', borderLeft: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5
    },
    rightEmptyState: { padding: '24px', display: 'flex', flexDirection: 'column' },
    rightEmptyIcon: { width: 44, height: 44, border: '2px solid #202223', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    rightEmptyTitle: { fontSize: '16px', fontWeight: '600', color: '#202223', margin: '0 0 12px 0' },
    rightEmptyText: { fontSize: '13px', color: '#5c5f62', lineHeight: '1.5', margin: '0 0 16px 0' },
    shortcutsBlock: { marginTop: '32px', borderTop: '1px solid #e4e5e7', paddingTop: '24px' },
    shortcutsTitle: { fontSize: '14px', fontWeight: '600', color: '#202223', margin: '0 0 16px 0' },
    shortcutRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', color: '#5c5f62', fontWeight: 500 },

    settingsScroll: { flex: 1, overflowY: 'auto', padding: '0' },
    settingBlock: { padding: '24px 20px', borderBottom: '1px solid #f4f6f8' },
    settingLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#202223', marginBottom: '8px' },
    settingsList: { display: 'flex', flexDirection: 'column', gap: '0' },
    placementRow: { display: 'flex', width: '100%', borderRadius: '4px' },

    // Setting rows padding resets
    colorSwatch: { width: 36, height: 36, padding: 0, border: '1px solid #c4cdd5', borderRadius: 6, cursor: 'pointer', overflow: 'hidden' },
    colorCode: { fontSize: 13, color: '#202223', fontFamily: 'monospace', flex: 1, background: '#f4f6f8', padding: '8px 12px', border: '1px solid #c4cdd5', borderRadius: 6 },
    rangeVal: { fontSize: 13, fontWeight: 500, color: '#202223', minWidth: 40, textAlign: 'right' },
    imageUploadBox: { border: '1px dashed #c4cdd5', borderRadius: 8, background: '#f9fafb', padding: 8, textAlign: 'center' },
    imageUploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', color: '#5c5f62', fontSize: 13, fontWeight: 500 },
    imagePreviewWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 4, overflow: 'hidden', background: '#fff', border: '1px solid #e1e3e5' },
    imagePreview: { width: '100%', height: '100%', objectFit: 'contain' }
};

const CSS = \`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  body {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f4f6f8;
      color: #202223;
  }
  *, *::before, *::after { box-sizing: border-box; }

  kbd { background-color: #f4f6f8; border: 1px solid #e4e5e7; border-radius: 4px; padding: 2px 6px; box-shadow: 0 1px 1px rgba(0,0,0,0.05); font-family: inherit; font-size: 11px; font-weight: 500; color: #202223; }

  /* Utility Sidebar */
  .te-util-btn { width: 40px; height: 40px; border-radius: 6px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; color: #5c5f62; cursor: pointer; transition: 0.1s; }
  .te-util-btn:hover { background-color: #f4f6f8; color: #202223; }
  .te-util-btn.active { background-color: #eef2ff; color: #3662e3; }

  /* Outline List Sub-Hover Effects */
  .te-block-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 16px 6px 12px;
      margin: 1px 0;
      cursor: pointer;
      border-radius: 4px;
      color: #5c5f62;
      transition: background-color 0.15s ease, color 0.15s ease;
      user-select: none;
      font-size: 13px;
  }
  .te-block-row:hover {
      background-color: #f6f6f7;
      color: #202223;
  }
  .te-block-row.active {
      background-color: #eef2ff; 
      color: #3662e3;
      font-weight: 500;
  }
  .te-block-row.active .blockIcon, .te-block-row.active .dragHandle { color: #3662e3 !important; }

  .te-add-sec-link { background: none; border: none; outline: none; padding: 0; margin-top: 12px; font-size: 13px; font-weight: 500; color: #1a73e8; display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .te-add-sec-link:hover { text-decoration: underline; }

  .te-del-btn {
      background: none; border: none; padding: 4px; cursor: pointer;
      color: #8c9196; opacity: 0; border-radius: 3px; display: flex; align-items: center; justify-content: center;
  }
  .te-block-row:hover .te-del-btn { opacity: 1; }
  .te-del-btn:hover { background-color: #e4e5e7; color: #d82c0d; opacity: 1; }

  /* Category/Template List Items */
  .te-list-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px;
      width: 100%; text-align: left;
      background: none; border: none; cursor: pointer;
      color: #5c5f62;
      border-bottom: 1px solid #f4f6f8;
      transition: background-color 0.15s ease;
      font-family: inherit;
  }
  .te-list-item:hover {
      background-color: #f6f6f7;
      color: #202223;
  }

  /* Buttons */
  .te-text-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      color: #1a73e8; /* Classic blue for Add Section */
      font-size: 13px; font-weight: 500; width: 100%;
      padding: 8px 12px; border-radius: 4px;
      transition: background-color 0.15s ease;
      font-family: inherit;
  }
  .te-text-btn:hover { background-color: #f1f8fe; }

  .te-text-action { background: none; border: none; color: #202223; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; padding: 6px 8px; border-radius: 4px; }
  .te-text-action:hover { background-color: #f4f6f8; }

  .te-icon-back, .te-icon-btn {
      display: flex; justify-content: center; align-items: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer; color: #5c5f62;
      border-radius: 4px; padding: 0;
  }
  .te-icon-back:hover, .te-icon-btn:hover { background-color: #f4f6f8; color: #202223; }

  .te-dev-btn {
      display: flex; justify-content: center; align-items: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer; color: #8c9196;
      border-radius: 4px; transition: all 0.1s ease; margin: 0 1px;
  }
  .te-dev-btn:hover { color: #202223; background-color: #f4f6f8; }
  .te-dev-btn.active { color: #202223; background-color: #f4f6f8; }

  /* PageFly 'Publish' and 'Canvas' buttons */
  .te-publish-btn {
      background: #202223; color: white;
      border: none; padding: 5px 16px; border-radius: 40px;
      font-weight: 500; font-size: 12px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      font-family: inherit;
  }
  .te-publish-btn:hover:not(:disabled) { background: #000000; }
  .te-publish-btn:disabled { background: #e4e5e7; color: #8c9196; cursor: not-allowed; }

  .te-close-btn { background: none; border: none; cursor: pointer; color: #8c9196; padding: 4px; display: flex; }
  .te-close-btn:hover { color: #202223; }

  .te-canvas-btn { background: #ffffff; border: 1px solid #c9cccf; padding: 8px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; color: #202223; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
  .te-canvas-btn:hover { background: #f4f6f8; }

  .te-canvas-btn-dark { background: #202223; border: 1px solid #202223; padding: 8px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
  .te-canvas-btn-dark:hover { background: #000000; }

  /* Settings Inputs */
  .te-input, .te-select {
      width: 100%; box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #c9cccf; border-radius: 4px;
      font-size: 13px; color: #202223; font-family: inherit;
      background: #ffffff;
      outline: none; transition: border-color 0.2s ease;
  }
  .te-input:focus, .te-select:focus { border-color: #1a73e8; box-shadow: 0 0 0 1px #1a73e8; }
  
  .te-place-btn {
      flex: 1; padding: 8px 0; border: 1px solid #c9cccf; background: #fff;
      cursor: pointer; font-size: 13px; transition: all 0.2s;
      color: #5c5f62; font-family: inherit;
  }
  .te-place-btn:first-child { border-radius: 4px 0 0 4px; border-right: none; }
  .te-place-btn:last-child { border-radius: 0 4px 4px 0; border-left: none; }
  .te-place-btn.active { background: #f4f6f8; color: #202223; font-weight: 500; z-index: 1; border: 1px solid #c9cccf;}

  /* Scrollbars - refined minimal look */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d2d5d8; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #aeb4b9; }

  .te-spinner {
      width: 20px; height: 20px;
      border: 2px solid #e4e5e7; border-top-color: #202223;
      border-radius: 50%;
      animation: te-spin 0.8s linear infinite;
  }
  @keyframes te-spin { to { transform: rotate(360deg); } }
\`;
`;
content = content.replace(/const S = \{[\s\S]+?@keyframes te-spin \{ to \{ transform: rotate\(360deg\); \} \}\n\`;/m, NEW_STYLES);

fs.writeFileSync(file, content);
console.log("SUCCESS");
