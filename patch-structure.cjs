const fs = require('fs');
const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. Ensure ChevronRight and X icons are imported
// Replace the lucide-react import
const importRegex = /import \{([^\}]+)\} from "lucide-react";/;
const match = content.match(importRegex);
if (match) {
    let imports = match[1].split(',').map(s => s.trim());
    if (!imports.includes('ChevronRight')) imports.push('ChevronRight');
    if (!imports.includes('X')) imports.push('X');
    if (!imports.includes('Check')) imports.push('Check');
    content = content.replace(importRegex, \`import { \${imports.join(', ')} } from "lucide-react";\`);
}

// 2. Replace the Return statement
const newReturn = `    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* ── TOP NAV BAR (PageFly Style) ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-icon-back" onClick={() => navigate('/app')} title="Exit Editor">
                        <Home size={16} strokeWidth={2.5} />
                    </button>
                    <div style={S.topbarTitleGroup}>
                        <span style={S.topbarPageName}>Home page</span>
                        <span style={S.statusPill}>Unpublished</span>
                    </div>
                </div>

                <div style={S.topbarCenter}>
                    <div style={S.deviceToggle}>
                        <button className={"te-dev-btn" + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')}><Monitor size={16} strokeWidth={2.5} /></button>
                        <button className={"te-dev-btn" + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')}><Smartphone size={16} strokeWidth={2.5} /></button>
                    </div>
                </div>

                <div style={S.topbarRight}>
                    {toast && (
                        <span style={{ ...S.toastBadge, background: toast.ok ? '#e3f1df' : '#fee2e2', color: toast.ok ? '#065f46' : '#991b1b' }}>
                            <Check size={12} style={{ marginRight: 4, display: 'inline-block' }} /> {toast.msg}
                        </span>
                    )}
                    {isBusy && <span style={S.savingDot}>Saving...</span>}
                    <button
                        className="te-save-btn"
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                    >
                        Publish
                    </button>
                </div>
            </header>

            <div style={S.workspace}>
                {/* ── LEFT SIDEBAR (PageFly Outline) ── */}
                <aside style={S.leftSidebar}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Page content</span>
                                <button className="te-icon-btn"><X size={16} strokeWidth={2.5} /></button>
                            </div>

                            <div style={S.outlineList}>
                                {pageBlocks.length === 0 && (
                                    <p style={S.emptyHint}>No element selected</p>
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

                                <div style={{ padding: '8px 12px', marginTop: '4px' }}>
                                    <button className="te-text-btn" onClick={() => setLeftView('categories')}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Add section
                                    </button>
                                </div>

                                <div style={{ marginTop: 24 }}>
                                    <div style={S.contextHeader}>Header</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}><Layout size={14} color="#5c5f62" /><span style={{ fontSize: 13, color: '#5c5f62' }}>Theme header</span></div>
                                    </div>
                                    <div style={{ ...S.contextHeader, marginTop: 16 }}>Footer</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}><Layout size={14} color="#5c5f62" /><span style={{ fontSize: 13, color: '#5c5f62' }}>Theme footer</span></div>
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
                    <div style={{ ...S.canvasHeader, maxWidth: device === 'mobile' ? '400px' : '100%' }}>
                        {device === 'desktop' ? '1440px, 100%' : '375px, 100%'}
                    </div>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && (
                            <div style={S.previewPlaceholder}>
                                <div className="te-spinner" />
                                <p style={S.previewPlaceholderText}>Loading visual canvas...</p>
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

                {/* ── RIGHT SETTINGS PANEL (Conditional) ── */}
                {(selectedTemplateId || activeBlockId) && (
                    <aside style={S.rightSidebar}>
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
                    </aside>
                )}
            </div>
        </div>
    );
} `;

const startIdx = content.indexOf('    return (\n        <div style={S.root}>');
const endIdx = content.indexOf('// ─── SETTING ROW');

if (startIdx === -1 || endIdx === -1) {
    console.error("FAIL: Could not find markers!");
    process.exit(1);
}

const replaceReturn = content.substring(0, startIdx) + newReturn + '\n\n' + content.substring(endIdx);
fs.writeFileSync(file, replaceReturn);
console.log("SUCCESS!");
