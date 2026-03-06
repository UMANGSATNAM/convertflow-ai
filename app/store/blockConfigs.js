import { ELEMENT_CONFIGS } from './elementConfigs';

// Helper to assemble pre-designed trees
const buildNode = (type, settings = {}, children = []) => ({
    id: `block_el_${Math.random().toString(36).substring(2, 9)}`,
    type,
    settings: {
        ...ELEMENT_CONFIGS[type]?.defaultProps,
        ...settings,
        styles: {
            ...ELEMENT_CONFIGS[type]?.defaultProps?.styles,
            ...settings.styles
        }
    },
    children
});

export const BLOCK_CONFIGS = {
    HeroLeftLight: {
        id: 'HeroLeftLight',
        label: 'Hero (Left Text)',
        category: 'Hero',
        icon: 'LayoutTemplate', // Lucide icon
        buildTree: () => buildNode('Row', {
            styles: { padding: '80px 40px', backgroundColor: '#ffffff', gap: '40px', alignItems: 'center' }
        }, [
            buildNode('Column', { styles: { width: '50%', gap: '20px' } }, [
                buildNode('Heading', { text: 'Build Your Dream Store', tag: 'h1', styles: { fontSize: '48px', fontWeight: '800', color: '#111827' } }),
                buildNode('Paragraph', { text: 'Create high-converting landing pages in minutes with our drag and drop builder. No coding required.', styles: { fontSize: '18px', color: '#4B5563', lineHeight: '1.6' } }),
                buildNode('Button', { text: 'Start Building Now', styles: { padding: '16px 32px', backgroundColor: '#2563EB', color: '#ffffff', borderRadius: '8px', fontSize: '16px', fontWeight: '600', alignSelf: 'flex-start' } })
            ]),
            buildNode('Column', { styles: { width: '50%' } }, [
                buildNode('Image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', styles: { width: '100%', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } })
            ])
        ])
    },
    FeatureGrid3: {
        id: 'FeatureGrid3',
        label: '3-Col Features',
        category: 'Features',
        icon: 'LayoutGrid',
        buildTree: () => buildNode('Row', {
            styles: { padding: '60px 40px', backgroundColor: '#F9FAFB', gap: '30px', flexDirection: 'column', alignItems: 'center' }
        }, [
            buildNode('Heading', { text: 'Why Choose Us', tag: 'h2', styles: { fontSize: '36px', fontWeight: '700', color: '#111827', textAlign: 'center', margin: '0 0 40px 0' } }),
            buildNode('Row', { styles: { width: '100%', gap: '30px', alignItems: 'stretch' } }, [
                buildNode('Column', { styles: { width: '33.33%', padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', gap: '15px' } }, [
                    buildNode('Heading', { text: 'Lightning Fast', tag: 'h3', styles: { fontSize: '20px', fontWeight: '600', color: '#111827' } }),
                    buildNode('Paragraph', { text: 'Optimized code output ensures your store loads instantly.', styles: { fontSize: '15px', color: '#6B7280' } })
                ]),
                buildNode('Column', { styles: { width: '33.33%', padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', gap: '15px' } }, [
                    buildNode('Heading', { text: 'SEO Optimized', tag: 'h3', styles: { fontSize: '20px', fontWeight: '600', color: '#111827' } }),
                    buildNode('Paragraph', { text: 'Clean HTML and proper tags help you rank higher on Google.', styles: { fontSize: '15px', color: '#6B7280' } })
                ]),
                buildNode('Column', { styles: { width: '33.33%', padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', gap: '15px' } }, [
                    buildNode('Heading', { text: 'Fully Responsive', tag: 'h3', styles: { fontSize: '20px', fontWeight: '600', color: '#111827' } }),
                    buildNode('Paragraph', { text: 'Looks perfect on mobile, tablet, and desktop devices.', styles: { fontSize: '15px', color: '#6B7280' } })
                ])
            ])
        ])
    },
    CTASection: {
        id: 'CTASection',
        label: 'Simple CTA',
        category: 'Conversion',
        icon: 'MousePointerClick',
        buildTree: () => buildNode('Row', {
            styles: { padding: '80px 40px', backgroundColor: '#111827', gap: '20px', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }
        }, [
            buildNode('Heading', { text: 'Ready to increase your sales?', tag: 'h2', styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff' } }),
            buildNode('Paragraph', { text: 'Join thousands of merchants using our builder today.', styles: { fontSize: '18px', color: '#9CA3AF', marginBottom: '10px' } }),
            buildNode('Button', { text: 'Get Started for Free', styles: { padding: '16px 32px', backgroundColor: '#10B981', color: '#ffffff', borderRadius: '8px', fontSize: '16px', fontWeight: '600' } })
        ])
    }
};
