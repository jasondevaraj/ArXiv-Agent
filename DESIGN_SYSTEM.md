# ArXiv Digest Agent - Design System

## Design Philosophy

The ArXiv Digest Agent is designed to be a **sophisticated research productivity dashboard**, not a generic AI landing page. The design prioritizes:

- **Clarity** over decoration
- **Intelligence** over flashiness
- **Professionalism** over trends
- **Calmness** over excitement
- **Research focus** over generic tech aesthetics

## Color System

### Core Colors

```css
--bg-ivory: #faf9f7          /* Warm off-white background */
--card-white: #ffffff        /* Clean white cards */
--text-charcoal: #2d3436     /* Dark charcoal text */
--text-gray: #636e72         /* Medium gray for secondary text */
--text-light: #b2bec3        /* Light gray for hints */
```

### Accent Colors

```css
--accent-forest: #2d7053     /* Deep forest green (primary) */
--accent-sage: #7d9b7a       /* Muted sage/olive (secondary) */
--accent-terracotta: #c87856 /* Muted terracotta/orange (alerts) */
```

### Border and Shadow Colors

```css
--border-light: #e8e6e3      /* Subtle border color */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
```

## Color Usage Guidelines

### Primary Actions
- **Buttons:** Forest green (#2d7053)
- **Hover state:** Darker forest (#245d44)
- **Focus rings:** Forest green

### Secondary Elements
- **Badges/Pills:** Sage green (#7d9b7a)
- **Category tags:** Light sage background (#f0f4f0) with forest text
- **Small accents:** Sage green

### Status and Alerts
- **Error states:** Terracotta (#c87856)
- **Success states:** Forest green (#2d7053)
- **Loading indicators:** Forest green

### Text Hierarchy
- **Headings:** Charcoal (#2d3436)
- **Body text:** Gray (#636e72)
- **Subtle text:** Light gray (#b2bec3)

## Typography

### Font Stack
- System fonts for maximum readability and performance
- `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`

### Size Scale
- **Hero heading:** 2.5rem - 3rem (40-48px)
- **Page heading:** 2rem (32px)
- **Section heading:** 1.5rem (24px)
- **Card title:** 1.125rem (18px)
- **Body text:** 1rem (16px)
- **Small text:** 0.875rem (14px)
- **Tiny text:** 0.75rem (12px)

### Weight Scale
- **Bold:** 700 (headings, emphasis)
- **Semibold:** 600 (subheadings, labels)
- **Medium:** 500 (buttons, badges)
- **Regular:** 400 (body text)

## Component Patterns

### Header
- Height: 64px (h-16)
- Background: White (#ffffff)
- Border: 1px bottom border (#e8e6e3)
- Logo: Semibold, charcoal
- Navigation: Small font, sage green active state

### Hero Section
- Background: Ivory (#faf9f7)
- Padding: 4rem top, 5rem bottom (desktop)
- Badge: Sage green background, white text, uppercase
- Heading: Bold, 2.5-3rem, charcoal
- Supporting text: Regular, 1.125-1.25rem, gray

### Search Card
- Background: White
- Border: 1px solid light border (#e8e6e3)
- Border radius: 0.5rem (8px)
- Padding: 2rem (32px)
- Shadow: Medium shadow on hover

### Input Field
- Background: Ivory (#faf9f7)
- Border: 2px solid light border (#e8e6e3)
- Border radius: 0.5rem (8px)
- Padding: 1rem (16px)
- Focus: Forest green border
- Icon: Left aligned, light gray

### Primary Button
- Background: Forest green (#2d7053)
- Text: White, semibold
- Padding: 1rem 2rem (16px 32px)
- Border radius: 0.5rem (8px)
- Hover: Darker forest (#245d44)
- Disabled: 40% opacity

### Statistics Cards
- Background: White
- Border: 1px solid light border (#e8e6e3)
- Padding: 1rem (16px)
- Value: 1.5rem, bold, forest green
- Label: 0.75rem, uppercase, medium gray

### Paper Cards
- Background: White
- Border: 1px solid light border (#e8e6e3)
- Padding: 1.5rem (24px)
- Border radius: 0.5rem (8px)
- Hover: Forest green border + subtle shadow
- Transition: All 200ms

### Category Pills
- Background: Light sage (#f0f4f0)
- Text: Forest green, 0.75rem, medium weight
- Padding: 0.25rem 0.75rem (4px 12px)
- Border radius: 9999px (full)

### Loading State
- Spinner: Forest green, 2px border
- Text: Gray, 1.125rem
- Steps: Forest green dots with opacity transitions

### Empty State
- Icon: 64px circle, light border background
- Icon color: Sage green
- Heading: 1.25rem, semibold, charcoal
- Text: Regular, gray

## Spacing System

### Padding Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)

### Gap Scale
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

## Layout Grid

### Max Width
- Content: 1280px (max-w-7xl)
- Narrow content: 896px (max-w-4xl)

### Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (sm to lg)
- Desktop: > 1024px (lg+)

### Grid Patterns
- Statistics: 2 columns (mobile), 4 columns (desktop)
- Paper feed: Single column, full width

## Interactive States

### Hover
- Cards: Border color changes to forest green + shadow
- Buttons: Background darkens slightly
- Links: Color deepens

### Focus
- Inputs: Forest green border, no glow
- Buttons: Subtle outline in forest green

### Active
- Buttons: Slightly darker background
- Links: Underline appears

### Disabled
- Opacity: 40%
- Cursor: not-allowed
- No hover effects

## Animation Guidelines

### Transitions
- Duration: 200ms for most interactions
- Easing: Default (ease) for smooth feel
- Properties: color, background-color, border-color, box-shadow, opacity

### Avoid
- Excessive animations
- Slide-ins or fly-ins
- Bouncing effects
- Scale transformations (except subtle hover)
- Fade-in delays

### Loading
- Simple spinner rotation
- Step-by-step opacity transitions
- No fake progress bars
- No percentage counters

## Iconography

### Style
- Outline style (stroke-based)
- 2px stroke width
- Rounded line caps and joins
- No fill colors

### Sizes
- Small: 16px (w-4 h-4)
- Medium: 20px (w-5 h-5)
- Large: 24px (w-6 h-6)
- Extra large: 32px (w-8 h-8)

### Usage
- Search icon in input field
- User icon for authors
- Calendar icon for dates
- External link icon for paper links
- Document icon for empty state

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Primary text: 4.5:1 minimum
- Large text: 3:1 minimum

### Interactive Elements
- Focus indicators on all interactive elements
- Sufficient touch targets (44px minimum)
- Clear disabled states

### Semantic HTML
- Proper heading hierarchy
- Descriptive button text
- Alt text for icons (when needed)
- Proper form labels

## Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Full-width buttons
- Reduced padding and margins
- Stacked statistics (2x2 grid)
- Hidden navigation (keep compact)

### Tablet (640px - 1024px)
- Two column layouts where appropriate
- Maintained button sizes
- Comfortable padding
- 4-column statistics grid

### Desktop (> 1024px)
- Full layout with optimal spacing
- Side-by-side elements
- Maximum readability
- Full navigation visible

## Best Practices

### Do
✅ Use solid colors throughout
✅ Maintain consistent spacing
✅ Keep interactions subtle
✅ Use semantic color meanings
✅ Prioritize readability
✅ Keep animations minimal

### Don't
❌ Use gradients (blue, purple, pink, cyan, multi-color)
❌ Add glassmorphism effects
❌ Use neon or bright colors
❌ Create excessive animations
❌ Add glow effects
❌ Overuse shadows
❌ Make it look like a generic AI product

## File Structure

```
app/
├── globals.css          # CSS variables and base styles
├── layout.tsx           # Root layout with bg color
└── page.tsx            # Main page with all components
```

## Technical Implementation

### Inline Styles vs Tailwind
- Use Tailwind for: spacing, sizing, display, flexbox, grid
- Use inline styles for: specific colors from palette
- Reason: Precise control over custom color system

### State Management
- React useState for all state
- No external state management needed
- Local component state only

### Performance
- No external CSS-in-JS libraries
- Minimal inline styles
- Static color values (no runtime calculations)
- Optimized for Next.js build

## Future Considerations

When adding theme discovery or clustering features:
- Maintain the same color palette
- Use forest green for theme labels
- Keep the calm, professional aesthetic
- Avoid adding complexity to the UI
- Preserve the research-focused feel
