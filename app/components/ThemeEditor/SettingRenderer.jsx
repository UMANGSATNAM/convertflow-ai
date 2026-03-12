import React from 'react';

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

export function SettingRenderer({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    switch (setting.type) {
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
                    {setting.info && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9ca3af' }}>{setting.info}</p>}
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

        case 'checkbox':
            return (
                <div style={{ ...rowStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1f2937', cursor: 'pointer', userSelect: 'none' }} htmlFor={`chk-${setting.id}`}>
                        {setting.label || setting.id}
                    </label>
                    {/* Toggle switch */}
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

        case 'select':
        case 'text_alignment':
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

        case 'color':
        case 'color_background':
            return (
                <div style={rowStyle}>
                    <label style={labelStyle}>{setting.label || setting.id}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#fafafa', cursor: 'pointer' }}>
                        {/* Swatch */}
                        <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, background: v || '#000', border: '2px solid rgba(0,0,0,0.08)', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                            <input
                                type="color"
                                value={v || '#000000'}
                                onChange={e => onChange(setting.id, e.target.value)}
                                style={{ position: 'absolute', inset: -6, width: '150%', height: '150%', cursor: 'pointer', border: 'none', padding: 0 }}
                            />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>{(v || '#000000').toUpperCase()}</span>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#d1d5db" style={{ marginLeft: 'auto' }}><path d="M13.586 3.586a2 2 0 012.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </div>
                </div>
            );

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

        default:
            return null;
    }
}
