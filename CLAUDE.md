# Wireclaw Website

Marketing website, blog, and documentation. Astro 6 + Tailwind CSS 4 + TypeScript.

## Critical Constraints

- **UI-Only Configuration:** Users configure agents through the web dashboard — never by editing config files. All copy on the site must reflect this. See root `CLAUDE.md` → "Критические констрейны продукта".

## Stack & Setup

- **Stack:** Astro 6 + Tailwind CSS 4 + TypeScript
- **Run:** `pnpm install && pnpm dev` (requires Node >= 22.12)
- Dark theme only, no light mode

## Structure

```
src/pages/         Pages (index.astro — landing)
src/components/    Astro components (Hero, Features, Pricing, Comparison, etc.)
src/layouts/       Layout.astro (SEO meta, OG tags, structured data, scroll animations)
src/styles/        global.css — Tailwind theme with brand tokens
public/            Static assets
```

Landing sections (order): Navbar → Hero → SocialProof → Features → ChannelIntegrations → DemoShowcase → HowItWorks → Architecture → Comparison → Pricing → FinalCTA → Footer.

## Brand Implementation

- Tailwind theme with custom tokens is configured in `src/styles/global.css` — use semantic classes (`text-wire-500`, `bg-navy-950`), not raw hex
- Full brand spec (colors, typography, visual language): `wireclaw-marketing-strategy/brand/guidelines.md`
- All copy on the site comes from messaging (`wireclaw-marketing-strategy/brand/messaging.md`), not hardcoded

### Design Tokens (quick reference)

| Role | Class | HEX |
|------|-------|-----|
| Background | `bg-navy-950` | #020617 |
| Surface | `bg-navy-900` | #0F172A |
| Card | `bg-navy-800` | #1E293B |
| Primary | `text-wire-500` | #3B82F6 |
| Accent | `text-claw-500` | #8B5CF6 |

Gradient (hero): `linear-gradient(135deg, #60A5FA, #3B82F6, #A78BFA)`
Glow: `box-shadow: 0 0 20px rgba(59, 130, 246, 0.3)`

### Typography

- Display: **Instrument Sans 700**
- Body: **DM Sans 300–700**
- Mono: **JetBrains Mono 400–600**

### Visual Language

- Always dark backgrounds
- Glow effects on interactive elements
- Faint grid pattern on backgrounds
- Terminal screenshots > diagrams
- Thin 1px borders on cards
- No stock illustrations — only screenshots, code, architecture diagrams

## Animations

- Scroll animations via `data-animate` attribute (Intersection Observer in Layout.astro)

## Dependencies

- **wireclaw-marketing-strategy** — messaging, brand, SEO keywords → site copy
- **wireclaw-product** — feature specs → feature descriptions, pricing
- **wireclaw-blog-strategy** — blog series → blog section
