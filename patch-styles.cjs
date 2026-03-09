const fs = require('fs');
const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8');

const newStyles = `
const SVG_ICONS = {
    layout: <Layout size={20} strokeWidth={1.5} />,
    announcement: <Megaphone size={20} strokeWidth={1.5} />,
    image: <ImageIcon size={20} strokeWidth={1.5} />,
    shoppingBag: <ShoppingBag size={20} strokeWidth={1.5} />,
    grid: <Grid size={20} strokeWidth={1.5} />,
    message: <MessageSquare size={20} strokeWidth={1.5} />,
    award: <Award size={20} strokeWidth={1.5} />,
    type: <Type size={20} strokeWidth={1.5} />,
    mail: <Mail size={20} strokeWidth={1.5} />,
    camera: <Camera size={20} strokeWidth={1.5} />,
    play: <Play size={20} strokeWidth={1.5} />,
    help: <HelpCircle size={20} strokeWidth={1.5} />,
    zap: <Zap size={20} strokeWidth={1.5} />,
    default: <Layout size={20} strokeWidth={1.5} />
};

const CAT_SVG = {
    header: SVG_ICONS.layout,
    announcement: SVG_ICONS.announcement,
    hero: SVG_ICONS.image,
    product: SVG_ICONS.shoppingBag,
    collection: SVG_ICONS.grid,
    testimonial: SVG_ICONS.message,
    brand: SVG_ICONS.award,
    content: SVG_ICONS.type,
    newsletter: SVG_ICONS.mail,
    social: SVG_ICONS.camera,
    video: SVG_ICONS.play,
    faq: SVG_ICONS.help,
    banner: SVG_ICONS.zap,
    footer: SVG_ICONS.layout,
    default: SVG_ICONS.default
};

const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f4f6f8', fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },

    // ── TOP NAV BAR ──
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: '#fff', borderBottom: '1px solid #dfe3e8', flexShrink: 0, zIndex: 10 },
    topbarLeft: { display: 'flex', alignItems: 'center', width: 200, gap: 16 },
    deviceToggle: { display: 'flex', background: '#f4f6f8', borderRadius: 6, padding: 4 },
    topbarCenter: { flex: 1, display: 'flex', justifyContent: 'center' },
    topbarPageName: { fontSize: 14, fontWeight: 600, color: '#202223' },
    topbarRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, width: 200 },
    savingDot: { fontSize: 13, color: '#aaa' },
    toastBadge: { fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 6 },

    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },

    // ── LEFT SIDEBAR (Outline/Templates) ──
    leftSidebar: { width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid #dfe3e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 },
    
    // ── RIGHT SIDEBAR (Settings) ──
    rightSidebar: { width: 340, flexShrink: 0, background: '#fff', borderLeft: '1px solid #dfe3e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 },
    
    // ── SHARED PANEL STYLES ──
    panelInner: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    panelHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid #f4f6f8', flexShrink: 0 },
    panelTitle: { fontSize: 14, fontWeight: 600, color: '#202223', flex: 1 },
    
    outlineList: { flex: 1, overflowY: 'auto', padding: '16px 12px' },
    emptyHint: { fontSize: 13, color: '#6d7175', textAlign: 'center', padding: '32px 16px' },
    blockRowLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    dragHandle: { color: '#c4cdd5', cursor: 'grab', display: 'flex' },
    blockIcon: { color: '#8c9196', display: 'flex' },
    blockLabel: { fontSize: 13, color: '#202223', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    
    addSectionArea: { padding: '16px', borderTop: '1px solid #dfe3e8', background: '#fff', flexShrink: 0 },

    scrollArea: { flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
    listIcon: { width: 20, height: 20, color: '#8c9196', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    listText: { fontSize: 13, color: '#202223', fontWeight: 500 },

    settingsScroll: { flex: 1, overflowY: 'auto' },
    settingsList: { padding: '16px' },
    settingBlock: { marginBottom: 20 },
    settingLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#202223', marginBottom: 8 },
    placementRow: { display: 'flex', gap: 8, padding: '0 16px 16px' },
    colorSwatch: { width: 36, height: 36, padding: 0, border: '1px solid #c4cdd5', borderRadius: 6, cursor: 'pointer', overflow: 'hidden' },
    colorCode: { fontSize: 13, color: '#202223', fontFamily: 'monospace', flex: 1, background: '#f4f6f8', padding: '8px 12px', border: '1px solid #c4cdd5', borderRadius: 6 },
    rangeVal: { fontSize: 13, fontWeight: 500, color: '#202223', minWidth: 40, textAlign: 'right' },
    
    imageUploadBox: { border: '1px dashed #c4cdd5', borderRadius: 8, background: '#f9fafb', padding: 8, textAlign: 'center' },
    imageUploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', color: '#5c5f62', fontSize: 13, fontWeight: 500 },
    imagePreviewWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 4, overflow: 'hidden', background: '#fff', border: '1px solid #e1e3e5' },
    imagePreview: { width: '100%', height: '100%', objectFit: 'contain' },

    // ── CENTER CANVAS (Persistent) ──
    canvas: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', background: '#f4f6f8' },
    previewFrame: { background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.05)', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', position: 'relative' },
    previewPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 },
    previewOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    previewIframe: { width: '100%', height: '100%', border: 'none', display: 'block', transition: 'opacity 0.2s', flex: 1 },
};

const CSS = \`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; overflow: hidden; }

/* Buttons */
.te-back-btn {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid #dfe3e8;
  background: #fff; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #5c5f62; transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.te-back-btn:hover { background: #f9fafb; border-color: #c4cdd5; color: #202223; }

.te-icon-back {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #5c5f62; transition: all 0.15s; margin-left: -8px;
}
.te-icon-back:hover { background: rgba(0,0,0,0.05); color: #202223; }

.te-dev-btn {
  padding: 6px 12px; border: none; background: transparent; cursor: pointer;
  font-size: 14px; color: #8c9196; transition: all 0.1s; border-radius: 4px;
}
.te-dev-btn.active { background: #fff; color: #202223; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.te-save-btn {
  padding: 8px 16px; border-radius: 6px; border: none;
  background: #008060; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s; box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}
.te-save-btn:hover:not(:disabled) { background: #006e52; }
.te-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.te-text-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border: 1px solid #dfe3e8; border-radius: 6px; background: #fff;
  font-size: 13px; font-weight: 600; color: #202223; cursor: pointer; 
  transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.te-text-btn:hover { background: #f9fafb; border-color: #c4cdd5; }

/* Lists & Rows */
.te-block-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; cursor: pointer; transition: background 0.12s;
  border-radius: 6px; margin-bottom: 2px;
}
.te-block-row:hover { background: #f4f6f8; }
.te-block-row.active { background: #eef2ff; color: #2c6ecb; }
.te-block-row.active .te-del-btn { opacity: 1; }

.te-del-btn {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: transparent; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #8c9196; opacity: 0; transition: all 0.1s;
}
.te-block-row:hover .te-del-btn { opacity: 1; }
.te-del-btn:hover { background: #fee2e2; color: #d82c0d; }

.te-list-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border: 1px solid transparent; border-radius: 6px; background: transparent;
  cursor: pointer; transition: all 0.1s; text-align: left; width: 100%;
}
.te-list-item:hover { background: #f4f6f8; }

.te-place-btn {
  flex: 1; padding: 10px; border: 1px solid #c4cdd5; border-radius: 6px;
  background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; 
  color: #5c5f62; transition: all 0.15s;
}
.te-place-btn.active { border-color: #2c6ecb; background: #eef2ff; color: #2c6ecb; font-weight: 600; }

.te-input, .te-select {
  width: 100%; border: 1px solid #c4cdd5; border-radius: 6px;
  padding: 8px 12px; font-size: 13px; font-family: inherit; color: #202223;
  background: #fff; transition: border 0.15s; outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
}
.te-input:focus, .te-select:focus { border-color: #2c6ecb; box-shadow: 0 0 0 1px #2c6ecb; }

.te-img-del-btn {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.te-img-del-btn:hover { background: #d82c0d; }

.te-spinner {
  width: 24px; height: 24px; border: 2px solid #dfe3e8;
  border-top-color: #2c6ecb; border-radius: 50%;
  animation: te-spin 0.6s linear infinite;
}
@keyframes te-spin { to { transform: rotate(360deg); } }
\`;
`;

const replaceStyles = content.replace(/const SVG_ICONS = \{[\s\S]*/, newStyles);
fs.writeFileSync(file, replaceStyles);
console.log("Successfully patched styles for class 3-panel");
