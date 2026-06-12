---
name: Industrial Excellence System
colors:
  surface: '#fff8f7'
  surface-dim: '#f6d2cd'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ee'
  surface-container: '#ffe9e6'
  surface-container-high: '#ffe2de'
  surface-container-highest: '#ffdad5'
  on-surface: '#2a1614'
  on-surface-variant: '#5e3f3a'
  inverse-surface: '#412b28'
  inverse-on-surface: '#ffedea'
  outline: '#936e69'
  outline-variant: '#e9bcb6'
  surface-tint: '#c0000b'
  primary: '#b40009'
  on-primary: '#ffffff'
  primary-container: '#e3000f'
  on-primary-container: '#fff4f2'
  inverse-primary: '#ffb4aa'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddd'
  on-secondary-container: '#5f6161'
  tertiary: '#0054b5'
  on-tertiary: '#ffffff'
  tertiary-container: '#006ce4'
  on-tertiary-container: '#f4f5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930006'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a41'
  on-tertiary-fixed-variant: '#004494'
  background: '#fff8f7'
  on-background: '#2a1614'
  surface-variant: '#ffdad5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1440px
  gutter: 16px
  touch-target: 44px
---

## Brand & Style

This design system is engineered for the high-stakes environment of industrial manufacturing and professional education. The brand personality is **authoritative, precise, and systematic**, reflecting the institutional heritage of SENAI-SP. It prioritizes functional clarity over decorative flair, ensuring that operators and students can interpret complex data at a glance.

The visual style follows a **Functional Flat Design** approach. It utilizes a modular "Dashboard" aesthetic where information is encapsulated in distinct, high-contrast containers. By stripping away non-essential ornamentation like gradients or glows, the interface maintains maximum legibility under varying factory lighting conditions. The emotional response should be one of reliability and industrial rigor.

## Colors

The palette is anchored by **SENAI Red**, used strategically for primary actions, branding, and critical highlights. To maintain professional focus, the primary interface background uses **Dark Industrial Gray**, which provides a stable, low-fatigue frame for the application.

Content resides on **Crisp White** cards to ensure the highest possible contrast for data and text. **Secondary Gray** is utilized for subtle UI zoning and non-interactive backgrounds. Status colors (Success, Warning) are strictly utilitarian, following standard industrial safety conventions to ensure immediate recognition of machine states.

## Typography

The typography system uses **Hanken Grotesk** as the primary typeface. It provides a contemporary, high-legibility alternative to traditional corporate sans-serifs, maintaining professional neutrality while improving readability on low-resolution industrial displays.

For technical data, sensor readings, and machine IDs, **JetBrains Mono** is employed. This monospaced font ensures that numerical values align vertically in tables and dashboard widgets, preventing visual "jumping" when values update rapidly. All type is rendered with high contrast against white backgrounds—never use Red for long-form text.

## Layout & Spacing

This design system utilizes a **Fixed Grid** philosophy for desktop interfaces to ensure consistent widget placement in control rooms, transitioning to a fluid model for mobile tablets used on the factory floor. 

The layout is built on a **4px baseline grid**. All components must adhere to 8px or 16px increments to maintain mathematical harmony. For industrial HMI applications, touch targets must be a minimum of **44px x 44px** to accommodate users wearing protective equipment. Dashboards should use a 12-column structure with 16px gutters, where cards occupy spans of 3, 4, 6, or 12 columns based on data density.

## Elevation & Depth

To maintain the functional flat aesthetic, depth is communicated through **Tonal Layering** and **Tight Ambient Shadows**. 

1.  **Level 0 (Floor):** Dark Industrial Gray (#2D2D2D) - The application shell.
2.  **Level 1 (Card):** Crisp White (#FFFFFF) - The primary content container. Use a subtle, 4px blur shadow with 5% opacity to separate the card from the background.
3.  **Level 2 (Interactive):** Secondary Gray (#F5F5F5) - Used for input fields and nested containers within cards.

Shadows must never be colorful or diffused beyond the card edge; they serve only to provide enough lift to distinguish clickable modules from the background.

## Shapes

The shape language is **Soft (Level 1)**. Elements feature a 0.25rem (4px) corner radius. This subtle rounding humanizes the industrial interface without appearing "playful" or consumer-grade. 

- **Standard Elements:** 4px (Buttons, Inputs, Small Cards).
- **Large Containers:** 8px (Main Dashboard Panels).
- **Data Tags:** 2px (Small indicators or status chips).

This rigid adherence to small radii maintains the "Institutional" feel, suggesting precision and structural integrity.

## Components

### Buttons
- **Primary:** Solid SENAI Red with White text. No gradients.
- **Secondary:** Transparent with a 2px Dark Gray border.
- **Critical:** Heavy Red border with Red text, reserved for "Stop" or "Emergency" overrides.

### Cards
Cards are the primary unit of the UI. They must have a Crisp White background, 4px border radius, and a 1px Secondary Gray stroke to define edges clearly. Titles within cards should always be Hanken Grotesk SemiBold.

### Input Fields
Inputs use a 1px border (#D1D1D1) on a Secondary Gray background. When focused, the border changes to SENAI Red (2px) to provide clear visual feedback in high-intensity environments.

### Data Chips & Lists
Lists should use alternating row colors (White and Secondary Gray) to assist the eye in tracking horizontal data. Chips for machine status (Running, Idle, Fault) should use a solid background of the status color with a high-contrast label.

### Additional Industrial Components
- **Value Readouts:** Large JetBrains Mono text for sensor data.
- **Toggle Switches:** Rectangular and robust, avoiding the "pill" shape common in consumer apps to maintain the industrial aesthetic.
- **Progress Gauges:** Flat, linear bars instead of radial dials to maximize space efficiency.