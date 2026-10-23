---
name: Precision Tech Minimalist
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#434655'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  tag-label:
    fontFamily: Inter
    fontSize: 11px
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
  unit-2xs: 0.25rem
  unit-xs: 0.5rem
  unit-sm: 0.75rem
  unit-md: 1rem
  unit-lg: 1.5rem
  unit-xl: 2rem
  unit-2xl: 3rem
  gutter-desktop: 1.5rem
  gutter-mobile: 0.75rem
  margin-desktop: 2rem
  margin-mobile: 1rem
---

## Brand & Style

This design system establishes a high-trust, objective, and analytical environment for tech-savvy consumers navigating consumer electronics purchasing decisions. It marries the efficiency and data density of hardware benchmarking tools with the clarity and ease of modern consumer digital retail.

### Design Principles
- **Clarity Over Clutter:** Visual styling steps aside to prioritize specifications, price trends, and vendor distinctions. White space and structural alignment replace decorative motifs.
- **Analytical Precision:** Data points—such as price fluctuations, technical configurations, and benchmark scores—are framed crisply with deliberate tabular structure and scannable visual anchors.
- **Actionable Urgency:** Deal indicators, lowest historical prices, and stock movements use selective chromatic tension against an otherwise disciplined, cool-toned palette.

### Aesthetic Direction
A modern minimalist foundation grounded in card-based architecture. Interfaces leverage cool neutral backgrounds (`#F5F7FA`) to float pure white content cards (`#FFFFFF`), separated by subtle 1px border lines and diffused ambient light. The look is utilitarian yet refined, engineering-focused without appearing archaic or raw.

## Colors

The palette is engineered for analytical consumption: high contrast, strict semantic functional boundaries, and zero decorative color wash.

### Color Tokens & Semantic Assignments

- **Primary (`#2563EB` - Tech Blue):** Primary navigation, interactive states, verified specification checkmarks, direct platform links, and active controls. Signals technological authority and precision.
- **Secondary (`#F97316` - Signal Orange):** Historical low indicators, active coupon reductions, lightning deals (限时特惠), and negative price delta highlights (降价). Must be strictly reserved for monetary savings to avoid alert fatigue.
- **Tertiary (`#10B981` - Performance Green):** Value-for-money indices (性价比指数), positive rating badges (好评率), in-stock confirmations, and favorable benchmark comparisons.
- **Neutral Primary (`#1F2937` - Core Slate):** Page headings, primary price numerals, product model numbers, and key product titles.
- **Neutral Muted (`#6B7280` - Cool Steel):** Secondary specs, merchant names, historic dates, peripheral chart labels, and unit denominators (e.g., `元`, `GB`, `Hz`).
- **Surface Canvas (`#F5F7FA` - Clean Studio Gray):** Global viewport background, establishing clear separation against white containers.
- **Surface Elevation (`#FFFFFF` - Pure White):** Independent cards, comparison modules, modal overlays, and sticky navigation headers.
- **Border Subtle (`#E5E7EB` - Neutral Border):** 1px boundaries dividing table columns, chip outlines, and card separation lines.

## Typography

Typography pairs `Inter` for standard UI copy and Simplified Chinese body content (falling back systematically to `PingFang SC`, `Hiragino Sans GB`, and `Microsoft YaHei`) with `JetBrains Mono` for numerical values, financial figures, hardware specs, and serial numbers.

### Typographic Hierarchy Rules
- **Prices and Currency (`label-numeric-*`):** Monospaced fonts guarantee vertical alignment across multi-vendor pricing tables. The currency symbol (`¥`) must display at 75% of the integer numeral's font size and sit aligned to the baseline.
- **Product Hierarchy:** Model numbers and brand names use `headline-md` or `headline-sm` with a weight of `600`. Long product titles clamp at 2 lines on desktop and mobile list items.
- **Metrics and Scores:** Score badges combine a numeric metric in `JetBrains Mono` (Bold) with a 10px or 11px label describing the metric domain (e.g., `性价比 9.4`).

## Layout & Spacing

The interface uses a 12-column responsive fluid grid with an upper layout constraint of 1440px to retain analytical readability on ultra-wide screens.

### Grid & Breakpoints
- **Desktop (≥ 1280px):** 12-column grid, `gutter-desktop` (24px), page margins `margin-desktop` (32px). Max container width: 1400px centered.
- **Tablet (768px – 1279px):** 8-column grid, 16px gutters, 20px page margins.
- **Mobile (< 768px):** 4-column grid, `gutter-mobile` (12px), `margin-mobile` (16px). High-density horizontal scroll containers for multi-platform price lists.

### Layout Rhythms
- **Specification Matrices & Comparison Grids:** Condensed internal padding of `unit-xs` (8px) to `unit-sm` (12px) vertically, allowing 8-12 vendor rows to fit comfortably in an above-the-fold desktop viewport.
- **Card Padding:** Standard content cards use `unit-md` (16px) for interior space on mobile, scaling to `unit-lg` (24px) on desktop interfaces.

## Elevation & Depth

This system avoids heavy shadows, skewing toward structural 1px borders paired with soft, low-opacity ambient drop shadows to produce an airy, organized workspace.

### Tiers of Depth
- **Level 0 (Canvas Base):** Surface color `#F5F7FA`. Zero shadow. Holds secondary background filters, search containers, and site layout wrappers.
- **Level 1 (Card & Content Blocks):** `#FFFFFF` fill with `border: 1px solid #E5E7EB` and `box-shadow: 0 1px 3px 0 rgba(31, 41, 55, 0.04), 0 1px 2px -1px rgba(31, 41, 55, 0.02)`.
- **Level 2 (Hover & Active Product Cards):** `#FFFFFF` fill with `border-color: #CBD5E1` and `box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.06), 0 4px 6px -4px rgba(37, 99, 235, 0.04)`. A gentle Tech-Blue tint is added to the shadow spread to emphasize the hovered product.
- **Level 3 (Sticky Price Bars, Dropdowns, Flyouts):** `#FFFFFF` fill with `box-shadow: 0 20px 25px -5px rgba(31, 41, 55, 0.08), 0 8px 10px -6px rgba(31, 41, 55, 0.04)`.
- **Level 4 (Comparison Drawers & Modals):** `#FFFFFF` fill with dark backdrops (`rgba(31, 41, 55, 0.50)` blur 4px) and `box-shadow: 0 25px 50px -12px rgba(31, 41, 55, 0.2)`.

## Shapes

The interface implements consistent, controlled rounded geometry (`level 2`) to balance modern consumer software warmth with high-density tabular precision.

### Geometric Application
- **Data Cards & Group Containers:** `12px` (`rounded-lg`) corner radii keep distinct module cards clearly differentiated while grouping internal specs.
- **Buttons, Form Inputs, & Select Triggers:** `8px` (`0.5rem`) corner radii for structured touch targets.
- **Badges, Tags, & Benchmark Chips:** Fully rounded pills (`9999px`) to immediately visually isolate metadata and scores from square and rectangular spec matrices.
- **Table Cells & Mini-Graphs:** Retain sharp internal grid borders (`0px`) with rounded outer wrapper frames (`8px`).

## Components

### Buttons
- **Primary Action (e.g., "直达购买", "开始比价"):** `#2563EB` solid fill, `#FFFFFF` text, `8px` border radius, medium font weight. Hover: `#1D4ED8`. Active: scale down to `0.98`.
- **Secondary / Vendor Select (e.g., "加入对比", "历史价格"):** `#FFFFFF` background, `1px solid #E5E7EB`, `#1F2937` text. Hover: `#F5F7FA` with `#2563EB` border.
- **Alert / Deal Purchase (e.g., "史低抢购"):** `#F97316` solid fill, `#FFFFFF` text. Used exclusively when price hits historical floor.

### Tags & Chips
- **Category Filter Chips:** Neutral background `#FFFFFF`, border `1px solid #E5E7EB`, text `#6B7280`. When active: `#2563EB` fill, `#FFFFFF` text, border `#2563EB`.
- **Price Delta Badges (降价):** Light orange tint background (`#FFF7ED`), text `#F97316`, border `1px solid #FFEDD5`. Format: `↓ ¥240 (历史低价)`.
- **Score Badges (性价比评分):** Emerald tint background (`#ECFDF5`), text `#10B981`, font `JetBrains Mono` bold. Format: `9.6 极力推荐`.

### Price Comparison Table
- **Header:** Background `#F9FAFB`, bottom border `2px solid #E5E7EB`. Column items: 平台 (Platform), 商家 (Merchant), 配置 (Specs), 优惠信息 (Coupons), 当前价格 (Current Price), 操作 (Action).
- **Rows:** Alternating subtle state on hover (`#F8FAFC`). Lowest price row highlighted with a solid left accent border (`3px solid #F97316`) and very faint tint (`#FFFBF7`).
- **Data Columns:** Numerical pricing formatted via `JetBrains Mono`, aligned right, with currency symbols positioned systematically.

### Form Inputs & Search
- **Universal Product Search:** 48px height, `1px solid #E5E7EB` default border, interior icon in `#6B7280`. Focus state: border `#2563EB` with `0 0 0 3px rgba(37, 99, 235, 0.15)`. Quick-filter badges embedded inside the search bar right boundary.

### Product Card
- **Structure:** Vertical composition with a light neutral image well (`#F8FAFC`) at the top, followed by brand/category breadcrumb, 2-line title in `headline-sm`, key spec snippet array, interactive historical mini price sparkline, and bottom anchored vendor price comparison counter (e.g., `5个平台在售，最低 ¥3,299`).