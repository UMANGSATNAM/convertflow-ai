import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { Canvas } from './Canvas';

export function StoreBuilder({ pageBlocks = [] }) {
    const [device, setDevice] = useState('desktop');
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [themeName] = useState('Premium Theme');

    return (
        <div style={{
            width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: '#0f172a', /* Dark slate background */
            color: '#e2e8f0',
            overflow: 'hidden',
        }}>
            {/* ─── TOP HEADER ─── */}
            <header style={{
                height: 60, background: '#1e293b', borderBottom: '1px solid #334155',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 16,
                flexShrink: 0, zIndex: 100,
            }}>
                {/* LEFT: Logo + Theme Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '-0.5px' }}>CF</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>Builder</span>
                    
                    <div style={{ width: 1, height: 24, background: '#334155', margin: '0 4px' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{themeName}</span>
                        <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
                    </div>
                </div>

                {/* CENTER: Device Toggle */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: 4, background: '#0f172a', borderRadius: 10, border: '1px solid #334155' }}>
                        {[
                            { id: 'desktop', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9.5l.5 2H12a.75.75 0 010 1.5H8a.75.75 0 010-1.5h.5L9 14H4a2 2 0 01-2-2V5zm2-.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h12a.5.5 0 00.5-.5V5a.5.5 0 00-.5-.5H4z"/></svg>, label: 'Desktop' },
                            { id: 'mobile', icon: <svg width="13" height="16" viewBox="0 0 14 20" fill="currentColor"><path d="M4 0a2 2 0 00-2 2v16a2 2 0 002 2h6a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1.5h6a.5.5 0 01.5.5v16a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5zm3 14.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>, label: 'Mobile' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setDevice(opt.id)}
                                title={opt.label}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                                    fontSize: 12, fontWeight: 600,
                                    background: device === opt.id ? '#1e293b' : 'transparent',
                                    color: device === opt.id ? '#f8fafc' : '#64748b',
                                    transition: 'all 0.15s',
                                }}
                            >{opt.icon}<span>{opt.label}</span></button>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {/* Undo */}
                        <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.061.025z"/></svg>
                        </button>
                        {/* Redo */}
                        <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}>
                           <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.061.025z"/></svg>
                        </button>
                    </div>

                    <button
                        style={{
                            height: 36, padding: '0 20px',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                        }}
                    >
                        Save
                    </button>
                </div>
            </header>

            {/* ─── BODY ─── */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar 
                    blocks={pageBlocks} 
                    selectedBlockId={selectedBlockId} 
                    onSelectBlock={setSelectedBlockId} 
                />
                <Canvas device={device} />
                <PropertiesPanel 
                    selectedBlockId={selectedBlockId} 
                />
            </main>
        </div>
    );
}
