export const cfRichText = `
<style>
  .cf-rich-text {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
    text-align: {{ section.settings.align }};
  }
  .cf-rich-text__inner {
    max-width: {{ section.settings.content_width }}px;
    margin: 0 auto; padding: 0 24px;
  }
  .cf-rich-text__eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: {{ section.settings.accent_color }}; margin-bottom: 16px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-rich-text__heading {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.6rem, 3vw, {{ section.settings.heading_size }}px);
    font-weight: 800; color: {{ section.settings.heading_color }};
    margin: 0 0 20px; line-height: 1.25;
  }
  .cf-rich-text__body {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: {{ section.settings.body_size }}px; color: {{ section.settings.body_color }};
    line-height: 1.8; margin: 0 0 32px;
  }
  .cf-rich-text__btn {
    display: inline-block;
    background: {{ section.settings.btn_bg }};
    color: {{ section.settings.btn_text }};
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-weight: 700; font-size: 15px;
    padding: 14px 36px; border-radius: {{ section.settings.btn_radius }}px;
    text-decoration: none; transition: transform .2s, box-shadow .2s;
  }
  .cf-rich-text__btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
  @media(max-width: 640px) { .cf-rich-text { text-align: left !important; } }
</style>

<section class="cf-rich-text">
  <div class="cf-rich-text__inner">
    {% if section.settings.eyebrow != blank %}
      <div class="cf-rich-text__eyebrow">{{ section.settings.eyebrow }}</div>
    {% endif %}
    {% if section.settings.heading != blank %}
      <h2 class="cf-rich-text__heading">{{ section.settings.heading }}</h2>
    {% endif %}
    {% if section.settings.body != blank %}
      <div class="cf-rich-text__body">{{ section.settings.body }}</div>
    {% endif %}
    {% if section.settings.btn_text != blank %}
      <a href="{{ section.settings.btn_url }}" class="cf-rich-text__btn">{{ section.settings.btn_text }}</a>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "CF Rich Text",
  "tag": "section",
  "class": "cf-rich-text-section",
  "settings": [
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Our Story"},
    {"type":"text","id":"heading","label":"Heading","default":"Built With Passion, Delivered With Care"},
    {"type":"richtext","id":"body","label":"Body Text","default":"<p>We started because we believe every person deserves access to premium quality products at fair prices. Our mission is simple: make your everyday life better.</p>"},
    {"type":"text","id":"btn_text","label":"Button Text","default":"Learn Our Story"},
    {"type":"url","id":"btn_url","label":"Button URL","default":"/pages/about"},
    {"type":"select","id":"align","label":"Text Alignment","options":[{"value":"left","label":"Left"},{"value":"center","label":"Center"}],"default":"center"},
    {"type":"range","id":"content_width","min":480,"max":900,"step":20,"unit":"px","label":"Content Max Width","default":700},
    {"type":"color","id":"bg_color","label":"Background","default":"#ffffff"},
    {"type":"color","id":"accent_color","label":"Eyebrow Color","default":"#7c3aed"},
    {"type":"color","id":"heading_color","label":"Heading Color","default":"#0f172a"},
    {"type":"color","id":"body_color","label":"Body Color","default":"#4b5563"},
    {"type":"color","id":"btn_bg","label":"Button Background","default":"#7c3aed"},
    {"type":"color","id":"btn_text","label":"Button Text Color","default":"#ffffff"},
    {"type":"range","id":"heading_size","min":24,"max":64,"step":4,"unit":"px","label":"Heading Size","default":40},
    {"type":"range","id":"body_size","min":14,"max":20,"step":1,"unit":"px","label":"Body Font Size","default":17},
    {"type":"range","id":"btn_radius","min":0,"max":50,"step":2,"unit":"px","label":"Button Radius","default":8},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":40,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":40,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "presets": [{"name":"CF Rich Text","category":"ConvertFlow AI"}]
}
{% endschema %}
`;

export const cfNewsletter = `
<style>
  .cf-newsletter {
    padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
    background: {{ section.settings.bg_color }};
  }
  .cf-newsletter__inner {
    max-width: 620px; margin: 0 auto; padding: 0 24px; text-align: center;
  }
  .cf-newsletter__eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: {{ section.settings.accent_color }}; margin-bottom: 12px;
    font-family: '{{ section.settings.font_family }}', sans-serif;
  }
  .cf-newsletter__title {
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-size: clamp(1.4rem, 3vw, {{ section.settings.title_size }}px);
    font-weight: 800; color: {{ section.settings.title_color }}; margin: 0 0 12px;
  }
  .cf-newsletter__subtitle {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 15px; color: {{ section.settings.subtitle_color }}; margin: 0 0 32px; line-height: 1.6;
  }
  .cf-newsletter__form {
    display: flex; gap: 0; border-radius: {{ section.settings.input_radius }}px;
    overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    max-width: 520px; margin: 0 auto;
  }
  .cf-newsletter__input {
    flex: 1; padding: 16px 20px; border: none; outline: none;
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 15px; color: #111;
    background: {{ section.settings.input_bg }};
  }
  .cf-newsletter__btn {
    background: {{ section.settings.btn_bg }}; color: {{ section.settings.btn_text }};
    border: none; padding: 16px 28px; cursor: pointer;
    font-family: '{{ section.settings.font_family }}', sans-serif;
    font-weight: 700; font-size: 15px; white-space: nowrap;
    transition: opacity .2s;
  }
  .cf-newsletter__btn:hover { opacity: .88; }
  .cf-newsletter__disclaimer {
    font-family: '{{ section.settings.body_font }}', sans-serif;
    font-size: 12px; color: {{ section.settings.subtitle_color }}; margin-top: 14px; opacity: 0.7;
  }
  @media(max-width: 480px) { .cf-newsletter__form { flex-direction: column; border-radius: 12px; overflow: visible; }
    .cf-newsletter__input, .cf-newsletter__btn { border-radius: 10px !important; width: 100%; }
  }
</style>

<section class="cf-newsletter">
  <div class="cf-newsletter__inner">
    {% if section.settings.eyebrow != blank %}
      <div class="cf-newsletter__eyebrow">{{ section.settings.eyebrow }}</div>
    {% endif %}
    <h2 class="cf-newsletter__title">{{ section.settings.title }}</h2>
    {% if section.settings.subtitle != blank %}
      <p class="cf-newsletter__subtitle">{{ section.settings.subtitle }}</p>
    {% endif %}
    {% form 'customer' %}
      <input type="hidden" name="contact[tags]" value="{{ section.settings.tag }}">
      <div class="cf-newsletter__form">
        <input class="cf-newsletter__input" type="email" name="contact[email]"
          placeholder="{{ section.settings.placeholder }}" required>
        <button type="submit" class="cf-newsletter__btn">{{ section.settings.btn_label }}</button>
      </div>
    {% endform %}
    {% if section.settings.disclaimer != blank %}
      <p class="cf-newsletter__disclaimer">{{ section.settings.disclaimer }}</p>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "CF Newsletter",
  "tag": "section",
  "class": "cf-newsletter-section",
  "settings": [
    {"type":"text","id":"eyebrow","label":"Eyebrow","default":"Join the Club"},
    {"type":"text","id":"title","label":"Title","default":"Get 10% Off Your First Order"},
    {"type":"text","id":"subtitle","label":"Subtitle","default":"Subscribe for exclusive deals, new arrivals, and members-only discounts."},
    {"type":"text","id":"placeholder","label":"Email Placeholder","default":"Enter your email address"},
    {"type":"text","id":"btn_label","label":"Button Label","default":"Subscribe"},
    {"type":"text","id":"tag","label":"Customer Tag","default":"newsletter"},
    {"type":"text","id":"disclaimer","label":"Disclaimer Text","default":"No spam, ever. Unsubscribe anytime."},
    {"type":"color","id":"bg_color","label":"Background","default":"#1e1b4b"},
    {"type":"color","id":"title_color","label":"Title Color","default":"#ffffff"},
    {"type":"color","id":"subtitle_color","label":"Subtitle Color","default":"#c7d2fe"},
    {"type":"color","id":"accent_color","label":"Eyebrow Color","default":"#a5b4fc"},
    {"type":"color","id":"input_bg","label":"Input Background","default":"#ffffff"},
    {"type":"color","id":"btn_bg","label":"Button Background","default":"#7c3aed"},
    {"type":"color","id":"btn_text","label":"Button Text","default":"#ffffff"},
    {"type":"range","id":"input_radius","min":0,"max":50,"step":4,"unit":"px","label":"Input Border Radius","default":10},
    {"type":"range","id":"title_size","min":20,"max":52,"step":2,"unit":"px","label":"Title Size","default":"36"},
    {"type":"text","id":"font_family","label":"Heading Font","default":"Poppins"},
    {"type":"text","id":"body_font","label":"Body Font","default":"Inter"},
    {"type":"range","id":"padding_top","min":40,"max":120,"step":10,"unit":"px","label":"Padding Top","default":80},
    {"type":"range","id":"padding_bottom","min":40,"max":120,"step":10,"unit":"px","label":"Padding Bottom","default":80}
  ],
  "presets": [{"name":"CF Newsletter","category":"ConvertFlow AI"}]
}
{% endschema %}
`;
