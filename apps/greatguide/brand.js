// Hotel branding — drives logo, colors, typography, and copy.
//
// To rebrand for a different hotel, override BRAND in HTML before this file
// loads, or pass ?brand=<id> in the URL and add a config below.

export const BRANDS = {
  litoral: {
    id: 'litoral',
    name: { en: 'Hotel Litoral', pt: 'Hotel Litoral' },
    tagline: {
      en: 'Caraguatatuba — North Coast of São Paulo',
      pt: 'Caraguatatuba — Litoral Norte de São Paulo',
    },
    // Inline SVG logo so there are no asset dependencies.
    logoSvg: `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="gg-logo-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="currentColor" stop-opacity="0.9"/>
            <stop offset="1" stop-color="currentColor" stop-opacity="0.55"/>
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
        <path d="M8 38 Q15 33, 22 38 T36 38 T50 38" fill="none" stroke="url(#gg-logo-grad)" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M8 44 Q15 39, 22 44 T36 44 T50 44" fill="none" stroke="url(#gg-logo-grad)" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <circle cx="42" cy="20" r="6" fill="currentColor" opacity="0.85"/>
      </svg>
    `,
    palette: {
      // Coastal — warm sand, deep ocean, soft coral accent
      bg:        '#f8f5ee',
      surface:   '#ffffff',
      ink:       '#1a2a36',
      inkSoft:   '#5a6b78',
      accent:    '#c25a4f',
      accentInk: '#ffffff',
      accentSoft: 'rgba(194, 90, 79, 0.10)',
      ocean:     '#1f4f6f',
      sand:      '#e9dfc8',
      border:    '#e5dfd2',
    },
    fonts: {
      // Web-safe + Google Fonts available globally
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    // Image used in welcome hero — gradient when no asset
    heroImage: null,
    // Email recipients for the "tour generated" notification (mock recipients
    // for the demo build — a real integration would pull from hotel admin).
    notifyOnTour: ['guide@hotel.example.com'],
  },
};

export function getBrand() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get('brand') || window.GREATGUIDE_BRAND_ID || 'litoral';
  return BRANDS[id] || BRANDS.litoral;
}

// Apply the brand's palette + fonts to the document by writing CSS variables
// onto :root. Call once on page load.
export function applyBrand(brand) {
  const root = document.documentElement;
  Object.entries(brand.palette).forEach(([k, v]) => {
    root.style.setProperty(`--gg-${k}`, v);
  });
  root.style.setProperty('--gg-font-heading', brand.fonts.heading);
  root.style.setProperty('--gg-font-body', brand.fonts.body);
  // Set page title prefix
  if (brand.name?.en) {
    document.title = `${brand.name.en} — Great Guide`;
  }
}
