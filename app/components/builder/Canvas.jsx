import React from 'react';

export function Canvas({ device }) {
    const isMobile = device === 'mobile';
    const canvasWidth = isMobile ? 375 : '100%';
    const canvasHeight = isMobile ? 812 : '100%';

    return (
        <section style={{
            flex: 1, height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0f172a',
            position: 'relative',
        }}>
            {/* Dark Checkerboard Pattern */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.1, zIndex: 0,
                backgroundImage: 'repeating-linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b), repeating-linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b)',
                backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px',
            }} />

            {/* Iframe Window Container */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: canvasWidth, height: canvasHeight,
                background: '#fff', 
                boxShadow: isMobile ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
                borderRadius: isMobile ? 32 : 0,
                border: isMobile ? '8px solid #1e293b' : 'none',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Simulated Storefront Content */}
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#111827' }}>
                    
                    {/* Fake Header */}
                    <div style={{ height: 60, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                         <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>BRAND</div>
                         <div style={{ display: 'flex', gap: 16 }}>
                             <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #9ca3af' }} />
                             <div style={{ width: 16, height: 16, borderRadius: '2px', border: '2px solid #9ca3af' }} />
                         </div>
                    </div>

                    {/* Fake Hero */}
                    <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
                        <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#0f172a' }}>Live Preview <br/> Loading...</h1>
                        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 400, margin: '0 0 24px', lineHeight: 1.5 }}>
                            Your Shopify storefront iframe will render here once connected to the backend API.
                        </p>
                        <button style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Shop Now</button>
                    </div>

                </div>
            </div>
        </section>
    );
}
