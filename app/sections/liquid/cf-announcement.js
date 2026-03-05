export const cfAnnouncement = `
<div class="cf-announcement" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }}; padding: {{ section.settings.padding }}px 0;">
  <div class="cf-inner" style="max-width:1200px;margin:0 auto;padding:0 20px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
    {% if section.settings.emoji != blank %}
      <span style="font-size:1.1em;">{{ section.settings.emoji }}</span>
    {% endif %}
    <span style="font-family:'{{ section.settings.font_family }}',sans-serif;font-size:{{ section.settings.font_size }}px;font-weight:600;letter-spacing:0.5px;">
      {{ section.settings.announcement_text }}
    </span>
    {% if section.settings.link_text != blank %}
      <a href="{{ section.settings.link_url }}" style="color:{{ section.settings.text_color }};font-weight:700;text-decoration:underline;font-size:{{ section.settings.font_size }}px;white-space:nowrap;">
        {{ section.settings.link_text }} &rarr;
      </a>
    {% endif %}
  </div>
</div>
<style>
  @media(max-width:600px){
    .cf-announcement .cf-inner{flex-direction:column;text-align:center;gap:6px;}
  }
</style>

{% schema %}
{
  "name": "CF Announcement Bar",
  "tag": "section",
  "class": "cf-announcement-section",
  "settings": [
    {"type":"text","id":"announcement_text","label":"Announcement Text","default":"🎉 Free Shipping on orders over $50 — Limited Time Only!"},
    {"type":"text","id":"emoji","label":"Emoji (optional)","default":""},
    {"type":"text","id":"link_text","label":"CTA Link Text","default":"Shop Now"},
    {"type":"url","id":"link_url","label":"CTA Link URL","default":"/collections/all"},
    {"type":"color","id":"bg_color","label":"Background Color","default":"#111111"},
    {"type":"color","id":"text_color","label":"Text Color","default":"#ffffff"},
    {"type":"range","id":"padding","min":6,"max":24,"step":2,"unit":"px","label":"Vertical Padding","default":10},
    {"type":"range","id":"font_size","min":12,"max":18,"step":1,"unit":"px","label":"Font Size","default":14},
    {"type":"text","id":"font_family","label":"Font Family","default":"Inter"}
  ],
  "presets": [{"name":"CF Announcement Bar","category":"ConvertFlow AI"}]
}
{% endschema %}
`;
