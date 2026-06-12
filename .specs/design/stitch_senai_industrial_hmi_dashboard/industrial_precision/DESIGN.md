---
name: Industrial Precision
colors:
  surface: '#0f141a'
  surface-dim: '#0f141a'
  surface-bright: '#353941'
  surface-container-lowest: '#090f15'
  surface-container-low: '#171c23'
  surface-container: '#1b2027'
  surface-container-high: '#252a32'
  surface-container-highest: '#30353d'
  on-surface: '#dee2ec'
  on-surface-variant: '#e9bcb6'
  inverse-surface: '#dee2ec'
  inverse-on-surface: '#2c3138'
  outline: '#af8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e20613'
  on-primary-container: '#fff3f2'
  inverse-primary: '#c0000d'
  secondary: '#b0c6ff'
  on-secondary: '#002d6f'
  secondary-container: '#006af2'
  on-secondary-container: '#f8f7ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#008158'
  on-tertiary-container: '#daffe8'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429b'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f141a'
  on-background: '#dee2ec'
  surface-variant: '#30353d'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: '0'
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: '0'
  body-base:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-bold:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  gutter: 16px
  margin-mobile: 12px
  margin-desktop: 24px
---

## Brand & Style

The brand personality is authoritative, high-performance, and technically sophisticated, specifically engineered for the rigors of industrial automation. It balances the institutional reliability of the SENAI-SP identity with the modern, efficient aesthetic of high-end embedded graphics libraries.

The design style is a hybrid of **Corporate Modern** and **Tactile Minimalism**. It prioritizes low-complexity rendering to ensure high frame rates on TFT hardware while using subtle physical metaphors—like micro-gradients and structured layering—to make the interface intuitive for operators using touchscreens. The UI evokes a sense of "mission-critical" stability through a deep-charcoal atmosphere and high-contrast diagnostic accents.

**Key Visual Principles:**
- **Hardware-First Aesthetics:** Optimized for TFT/OLED displays with deep backgrounds to minimize eye strain and energy consumption.
- **Tactile Feedback:** Digital elements mirror physical switches and buttons through subtle depth cues and oversized touch targets.
- **Institutional Authority:** The strategic use of the institutional red serves as both a branding anchor and a functional signifier for critical interactions.

## Colors

The palette is optimized for dark-room legibility and industrial safety standards. It utilizes a hierarchical surface system to define depth without relying on expensive transparency effects.

- **Primary (Institutional Red):** Reserved for SENAI branding, critical alarms, and high-priority action highlights.
- **Secondary (Corporate Blue):** Used for interactive states, focused inputs, and secondary quantitative data.
- **Tertiary (Operational Green):** Indicates safe status, healthy telemetry, and successful automation cycles.
- **Neutral (Industrial Slate):** The core of the system. The base background is `#121519`, while surfaces use `#1A1F26`. This provides enough contrast to distinguish containers without creating harsh glare.

**Functional State Colors:**
- **Warning:** `#F59E0B` (Amber) for maintenance alerts.
- **Error:** `#D11919` (Industrial Red) for safety violations.
- **Info:** `#06B6D4` (Cyan) for diagnostic telemetry.

## Typography

The typography system uses **Montserrat** to ensure maximum legibility on low-resolution pixel matrices. Its geometric clarity and large x-height are ideal for industrial readouts that must be visible from a distance.

**Implementation Guidelines:**
- **Telemetry Readouts:** Use `display-lg` for primary sensor data (e.g., Temperature, RPM). Ensure numerical values are center-aligned within their respective cards.
- **Unit Labels:** Pair large metrics with `label-caps` for units (e.g., °C, PSI), typically using the "Muted Industrial Dust" color (#8C9BAE).
- **Pixel Alignment:** All text should be vertically centered within components to prevent sub-pixel rendering blur on hardware displays.
- **Contrast:** Maintain high-contrast ivory (#F0F3F6) for critical text against dark slate surfaces.

## Layout & Spacing

This design system employs a **Fixed Grid** model aligned to an **8px hardware module**. This ensures that all UI elements snap perfectly to standard TFT resolution pixel rows (e.g., 800x480).

**Grid & Alignment:**
- **Layout Model:** Use a 12-column grid for desktop views. On small/mobile industrial screens, collapse to a single-column stacked layout.
- **Gutter & Margins:** Maintain 16px gutters between cards. Use 24px margins on desktop to clear the physical bezels of the HMI chassis.
- **Touch Safety:** Every interactive element must maintain a minimum touch target of 48x48px, even if the visual element (like a small switch) is smaller.
- **Content Reflow:** On screens smaller than 480px width, side navigations must transition into a slide-out overlay or a bottom-fixed navigation bar.

## Elevation & Depth

Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** to minimize CPU overhead on embedded processors.

- **Layer 0 (Background):** Solid `#121519`. The deepest level.
- **Layer 1 (Containers):** Solid `#1A1F26` with a 1px solid border of `#384454`. This defines cards, sidebars, and main panels.
- **Layer 2 (Interactive/In-set):** Solid `#15191E` for input fields, data tables, and recessed toggle tracks.
- **Highlighting:** Instead of drop shadows, use 1px "ghost borders" or 2px active strokes in primary/secondary colors to indicate focus. 
- **Physicality:** Use subtle vertical gradients (Top: Light -> Bottom: Dark) on buttons to imply a raised surface, and inverse gradients for recessed input fields.

## Shapes

The shape language is modern and structured. It uses **Rounded (8px base)** corners to soften the industrial aesthetic while maximizing the active touch area within corners—a critical factor for gloved operation.

- **Standard Buttons & Inputs:** Use the base 8px (`rounded-md`) radius.
- **Main Panels & Dialogs:** Use 12px (`rounded-lg`) to create a clear structural distinction for primary content areas.
- **Knobs & Switches:** Use "Pill-shaped" (`rounded-full`) for slider handles and toggle tracks to signify their sliding physical nature.
- **Sharp Details:** Internal data table cells or status indicators should remain sharp (0px) to maximize data density.

## Components

### Buttons
- **Primary:** SENAI Red with a vertical gradient. White text. 1px white border for high-visibility separation.
- **Secondary:** Industrial Slate with `#384454` border. Text in Ivory.
- **State Change:** When pressed, buttons should shift downward by 1px and darken in color to simulate a physical depression.

### Inputs & Toggles
- **Input Fields:** Recessed appearance using `#15191E`. 1px border that turns Corporate Blue on focus.
- **Toggle Switch:** Pill-shaped track. Active state in Corporate Blue or Green. Knob is a crisp white circle that overlaps the track edges slightly for a tactile feel.
- **Sliders:** 12px height track with a 24px diameter circular white knob.

### Cards & Panels
- **Container:** Slate background with a top-edge 3px accent bar in SENAI Red to denote institutional consistency.
- **Padding:** Internal padding should be a minimum of 16px to ensure readability.

### Industrial Gauges & Charts
- **Arc/Gauges:** 12px thick stroke. Base track in `#1A1F26`. Active value in Blue or Green. Danger zones (last 15% of the arc) transition to Red.
- **Charts:** Solid 2px line weights. Background grids should be subtle `#384454` dashed lines. Use high-contrast functional colors for different data series.