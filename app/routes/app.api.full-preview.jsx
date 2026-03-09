import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const themeId = url.searchParams.get("themeId");

    const shopUrl = `https://${session.shop}/?preview_theme_id=${themeId}`;
    try {
        const response = await fetch(shopUrl);
        let html = await response.text();

        // Inject base tag so relative links resolve correctly in the iframe
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head><base href="https://${session.shop}/">`);
        }

        // Inject the interactive click script to postMessage to the parent App
        const script = `
        <style>
          /* Subtle hover outline for preview elements */
          [id^="shopify-section-"]:hover {
             outline: 2px solid #2c6ecb !important;
             outline-offset: -2px;
             cursor: pointer !important;
          }
        </style>
        <script>
          document.addEventListener('click', (e) => {
            const section = e.target.closest('[id^="shopify-section-"]');
            if (section) {
                e.preventDefault();
                e.stopPropagation();
                const blockId = section.id.replace('shopify-section-', '');
                // Send the exact block ID up to the Remix App
                window.parent.postMessage({ type: 'SECTION_CLICK', id: blockId }, '*');
            }
          }, true);
        </script>
        `;

        if (html.includes('</body>')) {
            html = html.replace('</body>', script + '</body>');
        } else {
            html += script;
        }

        return new Response(html, {
            headers: {
                "Content-Type": "text/html",
                // Ensure framing is allowed ONLY by the same origin (the Remix app)
                "Content-Security-Policy": "frame-ancestors 'self' https://*.shopifyapps.com https://admin.shopify.com;"
            }
        });
    } catch (e) {
        return new Response("Error loading full theme preview: " + e.message, { status: 500 });
    }
};
