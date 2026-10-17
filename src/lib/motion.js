// Shared motion language for the whole site (Motion for React + CSS).
//
// Keep it fast and quiet: most UI feedback is 150–250 ms, entrances 400 ms,
// nothing slower. Only transform and opacity are animated wherever possible
// (they run on the compositor), and every preset respects the user's
// "reduce motion" setting through <MotionConfig reducedMotion="user">.
//
// The same values exist as CSS custom properties in globals.css
// (--ease-out, --dur-fast …) for CSS-only transitions.

export const EASE = {
  out: [0.22, 1, 0.36, 1], // quick start, soft landing — default for entrances
  inOut: [0.65, 0, 0.35, 1], // symmetric — for things that move and come back
  in: [0.4, 0, 1, 1], // exits
}

export const DURATION = {
  fast: 0.15, // hovers, icon swaps, press feedback
  base: 0.22, // menus, dropdowns, tabs, step changes
  slow: 0.4, // entrances, dialogs
}

export const SPRING = {
  // Small "pop" for toggles (like / wishlist / added-to-cart).
  pop: { type: 'spring', stiffness: 520, damping: 26, mass: 0.6 },
}

export const STAGGER = 0.05 // seconds between list items (capped by callers)

// ---- Presets (spread onto <m.* {...preset}>) -------------------------------

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.base, ease: EASE.out },
}

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.slow, ease: EASE.out },
}

// Menus and dropdowns: short slide from the trigger side + fade.
export const dropdown = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.base, ease: EASE.out },
}

// Dialog surfaces (backdrop uses `fade`).
export const dialog = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.base, ease: EASE.out },
}

// Step-to-step content (checkout steps, tabs): small horizontal shift.
export const step = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.base, ease: EASE.out },
}

// Expand/collapse panels where the height is unknown.
export const collapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
  transition: { duration: DURATION.base, ease: EASE.out },
}

// Icon swap with a little spring (e.g. heart / bookmark toggles).
export const pop = {
  initial: { scale: 0.6, opacity: 0.6 },
  animate: { scale: 1, opacity: 1 },
  transition: SPRING.pop,
}
