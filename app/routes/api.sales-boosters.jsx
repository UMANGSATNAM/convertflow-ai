import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Sales Boosters API — Manages snippet injection for:
 * - Free Shipping Bar
 * - Countdown Timer
 * - Trust Badges
 * - Social Proof Notification
 * 
 * These are injected as Shopify theme app extensions via the Asset API.
 */

async function getActiveThemeId(admin, session) {
    const res = await admin.graphql(`{ themes(first:1, roles:[MAIN]) { nodes { id name } } }`);
    const data = await res.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) return null;
    return { id: theme.id.split('/').pop(), name: theme.name };
}

/**
 * Inject a snippet into the theme's layout/theme.liquid
 * We add snippets at the end of <body>, marked with CF comments for easy removal
 */
async function injectSnippet(session, themeId, snippetId, htmlContent) {
    const assetKey = `snippets/cf-${snippetId}.liquid`;
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`;

    // Upload the snippet file
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
        body: JSON.stringify({ asset: { key: assetKey, value: htmlContent } })
    });

    if (!res.ok) throw new Error(`Failed to save snippet: ${await res.text()}`);

    // Now ensure it's included in theme.liquid
    const layoutUrl = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`;
    const layoutRes = await fetch(layoutUrl, {
        headers: { 'X-Shopify-Access-Token': session.accessToken }
    });

    if (!layoutRes.ok) throw new Error("Failed to read theme.liquid");

    const layoutData = await layoutRes.json();
    let layoutContent = layoutData.asset.value;

    const includeTag = `{% render 'cf-${snippetId}' %}`;
    if (!layoutContent.includes(includeTag)) {
        // Insert before </body>
        layoutContent = layoutContent.replace('</body>', `  ${includeTag}\n</body>`);
        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
            body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: layoutContent } })
        });
    }

    return { success: true };
}

async function removeSnippet(session, themeId, snippetId) {
    const assetKey = `snippets/cf-${snippetId}.liquid`;
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${assetKey}`;

    // Delete the snippet file
    await fetch(url, {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': session.accessToken }
    });

    // Remove from theme.liquid
    const layoutUrl = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`;
    const layoutRes = await fetch(layoutUrl, {
        headers: { 'X-Shopify-Access-Token': session.accessToken }
    });

    if (layoutRes.ok) {
        const layoutData = await layoutRes.json();
        let layoutContent = layoutData.asset.value;
        const includeTag = `{% render 'cf-${snippetId}' %}`;
        layoutContent = layoutContent.replace(`  ${includeTag}\n`, '').replace(includeTag, '');

        const putUrl = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`;
        await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
            body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: layoutContent } })
        });
    }

    return { success: true };
}

// ═══════ SNIPPET GENERATORS ═══════

function generateFreeShippingBar(config) {
    const { threshold = 50, barColor = '#059669', textColor = '#ffffff', message = 'Free shipping on orders over ${threshold}!' } = config;
    return `<!-- ConvertFlow: Free Shipping Bar -->
<style>
.cf-shipping-bar{position:fixed;bottom:0;left:0;right:0;z-index:9998;padding:12px 20px;background:${barColor};color:${textColor};font-family:'Inter',system-ui,sans-serif;font-size:14px;font-weight:600;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 -2px 10px rgba(0,0,0,0.1);transition:transform 0.3s}
.cf-shipping-bar .close-btn{position:absolute;right:16px;background:none;border:none;color:${textColor};cursor:pointer;font-size:18px;opacity:0.7}
.cf-shipping-bar .close-btn:hover{opacity:1}
.cf-shipping-bar.hidden{transform:translateY(100%)}
</style>
<div class="cf-shipping-bar" id="cf-shipping-bar">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> ${message.replace('${threshold}', threshold)}
<button class="close-btn" onclick="document.getElementById('cf-shipping-bar').classList.add('hidden')">&times;</button>
</div>`;
}

function generateCountdownTimer(config) {
    const { endDate = '', title = 'Flash Sale Ends In', barColor = '#dc2626', textColor = '#ffffff' } = config;
    return `<!-- ConvertFlow: Countdown Timer -->
<style>
.cf-countdown{position:fixed;top:0;left:0;right:0;z-index:9998;padding:10px 20px;background:${barColor};color:${textColor};font-family:'Inter',system-ui,sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
.cf-countdown .title{font-size:13px;font-weight:600;margin-bottom:4px}
.cf-countdown .timer{display:flex;align-items:center;justify-content:center;gap:12px;font-size:20px;font-weight:800}
.cf-countdown .unit{text-align:center}
.cf-countdown .unit .num{font-size:24px;font-weight:800}
.cf-countdown .unit .label{font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.8}
.cf-countdown .sep{font-size:20px;opacity:0.5}
.cf-countdown .close-btn{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:${textColor};cursor:pointer;font-size:18px}
</style>
<div class="cf-countdown" id="cf-countdown">
<div class="title">${title}</div>
<div class="timer" id="cf-timer">
<div class="unit"><div class="num" id="cf-days">00</div><div class="label">Days</div></div>
<span class="sep">:</span>
<div class="unit"><div class="num" id="cf-hours">00</div><div class="label">Hours</div></div>
<span class="sep">:</span>
<div class="unit"><div class="num" id="cf-mins">00</div><div class="label">Min</div></div>
<span class="sep">:</span>
<div class="unit"><div class="num" id="cf-secs">00</div><div class="label">Sec</div></div>
</div>
<button class="close-btn" onclick="document.getElementById('cf-countdown').style.display='none'">&times;</button>
</div>
<script>
(function(){var end=new Date("${endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}").getTime();function u(){var n=end-Date.now();if(n<=0){document.getElementById('cf-countdown').innerHTML='<div class="title">Sale Has Ended!</div>';return}document.getElementById('cf-days').textContent=String(Math.floor(n/864e5)).padStart(2,'0');document.getElementById('cf-hours').textContent=String(Math.floor(n%864e5/36e5)).padStart(2,'0');document.getElementById('cf-mins').textContent=String(Math.floor(n%36e5/6e4)).padStart(2,'0');document.getElementById('cf-secs').textContent=String(Math.floor(n%6e4/1e3)).padStart(2,'0')}u();setInterval(u,1000)})();
</script>`;
}

function generateTrustBadges(config) {
    const { position = 'below_atc' } = config;
    return `<!-- ConvertFlow: Trust Badges -->
<style>
.cf-trust-badges{display:flex;align-items:center;justify-content:center;gap:16px;padding:16px;margin:12px 0;flex-wrap:wrap}
.cf-trust-badges .badge{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#374151;font-family:'Inter',system-ui,sans-serif}
.cf-trust-badges .badge-icon{font-size:18px}
</style>
<div class="cf-trust-badges">
<span class="badge"><span class="badge-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>Secure Checkout</span>
<span class="badge"><span class="badge-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span>Free Shipping</span>
<span class="badge"><span class="badge-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-12.36L1 10"/></svg></span>30-Day Returns</span>
<span class="badge"><span class="badge-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>All Cards Accepted</span>
</div>
${position === 'below_atc' ? `<script>
(function(){var btn=document.querySelector('[name="add"]')||document.querySelector('.product-form__submit')||document.querySelector('[type="submit"]');if(btn){var badges=document.querySelector('.cf-trust-badges');if(badges&&btn.parentElement){btn.parentElement.insertBefore(badges, btn.nextSibling)}}})();
</script>` : ''}`;
}

function generateSocialProof(config) {
    const { interval = 8000, bgColor = '#ffffff' } = config;
    const names = ['Sarah M.', 'James K.', 'Emily R.', 'Michael T.', 'Lisa P.', 'David W.', 'Anna S.', 'Chris B.', 'Rachel L.', 'Kevin H.'];
    const cities = ['New York', 'Los Angeles', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Tokyo', 'Mumbai', 'Dubai'];
    const products = ['Premium Bundle', 'Classic Collection', 'Best Seller Pack', 'Limited Edition', 'Starter Kit'];
    return `<!-- ConvertFlow: Social Proof Notifications -->
<style>
.cf-social-proof{position:fixed;bottom:24px;left:24px;z-index:9997;background:${bgColor};border-radius:12px;padding:14px 18px;box-shadow:0 8px 30px rgba(0,0,0,0.12);font-family:'Inter',system-ui,sans-serif;display:flex;align-items:center;gap:12px;max-width:340px;transform:translateX(-120%);transition:transform 0.4s cubic-bezier(0.4,0,0.2,1);border:1px solid #f3f4f6}
.cf-social-proof.show{transform:translateX(0)}
.cf-social-proof .avatar{width:40px;height:40px;background:#ede9fe;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.cf-social-proof .info .name{font-size:13px;font-weight:700;color:#111827}
.cf-social-proof .info .detail{font-size:12px;color:#6b7280;margin-top:2px}
.cf-social-proof .info .time{font-size:11px;color:#9ca3af;margin-top:2px}
</style>
<div class="cf-social-proof" id="cf-social-proof">
<div class="avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div>
<div class="info">
<div class="name" id="cf-sp-name">Someone</div>
<div class="detail" id="cf-sp-detail">just purchased something</div>
<div class="time" id="cf-sp-time">2 minutes ago</div>
</div>
</div>
<script>
(function(){var names=${JSON.stringify(names)};var cities=${JSON.stringify(cities)};var products=${JSON.stringify(products)};var el=document.getElementById('cf-social-proof');function show(){var n=names[Math.floor(Math.random()*names.length)];var c=cities[Math.floor(Math.random()*cities.length)];var p=products[Math.floor(Math.random()*products.length)];var t=Math.floor(Math.random()*15)+1;document.getElementById('cf-sp-name').textContent=n+' from '+c;document.getElementById('cf-sp-detail').textContent='purchased '+p;document.getElementById('cf-sp-time').textContent=t+' minutes ago';el.classList.add('show');setTimeout(function(){el.classList.remove('show')},5000)}setTimeout(show,3000);setInterval(show,${interval})})();
</script>`;
}

// ═══ LOADER ═══
export const loader = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const theme = await getActiveThemeId(admin, session);
        if (!theme) return json({ success: false, error: "No active theme" });

        // Check which snippets are already installed
        const assetsUrl = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
        const assetsRes = await fetch(assetsUrl, {
            headers: { 'X-Shopify-Access-Token': session.accessToken }
        });
        const assetsData = await assetsRes.json();
        const installed = {};
        ['shipping-bar', 'countdown-timer', 'trust-badges', 'social-proof'].forEach(id => {
            installed[id] = (assetsData.assets || []).some(a => a.key === `snippets/cf-${id}.liquid`);
        });

        return json({ success: true, themeName: theme.name, themeId: theme.id, installed });
    } catch (error) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
};

// ═══ ACTION ═══
export const action = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const fd = await request.formData();
        const intent = fd.get("intent");
        const theme = await getActiveThemeId(admin, session);
        if (!theme) return json({ success: false, error: "No active theme" });

        if (intent === "install") {
            const widgetId = fd.get("widgetId");
            const config = JSON.parse(fd.get("config") || '{}');
            let html;

            switch (widgetId) {
                case 'shipping-bar': html = generateFreeShippingBar(config); break;
                case 'countdown-timer': html = generateCountdownTimer(config); break;
                case 'trust-badges': html = generateTrustBadges(config); break;
                case 'social-proof': html = generateSocialProof(config); break;
                default: return json({ success: false, error: "Unknown widget" });
            }

            await injectSnippet(session, theme.id, widgetId, html);
            return json({ success: true, message: `${widgetId} installed successfully!` });
        }

        if (intent === "uninstall") {
            const widgetId = fd.get("widgetId");
            await removeSnippet(session, theme.id, widgetId);
            return json({ success: true, message: `${widgetId} removed successfully!` });
        }

        return json({ success: false, error: "Unknown intent" });
    } catch (error) {
        console.error("Sales Booster Error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};
