const fs = require('fs');
const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const newReturn = `    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* ── TOP NAV BAR (Reverted to Shopify App Nav standard) ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-back-btn" onClick={() => navigate('/app')} title="Exit Editor">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </button>
                    <span style={S.topbarPageName}>Home page</span>
                </div>

                <div style={S.topbarCenter}>
                    <div style={S.deviceToggle}>
                        <button className={"te-dev-btn" + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')}><Monitor size={16} strokeWidth={2.5} /></button>
                        <button className={"te-dev-btn" + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')}><Smartphone size={16} strokeWidth={2.5} /></button>
                    </div>
                </div>

                <div style={S.topbarRight}>
                    {toast && (
                        <span style={{ ...S.toastBadge, background: toast.ok ? '#d1fae5' : '#fee2e2', color: toast.ok ? '#065f46' : '#991b1b' }}>
                            {toast.msg}
                        </span>
                    )}
                    {isBusy && <span style={S.savingDot}>Saving...</span>}
                    <button
                        className="te-save-btn"
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                    >
                        Save
                    </button>
                </div>
            </header>

            <div style={S.workspace}>
                {/* ── LEFT SIDEBAR (Outline/Templates) ── */}
                <aside style={S.leftSidebar}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Sections</span>
                            </div>

                            <div style={S.outlineList}>
                                {pageBlocks.length === 0 && (
                                    <p style={S.emptyHint}>No sections yet.</p>
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
                                                    <Grid size={13} strokeWidth={2.5}/>
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={S.addSectionArea}>
                                <button className="te-text-btn" onClick={() => setLeftView('categories')}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add section
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STATE 1: CATEGORIES */}
                    {leftView === 'categories' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('outline')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>Add section</span>
                            </div>
                            <div style={S.scrollArea}>
                                {cfCats.map(cat => (
                                    <button key={cat.id} className="te-list-item" onClick={() => handleSelectCategory(cat.id)}>
                                        <span style={S.listIcon}>{CAT_SVG[cat.id] || CAT_SVG.default}</span>
                                        <span style={S.listText}>{cat.name}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
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
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</span>
                            </div>
                            <div style={S.scrollArea}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    return (
                                        <button key={id} className="te-list-item" onClick={() => handleSelectTemplate(id)}>
                                            <span style={S.listIcon}>{CAT_SVG.default}</span>
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
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && (
                             <div style={S.previewPlaceholder}>
                                 <div className="te-spinner" />
                                 <p style={{marginTop: 12, color: '#6d7175', fontSize: 13}}>Loading original theme...</p>
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
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>
                                    {templateSchema.name || (activeBlockId ? 'Edit Section' : 'Customize Section')}
                                </span>
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
                                    <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading settings...</div>
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
}`;

const startIdx = content.indexOf('    return (\n        <div style={S.root}>');
const endIdx = content.indexOf('// ─── SETTING ROW');

if (startIdx === -1 || endIdx === -1) {
    console.error("FAIL: Could not find markers!");
    process.exit(1);
}

const replaceReturn = content.substring(0, startIdx) + newReturn + '\n\n' + content.substring(endIdx);
fs.writeFileSync(file, replaceReturn);
console.log("SUCCESS!");
