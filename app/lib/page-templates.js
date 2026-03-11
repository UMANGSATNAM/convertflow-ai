export const PAGE_TEMPLATES = [
  // ─── 10 HOME PAGE TEMPLATES ───────────────────────────────────────
  {
    id: "cf-home-ultimate",
    type: "page",
    name: "The Ultimate D2C Home",
    description: "High-contrast, high-urgency layout designed for maximum conversions on flagship stores.",
    sections: ["cf-cro-hero-v3", "cf-cro-benefits-v2", "cf-cro-offer-grid-v4", "cf-cro-social-proof-v3", "cf-cro-faq-v4"]
  },
  {
    id: "cf-home-minimal",
    type: "page",
    name: "Clean & Minimalist",
    description: "Stripped back whitespace-heavy design putting focus entirely on your value proposition.",
    sections: ["cf-cro-hero-v4", "cf-cro-social-proof-v4", "cf-cro-comparison-v4", "cf-cro-countdown-v4"]
  },
  {
    id: "cf-home-aggressive",
    type: "page",
    name: "Aggressive Sale Event",
    description: "Built for BFCM and flash sales. Starts with urgency and aggressive offer stacking.",
    sections: ["cf-cro-countdown-v2", "cf-cro-hero", "cf-cro-offer-grid-v3", "cf-cro-social-proof-v2", "cf-cro-faq"]
  },
  {
    id: "cf-home-story",
    type: "page",
    name: "Story-Driven Brand",
    description: "Perfect for founder-led brands. Focuses heavily on social proof and emotional benefits.",
    sections: ["cf-cro-hero-v2", "cf-cro-social-proof-v3", "cf-cro-benefits-v4", "cf-cro-comparison-v2", "cf-cro-faq-v2"]
  },
  {
    id: "cf-home-bundle",
    type: "page",
    name: "Bundle-First Homepage",
    description: "Bypasses the traditional collection grid in favor of direct-to-bundle sales.",
    sections: ["cf-cro-benefits", "cf-cro-offer-grid-v4", "cf-cro-bundle-v4", "cf-cro-social-proof-v4", "cf-cro-faq-v3"]
  },
  {
    id: "cf-home-trust",
    type: "page",
    name: "Authority & Trust",
    description: "Leads with massive social proof to establish credibility before pitching the product.",
    sections: ["cf-cro-social-proof-v3", "cf-cro-hero-v4", "cf-cro-benefits-v3", "cf-cro-offer-grid-v2", "cf-cro-comparison-v4"]
  },
  {
    id: "cf-home-fast",
    type: "page",
    name: "Fast-Action Funnel",
    description: "Short-form landing page designed to capture impulse buyers under 30 seconds.",
    sections: ["cf-cro-countdown-v3", "cf-cro-hero-v3", "cf-cro-offer-grid-v3", "cf-cro-social-proof", "cf-cro-faq-v4"]
  },
  {
    id: "cf-home-clean",
    type: "page",
    name: "SaaS-Style Commerce",
    description: "Clean, professional, B2B/tech-inspired layout with clear features and pricing tables.",
    sections: ["cf-cro-hero-v2", "cf-cro-benefits-v4", "cf-cro-offer-grid-v4", "cf-cro-faq-v4", "cf-cro-comparison-v4"]
  },
  {
    id: "cf-home-social",
    type: "page",
    name: "Social Commerce",
    description: "Image-heavy, review-heavy layout optimized for TikTok and Instagram ad traffic.",
    sections: ["cf-cro-hero-v4", "cf-cro-social-proof-v2", "cf-cro-social-proof-v4", "cf-cro-benefits-v3", "cf-cro-offer-grid-v4"]
  },
  {
    id: "cf-home-hybrid",
    type: "page",
    name: "The Hybrid Funnel",
    description: "A balanced mix of brand storytelling and direct-response urgency.",
    sections: ["cf-cro-hero-v3", "cf-cro-countdown-v4", "cf-cro-offer-grid-v4", "cf-cro-social-proof-v4", "cf-cro-faq-v2"]
  },

  // ─── 10 PRODUCT PAGE TEMPLATES ──────────────────────────────────────
  {
    id: "cf-pdp-flagship",
    type: "product",
    name: "Flagship Product Pro",
    description: "The ultimate product page for a hero product. Explains every feature in detail.",
    sections: ["cf-cro-mini-pdp-v3", "cf-cro-benefits-v2", "cf-cro-comparison-v3", "cf-cro-faq-v4", "cf-cro-social-proof-v4"]
  },
  {
    id: "cf-pdp-bundle",
    type: "product",
    name: "The Bundle Pitch",
    description: "Replaces traditional PDP with a curated bundle widget to maximize AOV instantly.",
    sections: ["cf-cro-bundle-v4", "cf-cro-social-proof-v3", "cf-cro-comparison-v4", "cf-cro-faq-v3"]
  },
  {
    id: "cf-pdp-minimal",
    type: "product",
    name: "Sleek & Minimal PDP",
    description: "A clean, contained bento-box style layout for modern fashion and beauty brands.",
    sections: ["cf-cro-mini-pdp-v4", "cf-cro-comparison-v4", "cf-cro-faq-v4"]
  },
  {
    id: "cf-pdp-urgency",
    type: "product",
    name: "Urgency Drop PDP",
    description: "Countdown-driven product page for limited drops and exclusive inventory.",
    sections: ["cf-cro-countdown-v4", "cf-cro-mini-pdp-v2", "cf-cro-bundle-v2", "cf-cro-social-proof-v2"]
  },
  {
    id: "cf-pdp-comparison",
    type: "product",
    name: "Us vs Them PDP",
    description: "Heavily leverages comparative marketing to crush objections right on the product page.",
    sections: ["cf-cro-comparison-v4", "cf-cro-mini-pdp-v3", "cf-cro-comparison-v2", "cf-cro-faq-v2"]
  },
  {
    id: "cf-pdp-story",
    type: "product",
    name: "Editorial Product Page",
    description: "Reads like an editorial feature, perfect for innovative or novel products.",
    sections: ["cf-cro-mini-pdp-v3", "cf-cro-benefits-v4", "cf-cro-social-proof-v4", "cf-cro-faq-v4"]
  },
  {
    id: "cf-pdp-upsell",
    type: "product",
    name: "Upsell Engine",
    description: "Quick product pitch immediately followed by an aggressive bundle upgrade.",
    sections: ["cf-cro-mini-pdp-v4", "cf-cro-bundle-v4", "cf-cro-social-proof-v3", "cf-cro-faq-v2"]
  },
  {
    id: "cf-pdp-trust",
    type: "product",
    name: "High Trust Supplement",
    description: "Designed for health/wellness. Focuses on ingredients, guarantees, and clinical proof.",
    sections: ["cf-cro-benefits-v2", "cf-cro-mini-pdp-v3", "cf-cro-social-proof-v4", "cf-cro-comparison-v2"]
  },
  {
    id: "cf-pdp-compact",
    type: "product",
    name: "Compact View",
    description: "Everything above the fold. Dense information layout for decisive buyers.",
    sections: ["cf-cro-mini-pdp-v4", "cf-cro-bundle-v3", "cf-cro-faq-v4"]
  },
  {
    id: "cf-pdp-ultimate",
    type: "product",
    name: "The Conversion Machine",
    description: "Combines our highest-converting variants into an unstoppable sales magnet.",
    sections: ["cf-cro-mini-pdp-v3", "cf-cro-comparison-v3", "cf-cro-bundle-v4", "cf-cro-social-proof-v4", "cf-cro-faq-v4"]
  }
];
