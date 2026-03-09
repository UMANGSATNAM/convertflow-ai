const fs = require('fs');
const file = 'app/routes/app.theme-editor.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const startIdx = content.indexOf('const S = {');
if (startIdx === -1) {
  console.error("FAIL: Could not find const S = { block!");
  process.exit(1);
}

const NEW_CSS_AND_STYLES = `const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f4f6f8', fontFamily: "'Inter', sans-serif" },
    
    // Topbar (PageFly header)
    topbar: {
        height: '56px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #e4e5e7', flexShrink: 0, zIndex: 10
    },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    brandIcon: { width: '24px', height: '24px', backgroundColor: '#1a73e8', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
    topbarTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' },
    topbarPageName: { fontSize: '14px', fontWeight: '500', color: '#202223' },
    statusPill: { fontSize: '11px', backgroundColor: '#f4f6f8', color: '#5c5f62', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' },
    
    topbarCenter: { display: 'flex', alignItems: 'center', gap: '16px' },
    deviceToggle: { display: 'flex', gap: '4px', backgroundColor: '#f4f6f8', padding: '4px', borderRadius: '6px' },
    
    topbarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    savingDot: { fontSize: '13px', color: '#5c5f62' },
    toastBadge: { fontSize: '13px', padding: '4px 8px', borderRadius: '4px' },

    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },

    // Left Sidebar (Page Content / Context)
    leftSidebar: {
        width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5
    },
    panelInner: { display: 'flex', flexDirection: 'column', height: '100%' },
    panelHeader: {
        padding: '16px', borderBottom: '1px solid #e4e5e7',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    panelTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
    panelTitle: { fontSize: '14px', fontWeight: '600', color: '#202223', margin: 0 },
    
    outlineList: { flex: 1, overflowY: 'auto', padding: '16px 8px' },
    emptyHint: { padding: '20px', textAlign: 'center', color: '#8c9196', fontSize: '13px', margin: 0 },
    
    // Aesthetic structural row markers
    contextBlock: { padding: '8px', marginBottom: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #e4e5e7' },
    contextHeader: { fontSize: '11px', textTransform: 'uppercase', color: '#8c9196', fontWeight: '600', marginBottom: '8px', paddingLeft: '4px' },
    
    blockRowLeft: { display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' },
    dragHandle: { color: '#c9cccf', display: 'flex' }, // Now repurposed for Chevron
    blockIcon: { color: '#5c5f62', display: 'flex' },
    blockLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' },

    addSectionArea: { padding: '16px', borderTop: '1px solid #e4e5e7', display: 'flex', justifyContent: 'center', background: '#fff' },
    
    scrollArea: { flex: 1, overflowY: 'auto' },
    listIcon: { color: '#5c5f62', display: 'flex' },
    listText: { fontSize: '13px', fontWeight: '500' },

    // Center Canvas (Preview iframe)
    canvas: {
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', backgroundColor: '#f4f6f8', overflow: 'hidden', padding: '0'
    },
    canvasHeader: { width: '100%', padding: '12px 24px', display: 'flex', justifyContent: 'center', color: '#8c9196', fontSize: '12px' },
    previewFrame: {
        flex: 1, width: '100%', maxWidth: '100%', height: '100%', 
        backgroundColor: '#fff', position: 'relative', transition: 'width 0.3s ease, max-width 0.3s ease',
        boxShadow: '0 0 0 1px #e4e5e7', // Gives the iframe a crisp edge against the gray canvas
    },
    previewPlaceholder: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
    previewPlaceholderText: { marginTop: '16px', color: '#8c9196', fontSize: '13px' },
    previewOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' },
    previewIframe: { width: '100%', height: '100%', border: 'none', transition: 'opacity 0.2s', backgroundColor: '#fff' },

    // Right Sidebar (Properties/Settings)
    rightSidebar: {
        width: '320px', backgroundColor: '#ffffff', borderLeft: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5,
        boxShadow: '-4px 0 16px rgba(0,0,0,0.03)'
    },
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
      background-color: #e3f1df; /* Very subtle PageFly active tint */
      color: #202223;
      font-weight: 500;
  }

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

  .te-icon-back, .te-icon-btn {
      display: flex; justify-content: center; align-items: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer; color: #5c5f62;
      border-radius: 4px; padding: 0;
  }
  .te-icon-back:hover, .te-icon-btn:hover { background-color: #f4f6f8; color: #202223; }

  .te-dev-btn {
      display: flex; justify-content: center; align-items: center;
      width: 32px; height: 32px;
      background: none; border: none; cursor: pointer; color: #8c9196;
      border-radius: 4px; transition: all 0.1s ease;
  }
  .te-dev-btn:hover { color: #202223; background-color: #e4e5e7; }
  .te-dev-btn.active { color: #202223; background-color: #e4e5e7; }

  /* PageFly 'Publish' primary style */
  .te-save-btn {
      background: #202223; color: white;
      border: none; padding: 6px 16px; border-radius: 4px;
      font-weight: 500; font-size: 13px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      font-family: inherit;
  }
  .te-save-btn:hover:not(:disabled) { background: #000000; }
  .te-save-btn:disabled { background: #e4e5e7; color: #8c9196; cursor: not-allowed; }

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
  
  .te-color-pick {
      width: 36px; height: 36px; padding: 0; border: 1px solid #c9cccf;
      border-radius: 4px; cursor: pointer; outline: none;
  }
  .te-color-pick::-webkit-color-swatch-wrapper { padding: 0; }
  .te-color-pick::-webkit-color-swatch { border: none; border-radius: 3px; }

  .te-check-row {
      display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;
  }
  .te-checkbox {
      width: 16px; height: 16px; border: 1px solid #c9cccf; border-radius: 3px;
      accent-color: #1a73e8; cursor: pointer;
  }

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

  .te-img-del-btn {
      position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
      background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
  }

  .te-spinner {
      width: 20px; height: 20px;
      border: 2px solid #e4e5e7; border-top-color: #202223;
      border-radius: 50%;
      animation: te-spin 0.8s linear infinite;
  }
  @keyframes te-spin { to { transform: rotate(360deg); } }
\`;
`;

const patched = content.substring(0, startIdx) + NEW_CSS_AND_STYLES;
fs.writeFileSync(file, patched);
console.log("SUCCESS");
