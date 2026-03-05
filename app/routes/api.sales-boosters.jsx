import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * api.sales-boosters.jsx
 * - Manages injection of 7 conversion booster widgets into the theme.
 */

async function getActiveThemeId(admin, session) {
    const res = await admin.graphql(`{ themes(first:1, roles:[MAIN]) { nodes { id name } } }`);
    const data = await res.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) return null;
    return { id: theme.id.split('/').pop(), name: theme.name };
}

async function injectSnippet(session, themeId, snippetId, htmlContent) {
    const assetKey = `snippets/cf-${snippetId}.liquid`;
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`;

    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
        body: JSON.stringify({ asset: { key: assetKey, value: htmlContent } })
    });
    if (!res.ok) throw new Error(`Failed to save snippet: ${await res.text()}`);

    const layoutUrl = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`;
    const layoutRes = await fetch(layoutUrl, { headers: { 'X-Shopify-Access-Token': session.accessToken } });
    if (!layoutRes.ok) throw new Error("Failed to read theme.liquid");

    const layoutData = await layoutRes.json();
    let layoutContent = layoutData.asset.value;
    const includeTag = `{% render 'cf-${snippetId}' %}`;

    if (!layoutContent.includes(includeTag)) {
        if (snippetId === 'volume-discounts') {
            // Volume discounts usually go on product pages, but we'll inject globally and scope in liquid
            layoutContent = layoutContent.replace('</body>', `  ${includeTag}\n</body>`);
        } else {
            layoutContent = layoutContent.replace('</body>', `  ${includeTag}\n</body>`);
        }
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
    await fetch(url, { method: 'DELETE', headers: { 'X-Shopify-Access-Token': session.accessToken } });

    const layoutUrl = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`;
    const layoutRes = await fetch(layoutUrl, { headers: { 'X-Shopify-Access-Token': session.accessToken } });

    if (layoutRes.ok) {
        let layoutContent = (await layoutRes.json()).asset.value;
        const includeTag = `{% render 'cf-${snippetId}' %}`;
        layoutContent = layoutContent.replace(`  ${includeTag}\n`, '').replace(includeTag, '');
        await fetch(`https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
            body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: layoutContent } })
        });
    }
    return { success: true };
}

// ═══════ SNIPPET GENERATORS ═══════

function generateSpendingGoal(config) {
    const { goal = 50, color = '#8b5cf6' } = config;
    return `<!-- ConvertFlow: Spending Goal -->
<style>
.cf-spending-goal{position:fixed;top:0;left:0;right:0;z-index:9998;background:#fff;padding:8px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);font-family:'Inter',system-ui,sans-serif;text-align:center;font-size:13px;font-weight:600;color:#1e293b}
.cf-spending-progress{width:100%;max-width:300px;height:6px;background:#e2e8f0;border-radius:10px;margin:6px auto 0;overflow:hidden}
.cf-spending-bar{height:100%;background:${color};border-radius:10px;transition:width 0.3s}
</style>
<div class="cf-spending-goal" id="cf-spending-goal" style="display:none;">
    <span id="cf-spending-text"></span>
    <div class="cf-spending-progress"><div class="cf-spending-bar" id="cf-spending-bar"></div></div>
</div>
<script>
(function(){
    var goal = ${goal} * 100;
    function update(cart) {
        var el = document.getElementById('cf-spending-goal');
        var text = document.getElementById('cf-spending-text');
        var bar = document.getElementById('cf-spending-bar');
        if(!cart || typeof cart.total_price === 'undefined') return;
        el.style.display = 'block';
        if(cart.total_price >= goal) {
            text.innerHTML = '🎉 You are eligible for <b>Free Shipping!</b>';
            bar.style.width = '100%';
            bar.style.background = '#10b981';
        } else {
            var remaining = ((goal - cart.total_price) / 100).toFixed(2);
            text.innerHTML = 'Spend <b>$' + remaining + '</b> more to unlock Free Shipping';
            bar.style.width = Math.max(5, (cart.total_price / goal) * 100) + '%';
            bar.style.background = '${color}';
        }
    }
    fetch('/cart.js').then(r=>r.json()).then(update);
    // Rough intercept for add to cart
    var origFetch = window.fetch;
    window.fetch = function() {
        return origFetch.apply(this, arguments).then(function(res){
            if(res.url.includes('/cart/add') || res.url.includes('/cart/change') || res.url.includes('/cart/update')) {
                setTimeout(function(){ fetch('/cart.js').then(r=>r.json()).then(update); }, 500);
            }
            return res;
        });
    };
})();
</script>`;
}

function generateBackToTop(config) {
    const { color = '#8b5cf6' } = config;
    return `<!-- ConvertFlow: Back To Top -->
<style>
.cf-btt{position:fixed;bottom:24px;right:24px;z-index:9997;width:44px;height:44px;border-radius:50%;background:${color};color:#fff;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(20px);transition:all 0.3s;pointer-events:none}
.cf-btt.visible{opacity:1;transform:translateY(0);pointer-events:auto}
.cf-btt:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(0,0,0,0.2)}
</style>
<button class="cf-btt" id="cf-btt" onclick="window.scrollTo({top:0,behavior:'smooth'})">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
</button>
<script>
window.addEventListener('scroll', function(){
    var btn = document.getElementById('cf-btt');
    if(window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
});
</script>`;
}

function generateGDPRCookie(config) {
    const { color = '#8b5cf6' } = config;
    return `<!-- ConvertFlow: GDPR Cookie -->
<style>
.cf-gdpr{position:fixed;bottom:24px;left:24px;right:24px;max-width:400px;z-index:9999;background:#1e293b;color:#f8fafc;padding:20px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);font-family:'Inter',system-ui,sans-serif;font-size:13px;line-height:1.5;display:none;animation:slideUp 0.5s ease-out}
.cf-gdpr p{margin:0 0 12px}
.cf-gdpr-btns{display:flex;gap:10px}
.cf-gdpr-btn{flex:1;padding:10px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;border:none}
.cf-gdpr-btn.accept{background:${color};color:#fff}
.cf-gdpr-btn.decline{background:rgba(255,255,255,0.1);color:#cbd5e1}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
</style>
<div class="cf-gdpr" id="cf-gdpr">
    <p>🍪 We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
    <div class="cf-gdpr-btns">
        <button class="cf-gdpr-btn decline" onclick="cfHandleGDPR('decline')">Decline</button>
        <button class="cf-gdpr-btn accept" onclick="cfHandleGDPR('accept')">Accept All</button>
    </div>
</div>
<script>
function cfHandleGDPR(choice){
    localStorage.setItem('cf_gdpr_consent', choice);
    document.getElementById('cf-gdpr').style.display = 'none';
}
if(!localStorage.getItem('cf_gdpr_consent')){
    setTimeout(function(){ document.getElementById('cf-gdpr').style.display = 'block'; }, 1000);
}
</script>`;
}

function generateUrgencyTimer(config) {
    const { minutes = 15, color = '#ef4444' } = config;
    return `<!-- ConvertFlow: Urgency Timer -->
<style>
.cf-urgency{background:#fff1f2;border:1px solid #ffe4e6;border-radius:8px;padding:10px 16px;margin:16px 0;display:flex;align-items:center;justify-content:space-between;color:${color};font-family:'Inter',system-ui,sans-serif;font-weight:600}
.cf-urgency-timer{display:flex;align-items:center;gap:6px;font-size:18px;font-variant-numeric:tabular-nums}
</style>
<div class="cf-urgency" id="cf-urgency" style="display:none;">
    <span>🔥 High Demand! Reserved for:</span>
    <div class="cf-urgency-timer">
        <svg fill="currentColor" width="18" height="18" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>
        <span id="cf-urgency-min">00</span>:<span id="cf-urgency-sec">00</span>
    </div>
</div>
<script>
(function(){
    var isProductPage = window.location.pathname.includes('/products/');
    if(!isProductPage) return;
    document.getElementById('cf-urgency').style.display = 'flex';
    var endTime = localStorage.getItem('cf_urgency_timer');
    if(!endTime) {
        endTime = Date.now() + ${minutes} * 60000;
        localStorage.setItem('cf_urgency_timer', endTime);
    }
    function update() {
        var remain = Math.max(0, endTime - Date.now());
        if(remain === 0) { localStorage.removeItem('cf_urgency_timer'); return; }
        document.getElementById('cf-urgency-min').textContent = String(Math.floor(remain / 60000)).padStart(2, '0');
        document.getElementById('cf-urgency-sec').textContent = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
    }
    update(); setInterval(update, 1000);
    
    // Inject near add to cart
    var btn=document.querySelector('[name="add"]')||document.querySelector('.product-form__submit');
    if(btn&&btn.parentElement){
        var el = document.getElementById('cf-urgency');
        btn.parentElement.insertBefore(el, btn);
    }
})();
</script>`;
}

function generateAnnouncementBar(config) {
    const { text = "🔥 HUGE SALE: 50% OFF EVERYTHING TODAY ONLY!", bgColor = '#0f172a', textColor = '#ffffff' } = config;
    return `<!-- ConvertFlow: Announcement Bar -->
<style>
.cf-announcement{background:${bgColor};color:${textColor};padding:10px;text-align:center;font-size:13px;font-weight:700;font-family:'Inter',system-ui,sans-serif;letter-spacing:0.5px;position:relative;z-index:9999}
</style>
<div class="cf-announcement">${text}</div>
<script>
(function(){
    var el = document.querySelector('.cf-announcement');
    document.body.insertBefore(el, document.body.firstChild);
})();
</script>`;
}

function generateVolumeDiscount(config) {
    const { color = '#3b82f6' } = config;
    return `<!-- ConvertFlow: Volume Discounts -->
<style>
.cf-volume{margin:20px 0;font-family:'Inter',system-ui,sans-serif}
.cf-volume-title{font-size:14px;font-weight:700;margin-bottom:10px}
.cf-volume-grid{display:flex;flex-direction:column;gap:8px}
.cf-volume-tier{border:2px solid #e2e8f0;border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s}
.cf-volume-tier:hover{border-color:${color}40;background:${color}0a}
.cf-volume-tier.active{border-color:${color};background:${color}10}
.cf-volume-left{display:flex;align-items:center;gap:12px}
.cf-volume-radio{width:18px;height:18px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center}
.cf-volume-tier.active .cf-volume-radio{border-color:${color}}
.cf-volume-tier.active .cf-volume-radio::after{content:'';width:10px;height:10px;background:${color};border-radius:50%}
.cf-volume-qty{font-weight:700;font-size:15px;color:#0f172a}
.cf-volume-badge{background:#ef4444;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase}
.cf-volume-price{text-align:right}
.cf-volume-each{font-weight:700;font-size:15px;color:#0f172a}
.cf-volume-total{font-size:11px;color:#64748b;text-decoration:line-through;margin-top:2px}
</style>
<div class="cf-volume" id="cf-volume" style="display:none;">
    <div class="cf-volume-title">Buy More, Save More!</div>
    <div class="cf-volume-grid" id="cf-volume-grid"></div>
</div>
<script>
(function(){
    var isProductPage = window.location.pathname.includes('/products/');
    if(!isProductPage) return;
    
    // Simulate data based on standard Shopify product objects if available, else generic.
    // In a real app we'd read the product variant price via Liquid.
    document.getElementById('cf-volume').style.display = 'block';
    
    var grid = document.getElementById('cf-volume-grid');
    var tiers = [
        { qty: 1, discount: 0, tag: '' },
        { qty: 2, discount: 15, tag: 'Most Popular' },
        { qty: 3, discount: 25, tag: 'Best Value' }
    ];
    
    // Attempt to parse price from document (rough fallback)
    var priceEl = document.querySelector('.price-item--regular, .price__regular .price-item');
    var basePrice = 29.99;
    var symbol = '$';
    if(priceEl && priceEl.textContent.match(/[\\d\\.]+/)) {
        basePrice = parseFloat(priceEl.textContent.match(/[\\d\\.]+/)[0]);
        symbol = priceEl.textContent.replace(/[\\d\\.,\\s]/g, '') || '$';
    }

    tiers.forEach(function(t, i){
        var html = '<div class="cf-volume-tier '+(i===1?'active':'')+'" onclick="cfSelectVolume(this, '+t.qty+')">';
        html += '<div class="cf-volume-left"><div class="cf-volume-radio"></div><div>';
        html += '<div class="cf-volume-qty">Buy ' + t.qty + '</div>';
        if(t.tag) html += '<div class="cf-volume-badge">' + t.discount + '% OFF</div> <span style="font-size:11px;font-weight:600;color:${color}">'+t.tag+'</span>';
        html += '</div></div><div class="cf-volume-price">';
        
        var dPrice = basePrice * (1 - t.discount/100);
        html += '<div class="cf-volume-each">' + symbol + dPrice.toFixed(2) + ' /ea</div>';
        if(t.discount > 0) html += '<div class="cf-volume-total">' + symbol + (basePrice*t.qty).toFixed(2) + '</div>';
        html += '</div></div>';
        grid.innerHTML += html;
    });

    window.cfSelectVolume = function(el, qty) {
        document.querySelectorAll('.cf-volume-tier').forEach(function(n){ n.classList.remove('active'); });
        el.classList.add('active');
        var qtyInput = document.querySelector('[name="quantity"]');
        if(qtyInput) qtyInput.value = qty;
    };

    // Inject near add to cart
    var form = document.querySelector('form[action^="/cart/add"]');
    if(form) {
        var btn = form.querySelector('[type="submit"], [name="add"]');
        if(btn) form.insertBefore(document.getElementById('cf-volume'), btn);
    }
})();
</script>`;
}

function generateSpinWheel(config) {
    const { color = '#ec4899' } = config;
    return `<!-- ConvertFlow: Spin Wheel -->
<style>
.cf-spin-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:none;align-items:center;justify-content:center}
.cf-spin-modal{background:#fff;border-radius:24px;width:90%;max-width:800px;display:flex;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;animation:spinPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)}
.cf-spin-close{position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.05);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;color:#64748b;z-index:10}
.cf-spin-left{flex:1;background:radial-gradient(circle, ${color} 0%, #1e1b4b 100%);padding:40px;display:flex;align-items:center;justify-content:center;position:relative}
.cf-spin-wheel{width:280px;height:280px;border-radius:50%;border:8px solid #fff;background:conic-gradient(#fff 0 45deg, #f1f5f9 45deg 90deg, #fff 90deg 135deg, #f1f5f9 135deg 180deg, #fff 180deg 225deg, #f1f5f9 225deg 270deg, #fff 270deg 315deg, #f1f5f9 315deg 360deg);position:relative;transition:transform 4s cubic-bezier(0.2, 0.8, 0.2, 1);box-shadow:0 10px 25px rgba(0,0,0,0.3)}
.cf-spin-pointer{position:absolute;top:50%;right:-15px;transform:translateY(-50%);width:0;height:0;border-top:15px solid transparent;border-bottom:15px solid transparent;border-right:25px solid #ef4444;z-index:2;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))}
.cf-spin-right{flex:1;padding:48px 40px;font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center}
.cf-spin-title{font-size:32px;font-weight:900;color:#0f172a;margin:0 0 12px;line-height:1.2;text-transform:uppercase}
.cf-spin-desc{font-size:15px;color:#64748b;margin:0 0 24px;line-height:1.5}
.cf-spin-input{width:100%;padding:14px 16px;border:2px solid #e2e8f0;border-radius:12px;font-size:16px;outline:none;transition:border-color 0.2s;margin-bottom:16px}
.cf-spin-input:focus{border-color:${color}}
.cf-spin-btn{width:100%;padding:16px;background:${color};color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;transition:transform 0.1s;box-shadow:0 4px 14px ${color}60}
.cf-spin-btn:active{transform:scale(0.98)}
@keyframes spinPop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
@media (max-width:768px){.cf-spin-modal{flex-direction:column}.cf-spin-left{padding:30px}.cf-spin-wheel{width:220px;height:220px}.cf-spin-right{padding:30px 24px}}
</style>
<div class="cf-spin-overlay" id="cf-spin-overlay">
    <div class="cf-spin-modal">
        <button class="cf-spin-close" onclick="cfCloseSpin()">&times;</button>
        <div class="cf-spin-left">
            <div class="cf-spin-pointer"></div>
            <div class="cf-spin-wheel" id="cf-spin-wheel"></div>
        </div>
        <div class="cf-spin-right" id="cf-spin-form">
            <h2 class="cf-spin-title">Unlock an Exclusive Discount</h2>
            <p class="cf-spin-desc">Spin the wheel to win up to 20% OFF your entire order today! Enter your email to play.</p>
            <input type="email" id="cf-spin-email" class="cf-spin-input" placeholder="Enter your best email..." />
            <button class="cf-spin-btn" onclick="cfSpinIt()">Try My Luck</button>
        </div>
    </div>
</div>
<script>
window.cfCloseSpin = function() {
    document.getElementById('cf-spin-overlay').style.display='none';
    localStorage.setItem('cf_spin_seen', 'true');
};
window.cfSpinIt = function() {
    var email = document.getElementById('cf-spin-email').value;
    if(!email || !email.includes('@')) return alert('Please enter a valid email.');
    var wheel = document.getElementById('cf-spin-wheel');
    var form = document.getElementById('cf-spin-form');
    // Rotate 5 full times (1800deg) + land on winning slice
    wheel.style.transform = 'rotate(' + (1800 + 45) + 'deg)';
    setTimeout(function(){
        form.innerHTML = '<h2 class="cf-spin-title" style="color:${color}">🎉 YOU WON 15% OFF!</h2><p class="cf-spin-desc">Use code at checkout to claim your reward.</p><div style="background:#f1f5f9;padding:16px;font-size:24px;font-weight:900;text-align:center;border:2px dashed #cbd5e1;border-radius:12px;letter-spacing:2px;color:#0f172a">LUCKY15</div><button class="cf-spin-btn" style="margin-top:24px" onclick="cfCloseSpin()">Continue Shopping</button>';
    }, 4000);
};
if(!localStorage.getItem('cf_spin_seen')) {
    setTimeout(function(){ document.getElementById('cf-spin-overlay').style.display='flex'; }, Math.random() * 5000 + 5000);
}
</script>`;
}



// ═══ EXPORTS ═══

const WIDGET_GENERATORS = {
    'spending-goal': generateSpendingGoal,
    'back-to-top': generateBackToTop,
    'gdpr-cookie': generateGDPRCookie,
    'urgency-timer': generateUrgencyTimer,
    'announcement-bar': generateAnnouncementBar,
    'volume-discounts': generateVolumeDiscount,
    'spin-wheel': generateSpinWheel
};

export const loader = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const theme = await getActiveThemeId(admin, session);
        if (!theme) return json({ success: false, error: "No active theme" });

        const assetsUrl = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
        const assetsRes = await fetch(assetsUrl, { headers: { 'X-Shopify-Access-Token': session.accessToken } });
        const assetsData = await assetsRes.json();

        const installed = {};
        Object.keys(WIDGET_GENERATORS).forEach(id => {
            installed[id] = (assetsData.assets || []).some(a => a.key === `snippets/cf-${id}.liquid`);
        });

        return json({ success: true, themeName: theme.name, themeId: theme.id, installed });
    } catch (error) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
};

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
            const generator = WIDGET_GENERATORS[widgetId];
            if (!generator) return json({ success: false, error: "Unknown widget" });

            const html = generator(config);
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
        return json({ success: false, error: error.message }, { status: 500 });
    }
};
