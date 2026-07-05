# Prospera Design System

## Core Aesthetic
Prospera is a dark-mode only, premium personal finance tracker. It heavily utilizes glassmorphism, glowing gradients, and deep backgrounds to present financial intelligence as a "pro tool."

## Typography
- **Primary Font**: Inter (sans-serif)
- **Style**: Clean, modern, highly legible. Weights 400 (body), 500 (labels), 600 (headers), 700 (display titles).

## Colors

### Base Theme
- **Background**: Slate-950 (`#020617`). Deep dark blue/black.
- **Foreground (Text)**: Slate-50 (`#f8fafc`). Crisp white.
- **Card Background**: Semi-transparent dark overlay (`rgba(255, 255, 255, 0.05)`) with backdrop blur.

### Semantic Colors
- **Primary**: Purple (`#8b5cf6`). Used for brand identity, glowing accents, active states, and CTAs.
- **Income (Success)**: Emerald (`#10b981`). Used for positive cash flow, savings, active status.
- **Expense (Destructive)**: Red (`#ef4444`). Used for outflows, burn rate, errors, destructive actions.
- **Warning**: Amber (`#f59e0b`). Used for approaching budget limits, warnings.
- **Info**: Blue (`#3b82f6`). Used for secondary metrics like savings rate.

### Chart Palette
- Purple (`#8b5cf6`), Pink (`#ec4899`), Blue (`#3b82f6`), Emerald (`#10b981`), Amber (`#f59e0b`), Cyan (`#06b6d4`).

## Components

### Glass Cards
- Background: `rgba(255, 255, 255, 0.06)`
- Border: 1px solid `rgba(255, 255, 255, 0.08)`
- Backdrop Blur: `12px`
- Border Radius: `12px` (`0.75rem`)
- Subtle shadow: `0 8px 32px rgba(0, 0, 0, 0.3)`

### Buttons
- **Primary**: Purple gradient with subtle glow shadow. White text. Rounded `12px`.
- **Secondary**: Glass style (semi-transparent white), white text.
- **Destructive**: Red gradient.
- **Ghost**: Transparent with hover state (`rgba(255,255,255,0.1)`).

### Inputs
- Background: `rgba(0, 0, 0, 0.2)`
- Border: `rgba(255, 255, 255, 0.1)`
- Focus: Ring of Purple (`#8b5cf6`) with glow.

## Layout & Navigation
- **Desktop**: Left fixed sidebar (256px wide) with user avatar, nav items with icons.
- **Tablet**: Left icon-only rail (64px wide).
- **Mobile**: Top header with hamburger menu.
- **Padding**: 32px on desktop, 16px on mobile.

## Ambient Background
- 3 static, large radial gradient blobs behind everything: Red (caution), Green (growth), Indigo (trust). Positioned off-center.
