import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   SettingRenderer — Premium Shopify-style setting controls
   
   Supports ALL Shopify setting types:
   - header, paragraph
   - text, url, textarea, html/liquid
   - number
   - checkbox (toggle switch)
   - select, text_alignment
   - range
   - color, color_background, color_scheme
   - image_picker
   - video_url
   - font_picker
   - collection, product, blog, page, article (resource pickers)
   - link_list
   - richtext (inline editor)
   ═══════════════════════════════════════════════════════════════ */

/* ── Shared Styles ─────────────────────────────────────────────── */
const rowStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
};

const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 7,
};

const inputBase = {
    width: '100%',
    height: 42,
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#1f2937',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
};

const focusStyle = {
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(79,70,229,0.12)',
};

const blurStyle = {
    borderColor: '#e5e7eb',
    boxShadow: 'none',
};

const infoStyle = { margin: '6px 0 0', fontSize: 11, color: '#9ca3af', lineHeight: 1.4 };

/* ── Popular Google Fonts ──────────────────────────────────────── */
const FONT_OPTIONS = [
    'Assistant', 'DM Sans', 'Inter', 'Lato', 'Montserrat', 'Nunito Sans',
    'Open Sans', 'Oswald', 'Outfit', 'Playfair Display', 'Poppins',
    'Raleway', 'Roboto', 'Source Sans 3', 'Work Sans',
];

/* ── Resource type labels ──────────────────────────────────────── */
const RESOURCE_LABELS = {
    collection: { label: 'Collection', icon: '📦', placeholder: 'Search collections…' },
    product:    { label: 'Product',    icon: '🛍️', placeholder: 'Search products…' },
    blog:       { label: 'Blog',       icon: '📝', placeholder: 'Search blogs…' },
    page:       { label: 'Page',       icon: '📄', placeholder: 'Search pages…' },
    article:    { label: 'Article',    icon: '📰', placeholder: 'Search articles…' },
};

/* ── Number Input with Stepper ─────────────────────────────────── */
function NumberStepper({ value, onChange, min, max, step = 1, unit }) {
    const v = Number(value) || 0;
    const canDec = min === undefined || v - step >= min;
    const canInc = max === undefined || v + step <= max;

    const btnStyle = (enabled) => ({
        width: 32, height: 32, border: 'none', borderRadius: 8,
        background: enabled ? '#f3f4f6' : '#fafafa',
        cursor: enabled ? 'pointer' : 'not-allowed',
        color: enabled ? '#374151' : '#d1d5db',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 600, transition: 'all 0.12s',
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '3px 4px', background: '#fff' }}>
            <button style={btnStyle(canDec)} onClick={() => canDec && onChange(v - step)} type="button">−</button>
            <input
                type="number"
                value={v}
                onChange={e => onChange(Number(e.target.value))}
                min={min} max={max} step={step}
                style={{ width: 56, height: 32, border: 'none', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1f2937', outline: 'none', fontFamily: 'inherit', background: 'transparent' }}
            />
            {unit && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{unit}</span>}
            <button style={btnStyle(canInc)} onClick={() => canInc && onChange(v + step)} type="button">+</button>
        </div>
    );
}

/* ── Rich Text Mini Editor ─────────────────────────────────────── */
function RichTextEditor({ value, onChange }) {
    const editorRef = useRef(null);
    const [focused, setFocused] = useState(false);

    // Sync content on initial load
    useEffect(() => {
        if (editorRef.current && !focused) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value, focused]);

    const exec = (cmd, val) => {
        document.execCommand(cmd, false, val);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const toolBtn = (icon, cmd, title) => (
        <button
            key={cmd}
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); exec(cmd); }}
            style={{
                width: 28, height: 28, border: 'none', borderRadius: 6,
                background: 'transparent', cursor: 'pointer', color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1f2937'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >{icon}</button>
    );

    return (
        <div style={{
            border: `1.5px solid ${focused ? '#4f46e5' : '#e5e7eb'}`,
            borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
            boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.12)' : 'none',
        }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 1, padding: '4px 6px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                {toolBtn('B', 'bold', 'Bold')}
                {toolBtn('I', 'italic', 'Italic')}
                {toolBtn('U', 'underline', 'Underline')}
                <div style={{ width: 1, background: '#e5e7eb', margin: '4px 3px' }} />
                {toolBtn('UL', 'insertUnorderedList', 'Bullet list')}
                {toolBtn('OL', 'insertOrderedList', 'Numbered list')}
                <div style={{ width: 1, background: '#e5e7eb', margin: '4px 3px' }} />
                {toolBtn('🔗', 'createLink', 'Insert link')}
            </div>
            {/* Editor area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    minHeight: 80, padding: '10px 12px', fontSize: 13, lineHeight: 1.6,
                    color: '#1f2937', outline: 'none', fontFamily: 'inherit',
                }}
            />
        </div>
    );
}

/* ── Resource Picker (collection, product, etc.) ───────────────── */
function ResourcePicker({ type, value, onChange }) {
    const cfg = RESOURCE_LABELS[type] || RESOURCE_LABELS.collection;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', background: '#fafafa' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {cfg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {value ? (
                    <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                        <button onClick={() => onChange('')} type="button" style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>Remove</button>
                    </>
                ) : (
                    <input
                        type="text"
                        placeholder={cfg.placeholder}
                        onBlur={e => { if (e.target.value) onChange(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { onChange(e.target.value); e.target.value = ''; } }}
                        style={{ ...inputBase, height: 30, border: 'none', background: 'transparent', padding: 0, fontSize: 12 }}
                    />
                )}
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
            </svg>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN SETTING RENDERER
   ═══════════════════════════════════════════════════════════════ */
export function SettingRenderer({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    switch (setting.type) {
        /* ── Layout / info ─────────────────────────────────────── */
        case 'header':
            return (
                <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.02em' }}>{setting.content || setting.label}</p>
                </div>
            );

        case 'paragraph':
            return (
                <div style={{ padding: '6px 16px 10px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{setting.content}</p>
                </div>
            );

        /* ── Text inputs ───────────────────────────────────────── */
        case 'text':
        case 'url':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <input
                        type="text"
                        value={v}
                        onChange={e => onChange(setting.id, e.target.value)}
                        placeholder={setting.placeholder || (setting.type === 'url' ? 'https://' : '')}
                        style={inputBase}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                    />
                    {setting.info && <p style={infoStyle}>{setting.info}</p>}
                </div>
            );

        case 'textarea':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <textarea
                        value={v}
                        onChange={e => onChange(setting.id, e.target.value)}
                        rows={3}
                        style={{ ...inputBase, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                    />
                </div>
            );

        /* ── Rich text ─────────────────────────────────────────── */
        case 'richtext':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <RichTextEditor value={v} onChange={(html) => onChange(setting.id, html)} />
                    {setting.info && <p style={infoStyle}>{setting.info}</p>}
                </div>
            );

        /* ── HTML / Liquid code ─────────────────────────────────── */
        case 'html':
        case 'liquid':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>
                        {setting.label || setting.id}
                        <span style={{ fontSize: 9, marginLeft: 6, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 3, fontWeight: 600, textTransform: 'uppercase' }}>{setting.type}</span>
                    </label>
                    <textarea
                        value={v}
                        onChange={e => onChange(setting.id, e.target.value)}
                        rows={5}
                        style={{
                            ...inputBase, height: 'auto', padding: '10px 12px', resize: 'vertical',
                            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                            fontSize: 12, lineHeight: 1.7, background: '#1e1e2e', color: '#cdd6f4',
                            borderColor: '#313244', borderRadius: 10,
                        }}
                        onFocus={e => { e.target.style.borderColor = '#89b4fa'; e.target.style.boxShadow = '0 0 0 3px rgba(137,180,250,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = '#313244'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>
            );

        /* ── Number ────────────────────────────────────────────── */
        case 'number':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <NumberStepper
                        value={v}
                        onChange={val => onChange(setting.id, val)}
                        min={setting.min}
                        max={setting.max}
                        step={setting.step || 1}
                        unit={setting.unit}
                    />
                    {setting.info && <p style={infoStyle}>{setting.info}</p>}
                </div>
            );

        /* ── Toggle switch ─────────────────────────────────────── */
        case 'checkbox':
            return (
                <div style={{ ...rowStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1f2937', cursor: 'pointer', userSelect: 'none' }} htmlFor={`chk-${setting.id}`}>
                        {setting.label || setting.id}
                    </label>
                    <label style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
                        <input
                            id={`chk-${setting.id}`}
                            type="checkbox"
                            checked={Boolean(v)}
                            onChange={e => onChange(setting.id, e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: 11,
                            background: Boolean(v) ? '#4f46e5' : '#e5e7eb',
                            transition: 'background 0.2s',
                        }} />
                        <div style={{
                            position: 'absolute', top: 3, left: Boolean(v) ? 21 : 3,
                            width: 16, height: 16, borderRadius: '50%', background: '#fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s',
                        }} />
                    </label>
                </div>
            );

        /* ── Select / Alignment ────────────────────────────────── */
        case 'select':
        case 'text_alignment':
        case 'color_scheme':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={v}
                            onChange={e => onChange(setting.id, e.target.value)}
                            style={{ ...inputBase, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        >
                            {(setting.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                        </svg>
                    </div>
                </div>
            );

        /* ── Range slider ──────────────────────────────────────── */
        case 'range':
            return (
                <div style={rowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>{setting.label || setting.id}</label>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
                            {Number(v)}{setting.unit || ''}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={setting.min || 0}
                        max={setting.max || 100}
                        step={setting.step || 1}
                        value={Number(v)}
                        onChange={e => onChange(setting.id, Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#4f46e5', cursor: 'pointer', height: 6 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#d1d5db' }}>{setting.min || 0}</span>
                        <span style={{ fontSize: 10, color: '#d1d5db' }}>{setting.max || 100}</span>
                    </div>
                </div>
            );

        /* ── Color picker ──────────────────────────────────────── */
        case 'color':
        case 'color_background':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#fafafa', cursor: 'pointer' }}>
                        <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, background: v || '#000', border: '2px solid rgba(0,0,0,0.08)', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                            <input
                                type="color"
                                value={v || '#000000'}
                                onChange={e => onChange(setting.id, e.target.value)}
                                style={{ position: 'absolute', inset: -6, width: '150%', height: '150%', cursor: 'pointer', border: 'none', padding: 0 }}
                            />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{(v || '#000000').toUpperCase()}</span>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#d1d5db" style={{ marginLeft: 'auto' }}><path d="M13.586 3.586a2 2 0 012.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </div>
                </div>
            );

        /* ── Image picker ──────────────────────────────────────── */
        case 'image_picker':
        case 'image':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    {v ? (
                        <div style={{ position: 'relative', border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#f9fafb' }}>
                            <img src={v} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button
                                onClick={() => onChange(setting.id, '')}
                                type="button"
                                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, background: 'rgba(255,255,255,0.95)', border: '1.5px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
                            </button>
                        </div>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #c7d2fe', borderRadius: 10, padding: '22px 12px', cursor: 'pointer', background: '#fafafa', gap: 8, transition: 'all 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#c7d2fe'; }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => onChange(setting.id, reader.result);
                                reader.readAsDataURL(file);
                            }} />
                            <div style={{ width: 40, height: 40, background: '#e0e7ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>Upload image</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPG up to 20MB</span>
                        </label>
                    )}
                </div>
            );

        /* ── Video URL ─────────────────────────────────────────── */
        case 'video_url':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        <input
                            type="url"
                            value={v}
                            onChange={e => onChange(setting.id, e.target.value)}
                            placeholder="YouTube or Vimeo URL…"
                            style={{ ...inputBase, paddingLeft: 36 }}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        />
                    </div>
                    {v && (v.includes('youtube') || v.includes('youtu.be') || v.includes('vimeo')) && (
                        <div style={{ marginTop: 8, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
                                {v.includes('youtube') || v.includes('youtu.be') ? 'YouTube' : 'Vimeo'} video detected
                            </span>
                        </div>
                    )}
                    {setting.info && <p style={infoStyle}>{setting.info}</p>}
                </div>
            );

        /* ── Font picker ───────────────────────────────────────── */
        case 'font_picker':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={v}
                            onChange={e => onChange(setting.id, e.target.value)}
                            style={{ ...inputBase, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontFamily: v || 'inherit' }}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        >
                            <option value="">System default</option>
                            {FONT_OPTIONS.map(f => (
                                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                            ))}
                        </select>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                        </svg>
                    </div>
                    {/* Font preview */}
                    {v && (
                        <div style={{ marginTop: 8, padding: '10px 14px', border: '1px solid #f3f4f6', borderRadius: 8, background: '#fafafa' }}>
                            <span style={{ fontFamily: v, fontSize: 18, color: '#374151', fontWeight: 500 }}>
                                The quick brown fox jumps
                            </span>
                        </div>
                    )}
                </div>
            );

        /* ── Resource pickers ──────────────────────────────────── */
        case 'collection':
        case 'product':
        case 'blog':
        case 'page':
        case 'article':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <ResourcePicker type={setting.type} value={v} onChange={val => onChange(setting.id, val)} />
                    {setting.info && <p style={infoStyle}>{setting.info}</p>}
                </div>
            );

        /* ── Link list / menu picker ───────────────────────────── */
        case 'link_list':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
                        </svg>
                        <select
                            value={v}
                            onChange={e => onChange(setting.id, e.target.value)}
                            style={{ ...inputBase, appearance: 'none', paddingLeft: 36, paddingRight: 36, cursor: 'pointer' }}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        >
                            <option value="">Select menu…</option>
                            <option value="main-menu">Main menu</option>
                            <option value="footer">Footer menu</option>
                        </select>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                        </svg>
                    </div>
                </div>
            );

        default:
            // Fallback: render as text input for unknown types
            if (setting.type && !['header', 'paragraph'].includes(setting.type)) {
                return (
                    <div style={rowStyle}>
                        <label style={labelStyle}>
                            {setting.label || setting.id}
                            <span style={{ fontSize: 9, marginLeft: 6, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{setting.type}</span>
                        </label>
                        <input
                            type="text"
                            value={v}
                            onChange={e => onChange(setting.id, e.target.value)}
                            style={inputBase}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        />
                    </div>
                );
            }
            return null;
    }
}
