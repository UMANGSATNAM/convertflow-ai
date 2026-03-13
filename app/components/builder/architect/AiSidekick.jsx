import React, { useState } from 'react';
import { AppProvider, BlockStack, Button, Card, Spinner, Text, TextArea, TextField, Banner } from '@shopify/polaris';
import { MagicIcon } from '@shopify/polaris-icons';
import '@shopify/polaris/build/esm/styles.css';

/**
 * AI Sidekick — Pillar 4
 * 
 * A panel that lets merchants describe a section in plain language
 * and auto-generates settings_schema + Liquid HTML via Gemini.
 * 
 * Props:
 * - themeColors: { primary: '#hex' }
 * - themeFont: string
 * - onSectionGenerated: (schema, liquidHtml, sectionName) => void
 */
export function AiSidekick({ themeColors = {}, themeFont = 'sans-serif', onSectionGenerated }) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/app/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    themePrimaryColor: themeColors.primary || '#1a1a1a',
                    themeFont
                })
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInject = () => {
        if (result && onSectionGenerated) {
            onSectionGenerated(result.schema, result.liquidHtml, result.sectionName);
        }
    };

    return (
        <AppProvider i18n={{}}>
            <div style={{ padding: '20px' }}>
                <BlockStack gap="400">
                    {/* Prompt Input */}
                    <BlockStack gap="200">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>
                            </svg>
                            <Text as="h3" variant="headingSm">AI Section Generator</Text>
                        </div>
                        <Text as="p" variant="bodySm" color="subdued">
                            Describe the section you want in plain language. The AI will generate the code.
                        </Text>
                        <TextField
                            label="What should this section do?"
                            labelHidden
                            value={prompt}
                            onChange={setPrompt}
                            multiline={4}
                            placeholder="e.g. A hero banner with a headline, subtext and a CTA button. Background should be dark with white text."
                            autoComplete="off"
                            maxLength={500}
                            showCharacterCount
                        />
                        <Button
                            icon={MagicIcon}
                            variant="primary"
                            fullWidth
                            onClick={handleGenerate}
                            loading={loading}
                            disabled={!prompt.trim() || loading}
                        >
                            Generate Section
                        </Button>
                    </BlockStack>

                    {/* Error State */}
                    {error && (
                        <Banner title="Generation failed" tone="critical">
                            <p>{error}</p>
                        </Banner>
                    )}

                    {/* Result Preview */}
                    {result && !loading && (
                        <BlockStack gap="300">
                            <Banner title={`Generated: ${result.sectionName}`} tone="success">
                                <p>{result.schema.length} settings created. Ready to inject.</p>
                            </Banner>

                            {/* Settings Preview */}
                            <Card>
                                <BlockStack gap="200">
                                    <Text variant="headingXs" as="h4">Settings ({result.schema.length})</Text>
                                    {result.schema.slice(0, 5).map(s => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <span style={{ fontWeight: 600, color: '#374151' }}>{s.label || s.id}</span>
                                            <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{s.type}</span>
                                        </div>
                                    ))}
                                    {result.schema.length > 5 && (
                                        <Text variant="bodySm" color="subdued">+{result.schema.length - 5} more...</Text>
                                    )}
                                </BlockStack>
                            </Card>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleInject}
                                tone="success"
                            >
                                Add to Page
                            </Button>

                            <Button
                                variant="plain"
                                fullWidth
                                onClick={() => { setResult(null); setPrompt(''); }}
                            >
                                Start Over
                            </Button>
                        </BlockStack>
                    )}
                </BlockStack>
            </div>
        </AppProvider>
    );
}
