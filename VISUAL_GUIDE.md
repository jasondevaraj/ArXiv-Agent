# ArXiv Digest Agent - Visual Design Guide

## Color Reference

### Quick Copy Colors

```css
/* Backgrounds */
--bg-ivory: #faf9f7;
--card-white: #ffffff;

/* Text */
--text-charcoal: #2d3436;
--text-gray: #636e72;
--text-light: #b2bec3;

/* Accents */
--accent-forest: #2d7053;      /* Primary buttons, active states */
--accent-forest-dark: #245d44;  /* Hover states */
--accent-sage: #7d9b7a;        /* Badges, secondary elements */
--accent-terracotta: #c87856;  /* Errors, warnings */

/* Borders & Shadows */
--border-light: #e8e6e3;
```

## Component Visual Specs

### Header
```
Height: 64px
Background: #ffffff
Border bottom: 1px solid #e8e6e3
Title: 1.25rem, semibold, #2d3436
Nav buttons: 0.875rem, #636e72 (inactive), #2d7053 (active)
```

### Hero Badge
```
Background: #7d9b7a
Text: #ffffff, 0.75rem, uppercase, semibold
Padding: 0.25rem 0.75rem
Border radius: 9999px (full rounded)
```

### Hero Heading
```
Size: 2.5rem - 3rem (40-48px)
Weight: Bold (700)
Color: #2d3436
Line height: Tight (1.2)
```

### Search Input
```
Background: #faf9f7
Border: 2px solid #e8e6e3
Focus border: 2px solid #2d7053
Border radius: 0.5rem (8px)
Padding: 1rem (16px) left, 3rem for icon
Icon color: #b2bec3
Text color: #2d3436
```

### Primary Button
```
Background: #2d7053
Hover: #245d44
Text: #ffffff, semibold
Padding: 1rem 2rem (16px 32px)
Border radius: 0.5rem (8px)
Transition: 200ms
```

### Statistics Card
```
Background: #ffffff
Border: 1px solid #e8e6e3
Border radius: 0.5rem (8px)
Padding: 1rem (16px)
Value: 1.5rem, bold, #2d7053
Label: 0.75rem, uppercase, medium, #636e72
```

### Paper Card
```
Background: #ffffff
Border: 1px solid #e8e6e3
Hover border: 1px solid #2d7053
Border radius: 0.5rem (8px)
Padding: 1.5rem (24px)
Shadow on hover: 0 4px 6px rgba(0,0,0,0.05)
Transition: 200ms
```

### Paper Card Elements

**Title:**
```
Size: 1.125rem (18px)
Weight: Semibold (600)
Color: #2d3436
Line height: Snug (1.375)
```

**Metadata (authors, date):**
```
Size: 0.875rem (14px)
Weight: Medium (500)
Color: #636e72
Icons: 1rem (16px)
```

**Abstract:**
```
Size: 0.875rem (14px)
Weight: Regular (400)
Color: #636e72
Line height: Relaxed (1.625)
```

**Category Pills:**
```
Background: #f0f4f0
Text: #2d7053, 0.75rem (12px), medium
Padding: 0.25rem 0.75rem (4px 12px)
Border radius: 9999px (full)
```

**Read Paper Button:**
```
Background: #2d7053
Hover: #245d44
Text: #ffffff, 0.875rem, semibold
Padding: 0.5rem 1rem (8px 16px)
Border radius: 0.5rem (8px)
Icon: 1rem (16px)
```

### Loading Indicator

**Container:**
```
Center aligned
Icon background: #e8e6e3, 64px circle
Spinner: #2d7053, 2px border
```

**Steps:**
```
Dot: 0.5rem circle, #2d7053
Active: opacity 100%
Inactive: opacity 30%
Text: 0.875rem, #636e72
Active: opacity 100%
Inactive: opacity 50%
```

### Error State
```
Background: #fff5f5
Border: 1px solid #feb2b2
Border radius: 0.5rem (8px)
Padding: 1.5rem (24px)
Icon: #c87856, 1.5rem (24px)
Heading: 1rem, semibold, #2d3436
Text: 0.875rem, #636e72
```

### Empty State
```
Icon container: #e8e6e3, 64px circle
Icon: #7d9b7a, 2rem (32px)
Heading: 1.25rem, semibold, #2d3436
Text: 1rem, regular, #636e72
```

## Spacing System

### Padding Scale
```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
4xl: 80px  (5rem)
```

### Gap Scale
```
sm: 8px   (0.5rem)
md: 16px  (1rem)
lg: 24px  (1.5rem)
xl: 32px  (2rem)
```

## Typography Scale

### Sizes
```
Hero:     48px  (3rem)
H1:       32px  (2rem)
H2:       24px  (1.5rem)
H3:       20px  (1.25rem)
Large:    18px  (1.125rem)
Base:     16px  (1rem)
Small:    14px  (0.875rem)
Tiny:     12px  (0.75rem)
```

### Weights
```
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
```

## Shadows

```css
/* Small - Subtle elevation */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

/* Medium - Card hover */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);

/* Large - Modal/overlay */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
```

## Border Radius

```css
/* Input, button, card */
border-radius: 0.5rem;  /* 8px */

/* Pills, badges */
border-radius: 9999px;  /* Full rounded */
```

## Transitions

```css
/* Standard */
transition: all 200ms ease;

/* Specific properties (preferred) */
transition: background-color 200ms, border-color 200ms, box-shadow 200ms;
```

## Icons

### Style
- Outline/stroke based
- 2px stroke width
- Rounded line caps and joins

### Sizes
```
sm: 16px  (1rem)
md: 20px  (1.25rem)
lg: 24px  (1.5rem)
xl: 32px  (2rem)
```

### Used Icons
- Search (magnifying glass)
- User (person)
- Calendar
- External link (arrow out)
- Document
- Warning triangle

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 639px) {
  /* Single column, 2x2 grid, reduced padding */
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  /* 4-column stats, comfortable spacing */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Full layout, optimal spacing */
}
```

## Grid Layouts

### Statistics Grid
```css
/* Mobile */
grid-template-columns: repeat(2, 1fr);

/* Desktop */
grid-template-columns: repeat(4, 1fr);

gap: 1rem;
```

### Max Widths
```css
Hero: 896px   (max-w-4xl)
Results: 1280px  (max-w-7xl)
```

## State Variations

### Hover
```css
/* Buttons */
background-color: #245d44; /* from #2d7053 */

/* Cards */
border-color: #2d7053; /* from #e8e6e3 */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
```

### Focus
```css
/* Inputs */
border-color: #2d7053;
outline: none;
```

### Active
```css
/* Buttons - slightly darker */
background-color: #1e4d38;
```

### Disabled
```css
opacity: 0.4;
cursor: not-allowed;
pointer-events: none;
```

## Color Usage Guide

### When to use Forest Green (#2d7053)
- Primary action buttons
- Active navigation items
- Important numbers/values
- Focus states
- Paper card hover borders
- Category pills (text)

### When to use Sage (#7d9b7a)
- Secondary badges
- Icons in empty states
- Subtle accents
- Secondary information

### When to use Terracotta (#c87856)
- Error icons
- Warning states
- Delete actions (if needed in future)

### When to use Charcoal (#2d3436)
- Primary headings
- Important text
- Strong emphasis

### When to use Gray (#636e72)
- Body text
- Supporting information
- Metadata
- Secondary text

### When to use Light Gray (#b2bec3)
- Placeholder text
- Disabled text
- Subtle hints

## Animation Guidelines

### Do Animate
✅ Background color changes (200ms)
✅ Border color changes (200ms)
✅ Box shadow appearance (200ms)
✅ Opacity transitions (200ms)
✅ Loading spinner rotation

### Don't Animate
❌ Width/height changes
❌ Position changes (except subtle hover)
❌ Transform scale (except minimal)
❌ Slide-ins or fly-ins
❌ Bounce effects

## Accessibility

### Color Contrast
```
White on Forest Green: 4.5:1+ ✓
Charcoal on White: 12:1+ ✓
Gray on White: 4.5:1+ ✓
Forest on White: 4.5:1+ ✓
```

### Touch Targets
```
Minimum: 44px x 44px
Buttons: 48px+ height
Links: Adequate spacing
```

### Focus Indicators
```
Visible on all interactive elements
Color: Forest green
Width: 2px
No excessive glow
```

## Best Practices Summary

✅ **Use solid colors** - No gradients
✅ **Subtle shadows** - Minimal depth
✅ **Earth tones** - Forest/sage palette
✅ **Professional typography** - Strong hierarchy
✅ **Consistent spacing** - 4/8/16/24/32px scale
✅ **Smooth transitions** - 200ms standard
✅ **Clear focus states** - Forest green indicators
✅ **Accessible contrast** - WCAG AA compliant

❌ **No gradients** - Especially blue, purple, pink, cyan
❌ **No glassmorphism** - Keep backgrounds solid
❌ **No neon** - Muted, calm colors only
❌ **No excessive animations** - Subtle and purposeful
❌ **No glow effects** - Clean, professional look
