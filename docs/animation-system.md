# Unified Animation System Documentation

## Overview

This document describes the unified animation system implemented in the application to ensure consistent, performant, and conflict-free animations across all components.

## Architecture

The animation system is built on Framer Motion and consists of:

1. **Global Page Transitions** - Handled by the `PageTransition` component in the dashboard layout
2. **Component-Level Animations** - Micro-interactions using Framer Motion primitives
3. **Dropdown Animations** - Controlled with `AnimatePresence` for smooth entry/exit transitions

## Implementation Details

### 1. Global Page Transitions

The `PageTransition` component in `src/components/ui/page-transition.tsx` provides consistent page-to-page transitions:

```tsx
// In src/app/(dashboard)/layout.tsx
<PageTransition className="page-container">
  {children}
</PageTransition>
```

All client components should wrap their content with this single `PageTransition` component at the root level, avoiding any additional page-level animation wrappers.

### 2. Component Animations

For micro-interactions within components, we use Framer Motion's `motion` components:

```tsx
<motion.button 
  whileHover={{ scale: 1.05 }} 
  whileTap={{ scale: 0.95 }}
  style={{
    willChange: 'transform',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden'
  }}
>
  Click me
</motion.button>
```

### 3. Dropdown Animations

Dropdown menus use `AnimatePresence` with proper `mode="wait"` for smooth transitions:

```tsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Dropdown content */}
    </motion.div>
  )}
</AnimatePresence>
```

## Best Practices

1. **Single Source of Truth**: Only use `PageTransition` at the layout level, never in individual components
2. **Performance**: Always use `willChange`, `transformStyle`, and `backfaceVisibility` for smooth animations
3. **Accessibility**: Ensure animations respect `prefers-reduced-motion` media query
4. **Consistency**: Use the same easing functions and durations across the application
5. **Staggering**: Use staggered delays for list items to create more dynamic experiences

## Components

### PageTransition
Located: `src/components/ui/page-transition.tsx`

Provides page-level transitions with spring physics:
- Entry: Fade in with left slide
- Exit: Fade out with right slide
- Delay: 0.1s for better perceived performance

### SectionTransition
Located: `src/components/ui/page-transition.tsx`

Provides section-level transitions:
- Fade in with upward motion
- Staggered delays for child elements

### CardTransition
Located: `src/components/ui/page-transition.tsx`

Provides card-level transitions with hover effects:
- Subtle entrance animation
- Lift effect on hover with smooth transition

### ListItemTransition
Located: `src/components/ui/page-transition.tsx`

Provides list item transitions with staggered delays:
- Entrance animation with x-axis movement
- Index-based delays for natural sequencing

## Performance Optimizations

All motion components include performance optimizations:

```tsx
style={{
  willChange: 'transform, opacity',
  transformStyle: 'preserve-3d',
  backfaceVisibility: 'hidden'
}}
```

These properties help the browser optimize animations by:
- Informing the browser which properties will change
- Enabling 3D acceleration
- Preventing unnecessary repaints

## Migration Guide

### Before (Problematic)
```tsx
// DON'T DO THIS - Causes animation conflicts
<PageTransition>
  <AnimatedPageTemplate>  {/* Redundant wrapper */}
    <div>Content</div>
  </AnimatedPageTemplate>
</PageTransition>
```

### After (Correct)
```tsx
// DO THIS - Single animation wrapper
<PageTransition>
  <div>Content</div>
</PageTransition>
```

## Troubleshooting

### Blinking/Flashing Animations
This usually occurs when:
1. Multiple animation wrappers are competing (`PageTransition` + another wrapper)
2. Missing `AnimatePresence` for dropdowns
3. Incorrect `key` props in lists

### Performance Issues
1. Use `willChange`, `transformStyle`, and `backfaceVisibility`
2. Limit the number of simultaneous animations
3. Use CSS transforms instead of changing layout properties
4. Add slight delays to page transitions for better perceived performance

## Professional Animation Examples

Inspired by professional web animation examples, we've implemented:

1. **Subtle Page Transitions** - Smooth slide-in/slide-out effects that don't distract from content
2. **Micro-interactions** - Small hover/tap effects that provide feedback without being obtrusive
3. **Staggered Animations** - Sequential animations for lists that create a sense of flow
4. **Performance-first Design** - All animations include browser optimization hints

These techniques follow industry best practices from companies like Framer, ensuring a professional and polished user experience.