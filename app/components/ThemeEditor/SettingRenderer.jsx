import React from 'react';

const label = (text) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6d7175', marginBottom: 5, textTransform: 'none', letterSpacing: 0 }}>
        {text}
    </label>
);

const inputStyle = {
    width: '100%',
    border: '1px solid #c9cccf',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 13,
    color: '#202223',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
};

const wrapper = { padding: '0 16px 14px', borderBottom: '1px solid #ebebeb', marginBottom: 0 };

export function SettingRenderer({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    const focusStyle = { borderColor: '#005bd3', boxShadow: '0 0 0 2px rgba(0,91,211,0.2)' };
    const blurStyle = { borderColor: '#c9cccf', boxShadow: 'none' };

    switch (setting.type) {
        case 'text':
        case 'url':
            return (
                <div style={wrapper}>
                    {label(setting.label || setting.id)}
                    <input
                        type="text"
                        value={v}
                        onChange={(e) => onChange(setting.id, e.target.value)}
                        placeholder={setting.placeholder || (setting.type === 'url' ? 'https://' : '')}
                        style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                    />
                </div>
            );

        case 'textarea':
            return (
                <div style={wrapper}>
                    {label(setting.label || setting.id)}
                    <textarea
                        value={v}
                        onChange={(e) => onChange(setting.id, e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                    />
                </div>
            );

        case 'checkbox':
            return (
                <div style={{ ...wrapper, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        id={`chk-${setting.id}`}
                        type="checkbox"
                        checked={Boolean(v)}
                        onChange={(e) => onChange(setting.id, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#005bd3', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <label htmlFor={`chk-${setting.id}`} style={{ fontSize: 13, color: '#202223', cursor: 'pointer', userSelect: 'none' }}>
                        {setting.label || setting.id}
                    </label>
                </div>
            );

        case 'select':
        case 'text_alignment':
            return (
                <div style={wrapper}>
                    {label(setting.label || setting.id)}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={v}
                            onChange={(e) => onChange(setting.id, e.target.value)}
                            style={{ ...inputStyle, appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                        >
                            {(setting.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6d7175' }}>
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                        </span>
                    </div>
                </div>
            );

        case 'range':
            return (
                <div style={wrapper}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        {label(setting.label || setting.id)}
                        <span style={{ fontSize: 12, color: '#202223', fontWeight: 600 }}>{Number(v)}{setting.unit || ''}</span>
                    </div>
                    <input
                        type="range"
                        min={setting.min || 0}
                        max={setting.max || 100}
                        step={setting.step || 1}
                        value={Number(v)}
                        onChange={(e) => onChange(setting.id, Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#005bd3', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#8c9196' }}>{setting.min || 0}</span>
                        <span style={{ fontSize: 10, color: '#8c9196' }}>{setting.max || 100}</span>
                    </div>
                </div>
            );

        case 'color':
        case 'color_background':
            return (
                <div style={wrapper}>
                    {label(setting.label || setting.id)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #c9cccf', borderRadius: 6, padding: '6px 10px', background: '#fff' }}>
                        <div style={{ position: 'relative', width: 24, height: 24, borderRadius: 4, border: '1px solid rgba(0,0,0,0.12)', overflow: 'hidden', cursor: 'pointer', background: v || '#000', flexShrink: 0 }}>
                            <input
                                type="color"
                                value={v || '#000000'}
                                onChange={e => onChange(setting.id, e.target.value)}
                                style={{ position: 'absolute', inset: -8, width: '200%', height: '200%', cursor: 'pointer', border: 'none', padding: 0 }}
                            />
                        </div>
                        <span style={{ fontSize: 13, color: '#202223', fontFamily: 'monospace' }}>{(v || '#000000').toUpperCase()}</span>
                    </div>
                </div>
            );

        case 'image_picker':
        case 'image':
            return (
                <div style={wrapper}>
                    {label(setting.label || setting.id)}
                    {v ? (
                        <div style={{ position: 'relative', border: '1px solid #c9cccf', borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: '#f1f2f4' }}>
                            <img src={v} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button
                                onClick={() => onChange(setting.id, '')}
                                style={{ position: 'absolute', top: 6, right: 6, background: '#fff', border: '1px solid #c9cccf', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d72c0d' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                            </button>
                        </div>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #c9cccf', borderRadius: 6, padding: '20px 12px', cursor: 'pointer', background: '#fafbfb', gap: 6 }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => onChange(setting.id, reader.result);
                                reader.readAsDataURL(file);
                            }} />
                            <svg width="24" height="24" viewBox="0 0 20 20" fill="#8c9196"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" /></svg>
                            <span style={{ fontSize: 12, color: '#005bd3', fontWeight: 600 }}>Select image</span>
                        </label>
                    )}
                </div>
            );

        default:
            return null;
    }
}
