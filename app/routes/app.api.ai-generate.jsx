import { json } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

/**
 * AI Sidekick — Pillar 4
 * 
 * POST /app/api/ai-generate
 * Body: { prompt: string, themePrimaryColor?: string, themeFont?: string }
 * 
 * Returns: { schema: [], liquidHtml: string, sectionName: string }
 */
export async function action({ request }) {
    await authenticate.admin(request);
    
    const body = await request.json();
    const { prompt, themePrimaryColor = '#1a1a1a', themeFont = 'sans-serif' } = body;

    if (!prompt || !String(prompt).trim()) {
        return json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return json({ error: 'GEMINI_API_KEY not configured. Add it to your .env file.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are a Shopify Theme Section Code Generator. Your job is to take a user's description of a storefront section and produce:
1. A valid Shopify settings_schema JSON array (only standard Shopify setting types: text, textarea, image_picker, color, color_background, range, select, checkbox, video_url)
2. The corresponding section HTML (using standard HTML + inline CSS, NO Tailwind). The HTML should reference settings via {{ section.settings.SETTING_ID }} syntax.
3. A short, snake_case section name (e.g. "hero_banner", "faq_grid")

The brand context is:
- Primary Color: ${themePrimaryColor}
- Font: ${themeFont}

Use these as defaults in the color and font settings.

CRITICAL: Return ONLY a valid JSON object like this, with NO markdown, NO explanation, NO code blocks:
{
  "sectionName": "hero_banner",
  "schema": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Hello World" }
  ],
  "liquidHtml": "<section style=\\"background: {{ section.settings.bg_color }}\\"><h1>{{ section.settings.heading }}</h1></section>"
}`;

    try {
        const result = await model.generateContent(`${systemPrompt}\n\nUser Request: ${prompt}`);
        const rawText = result.response.text().trim();

        // Strip any accidental markdown code fences
        const cleaned = rawText
            .replace(/^```json\n?/, '')
            .replace(/^```\n?/, '')
            .replace(/\n?```$/, '')
            .trim();

        const parsed = JSON.parse(cleaned);

        if (!parsed.schema || !parsed.liquidHtml || !parsed.sectionName) {
            throw new Error('AI response missing required fields');
        }

        return json({
            ok: true,
            sectionName: parsed.sectionName,
            schema: parsed.schema,
            liquidHtml: parsed.liquidHtml
        });

    } catch (err) {
        console.error('[AI Generate Error]', err);
        return json({ 
            ok: false, 
            error: `AI generation failed: ${err.message}. Make sure GEMINI_API_KEY is set.` 
        }, { status: 500 });
    }
}
