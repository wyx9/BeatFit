---
name: High-Energy Fitness
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a3d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7b6c'
  outline-variant: '#bccbb9'
  surface-tint: '#006e2f'
  primary: '#006e2f'
  on-primary: '#ffffff'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#4ae176'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#a9acae'
  on-tertiary-container: '#3d4042'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
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
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-margin-mobile: 20px
  container-margin-desktop: 40px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style
The brand personality is defined by three pillars: **Vitality, Precision, and Clarity**. This design system is built for users who view fitness as a premium, data-driven lifestyle choice rather than a chore. 

The aesthetic is a refined take on **Minimalism** blended with **High-Energy** accents. It prioritizes a "high-white" environment to evoke a sense of cleanliness and mental focus. By utilizing significant whitespace, we allow the vibrant accent colors to act as psychological triggers for action and movement. The interface should feel breathable and effortless, mirroring the flow of a well-executed workout.

## Colors
The palette is intentionally restricted to maintain a professional, high-end feel. 

- **Primary (Vibrant Green):** Used exclusively for high-priority actions, progress indicators, and "success" states. This is the kinetic energy of the app.
- **Secondary (Deep Navy):** Provides grounded contrast for primary typography and dark-mode elements. It ensures the design feels professional rather than purely "neon."
- **Tertiary (Ice White/Gray):** Used for subtle card backgrounds and surface separations to avoid harsh lines.
- **Neutral (Slate):** Reserved for secondary body text and icons to maintain a soft hierarchy against the high-white background.

## Typography
This design system uses **Plus Jakarta Sans** across all levels to maintain a cohesive, modern, and approachable character. 

The type scale is aggressive in its weight—headlines use **Bold (700)** and **ExtraBold (800)** to command attention and inject energy. Display sizes use slight negative letter-spacing to appear tighter and more "editorial." Body text is kept at a comfortable **Regular (400)** weight with generous line height to ensure readability during physical activity. Label styles utilize a semi-bold weight and increased tracking for clarity at small sizes.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy with a base-8 spacing scale. 

- **Mobile:** A single-column layout with 20px side margins. Elements are stacked vertically with a 16px (stack-md) gap for standard content and 32px (stack-lg) between distinct functional groups.
- **Desktop:** A 12-column grid with a maximum content width of 1280px. Margins expand to 40px to increase the sense of luxury and space.
- **Rhythm:** Vertical rhythm is strictly enforced using multiples of 8px. This consistency creates a "stable" feeling even when the content is dynamic (e.g., live workout tracking).

## Elevation & Depth
Depth is conveyed through **Minimalist Shadows** and **Tonal Layering** rather than heavy gradients.

- **Level 0 (Base):** Pure White (#ffffff).
- **Level 1 (Cards/Surface):** Very subtle low-opacity shadows (e.g., 0px 4px 20px rgba(0, 0, 0, 0.04)). This makes components appear to "float" just above the surface.
- **Interactive Depth:** When a user interacts with a pill-shaped button or card, the shadow should slightly increase in spread, or the element should subtly scale (1.02x) to provide tactile feedback.
- **Glassmorphism:** Use sparingly for fixed navigation bars (blurs of 20px with 80% opacity) to maintain context of the content scrolling beneath.

## Shapes
The shape language is defined by **Full Roundness (Pill-shaped)**. 

Every interactive element—buttons, input fields, tags, and progress bars—should utilize the maximum border-radius available to create a friendly, organic, and safe feel. This "soft" geometry balances the "hard" energy of the vibrant green and bold typography, making the fitness journey feel more accessible and less intimidating. Cards should use `rounded-xl` (3rem) to maintain consistency with the pill-shaped smaller elements.

## Components
- **Buttons:** Primary buttons are solid Vibrant Green (#22c55e) with white text. They are always pill-shaped. Secondary buttons use a light gray ghost style with a subtle border.
- **Progress Bars:** Thicker, pill-shaped tracks. The background track should be a very pale version of the primary color or a light gray, with the active progress in solid Vibrant Green.
- **Cards:** White backgrounds with the Level 1 shadow. Cards should have generous internal padding (min 24px) to avoid visual crowding.
- **Inputs:** Pill-shaped containers with a 1px light gray border. On focus, the border transitions to Vibrant Green with a soft outer glow.
- **Chips/Badges:** Small pill shapes used for workout categories (e.g., "Strength," "Cardio"). Use a "Light Primary" background (Green at 10% opacity) with dark green text for high legibility and a modern look.
- **Lists:** Clean rows separated by whitespace or extremely faint horizontal rules. Each list item should feel like a distinct, touchable surface.