---
name: Theme Engine Architecture
description: 6-theme ThemeStore + 4 exclusive visual engines; radio-button logic, EngineContext, GlobalEngineLayer wiring
---

## Radio-Button Overlay Logic
`themeStore.ts` uses `activeOverlay: OverlayMode | null` (NOT a Record of booleans).
`setOverlay(mode)` is a toggle: calling with the active engine turns it off (null); calling with a different engine switches atomically.
**Why:** Multiple overlays conflicted rendering pipeline (z-index, blur + vignette stacked). Exclusive activation prevents visual corruption and maps cleanly to UI radio buttons.

## Engine Pipeline Files
- `store/themeStore.ts` — source of truth: `activeTheme` + `activeOverlay` + `tokens`
- `context/EngineContext.tsx` — provides runtime engine state (parallaxX/Y Animated.Values, springConfig, glassIntensity, rimGlow). Handles Accelerometer subscription for Motion engine (imported lazily from `expo-sensors`).
- `components/engines/GlobalEngineLayer.tsx` — absolute-fill visual overlay rendered at root; `pointerEvents="none"` so UI below is always interactive.
- `hooks/useColors.ts` — applies token overrides per active engine BEFORE returning ExtendedTokens. Priority: Creator > Cinematic > Glass > Motion(no token change).

## Token Override Priority
1. **Creator** — full monochrome: background `#050505`, accent `#FFFFFF`, radius `0`, animationDuration `80`
2. **Cinematic** — forces dark: card `#080808`, animationDuration `420`, deep shadows
3. **Glass** — translucent: card `rgba(255,255,255,0.07)` dark / `0.75` light, border `rgba(255,255,255,0.18)`
4. **Motion** — no token changes; physics handled in EngineContext via springConfig

## GlobalEngineLayer rendering
- Glass → `expo-blur BlurView intensity=10` (native) or semi-transparent View (web); very subtle, cards handle their own deeper blur
- Cinematic → 4 LinearGradient vignettes (top/bottom/left/right, `rgba(0,0,0,0.72)`)
- Motion → oversized `Animated.View` (`top/left/bottom/right: -40`) with parallax gradient; `-1` z-index so it sits BEHIND content
- Creator → null (pure token change)

## EngineContext accelerometer
Lazily imports `expo-sensors` only when Motion is active, on non-web platforms.
Falls through silently if unavailable (web, simulator). On deactivation, springs both axes back to `{0, 0}`.

## useMotionPress hook
Exported from EngineContext. Returns `{ scale, onPressIn, onPressOut }`.
No-op when Motion engine is not active — safe to wire up to any Pressable/TouchableOpacity without conditional logic.

## _layout.tsx wiring
`RootLayoutNav` splits into `RootLayoutNavInner` (reads `useColors()` for live `bg` + `dur`) wrapped by `EngineProvider`.
`GlobalEngineLayer` is the FIRST child of the root View (above Stack) so vignettes overlay everything.
`animationDuration: dur` propagates Cinematic's 420ms or Creator's 80ms to all Stack screen transitions automatically.

## Web note
`useNativeDriver: true` logs a fallback warning on web — expected, animations still work via JS driver.
