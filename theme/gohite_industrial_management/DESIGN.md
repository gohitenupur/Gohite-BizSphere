---
name: Gohite Industrial Management
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

## Brand & Style
The design system for Gohite is engineered for high-utility shop management, prioritizing clarity, efficiency, and reliability. The brand personality is professional and pragmatic, designed to reduce cognitive load in fast-paced industrial environments. 

The aesthetic follows a **Modern Corporate** approach with a focus on high density and functional minimalism. It balances the precision of industrial software with the approachability of modern SaaS. The UI evokes a sense of organized control through structured layouts, intentional whitespace, and a clear visual hierarchy that directs the user’s attention to critical data points and operational actions.

## Colors
The design system utilizes a dual-theme architecture to cater to different industrial sectors. 

**Krishi Theme:** Employs a professional emerald green palette paired with earthy neutrals. This theme signifies growth and precision, utilizing green as the primary driver for both branding and positive status indicators.

**Hardware Theme:** Focuses on industrial steel blues and slate grays. This palette evokes durability and technical expertise, providing a high-contrast environment suitable for hardware and tool management.

Both themes utilize a shared semantic logic for status indicators:
- **In Stock:** Success Green.
- **Low Stock:** Warning Amber.
- **Expired/Critical:** Error Red.
- **Neutral/Technical:** Slate or Gray.

## Typography
The system uses **Inter** exclusively to ensure maximum legibility across data-heavy interfaces. The typographic scale is optimized for information density. 

**Label-sm** is used for technical metadata and column headers in tables, featuring an uppercase treatment and increased letter spacing to differentiate it from interactive body text. **Body-md** serves as the primary reading size for dashboard widgets and form inputs. For mobile views, display and headline sizes should scale down by 20% to maintain visual balance on smaller viewports.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for dashboard layouts and a **fixed-width sidebar** (240px) for primary navigation. 

A strict 4px baseline grid ensures vertical rhythm. **Density is a core requirement:** data tables and list views should use "tight" spacing (4px gutters/padding) to maximize the information visible above the fold. General layout containers and cards should use "comfortable" spacing to prevent visual clutter. On mobile, the grid collapses to a single column with 16px side margins.

## Elevation & Depth
Elevation in this design system is used sparingly to maintain a clean, enterprise-ready look. We use **Tonal Layers** as the primary method of separation, where the background is slightly darker (`#f9fafb`) than the white surface containers.

**Shadows:**
- **Level 1 (Cards/Inputs):** A very subtle, 1px blur shadow with 5% opacity to provide a slight lift from the background.
- **Level 2 (Dropdowns/Modals):** A more defined 8px blur with 10% opacity to indicate temporary interaction layers.

**Outlines:**
- Use 1px borders (`#e5e7eb`) for all container boundaries. High-contrast outlines are used for focused input states using the primary theme color.

## Shapes
The shape language is structured and professional. We use **Rounded-LG (0.5rem)** as the standard for all primary containers, buttons, and input fields. This provides a modern touch without appearing overly "bubbly" or consumer-grade. Small components like tags and checkboxes use the 0.25rem (Soft) radius to maintain sharpness at small scales.

## Components
Consistent component styling is vital for the Gohite system:

- **Data Tables:** High-density rows (32px height). Use alternating row stripes (Zebra striping) for readability. Headers must be "label-sm" with a subtle bottom border.
- **Status Badges:** Pill-shaped with a low-opacity background of the status color and high-contrast text (e.g., In Stock uses a light green bg with dark green text).
- **Input Fields:** 1px solid borders, 40px height for standard, 32px for compact. Labels should be positioned above the field.
- **Buttons:** Solid primary color for main actions. Ghost buttons for secondary actions within tables. All buttons use "label-md" weight.
- **Inventory Cards:** Use a Level 1 shadow. Include a clear "Low Stock" indicator in the top right corner when thresholds are met.
- **Filter Bar:** A horizontal persistent bar above tables for quick-access filtering by category, date, or status.