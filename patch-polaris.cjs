const fs = require('fs');

const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

console.log("Original content length:", content.length);

// 1. imports
content = content.replace(
    `import { json } from "@remix-run/node";`,
    `import { json } from "@remix-run/node";\nimport { BlockStack, InlineStack, Box, Text, Button, TextField, Select, Checkbox, RangeSlider, Badge, Icon, Divider, Tooltip } from "@shopify/polaris";`
);

let iconLineMatch = content.match(/import \{ ([^}]+) \} from "lucide-react";/);
if (iconLineMatch) {
    let icons = iconLineMatch[1].split(',').map(s => s.trim());
    for (const icon of ['Settings', 'ArrowLeft', 'Eye', 'LayoutTemplate']) {
        if (!icons.includes(icon)) icons.push(icon);
    }
    content = content.replace(iconLineMatch[0], `import { ${icons.join(', ')} } from "lucide-react";`);
} else {
    console.log("Failed to match lucide-react");
}

// 2. We extract the three parts: Start to SettingsRow, SettingsRow, and the rest.
let themeEditorReturnIdx = content.indexOf('    return (\n        <div style={S.root}>');
let settingRowIdx = content.indexOf('// ─── SETTING ROW ');
let themeEditorEndIdx = settingRowIdx - 2; // the }\n before it

if (themeEditorReturnIdx === -1 || settingRowIdx === -1) {
    console.log("Could not find boundaries");
    process.exit(1);
}

const NEW_RETURN = `    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* ── TOP NAV BAR (Polaris Header) ── */}
            <header style={S.topbar}>
                <InlineStack blockAlign="center" gap="400">
                    <Button variant="tertiary" icon={<ArrowLeft size={20} />} onClick={() => navigate('/app')} accessibilityLabel="Exit Editor" />
                    <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingMd" as="h1">Home page</Text>
                        <Badge tone="info">Unpublished</Badge>
                    </InlineStack>
                </InlineStack>

                <InlineStack blockAlign="center" gap="400">
                    <Box background="bg-surface-secondary" padding="100" borderRadius="200">
                        <InlineStack gap="100">
                            <Button variant={device === 'desktop' ? 'secondary' : 'tertiary'} icon={<Monitor size={18} />} onClick={() => setDevice('desktop')} />
                            <Button variant={device === 'mobile' ? 'secondary' : 'tertiary'} icon={<Smartphone size={18} />} onClick={() => setDevice('mobile')} />
                        </InlineStack>
                    </Box>
                </InlineStack>

                <InlineStack blockAlign="center" gap="300">
                    {toast && (
                        <Badge tone={toast.ok ? 'success' : 'critical'} icon={<Check size={14}/>}>
                            {toast.msg}
                        </Badge>
                    )}
                    {isBusy && <Text as="span" tone="subdued" variant="bodySm">Building preview component tree...</Text>}
                    <Button
                        variant="primary"
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                        loading={isBusy}
                    >
                        Publish
                    </Button>
                </InlineStack>
            </header>

            <div style={S.workspace}>
                {/* ── LEFT SIDEBAR (Polaris BlockStack) ── */}
                <aside style={S.sidebarLeft}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <Box style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
                                <Text variant="headingMd" as="h2">Page content</Text>
                            </Box>

                            <div style={S.scrollArea}>
                                {pageBlocks.length === 0 && (
                                    <Box padding="800" paddingBlockStart="1200">
                                        <BlockStack gap="200" align="center" inlineAlign="center">
                                            <LayoutTemplate size={32} color="var(--p-color-icon-subdued)" />
                                            <Text tone="subdued" variant="bodyMd" alignment="center">No sections exist in this template. Your canvas is a blank slate.</Text>
                                        </BlockStack>
                                    </Box>
                                )}
                                {pageBlocks.map((block) => {
                                    const isActive = block.id === activeBlockId;
                                    const label = block.isCf ? (SECTION_FILES[block.type]?.name || block.type) : block.type;
                                    return (
                                        <div
                                            key={block.id}
                                            className={"p-te-row" + (isActive ? ' active' : '')}
                                            style={S.sectionRow}
                                            onClick={() => {
                                                if (block.isCf) {
                                                    setActiveBlockId(block.id);
                                                    setSelectedTemplateId(null);
                                                }
                                            }}
                                        >
                                            <Box color="text-subdued" style={{display: 'flex', flexGrow: 0}}>
                                                <ChevronRight size={16} strokeWidth={2.5} />
                                            </Box>
                                            <Box color="text-subdued" style={{display: 'flex', flexGrow: 0}}>
                                                {block.isCf ? <Palette size={16} /> : <Layout size={16} />}
                                            </Box>
                                            <Box style={{flex: 1, minWidth: 0}}>
                                                <Text as="span" variant="bodyMd" fontWeight={isActive ? "bold" : "regular"} truncate>{label}</Text>
                                            </Box>
                                            {block.isCf && (
                                                <button
                                                    className="del-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(block.id); }}
                                                    title="Remove section"
                                                >
                                                    <X size={16} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                <Box padding="400" paddingBlockStart="800">
                                    <Divider />
                                    <Box paddingBlockStart="400">
                                        <Button variant="plain" icon={<Zap size={16}/>} onClick={() => setLeftView('categories')}>
                                            Add convertflow-ai section
                                        </Button>
                                    </Box>
                                </Box>
                            </div>
                        </Box>
                    )}

                    {/* STATE 1: CATEGORIES */}
                    {leftView === 'categories' && (
                        <Box style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
                                <InlineStack blockAlign="center" gap="300">
                                    <Button variant="tertiary" icon={<ArrowLeft size={20}/>} onClick={() => setLeftView('outline')} />
                                    <Text variant="headingMd" as="h2">Add section</Text>
                                </InlineStack>
                            </Box>
                            <div style={{...S.scrollArea, padding: 0}}>
                                {cfCats.map(cat => (
                                    <div key={cat.id} className="p-te-cat" style={S.categoryRow} onClick={() => handleSelectCategory(cat.id)}>
                                        <Box color="text-subdued" style={{display: 'flex'}}>{CAT_SVG[cat.id] || <Layout size={18} />}</Box>
                                        <Box style={{flex: 1}}><Text as="span" variant="bodyMd" fontWeight="medium">{cat.name}</Text></Box>
                                        <Box color="text-subdued" style={{display: 'flex'}}><ChevronRight size={16} /></Box>
                                    </div>
                                ))}
                            </div>
                        </Box>
                    )}

                    {/* STATE 2: TEMPLATES */}
                    {leftView === 'templates' && (
                        <Box style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
                                <InlineStack blockAlign="center" gap="300">
                                    <Button variant="tertiary" icon={<ArrowLeft size={20}/>} onClick={() => setLeftView('categories')} />
                                    <Text variant="headingMd" as="h2">{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</Text>
                                </InlineStack>
                            </Box>
                            <div style={{...S.scrollArea, padding: 0}}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    return (
                                        <div key={id} className="p-te-cat" style={S.categoryRow} onClick={() => handleSelectTemplate(id)}>
                                            <Box color="text-subdued" style={{display: 'flex'}}><Palette size={18} /></Box>
                                            <Box style={{flex: 1}}><Text as="span" variant="bodyMd" fontWeight="medium">{meta?.name || id}</Text></Box>
                                        </div>
                                    );
                                })}
                            </div>
                        </Box>
                    )}
                </aside>

                {/* ── CENTER CANVAS (Persistent Full Preview) ── */}
                <main style={S.canvas}>
                    <Box padding="300" width="100%">
                        <Text as="p" tone="subdued" variant="bodySm" alignment="center">
                            {device === 'desktop' ? 'Desktop View (1440px)' : 'Mobile View (375px)'}
                        </Text>
                    </Box>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && (
                            <Box style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--p-color-bg-surface)', zIndex: 5}}>
                                <div className="te-spinner" />
                                <Box paddingBlockStart="400">
                                    <Text tone="subdued" variant="bodyMd">Loading canvas engine...</Text>
                                </Box>
                            </Box>
                        )}
                        {previewLoading && (
                            <Box style={{position: 'absolute', inset: 0, backgroundColor: 'var(--p-color-bg-surface-transparent)', backdropFilter: 'blur(1px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <div className="te-spinner" />
                            </Box>
                        )}
                        {previewHtml && (
                            <iframe
                                srcDoc={previewHtml}
                                style={{ width: '100%', height: '100%', border: 'none', transition: 'opacity 0.2s', backgroundColor: '#fff', opacity: previewLoading ? 0.5 : 1 }}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                title="Live Preview"
                            />
                        )}
                    </div>
                </main>

                {/* ── RIGHT SETTINGS PANEL (Polaris Schema Auto-Render) ── */}
                {(selectedTemplateId || activeBlockId) && (
                    <aside style={S.sidebarRight}>
                        <Box style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
                                <InlineStack blockAlign="center" align="space-between">
                                    <Text variant="headingMd" as="h2">
                                        {templateSchema.name || (activeBlockId ? 'Edit Section' : 'Customize Section')}
                                    </Text>
                                    <Button variant="tertiary" icon={<X size={20}/>} onClick={() => {
                                        if (activeBlockId) {
                                            setActiveBlockId(null);
                                            setSettings({});
                                        } else {
                                            setSelectedTemplateId(null);
                                            setSettings({});
                                        }
                                    }} />
                                </InlineStack>
                            </Box>

                            <div style={S.scrollArea}>
                                {!activeBlockId && (
                                    <Box paddingBlockEnd="600" borderBottomWidth="025" borderColor="border-subdued">
                                        <BlockStack gap="200">
                                            <Text variant="bodyMd" fontWeight="medium">Inject Position</Text>
                                            <Select
                                                label=""
                                                labelHidden
                                                options={[
                                                    {label: 'Append below Header (Top)', value: 'top'},
                                                    {label: 'Append above Footer (Bottom)', value: 'bottom'}
                                                ]}
                                                value={placement}
                                                onChange={setPlacement}
                                            />
                                        </BlockStack>
                                    </Box>
                                )}

                                <Box paddingBlockStart={!activeBlockId ? "600" : "0"}>
                                    {templateSchema.settings.length === 0 ? (
                                        <Box padding="800">
                                            <Text tone="subdued" variant="bodyMd" alignment="center">Loading schema parameters...</Text>
                                        </Box>
                                    ) : (
                                        <BlockStack gap="400" align="start">
                                            {templateSchema.settings.map(s => (
                                                <SettingRow
                                                    key={s.id}
                                                    setting={s}
                                                    value={settings[s.id]}
                                                    onChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))}
                                                />
                                            ))}
                                        </BlockStack>
                                    )}
                                </Box>
                            </div>
                        </Box>
                    </aside>
                )}
            </div>
        </div>
    );
}`;

content = content.substring(0, themeEditorReturnIdx) + NEW_RETURN + "\n" + content.substring(themeEditorEndIdx);

// Now SettingRow
let settingRowStart = content.indexOf('// ─── SETTING ROW ');
let nextSectionIdx = content.indexOf('// ─── SVG ICONS (PREMIUM)');

const NEW_SETTING_ROW = `// ─── SETTING ROW ─────────────────────────────────────────────────────────────
function SettingRow({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { onChange(setting.id, reader.result); };
        reader.readAsDataURL(file);
    };

    return (
        <Box paddingBlockEnd="400">
            {setting.type === 'color' && (
                <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="medium">{setting.label || setting.id}</Text>
                    <InlineStack gap="200" align="start" blockAlign="center">
                        <input type="color" value={v || '#000000'} onChange={e => onChange(setting.id, e.target.value)} style={{width: 32, height: 32, padding: 0, border: '1px solid var(--p-color-border-subdued)', borderRadius: 4, cursor: 'pointer', outline: 'none'}} />
                        <Box background="bg-surface-secondary" padding="150" borderRadius="200" borderColor="border-subdued" borderWidth="025">
                            <Text as="span" variant="bodyMd" fontWeight="medium">{v || '#000000'}</Text>
                        </Box>
                    </InlineStack>
                </BlockStack>
            )}
            {setting.type === 'text' && (
                <TextField label={setting.label || setting.id} value={v} onChange={val => onChange(setting.id, val)} autoComplete="off" />
            )}
            {setting.type === 'textarea' && (
                <TextField label={setting.label || setting.id} value={v} onChange={val => onChange(setting.id, val)} multiline={4} autoComplete="off" />
            )}
            {setting.type === 'image_picker' && (
                <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="medium">{setting.label || setting.id}</Text>
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200" borderColor="border-subdued" borderWidth="025" borderStyle="dashed">
                        {v ? (
                            <BlockStack gap="200" align="center">
                                <img src={v} alt="Preview" style={{maxWidth: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 4}} />
                                <Button variant="plain" tone="critical" onClick={() => onChange(setting.id, '')}>Remove image</Button>
                            </BlockStack>
                        ) : (
                            <label style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                <ImageIcon size={20} color="var(--p-color-icon-subdued)" />
                                <Text as="span" variant="bodyMd" tone="subdued">Upload Image</Text>
                            </label>
                        )}
                    </Box>
                </BlockStack>
            )}
            {setting.type === 'range' && (
                 <RangeSlider label={setting.label || setting.id} min={setting.min} max={setting.max} step={setting.step || 1} value={v} onChange={val => onChange(setting.id, val)} output suffix={<Text variant="bodyMd" fontWeight="medium">{setting.unit}</Text>} />
            )}
            {setting.type === 'checkbox' && (
                <Checkbox label={setting.label || setting.id} checked={Boolean(v)} onChange={val => onChange(setting.id, val)} />
            )}
            {setting.type === 'select' && (
                <Select label={setting.label || setting.id} options={setting.options || []} value={v} onChange={val => onChange(setting.id, val)} />
            )}
        </Box>
    );
}
`;

content = content.substring(0, settingRowStart) + NEW_SETTING_ROW + "\n" + content.substring(nextSectionIdx);


// 3. Styles replacing
let styleStartIdx = content.indexOf('const S = {');
let cssEndIdx = content.indexOf('`;', content.indexOf('const CSS = `'));

const NEW_STYLES = `const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--p-color-bg-surface-secondary)', fontFamily: 'var(--p-font-family-sans)' },
    topbar: { height: '56px', backgroundColor: 'var(--p-color-bg-surface)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--p-color-border-subdued)', flexShrink: 0, zIndex: 10 },
    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebarLeft: { width: 300, backgroundColor: 'var(--p-color-bg-surface)', borderRight: '1px solid var(--p-color-border-subdued)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5 },
    sidebarRight: { width: 340, backgroundColor: 'var(--p-color-bg-surface)', borderLeft: '1px solid var(--p-color-border-subdued)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5, boxShadow: 'var(--p-shadow-300)' },
    canvas: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', backgroundColor: 'var(--p-color-bg-surface-secondary)', overflow: 'hidden' },
    previewFrame: { flex: 1, width: '100%', maxWidth: '100%', backgroundColor: '#fff', position: 'relative', transition: 'width 0.3s ease', outline: '1px solid var(--p-color-border-subdued)' },
    sectionRow: { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderRadius: 6, margin: '2px 8px', transition: 'background-color 0.1s' },
    scrollArea: { flex: 1, overflowY: 'auto' },
    categoryRow: { padding: '12px 16px', borderBottom: '1px solid var(--p-color-border-subdued)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background-color 0.1s' }
};

const CSS = \`
  .p-te-row:hover { background: var(--p-color-bg-surface-secondary-hover); }
  .p-te-row.active { background: var(--p-color-bg-fill-magic-secondary); }
  .p-te-row .del-btn { opacity: 0; transition: opacity 0.1s; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; border: none; background: transparent; cursor: pointer; color: var(--p-color-icon-subdued); }
  .p-te-row:hover .del-btn, .p-te-row.active .del-btn { opacity: 1; }
  .p-te-row .del-btn:hover { background: var(--p-color-bg-surface-critical); color: var(--p-color-text-critical); }
  .p-te-cat:hover { background: var(--p-color-bg-surface-secondary-hover); }
  
  .te-spinner { width: 24px; height: 24px; border: 2px solid var(--p-color-border-subdued); border-top-color: var(--p-color-icon-magic); border-radius: 50%; animation: p-spin 0.8s linear infinite; }
  @keyframes p-spin { to { transform: rotate(360deg); } }
  
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--p-color-border-subdued); border-radius: 6px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--p-color-border-hover); }
\`;`;

content = content.substring(0, styleStartIdx) + NEW_STYLES + content.substring(cssEndIdx + 2);

fs.writeFileSync(file, content);
console.log("SUCCESS NEW LENGTH:", content.length);
