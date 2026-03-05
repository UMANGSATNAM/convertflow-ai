export const cfTestimonials = `
<style>
  .cf-reviews {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
  }
  .cf-reviews__inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .cf-reviews__header { text-align: center; margin-bottom: 56px; }
  .cf-reviews__eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: {{ section.settings.accent_color }}; margin-bottom: 12px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-reviews__title {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.6rem, 3vw, {{ section.settings.title_size }}px);
    font-weight: 800; color: {{ section.settings.title_color }}; margin: 0 0 8px;
  }
  .cf-reviews__stars-total {
    font-size: 14px; color: {{ section.settings.desc_color }};
    font-family: '{{ section.settings.body_font }}', sans-serif;
  }
  .cf-reviews__grid {
    display: grid;
    grid-template-columns: repeat({{ section.settings.columns }}, 1fr);
    gap: {{ section.settings.gap }}px;
  }
  .cf-review-card {
    background: {{ section.settings.card_bg }};
    border-radius: {{ section.settings.card_radius }}px;
    padding: 28px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border: 1px solid {{ section.settings.card_border }};
    display: flex; flex-direction: column; gap: 16px;
  }
  .cf-review-card__stars { color: {{ section.settings.star_color }}; font-size: 18px; letter-spacing: 2px; }
  .cf-review-card__text {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 15px; line-height: 1.7; color: {{ section.settings.text_color }};
    font-style: italic; flex: 1;
  }
  .cf-review-card__author { display: flex; align-items: center; gap: 12px; }
  .cf-review-card__avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: {{ section.settings.accent_color }}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
    flex-shrink: 0;
  }
  .cf-review-card__name {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: 14px; font-weight: 700; color: {{ section.settings.title_color }};
  }
  .cf-review-card__meta {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 12px; color: {{ section.settings.desc_color }};
  }
  .cf-review-card__verified {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: #16a34a; font-weight: 600;
    font-family: '{{ section.settings.body_font }}', sans-serif;
  }
  @media(max-width: 900px) { .cf-reviews__grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width: 560px) { .cf-reviews__grid { grid-template-columns: 1fr; } }
</style>

<section class="cf-reviews">
  <div class="cf-reviews__inner">
    <div class="cf-reviews__header">
      {% if section.settings.eyebrow != blank %}
        <div class="cf-reviews__eyebrow">{{ section.settings.eyebrow }}</div>
      {% endif %}
      <h2 class="cf-reviews__title">{{ section.settings.title }}</h2>
      <p class="cf-reviews__stars-total">★★★★★ &nbsp;{{ section.settings.avg_rating }} out of 5 — <strong>{{ section.settings.review_count }}+ verified reviews</strong></p>
    </div>
    <div class="cf-reviews__grid">
      {% for block in section.blocks %}
        <div class="cf-review-card" {{ block.shopify_attributes }}>
          <div class="cf-review-card__stars">★★★★★</div>
          <p class="cf-review-card__text">"{{ block.settings.review_text }}"</p>
          <div class="cf-review-card__author">
            <div class="cf-review-card__avatar">{{ block.settings.author_name | slice: 0 }}</div>
            <div>
              <div class="cf-review-card__name">{{ block.settings.author_name }}</div>
              <div class="cf-review-card__meta">{{ block.settings.author_meta }}</div>
              {% if block.settings.verified %}
                <div class="cf-review-card__verified">
                  <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px;stroke:#16a34a;stroke-width:2.5;">
                    <path d="M3 8l4 4 6-6"/>
                  </svg> Verified Purchase
                </div>
              {% endif %}
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "CF Testimonials",
  "tag": "section",
  "class": "cf-reviews-section",
  "settings": [
    {"type":"header","content":"Header"},
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Customer Reviews"},
    {"type":"text","id":"title","label":"Title","default":"What Our Customers Are Saying"},
    {"type":"text","id":"avg_rating","label":"Average Rating","default":"4.9"},
    {"type":"text","id":"review_count","label":"Review Count Text","default":"2,400"},
    {"type":"header","content":"Layout"},
    {"type":"range","id":"columns","min":1,"max":4,"step":1,"label":"Columns","default":3},
    {"type":"range","id":"gap","min":12,"max":40,"step":4,"unit":"px","label":"Card Gap","default":24},
    {"type":"header","content":"Colors"},
    {"type":"color","id":"bg_color","label":"Background","default":"#f8fafc"},
    {"type":"color","id":"card_bg","label":"Card Background","default":"#ffffff"},
    {"type":"color","id":"card_border","label":"Card Border","default":"#e2e8f0"},
    {"type":"color","id":"accent_color","label":"Accent / Avatar BG","default":"#6366f1"},
    {"type":"color","id":"star_color","label":"Star Color","default":"#f59e0b"},
    {"type":"color","id":"title_color","label":"Title Color","default":"#0f172a"},
    {"type":"color","id":"text_color","label":"Review Text Color","default":"#374151"},
    {"type":"color","id":"desc_color","label":"Meta Color","default":"#9ca3af"},
    {"type":"range","id":"card_radius","min":0,"max":24,"step":2,"unit":"px","label":"Card Radius","default":16},
    {"type":"range","id":"title_size","min":24,"max":56,"step":2,"unit":"px","label":"Title Size","default":"36"},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":40,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":40,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "blocks": [
    {
      "type": "review",
      "name": "Review",
      "settings": [
        {"type":"textarea","id":"review_text","label":"Review Text","default":"Absolutely love this product! The quality exceeded my expectations."},
        {"type":"text","id":"author_name","label":"Customer Name","default":"Sarah M."},
        {"type":"text","id":"author_meta","label":"Customer Info","default":"Verified Buyer · New York, USA"},
        {"type":"checkbox","id":"verified","label":"Show Verified Badge","default":true}
      ]
    }
  ],
  "presets": [{
    "name":"CF Testimonials","category":"ConvertFlow AI",
    "blocks":[
      {"type":"review","settings":{"review_text":"This completely changed my mornings. Best purchase I've made all year!","author_name":"Jessica K.","author_meta":"Verified Buyer · London, UK","verified":true}},
      {"type":"review","settings":{"review_text":"Incredible quality. I've ordered 3 times already and never disappointed.","author_name":"Marcus T.","author_meta":"Verified Buyer · Toronto, CA","verified":true}},
      {"type":"review","settings":{"review_text":"Fast shipping, beautiful packaging, and the product is even better in person!","author_name":"Priya S.","author_meta":"Verified Buyer · Dubai, UAE","verified":true}}
    ]
  }]
}
{% endschema %}
`;
