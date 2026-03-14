import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const themeId = url.searchParams.get("themeId");

    if (!shop) {
        return new Response("Missing shop parameter", { status: 400 });
    }

    // Use unauthenticated admin to avoid throwing 302 redirects to /auth/login
    // when requested from inside an iframe without a Bearer token
    await unauthenticated.admin(shop);

    // Fetch the actual storefront HTML for the active theme, adding timestamp to bust cache
    const storefrontUrl = `https://${shop}/?preview_theme_id=${themeId || ''}&pb=0&t=${Date.now()}`;
    const response = await fetch(storefrontUrl);
    let html = await response.text();

    // Inject base tag so relative assets load correctly from the shop's domain
    if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n  <base href="https://${shop}/">`);
    } else {
        html = `<head><base href="https://${shop}/"></head>` + html;
    }

    // Advanced Interactive Script
    const interactiveScript = `
    <style>
      /* Editor Overlays and Interactions */
      .shopify-section { 
          position: relative; 
          cursor: pointer !important;
          transition: outline 0.1s ease-in-out;
      }
      .shopify-section:hover {
          outline: 2px solid #3b82f6 !important; /* Blue outline on hover */
          outline-offset: -2px;
          z-index: 1000;
      }
      .shopify-section.cf-active-section {
          outline: 3px solid #4f46e5 !important;
          outline-offset: -3px;
          z-index: 1001;
      }
      
      /* Disable pointer events on links inside preview to prevent navigation */
      .shopify-section a, .shopify-section button, .shopify-section form {
          pointer-events: none !important;
      }
    </style>
    <script>
      (function() {
        'use strict';
        let activeBlockId = '';

        // Handle Click to Select Section
        document.addEventListener('click', (e) => {
            const section = e.target.closest('.shopify-section');
            if (section) {
                e.preventDefault();
                e.stopPropagation();
                const blockId = section.id.replace('shopify-section-', '');
                
                // Send message to parent
                window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId } }, '*');
                window.parent.postMessage({ type: 'SECTION_CLICK', id: blockId }, '*'); // fallback
            }
        }, true);

        // Listen for messages from parent
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data.type !== 'string') return;

            const id = data.id || data.sectionId || data.payload?.blockId;

            if (data.type === 'shopify:section:select') {
                document.querySelectorAll('.shopify-section').forEach(el => el.classList.remove('cf-active-section'));
                if (id) {
                    const target = document.getElementById('shopify-section-' + id);
                    if (target) {
                        target.classList.add('cf-active-section');
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        activeBlockId = id;
                    }
                }
            } 
            else if (data.type === 'shopify:section:deselect') {
                document.querySelectorAll('.shopify-section').forEach(el => el.classList.remove('cf-active-section'));
                activeBlockId = null;
            }
            else if (data.type === 'shopify:section:load') {
                // Update section HTML instantly
                const htmlSource = data.html || data.payload?.html;
                if (id && htmlSource) {
                    const target = document.getElementById('shopify-section-' + id);
                    if (target) {
                        target.outerHTML = htmlSource;
                    } else if (data.placement === 'bottom') {
                        // If appending a new section that doesn't exist in DOM
                        document.body.insertAdjacentHTML('beforeend', htmlSource);
                    } else {
                         document.body.insertAdjacentHTML('afterbegin', htmlSource);
                    }
                    
                    // Re-apply active class if needed
                    setTimeout(() => {
                        const newTarget = document.getElementById('shopify-section-' + id);
                        if (newTarget && activeBlockId === id) {
                            newTarget.classList.add('cf-active-section');
                        }
                    }, 50);
                }
            }
            else if (data.type === 'shopify:section:remove') {
                if (id) {
                    const target = document.getElementById('shopify-section-' + id);
                    if (target) target.remove();
                }
            }
            else if (data.type === 'theme_editor:css_variable_update') {
                // Instantly apply CSS variables sent from color pickers and sliders
                const target = data.scope === ':root' ? document.documentElement : document.getElementById(data.scope) || document.documentElement;
                if (target && data.variable && data.value) {
                    target.style.setProperty(data.variable, data.value);
                }
            }
        });
      })();
    </script>
    `;

    if (html.includes('</body>')) {
        html = html.replace('</body>', interactiveScript + '\n</body>');
    } else {
        html += interactiveScript;
    }

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Security-Policy": "frame-ancestors 'self' https://*.shopifyapps.com https://admin.shopify.com;"
      }
    });

  } catch (e) {
    console.error("Full Preview Proxy Error:", e);
    return new Response("Error loading live theme preview: " + e.message, { status: 500 });
  }
};
