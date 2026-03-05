export const cfTrustBadges = `
<style>
  .cf-trust {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
    border-top: 1px solid {{ section.settings.border_color }};
    border-bottom: 1px solid {{ section.settings.border_color }};
  }
  .cf-trust__inner {
    max-width: 1100px; margin: 0 auto; padding: 0 24px;
    display: grid;
    grid-template-columns: repeat({{ section.settings.columns }}, 1fr);
    gap: 24px;
  }
  .cf-trust__item {
    display: flex; align-items: center; gap: 16px;
    {% if section.settings.center_items %}justify-content: center;{% endif %}
  }
  .cf-trust__icon {
    flex-shrink: 0;
    width: {{ section.settings.icon_size }}px; height: {{ section.settings.icon_size }}px;
    background: {{ section.settings.icon_bg }};
    color: {{ section.settings.icon_color }};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .cf-trust__icon svg { width: 52%; height: 52%; }
  .cf-trust__text-wrap {}
  .cf-trust__title {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: 15px; font-weight: 700; color: {{ section.settings.title_color }};
    margin: 0 0 2px;
  }
  .cf-trust__desc {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 13px; color: {{ section.settings.desc_color }};
    margin: 0; line-height: 1.5;
  }
  @media(max-width: 768px) {
    .cf-trust__inner { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width: 480px) {
    .cf-trust__inner { grid-template-columns: 1fr; }
  }
</style>

{% assign icons = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z|M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z|M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4m4-4v4|M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z|M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" | split: "|" %}

<section class="cf-trust">
  <div class="cf-trust__inner">
    {% for block in section.blocks %}
      <div class="cf-trust__item" {{ block.shopify_attributes }}>
        <div class="cf-trust__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="{{ icons[forloop.index0] }}"/>
          </svg>
        </div>
        <div class="cf-trust__text-wrap">
          <p class="cf-trust__title">{{ block.settings.title }}</p>
          {% if block.settings.description != blank %}
            <p class="cf-trust__desc">{{ block.settings.description }}</p>
          {% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
</section>

{% schema %}
{
  "name": "CF Trust Badges",
  "tag": "section",
  "class": "cf-trust-section",
  "settings": [
    {"type":"range","id":"columns","min":2,"max":5,"step":1,"label":"Columns","default":4},
    {"type":"checkbox","id":"center_items","label":"Center items","default":false},
    {"type":"color","id":"bg_color","label":"Background","default":"#f9fafb"},
    {"type":"color","id":"border_color","label":"Border Color","default":"#e5e7eb"},
    {"type":"color","id":"icon_bg","label":"Icon Background","default":"#ede9fe"},
    {"type":"color","id":"icon_color","label":"Icon Color","default":"#7c3aed"},
    {"type":"color","id":"title_color","label":"Title Color","default":"#111827"},
    {"type":"color","id":"desc_color","label":"Description Color","default":"#6b7280"},
    {"type":"range","id":"icon_size","min":40,"max":80,"step":4,"unit":"px","label":"Icon Size","default":56},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":16,"max":80,"step":8,"unit":"px","label":"Padding Top","default":40},
    {"type":"range","id":"padding_bottom","min":16,"max":80,"step":8,"unit":"px","label":"Padding Bottom","default":40}
  ],
  "blocks": [
    {
      "type":"trust_item","name":"Trust Badge",
      "settings": [
        {"type":"text","id":"title","label":"Title","default":"Free Shipping"},
        {"type":"text","id":"description","label":"Description","default":"On all orders over $50"}
      ]
    }
  ],
  "presets": [{
    "name": "CF Trust Badges",
    "category": "ConvertFlow AI",
    "blocks": [
      {"type":"trust_item","settings":{"title":"Free Shipping","description":"On orders over $50"}},
      {"type":"trust_item","settings":{"title":"Secure Checkout","description":"256-bit SSL encryption"}},
      {"type":"trust_item","settings":{"title":"Easy Returns","description":"30-day hassle-free returns"}},
      {"type":"trust_item","settings":{"title":"Fast Delivery","description":"Ships within 24 hours"}}
    ]
  }]
}
{% endschema %}
`;
