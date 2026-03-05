export const cfFeaturedCollection = `
<style>
  .cf-collection {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
  }
  .cf-collection__inner { max-width:1200px;margin:0 auto;padding:0 24px; }
  .cf-collection__header { text-align:{{ section.settings.header_align }};margin-bottom:48px; }
  .cf-collection__eyebrow {
    display:inline-block;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    color:{{ section.settings.accent_color }};margin-bottom:12px;
    font-family:'{{ section.settings.font_family }}',sans-serif;
  }
  .cf-collection__title {
    font-family:'{{ section.settings.font_family }}',sans-serif;
    font-size:clamp(1.6rem,3vw,{{ section.settings.title_size }}px);
    font-weight:800;color:{{ section.settings.title_color }};margin:0 0 14px;
  }
  .cf-collection__subtitle {
    font-family:'{{ section.settings.body_font }}',sans-serif;
    font-size:16px;color:{{ section.settings.subtitle_color }};margin:0;max-width:540px;
    {% if section.settings.header_align == 'center' %}margin:0 auto;{% endif %}
  }
  .cf-collection__grid {
    display:grid;
    grid-template-columns:repeat({{ section.settings.columns }},1fr);
    gap:{{ section.settings.gap }}px;
  }
  .cf-product-card {
    background:{{ section.settings.card_bg }};
    border-radius:{{ section.settings.card_radius }}px;
    overflow:hidden;
    transition:transform .25s,box-shadow .25s;
    box-shadow:0 2px 12px rgba(0,0,0,0.06);
  }
  .cf-product-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.12);}
  .cf-product-card__img-wrap {
    position:relative;aspect-ratio:1;overflow:hidden;background:#f5f5f5;
  }
  .cf-product-card__img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .4s;}
  .cf-product-card:hover .cf-product-card__img-wrap img{transform:scale(1.05);}
  .cf-product-card__badge {
    position:absolute;top:12px;left:12px;
    background:{{ section.settings.badge_color }};color:#fff;
    font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px;
    font-family:'{{ section.settings.font_family }}',sans-serif;text-transform:uppercase;letter-spacing:1px;
  }
  .cf-product-card__body{padding:16px;}
  .cf-product-card__vendor {
    font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
    color:{{ section.settings.accent_color }};margin-bottom:6px;
    font-family:'{{ section.settings.body_font }}',sans-serif;
  }
  .cf-product-card__title {
    font-family:'{{ section.settings.font_family }}',sans-serif;
    font-size:16px;font-weight:700;color:{{ section.settings.title_color }};
    margin:0 0 8px;line-height:1.3;
  }
  .cf-product-card__price {
    font-family:'{{ section.settings.body_font }}',sans-serif;
    font-size:18px;font-weight:800;color:{{ section.settings.price_color }};
    display:flex;align-items:center;gap:8px;
  }
  .cf-product-card__compare{font-size:14px;color:#999;text-decoration:line-through;font-weight:400;}
  .cf-product-card__btn {
    display:block;margin-top:14px;padding:12px;text-align:center;
    background:{{ section.settings.btn_color }};color:{{ section.settings.btn_text }};
    border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;
    font-family:'{{ section.settings.font_family }}',sans-serif;
    transition:opacity .2s;
  }
  .cf-product-card__btn:hover{opacity:.85;}
  .cf-collection__footer{text-align:center;margin-top:48px;}
  .cf-collection__view-all {
    display:inline-block;padding:14px 40px;
    border:2px solid {{ section.settings.accent_color }};
    color:{{ section.settings.accent_color }};border-radius:50px;
    font-weight:700;font-size:15px;text-decoration:none;
    font-family:'{{ section.settings.font_family }}',sans-serif;
    transition:background .2s,color .2s;
  }
  .cf-collection__view-all:hover{background:{{ section.settings.accent_color }};color:#fff;}
  @media(max-width:900px){.cf-collection__grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:520px){.cf-collection__grid{grid-template-columns:1fr;}}
</style>

<section class="cf-collection">
  <div class="cf-collection__inner">
    <div class="cf-collection__header">
      {% if section.settings.eyebrow != blank %}
        <div class="cf-collection__eyebrow">{{ section.settings.eyebrow }}</div>
      {% endif %}
      {% if section.settings.title != blank %}
        <h2 class="cf-collection__title">{{ section.settings.title }}</h2>
      {% endif %}
      {% if section.settings.subtitle != blank %}
        <p class="cf-collection__subtitle">{{ section.settings.subtitle }}</p>
      {% endif %}
    </div>

    {% assign col = collections[section.settings.collection] %}
    {% if col %}
      <div class="cf-collection__grid">
        {% for product in col.products limit: section.settings.products_count %}
          <a href="{{ product.url }}" class="cf-product-card">
            <div class="cf-product-card__img-wrap">
              {% if product.featured_image %}
                {{ product.featured_image | image_url: width: 600 | image_tag: loading: 'lazy', alt: product.title }}
              {% else %}
                {{ 'product-1' | placeholder_svg_tag: 'cf-placeholder-img' }}
              {% endif %}
              {% if product.compare_at_price > product.price %}
                <div class="cf-product-card__badge">Sale</div>
              {% elsif product.tags contains 'new' %}
                <div class="cf-product-card__badge">New</div>
              {% endif %}
            </div>
            <div class="cf-product-card__body">
              {% if product.vendor != blank %}
                <div class="cf-product-card__vendor">{{ product.vendor }}</div>
              {% endif %}
              <div class="cf-product-card__title">{{ product.title }}</div>
              <div class="cf-product-card__price">
                {{ product.price | money }}
                {% if product.compare_at_price > product.price %}
                  <span class="cf-product-card__compare">{{ product.compare_at_price | money }}</span>
                {% endif %}
              </div>
              <div class="cf-product-card__btn">{{ section.settings.btn_label }}</div>
            </div>
          </a>
        {% endfor %}
      </div>
    {% else %}
      <div class="cf-collection__grid">
        {% for i in (1..section.settings.products_count) %}
          <div class="cf-product-card">
            <div class="cf-product-card__img-wrap">
              {{ 'product-' | append: i | placeholder_svg_tag: 'cf-placeholder-img' }}
            </div>
            <div class="cf-product-card__body">
              <div class="cf-product-card__vendor">Your Brand</div>
              <div class="cf-product-card__title">Sample Product {{ i }}</div>
              <div class="cf-product-card__price">$49.99</div>
              <div class="cf-product-card__btn">{{ section.settings.btn_label }}</div>
            </div>
          </div>
        {% endfor %}
      </div>
    {% endif %}

    {% if section.settings.show_view_all and section.settings.collection != blank %}
      <div class="cf-collection__footer">
        <a href="{{ col.url }}" class="cf-collection__view-all">{{ section.settings.view_all_label }}</a>
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "CF Featured Collection",
  "tag": "section",
  "class": "cf-collection-section",
  "settings": [
    {"type":"header","content":"Content"},
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Best Sellers"},
    {"type":"text","id":"title","label":"Section Title","default":"Our Most Popular Products"},
    {"type":"text","id":"subtitle","label":"Subtitle","default":"Handpicked favorites loved by thousands of customers"},
    {"type":"select","id":"header_align","label":"Header Alignment","options":[{"value":"left","label":"Left"},{"value":"center","label":"Center"}],"default":"center"},
    {"type":"collection","id":"collection","label":"Collection to Display"},
    {"type":"range","id":"products_count","min":2,"max":8,"step":1,"label":"Number of Products","default":4},
    {"type":"range","id":"columns","min":2,"max":4,"step":1,"label":"Columns (desktop)","default":4},
    {"type":"range","id":"gap","min":8,"max":40,"step":4,"unit":"px","label":"Gap Between Cards","default":20},
    {"type":"text","id":"btn_label","label":"Card Button Label","default":"Shop Now"},
    {"type":"checkbox","id":"show_view_all","label":"Show View All Button","default":true},
    {"type":"text","id":"view_all_label","label":"View All Label","default":"View All Products"},
    {"type":"header","content":"Colors & Fonts"},
    {"type":"color","id":"bg_color","label":"Section Background","default":"#ffffff"},
    {"type":"color","id":"card_bg","label":"Card Background","default":"#ffffff"},
    {"type":"color","id":"title_color","label":"Title Color","default":"#111111"},
    {"type":"color","id":"subtitle_color","label":"Subtitle Color","default":"#555555"},
    {"type":"color","id":"accent_color","label":"Accent / Button Color","default":"#6366f1"},
    {"type":"color","id":"price_color","label":"Price Color","default":"#111111"},
    {"type":"color","id":"badge_color","label":"Badge Color","default":"#ef4444"},
    {"type":"color","id":"btn_color","label":"Add to Cart Button BG","default":"#111111"},
    {"type":"color","id":"btn_text","label":"Add to Cart Button Text","default":"#ffffff"},
    {"type":"range","id":"card_radius","min":0,"max":24,"step":2,"unit":"px","label":"Card Border Radius","default":12},
    {"type":"range","id":"title_size","min":24,"max":60,"step":2,"unit":"px","label":"Title Size","default":"36"},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"header","content":"Spacing"},
    {"type":"range","id":"padding_top","min":20,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":20,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "presets": [{"name":"CF Featured Collection","category":"ConvertFlow AI"}]
}
{% endschema %}
`;
