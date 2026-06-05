---
name: Premium Performance
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#121212'
  on-primary-container: '#7e7d7d'
  inverse-primary: '#5f5e5e'
  secondary: '#ffffff'
  on-secondary: '#2b3400'
  secondary-container: '#ccf200'
  on-secondary-container: '#5a6c00'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#101213'
  on-tertiary-container: '#7c7d7e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ccf200'
  secondary-fixed-dim: '#b3d400'
  on-secondary-fixed: '#181e00'
  on-secondary-fixed-variant: '#3f4c00'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is built for a high-end fitness audience that values focus, clarity, and results. The brand personality is **disciplined, energetic, and sophisticated**. It utilizes a **Minimalist** foundation with **High-Contrast** accents to guide the user's attention toward their data and progress.

The UI avoids decorative clutter, favoring generous whitespace (or "dark space") to create a sense of calm and breathing room. The emotional response should be one of "quiet power"—a professional-grade tool that feels both approachable and elite. All interface text and instructional content are presented in **Simplified Chinese**, ensuring a localized and premium experience for the target market.

## Colors

The palette is rooted in a **Deep Charcoal (#121212)** base to provide a premium, low-glare environment suitable for early-morning or late-night workouts. 

- **Primary (Deep Charcoal):** Used for the main background and surfaces to establish a grounded, professional atmosphere.
- **Secondary (Electric Lime):** A high-vibration accent used sparingly for calls-to-action, progress indicators, and active states. It represents energy and movement.
- **Neutral (Soft Whites & Greys):** Soft White (#F9F9F9) is reserved for high-priority typography, while Mid-Greys are used for secondary information and borders.

The high-contrast relationship between the charcoal background and the electric lime accent ensures that critical fitness metrics are immediately legible.

## Typography

The typography system utilizes **Plus Jakarta Sans** for its modern, geometric clarity. For Chinese characters, it is paired with a clean, humanist sans-serif fallback to maintain a consistent weight and aesthetic.

- **Numbers & Metrics:** Use `display-lg` for primary fitness data (e.g., 步数, 卡路里).
- **Headlines:** `headline-lg` (标题) should be bold and impactful, setting a clear hierarchy for workout categories or daily summaries.
- **Body Text:** `body-md` (正文) is optimized for readability during physical activity, using generous line heights.
- **Labels:** `label-sm` (标签) is used for secondary metadata or button text, often in all-caps for English or slightly increased tracking for Chinese to ensure legibility.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with an emphasis on oversized margins to create a "gallery" feel.

- **Grid:** A 12-column grid is used for desktop/tablet, while a 4-column grid is used for mobile.
- **Safe Zones:** A 24px container margin is enforced on mobile to ensure content does not feel cramped.
- **Rhythm:** All spacing must be a multiple of the 8px base unit. Use `lg` (40px) or `xl` (64px) spacing between major content sections (e.g., between the daily progress chart and the workout list) to reduce visual noise.
- **Alignment:** Content is generally center-aligned or left-aligned with significant padding to emphasize the minimalist aesthetic.

## Elevation & Depth

In line with the minimalist and high-contrast style, this design system avoids traditional drop shadows. Depth is achieved through **Tonal Layering**:

- **Level 0 (Background):** The deepest charcoal (#121212).
- **Level 1 (Cards/Surfaces):** A slightly lighter charcoal (#1C1C1C) or a subtle 1px border (#2C2C2C).
- **Level 2 (Interactive):** Elements that are interactive use the Electric Lime accent or a pure white surface.

To maintain a "soft" feel, use **Background Blurs** (20px–40px) for navigation bars or overlays, allowing the energetic colors of the workout content to bleed through subtly without creating visual clutter.

## Shapes

The shape language is defined by **Extreme Roundedness**. This softens the aggressive nature of the high-contrast color palette, making the app feel "human" and modern.

- **Primary Elements:** All main cards and primary buttons must use a radius of at least 32px (rounded-xl).
- **Small Elements:** Chips, tags, and input fields should be fully pill-shaped (rounded-full).
- **Visual Consistency:** Icons should follow a "Lineal" style with rounded caps and joins to match the outer container curves.

## Components

### Buttons (按钮)
Primary buttons are pill-shaped, using the **Electric Lime** background with black text for maximum visibility. Secondary buttons use a thick 2px outline of Soft White or a subtle grey tint.
- *Text Example:* "开始训练" (Start Training)

### Cards (卡片)
Cards are the primary container for data. They should have a minimum internal padding of 24px. Use the Level 1 surface color (#1C1C1C) with a 32px corner radius.
- *Header:* Headline-md for the metric title (e.g., "今日活动").

### Progress Bars (进度条)
Progress bars should be thick (12px+) with fully rounded end-caps. Use a dark grey track with an Electric Lime fill to denote completion.

### Inputs (输入框)
Text inputs are pill-shaped with a 1px border. The focus state replaces the border with an Electric Lime glow or solid border.
- *Placeholder:* "搜索动作..." (Search exercises...)

### Chips & Tags (标签)
Used for workout categories (e.g., "有氧", "力量"). These are small, pill-shaped elements with a secondary grey background and white text.