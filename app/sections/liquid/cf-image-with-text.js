export const cfImageWithText = `
<style>
  .cf-img-text {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
  }
  .cf-img-text__inner {
    max-width: 1200px; margin: 0 auto; padding: 0 24px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: {{ section.settings.gap }}px;
    align-items: center;
    {% if section.settings.reverse %}direction: rtl;{% endif %}
  }
  .cf-img-text__inner > * { direction: ltr; }
  .cf-img-text__image {
    border-radius: {{ section.settings.img_radius }}px;
    overflow: hidden;
    {% if section.settings.img_shadow %}box-shadow: 0 20px 60px rgba(0,0,0,0.15);{% endif %}
    position: relative;
  }
  .cf-img-text__image img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cf-img-text__image-placeholder { aspect-ratio: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
  .cf-img-text__badge {
    position: absolute; top: 20px; left: 20px;
    background: {{ section.settings.accent_color }}; color: #fff;
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    padding: 6px 16px; border-radius: 50px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-img-text__content { display: flex; flex-direction: column; gap: 20px; }
  .cf-img-text__eyebrow {
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
    color: {{ section.settings.accent_color }};
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-img-text__heading {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.5rem, 3vw, {{ section.settings.heading_size }}px);
    font-weight: 800; color: {{ section.settings.heading_color }}; margin: 0; line-height: 1.2;
  }
  .cf-img-text__body {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 16px; color: {{ section.settings.body_color }}; line-height: 1.75; margin: 0;
  }
  .cf-img-text__features { display: flex; flex-direction: column; gap: 12px; }
  .cf-img-text__feature {
    display: flex; align-items: flex-start; gap: 12px;
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 15px; color: {{ section.settings.body_color }};
  }
  .cf-img-text__check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    background: {{ section.settings.accent_color }}; color: #fff;
    display: flex; align-items: center; justify-content: center; margin-top: 2px;
  }
  .cf-img-text__check svg { width: 12px; height: 12px; stroke: #fff; stroke-width: 3; }
  .cf-img-text__btn {
    display: inline-block; padding: 14px 32px;
    background: {{ section.settings.btn_bg }}; color: {{ section.settings.btn_text }};
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-weight: 700; font-size: 15px; border-radius: {{ section.settings.btn_radius }}px;
    text-decoration: none; width: fit-content;
    transition: transform .2s, box-shadow .2s;
  }
  .cf-img-text__btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
  @media(max-width: 768px) {
    .cf-img-text__inner { grid-template-columns: 1fr !important; direction: ltr !important; }
  }
</style>

<section class="cf-img-text">
  <div class="cf-img-text__inner">
    <div class="cf-img-text__image">
      {% if section.settings.image != blank %}
        {{ section.settings.image | image_url: width: 800 | image_tag: loading: 'lazy', alt: section.settings.heading }}
      {% else %}
        <div class="cf-img-text__image-placeholder">
          {{ 'lifestyle-2' | placeholder_svg_tag: 'cf-placeholder' }}
        </div>
      {% endif %}
      {% if section.settings.badge != blank %}
        <div class="cf-img-text__badge">{{ section.settings.badge }}</div>
      {% endif %}
    </div>
    <div class="cf-img-text__content">
      {% if section.settings.eyebrow != blank %}
        <div class="cf-img-text__eyebrow">{{ section.settings.eyebrow }}</div>
      {% endif %}
      <h2 class="cf-img-text__heading">{{ section.settings.heading }}</h2>
      {% if section.settings.body != blank %}
        <div class="cf-img-text__body">{{ section.settings.body }}</div>
      {% endif %}
      {% assign features = section.settings.features | split: "|" %}
      {% if features.size > 0 and section.settings.features != blank %}
        <div class="cf-img-text__features">
          {% for feature in features %}
            <div class="cf-img-text__feature">
              <div class="cf-img-text__check">
                <svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <span>{{ feature | strip }}</span>
            </div>
          {% endfor %}
        </div>
      {% endif %}
      {% if section.settings.btn_text != blank %}
        <a href="{{ section.settings.btn_url }}" class="cf-img-text__btn">{{ section.settings.btn_text }}</a>
      {% endif %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "CF Image With Text",
  "tag": "section",
  "class": "cf-img-text-section",
  "settings": [
    {"type":"image_picker","id":"image","label":"Image"},
    {"type":"text","id":"badge","label":"Image Badge (optional)","default":""},
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Why Choose Us"},
    {"type":"text","id":"heading","label":"Heading","default":"Premium Quality You Can Feel"},
    {"type":"richtext","id":"body","label":"Body","default":"<p>Every product is carefully crafted with premium materials and designed to last. We believe quality shouldn't cost a fortune.</p>"},
    {"type":"textarea","id":"features","label":"Feature List (separate by |)","default":"100% Premium Materials | Ethically Sourced | 2-Year Warranty"},
    {"type":"text","id":"btn_text","label":"Button Text","default":"Discover More"},
    {"type":"url","id":"btn_url","label":"Button URL","default":"/collections/all"},
    {"type":"checkbox","id":"reverse","label":"Reverse Layout (text first)","default":false},
    {"type":"color","id":"bg_color","label":"Background","default":"#ffffff"},
    {"type":"color","id":"heading_color","label":"Heading Color","default":"#0f172a"},
    {"type":"color","id":"body_color","label":"Body Color","default":"#4b5563"},
    {"type":"color","id":"accent_color","label":"Accent Color","default":"#7c3aed"},
    {"type":"color","id":"btn_bg","label":"Button Color","default":"#7c3aed"},
    {"type":"color","id":"btn_text","label":"Button Text Color","default":"#ffffff"},
    {"type":"range","id":"heading_size","min":24,"max":60,"step":4,"unit":"px","label":"Heading Size","default":"40"},
    {"type":"range","id":"img_radius","min":0,"max":32,"step":4,"unit":"px","label":"Image Radius","default":16},
    {"type":"range","id":"btn_radius","min":0,"max":50,"step":2,"unit":"px","label":"Button Radius","default":8},
    {"type":"range","id":"gap","min":20,"max":100,"step":10,"unit":"px","label":"Gap","default":60},
    {"type":"checkbox","id":"img_shadow","label":"Image Shadow","default":true},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":40,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":40,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "presets": [{"name":"CF Image With Text","category":"ConvertFlow AI"}]
}
{% endschema %}
`;

export const cfFaq = `
<style>
  .cf-faq {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
  }
  .cf-faq__inner { max-width: {{ section.settings.max_width }}px; margin: 0 auto; padding: 0 24px; }
  .cf-faq__header { text-align: {{ section.settings.header_align }}; margin-bottom: 48px; }
  .cf-faq__eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: {{ section.settings.accent_color }}; margin-bottom: 12px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-faq__title {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.5rem, 3vw, {{ section.settings.title_size }}px);
    font-weight: 800; color: {{ section.settings.title_color }}; margin: 0;
  }
  .cf-faq__list { display: flex; flex-direction: column; gap: 12px; }
  .cf-faq__item {
    background: {{ section.settings.item_bg }};
    border: 1px solid {{ section.settings.item_border }};
    border-radius: {{ section.settings.item_radius }}px;
    overflow: hidden;
  }
  .cf-faq__q {
    width: 100%; background: none; border: none;
    padding: 20px 24px; text-align: left; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: {{ section.settings.q_size }}px; font-weight: 700;
    color: {{ section.settings.q_color }};
  }
  .cf-faq__icon {
    flex-shrink: 0; width: 24px; height: 24px;
    border-radius: 50%; background: {{ section.settings.accent_color }}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    transition: transform .3s;
  }
  .cf-faq__icon svg { width: 14px; height: 14px; stroke: #fff; stroke-width: 2.5; }
  .cf-faq__item.open .cf-faq__icon { transform: rotate(45deg); }
  .cf-faq__a {
    padding: 0 24px;
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 15px; color: {{ section.settings.a_color }}; line-height: 1.7;
    max-height: 0; overflow: hidden; transition: max-height .35s ease, padding .35s;
  }
  .cf-faq__item.open .cf-faq__a { max-height: 400px; padding: 0 24px 20px; }
</style>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cf-faq__q').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.cf-faq__item');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.cf-faq__item.open').forEach(function(el) { el.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });
    });
  });
</script>

<section class="cf-faq">
  <div class="cf-faq__inner">
    <div class="cf-faq__header">
      {% if section.settings.eyebrow != blank %}
        <div class="cf-faq__eyebrow">{{ section.settings.eyebrow }}</div>
      {% endif %}
      <h2 class="cf-faq__title">{{ section.settings.title }}</h2>
    </div>
    <div class="cf-faq__list">
      {% for block in section.blocks %}
        <div class="cf-faq__item" {{ block.shopify_attributes }}>
          <button class="cf-faq__q">
            {{ block.settings.question }}
            <span class="cf-faq__icon">
              <svg viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke-linecap="round"/></svg>
            </span>
          </button>
          <div class="cf-faq__a">{{ block.settings.answer }}</div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "CF FAQ",
  "tag": "section",
  "class": "cf-faq-section",
  "settings": [
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"FAQ"},
    {"type":"text","id":"title","label":"Title","default":"Frequently Asked Questions"},
    {"type":"select","id":"header_align","label":"Header Alignment","options":[{"value":"left","label":"Left"},{"value":"center","label":"Center"}],"default":"center"},
    {"type":"range","id":"max_width","min":600,"max":1000,"step":50,"unit":"px","label":"Max Width","default":800},
    {"type":"color","id":"bg_color","label":"Background","default":"#f8fafc"},
    {"type":"color","id":"item_bg","label":"Item Background","default":"#ffffff"},
    {"type":"color","id":"item_border","label":"Item Border","default":"#e2e8f0"},
    {"type":"color","id":"accent_color","label":"Accent Color","default":"#7c3aed"},
    {"type":"color","id":"title_color","label":"Title Color","default":"#0f172a"},
    {"type":"color","id":"q_color","label":"Question Color","default":"#1e293b"},
    {"type":"color","id":"a_color","label":"Answer Color","default":"#475569"},
    {"type":"range","id":"title_size","min":20,"max":52,"step":2,"unit":"px","label":"Title Size","default":"36"},
    {"type":"range","id":"q_size","min":14,"max":20,"step":1,"unit":"px","label":"Question Font Size","default":16},
    {"type":"range","id":"item_radius","min":0,"max":20,"step":2,"unit":"px","label":"Item Radius","default":12},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":40,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":40,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "blocks": [
    {"type":"faq_item","name":"FAQ Item","settings":[
      {"type":"text","id":"question","label":"Question","default":"What is your return policy?"},
      {"type":"richtext","id":"answer","label":"Answer","default":"<p>We offer a 30-day hassle-free return policy. Just contact our support team and we'll sort it out right away.</p>"}
    ]}
  ],
  "presets": [{"name":"CF FAQ","category":"ConvertFlow AI","blocks":[
    {"type":"faq_item","settings":{"question":"What is your return policy?","answer":"<p>We offer a full 30-day return policy. No questions asked.</p>"}},
    {"type":"faq_item","settings":{"question":"How long does shipping take?","answer":"<p>Standard shipping takes 3-5 business days. Express shipping available at checkout.</p>"}},
    {"type":"faq_item","settings":{"question":"Do you ship internationally?","answer":"<p>Yes! We ship to over 50 countries worldwide. Shipping costs are calculated at checkout.</p>"}},
    {"type":"faq_item","settings":{"question":"Is my payment information secure?","answer":"<p>Absolutely. We use 256-bit SSL encryption and never store your card details.</p>"}}
  ]}]
}
{% endschema %}
`;

export const cfFooterCta = `
<style>
  .cf-footer-cta {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
    text-align: center;
    position: relative; overflow: hidden;
  }
  .cf-footer-cta::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 150%, {{ section.settings.glow_color }}44 0%, transparent 70%);
    pointer-events: none;
  }
  .cf-footer-cta__inner { max-width: 700px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
  .cf-footer-cta__eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: {{ section.settings.accent_color }}; margin-bottom: 16px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-footer-cta__heading {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.8rem, 5vw, {{ section.settings.heading_size }}px);
    font-weight: 900; color: {{ section.settings.heading_color }};
    margin: 0 0 16px; line-height: 1.15;
  }
  .cf-footer-cta__subtitle {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 18px; color: {{ section.settings.subtitle_color }}; margin: 0 0 40px; line-height: 1.6;
  }
  .cf-footer-cta__buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .cf-footer-cta__btn-primary {
    display: inline-block; padding: 18px 48px;
    background: {{ section.settings.btn_bg }}; color: {{ section.settings.btn_text }};
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-weight: 800; font-size: 17px; border-radius: {{ section.settings.btn_radius }}px;
    text-decoration: none; box-shadow: 0 8px 30px {{ section.settings.btn_bg }}66;
    transition: transform .2s, box-shadow .2s;
  }
  .cf-footer-cta__btn-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 40px {{ section.settings.btn_bg }}88; }
  .cf-footer-cta__btn-secondary {
    display: inline-block; padding: 18px 40px;
    border: 2px solid {{ section.settings.heading_color }}44; color: {{ section.settings.heading_color }};
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-weight: 700; font-size: 17px; border-radius: {{ section.settings.btn_radius }}px;
    text-decoration: none; transition: background .2s;
  }
  .cf-footer-cta__btn-secondary:hover { background: {{ section.settings.heading_color }}11; }
  @media(max-width: 480px) { .cf-footer-cta__buttons { flex-direction: column; align-items: center; } }
</style>

<section class="cf-footer-cta">
  <div class="cf-footer-cta__inner">
    {% if section.settings.eyebrow != blank %}
      <div class="cf-footer-cta__eyebrow">{{ section.settings.eyebrow }}</div>
    {% endif %}
    <h2 class="cf-footer-cta__heading">{{ section.settings.heading }}</h2>
    {% if section.settings.subtitle != blank %}
      <p class="cf-footer-cta__subtitle">{{ section.settings.subtitle }}</p>
    {% endif %}
    <div class="cf-footer-cta__buttons">
      <a href="{{ section.settings.btn1_url }}" class="cf-footer-cta__btn-primary">{{ section.settings.btn1_text }}</a>
      {% if section.settings.btn2_text != blank %}
        <a href="{{ section.settings.btn2_url }}" class="cf-footer-cta__btn-secondary">{{ section.settings.btn2_text }}</a>
      {% endif %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "CF Footer CTA",
  "tag": "section",
  "class": "cf-footer-cta-section",
  "settings": [
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Ready to Start?"},
    {"type":"text","id":"heading","label":"Heading","default":"Transform Your Store Today"},
    {"type":"text","id":"subtitle","label":"Subtitle","default":"Join thousands of merchants who grew their sales with premium store design."},
    {"type":"text","id":"btn1_text","label":"Primary Button","default":"Shop All Products"},
    {"type":"url","id":"btn1_url","label":"Primary Button URL","default":"/collections/all"},
    {"type":"text","id":"btn2_text","label":"Secondary Button","default":"Learn More"},
    {"type":"url","id":"btn2_url","label":"Secondary Button URL","default":"/pages/about"},
    {"type":"color","id":"bg_color","label":"Background","default":"#0f172a"},
    {"type":"color","id":"heading_color","label":"Heading Color","default":"#ffffff"},
    {"type":"color","id":"subtitle_color","label":"Subtitle Color","default":"#94a3b8"},
    {"type":"color","id":"accent_color","label":"Eyebrow Color","default":"#a5b4fc"},
    {"type":"color","id":"btn_bg","label":"Button Background","default":"#6366f1"},
    {"type":"color","id":"btn_text","label":"Button Text Color","default":"#ffffff"},
    {"type":"color","id":"glow_color","label":"Glow Effect Color","default":"#6366f1"},
    {"type":"range","id":"heading_size","min":28,"max":80,"step":4,"unit":"px","label":"Heading Size","default":56},
    {"type":"range","id":"btn_radius","min":0,"max":50,"step":4,"unit":"px","label":"Button Radius","default":12},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":60,"max":160,"step":10,"unit":"px","label":"Padding Top","default":100},
    {"type":"range","id":"padding_bottom","min":60,"max":160,"step":10,"unit":"px","label":"Padding Bottom","default":100}
  ],
  "presets": [{"name":"CF Footer CTA","category":"ConvertFlow AI"}]
}
{% endschema %}
`;
