---
name: HomeStyler Design System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#703a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#934e00'
  on-tertiary-container: '#ffd2b1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1280px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a sophisticated home-styling platform that bridges professional interior expertise with accessible AI technology. The brand personality is **Professional, Reliable, Modern, and Intuitive**. It aims to evoke a sense of creative empowerment and calm assurance, transforming the complex task of home design into a seamless, inspiring experience.

The design style follows a **Corporate Modern** aesthetic with **Tactile & Glassmorphic accents**. While the core interface is grounded in clean, systematic layouts and reliable structures, AI-driven features utilize soft background blurs and translucent layers to signal innovation. High-quality whitespace is used intentionally to mirror the "breathing room" of a well-designed physical space.

## Colors
This design system utilizes a palette that balances technical authority with domestic comfort.
- **Primary (#4F46E5):** An Indigo hue representing professional AI intelligence and architectural precision.
- **Secondary (#059669):** An Emerald green that brings a sense of organic growth, stability, and eco-friendly home environments.
- **Accent (#D97706):** An Amber tone used sparingly to inject warmth, reminiscent of natural wood and lighting.
- **Background & Surface:** A layered approach using #F9FAFB for the canvas to maintain an airy feel, with pure #FFFFFF for cards and functional containers to maximize clarity and perceived cleanliness.

## Typography
The typography strategy pairings prioritize modern friendliness with technical legibility. 
- **Plus Jakarta Sans** is used for headlines to provide a soft, rounded, and welcoming character that feels premium.
- **Inter** is the workhorse for body text and UI labels, ensuring maximum readability in data-heavy analysis screens and property details.
- Use a hierarchy that favors generous line heights to enhance the feeling of "open space" within the digital interface.

## Layout & Spacing
The layout follows a **Fluid Grid** system with fixed maximum constraints to maintain architectural integrity.
- **Desktop:** 12-column grid with 24px gutters and 48px side margins.
- **Tablet:** 8-column grid with 20px gutters and 32px side margins.
- **Mobile:** 4-column grid with 16px gutters and 20px side margins.
Spacing follows a 4px/8px baseline rhythm. For home-styling visuals, use "Extreme Whitespace" (e.g., 64px+ sections) to separate major content blocks, mimicking the minimalist aesthetics of modern interior photography.

## Elevation & Depth
Depth is used to distinguish between structural UI and dynamic AI-generated content.
- **Structural Depth:** Use soft, ambient shadows (e.g., `0 4px 20px rgba(0,0,0,0.05)`) for standard cards and navigation.
- **AI Intelligence Layer:** For AI analysis, styling suggestions, or "Magic" features, apply **Glassmorphism**. Use a 12px-16px backdrop-blur, 60% opacity white fill, and a subtle 1px white border to create an elevated, futuristic feel.
- **Interactive Depth:** On hover, increase shadow spread and slightly lift elements (Y-axis translation) to provide tactile feedback.

## Shapes
In line with the brand's friendly yet professional tone, shapes are predominantly rounded.
- **Standard UI Elements:** Buttons, inputs, and small cards use a **12px (rounded-lg)** radius.
- **Major Containers:** Large content blocks, modals, and featured image cards use a **24px (rounded-xl)** radius to emphasize a modern, soft aesthetic.
- **AI Tooltips & Chips:** Use pill shapes (full rounding) to differentiate them from standard structural elements.

## Components
- **Buttons:** Primary buttons use the Indigo fill with white text. Secondary buttons use a subtle Emerald tint or transparent background with Indigo text. All buttons have a height of 48px or 56px to ensure "touch-friendly" ergonomics.
- **Cards:** White surfaces with a 1px border (#E5E7EB) and the "Structural Depth" shadow. AI-specific cards use the Glassmorphism effect.
- **Input Fields:** Clean outlines with 12px rounding. On focus, the border transitions to Primary Indigo with a soft outer glow.
- **AI Analysis Chips:** Semi-transparent Emerald or Indigo backgrounds with high-contrast labels to indicate specific style tags (e.g., "Nordic," "Industrial").
- **Visual Feedback:** Use progress bars or skeleton screens with a soft pulse effect for AI loading states to maintain the "Modern" and "Professional" feel.