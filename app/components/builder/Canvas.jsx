import React from 'react';

export function Canvas({ device }) {
    
    // Calculate dimensions based on selected device toggle
    const getDeviceDimensions = () => {
        switch (device) {
            case 'mobile': return { width: 375, height: 812 };
            case 'tablet': return { width: 768, height: 1024 };
            case 'desktop': 
            default: return { width: '100%', height: '100%' };
        }
    };

    const dims = getDeviceDimensions();

    return (
        <section style={{
            flex: 1, height: '100%',
            background: '#eef2ff', // Light blue-gray PageFly background
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', overflowX: 'hidden', padding: 20,
            position: 'relative'
        }}>
            {/* The responsive "Iframe" container */}
            <div style={{
                width: dims.width,
                minHeight: device !== 'desktop' ? dims.height : 'calc(100vh - 100px)',
                background: '#ffffff',
                boxShadow: device !== 'desktop' ? '0 10px 40px rgba(0,0,0,0.1)' : 'none',
                borderRadius: device !== 'desktop' ? 16 : 0,
                border: device !== 'desktop' ? '8px solid #f8fafc' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* ─── LIVE PREVIEW MOCK (PageFly FAQ Section) ─── */}
                <div style={{ width: '100%', fontFamily: "'Inter', sans-serif", color: '#111827' }}>
                    
                    {/* Header: Our Programmes */}
                    <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
                        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 40px', color: '#1f2937' }}>Our Programmes</h1>
                        
                        {/* Empty Blog List Alert */}
                        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fdf8f6', border: '1px solid #fed7aa', borderRadius: 8, padding: '20px', color: '#c2410c', fontSize: 13, textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#4b5563', textAlign: 'center', fontSize: 12 }}>Blog post list</div>
                            <div style={{ background: '#ffedd5', padding: '12px', borderRadius: 6 }}>The blog is empty, please update the blog or select another one.</div>
                        </div>
                    </div>

                    {/* Divider with Plus Icon */}
                    <div style={{ position: 'relative', height: 2, background: '#3b82f6', margin: '20px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         <div style={{ width: 16, height: 16, background: '#3b82f6', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, lineHeight: 1 }}>+</div>
                    </div>

                    {/* FAQ Area: Parent Information & Accordion */}
                    <div style={{ display: 'grid', gridTemplateColumns: device === 'mobile' ? '1fr' : '1fr 1fr', gap: 40, padding: '40px 60px', background: '#e0f2fe' }}>
                        
                        {/* Left: Text Info */}
                        <div>
                            <p style={{ color: '#e11d48', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', margin: '0 0 8px', textTransform: 'uppercase' }}>Kidzone Q&A</p>
                            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 24px', color: '#1f2937' }}>Parent Information</h2>
                            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
                                If the question that you are looking for is not listed, please send it to us and we will get back as soon as possible.
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                                As your child enters kindergarten, we know that you probably have a lot of questions. We want to make sure that you and your child feel at home here at Webster, so we have come up with a list of the most frequently asked questions about this very important first year of school.
                            </p>
                            <button style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 30, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                Send your question
                            </button>
                        </div>

                        {/* Right: Accordion List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {['What are the general capabilities?', 'What if my child gets sick?', 'Is language course optional?', 'What are your pick up procedures?', 'Where can I buy school uniforms?'].map((q, i) => (
                                <div key={i} style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '16px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <span style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>+</span>
                                    {q}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            
        </section>
    );
}
