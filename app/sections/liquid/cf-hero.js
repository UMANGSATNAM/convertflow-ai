export const cfHero = `
<style>
  .cf-hero {
    position: relative;
    min-height: {{ section.settings.min_height }}px;
    display: flex;
    align-items: center;
    overflow: hidden;
    background-color: {{ section.settings.bg_color }};
  }
  .cf-hero__bg {
    position: absolute; inset: 0; z-index: 0;
  }
  .cf-hero__bg img {
    width:100%; height:100%; object-fit:cover;
    {% if section.settings.overlay_opacity > 0 %}
    filter: brightness({{ 100 | minus: section.settings.overlay_opacity }}%);
    {% endif %}
  }
  .cf-hero__overlay {
    position:absolute;inset:0;z-index:1;
    background: {{ section.settings.overlay_color }};
    opacity: {{ section.settings.overlay_opacity | divided_by: 100.0 }};
  }
  .cf-hero__content {
    position:relative;z-index:2;
    max-width:1200px;margin:0 auto;padding:80px 24px;
    text-align: {{ section.settings.text_align }};
  }
  .cf-hero__eyebrow {
    display:inline-block;
    background:{{ section.settings.accent_color }};
    color:{{ section.settings.heading_color }};
    font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    padding:4px 14px;border-radius:50px;margin-bottom:20px;
    font-family:'{{ section.settings.font_family }}',sans-serif;
  }
  .cf-hero__heading {
    font-family:'{{ section.settings.font_family }}',sans-serif;
    font-size:clamp(2rem,5vw,{{ section.settings.heading_size }}px);
    font-weight:800;line-height:1.15;
    color:{{ section.settings.heading_color }};
    margin:0 0 20px;max-width:700px;
    {% if section.settings.text_align == 'center' %}margin-left:auto;margin-right:auto;{% endif %}
  }
  .cf-hero__subheading {
    font-family:'{{ section.settings.body_font }}',sans-serif;
    font-size:clamp(1rem,2vw,{{ section.settings.subheading_size }}px);
    color:{{ section.settings.subheading_color }};
    margin:0 0 36px;max-width:560px;line-height:1.6;
    {% if section.settings.text_align == 'center' %}margin-left:auto;margin-right:auto;{% endif %}
  }
  .cf-hero__buttons {
    display:flex;flex-wrap:wrap;gap:14px;
    {% if section.settings.text_align == 'center' %}justify-content:center;{% endif %}
  }
  .cf-hero__btn-primary {
    background:{{ section.settings.btn_bg }};
    color:{{ section.settings.btn_text_color }};
    font-family:'{{ section.settings.font_family }}',sans-serif;
    font-weight:700;font-size:16px;
    padding:16px 36px;border-radius:{{ section.settings.btn_radius }}px;
    text-decoration:none;display:inline-block;
    transition:transform .2s,box-shadow .2s;
    box-shadow:0 4px 20px rgba(0,0,0,0.2);
  }
  .cf-hero__btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,0.3);}
  .cf-hero__btn-secondary {
    color:{{ section.settings.heading_color }};
    font-family:'{{ section.settings.font_family }}',sans-serif;
    font-weight:600;font-size:16px;
    padding:16px 36px;border-radius:{{ section.settings.btn_radius }}px;
    border:2px solid {{ section.settings.heading_color }};
    text-decoration:none;display:inline-block;
    transition:background .2s,color .2s;
  }
  .cf-hero__btn-secondary:hover{background:{{ section.settings.heading_color }};color:{{ section.settings.bg_color }};}
  @media(max-width:768px){
    .cf-hero__content{padding:60px 20px;}
    .cf-hero__buttons{justify-content:center;}
    .cf-hero{min-height:auto!important;}
  }
</style>

<div class="cf-hero">
  {% if section.settings.bg_image != blank %}
    <div class="cf-hero__bg">
      {{ section.settings.bg_image | image_url: width: 1920 | image_tag: loading: 'eager', class: 'cf-hero__bg-img' }}
    </div>
    {% if section.settings.overlay_opacity > 0 %}
      <div class="cf-hero__overlay"></div>
    {% endif %}
  {% endif %}
  <div class="cf-hero__content">
    {% if section.settings.eyebrow != blank %}
      <div class="cf-hero__eyebrow">{{ section.settings.eyebrow }}</div>
    {% endif %}
    <h1 class="cf-hero__heading">{{ section.settings.heading }}</h1>
    {% if section.settings.subheading != blank %}
      <p class="cf-hero__subheading">{{ section.settings.subheading }}</p>
    {% endif %}
    <div class="cf-hero__buttons">
      {% if section.settings.btn1_text != blank %}
        <a href="{{ section.settings.btn1_url }}" class="cf-hero__btn-primary">{{ section.settings.btn1_text }}</a>
      {% endif %}
      {% if section.settings.btn2_text != blank %}
        <a href="{{ section.settings.btn2_url }}" class="cf-hero__btn-secondary">{{ section.settings.btn2_text }}</a>
      {% endif %}
    </div>
  </div>
</div>

{% schema %}
{
  "name": "CF Hero Banner",
  "tag": "section",
  "class": "cf-hero-section",
  "settings": [
    {"type":"header","content":"Content"},
    {"type":"text","id":"eyebrow","label":"Eyebrow Text","default":"New Collection 2025"},
    {"type":"richtext","id":"heading","label":"Heading","default":"<p>Build Your Dream Store In 60 Seconds</p>"},
    {"type":"richtext","id":"subheading","label":"Subheading","default":"<p>Premium quality products, fast delivery, and unbeatable prices.</p>"},
    {"type":"text","id":"btn1_text","label":"Primary Button Text","default":"Shop Now"},
    {"type":"url","id":"btn1_url","label":"Primary Button URL","default":"/collections/all"},
    {"type":"text","id":"btn2_text","label":"Secondary Button Text","default":"Learn More"},
    {"type":"url","id":"btn2_url","label":"Secondary Button URL","default":"/pages/about"},
    {"type":"select","id":"text_align","label":"Text Alignment","options":[{"value":"left","label":"Left"},{"value":"center","label":"Center"}],"default":"center"},
    {"type":"header","content":"Background"},
    {"type":"image_picker","id":"bg_image","label":"Background Image"},
    {"type":"color","id":"bg_color","label":"Background Color","default":"#0a0a0a"},
    {"type":"color","id":"overlay_color","label":"Overlay Color","default":"#000000"},
    {"type":"range","id":"overlay_opacity","min":0,"max":80,"step":5,"unit":"%","label":"Overlay Opacity","default":40},
    {"type":"range","id":"min_height","min":300,"max":900,"step":50,"unit":"px","label":"Minimum Height","default":600},
    {"type":"header","content":"Typography & Colors"},
    {"type":"color","id":"heading_color","label":"Heading Color","default":"#ffffff"},
    {"type":"color","id":"subheading_color","label":"Subheading Color","default":"#cccccc"},
    {"type":"color","id":"accent_color","label":"Eyebrow Accent Color","default":"#6366f1"},
    {"type":"range","id":"heading_size","min":32,"max":96,"step":4,"unit":"px","label":"Heading Size (desktop)","default":"64"},
    {"type":"range","id":"subheading_size","min":14,"max":28,"step":2,"unit":"px","label":"Subheading Size","default":"20"},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"header","content":"Buttons"},
    {"type":"color","id":"btn_bg","label":"Primary Button Color","default":"#6366f1"},
    {"type":"color","id":"btn_text_color","label":"Button Text Color","default":"#ffffff"},
    {"type":"range","id":"btn_radius","min":0,"max":50,"step":2,"unit":"px","label":"Button Border Radius","default":"8"}
  ],
  "presets": [{"name":"CF Hero Banner","category":"ConvertFlow AI"}]
}
{% endschema %}
`;
