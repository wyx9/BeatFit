---
name: Kinetic Ether
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#434654'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0754d6'
  primary: '#003da2'
  on-primary: '#ffffff'
  primary-container: '#0052d4'
  on-primary-container: '#c9d4ff'
  inverse-primary: '#b3c5ff'
  secondary: '#5b5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e6'
  on-secondary-container: '#626567'
  tertiary: '#004c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#00657c'
  on-tertiary-container: '#8ce1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#00184a'
  on-primary-fixed-variant: '#003ea6'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#b6ebff'
  tertiary-fixed-dim: '#4cd6fe'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
---

## Brand & Style

The design system is engineered for a premium, high-energy fitness ecosystem. It balances the rigor of professional athletics with a social, modern aesthetic. The brand personality is "Athletic Elegance"—combining the precision of a high-performance tool with the inviting atmosphere of a luxury wellness club.

The visual style is **High-End Minimalism** infused with **Glassmorphism**. It utilizes expansive white space to denote premium quality, while vibrant accent colors and subtle translucency provide a futuristic, energetic pulse. The interface should feel breathable and focused, minimizing cognitive load to keep the user’s attention on their performance and community.

## Colors

The palette is anchored by **Deep Electric Blue**, a color that signifies reliability and high energy. This is paired with **Cyan** for interactive highlights and motivational progress indicators.

- **Primary (#0052D4):** Used for primary actions, active navigation states, and key brand moments.
- **Secondary (#F5F7FA):** A cool, soft gray for surface containers and background sections to provide subtle depth without adding visual noise.
- **Accent (#00B4DB):** Reserved for data visualization, success states, and high-energy callouts.
- **Neutral (#1A1A1A):** Used for primary text and high-contrast iconography to ensure absolute legibility.
- **Background (#FFFFFF):** The canvas for the application, ensuring a clean, clinical, and premium feel.

## Typography

This design system uses **Plus Jakarta Sans** for headlines to provide a modern, friendly, yet professional character. Its soft geometry makes high-energy titles feel approachable. For body copy and functional labels, **Inter** is utilized for its exceptional legibility and systematic, utilitarian feel.

Typography should follow a strict hierarchy. Use "Display" sizes only for key performance metrics or welcome screens. Large headlines should utilize negative letter spacing to feel tighter and more impactful. Ensure all body text maintains a minimum contrast ratio of 4.5:1 against the white background.

## Layout & Spacing

As a WeChat Mini-Program, the layout is mobile-first and relies on a **Fluid Grid**. A 4px baseline grid ensures consistent vertical rhythm. 

- **Margins:** 20px safe area on the horizontal edges of the screen to prevent content from feeling cramped.
- **Section Spacing:** Use 32px (xl) to separate distinct content blocks (e.g., "Daily Progress" vs "Featured Classes").
- **Internal Spacing:** Use 16px (md) for padding within cards and containers.
- **Reflow:** Layouts should utilize Flexbox for vertical stacking, ensuring that metrics and data points are prioritized at the top of the scroll view.

## Elevation & Depth

This design system employs a **Glassmorphic** approach to depth. Instead of traditional heavy shadows, depth is communicated through:

1.  **Backdrop Blurs:** Secondary surfaces (like sticky headers or floating navigation bars) should use a 20px blur with a 70% white opacity tint.
2.  **Smooth Ambient Shadows:** For interactive cards, use a multi-layered shadow (0px 10px 30px rgba(0, 82, 212, 0.08)) to create a "floating" effect that feels light and premium.
3.  **Tonal Layers:** Use the Secondary Gray (#F5F7FA) for inactive background regions to make the primary white cards pop.
4.  **Outer Glows:** Interactive elements like active buttons or progress rings may utilize a subtle primary-colored outer glow to simulate energy.

## Shapes

The shape language is consistently **Rounded**, reflecting a modern and "human" fitness brand. 

- **Cards and Containers:** 16px (rounded-lg) corner radius creates a soft, premium appearance.
- **Buttons and Inputs:** 12px corner radius balances the softness with a sense of structural integrity.
- **Iconography:** Icons should feature rounded caps and corners, maintaining a consistent 2px stroke weight. Avoid sharp 90-degree angles in any UI element.

## Components

**Buttons**
Primary buttons feature a Deep Electric Blue background with a subtle scale-up effect (1.02x) on tap. They should include a soft "inner glow" or top-light border to enhance the 3D feel. Secondary buttons use a transparent background with a 1.5px Primary border.

**Glass Cards**
Cards are the primary content container. Use a white background (opacity 90% if over dynamic content) with a 1px solid white border to define the edge against soft background colors. 

**Chips/Tags**
Used for fitness categories (e.g., "HIIT", "Yoga"). These should be pill-shaped with a Soft Gray background and Label-Md typography. Active states switch to Primary Blue with white text.

**Input Fields**
Clean, 12px rounded borders with a subtle Secondary Gray fill. On focus, the border transitions to Primary Blue with a 4px soft blue outer glow.

**Progress Indicators**
Utilize the Accent Cyan (#00B4DB) for progress bars and rings. Use rounded line-caps for all stroke-based progress indicators to match the shape language.

**Interactive Scaling**
All tappable elements (cards, list items, buttons) should utilize a haptic feedback trigger and a brief scale-down effect (0.98x) to provide a tactile, high-end mobile experience.