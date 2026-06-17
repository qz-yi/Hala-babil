---
name: Zentram Commerce Engine
description: Architecture decisions for Safrat Babel (سفرة بابل) shoppable reels, marketplace, merchant dashboard, and cart/checkout system
---

# Zentram Commerce Engine

## Data Layer (AppContext.tsx)
- `Reel` interface now has `tags?: string[]` and `linkedProductIds?: string[]`
- `addReel(url, title, filter, tags?, linkedProductIds?)` — updated signature
- `products: Product[]` and `merchants: Merchant[]` are raw arrays on context — filter in-component
- `addToCart(item: CommerceCartItem, merchantName: string)` — single source of truth
- `placeOrder(paymentMethod, address?, notes?)` — returns `Order | null`
- `updateOrderStatus(orderId, status)` exists in context
- `isMerchantOwner` boolean + `getMyMerchant()` function both available
- Payment methods: `cod | zaincash | fastpay | dafaa`

## Component Files
- `components/ShopNowSheet.tsx` — product bottom sheet (linked products, variations, qty, add-to-cart)
- `components/CartSheet.tsx` — cart → checkout → payment → COD OTP → success flow (4 steps)
- Both components import from `@/context/AppContext` and `@/store/themeStore`

## Screen Files
- `app/(tabs)/restaurants.tsx` — full marketplace (search, category filter, 2-col grid, cart FAB)
- `app/(tabs)/my-merchant.tsx` — merchant dashboard (stats, tier, catalog CRUD, order management)
- `app/(tabs)/my-restaurant.tsx` — just a redirect to my-merchant (uses `as any` for type)

## Reels Shoppable Integration
- `ReelPlayerItem` now has `onShopNow` prop
- Green "تسوق الآن" pill FAB appears only when `reel.linkedProductIds.length > 0`
- FAB positioned `left: 16` at `insets.bottom + 100`
- `REEL_TAGS` = 12 Arabic tags array (top of reels.tsx)
- PublishModal now has: tag picker + product linker (merchants only, filtered to their own products)

## Static Build Pattern
- App is served via `artifacts/hilla-connect-v2/server/serve.js` on port 5000
- After any code changes, must run: `cd artifacts/hilla-connect-v2 && npx expo export --platform web --output-dir static-build`
- Then restart "Hilla Connect" workflow
- The "artifacts/hilla-connect-v2: expo" workflow ALWAYS fails (port conflict) — expected, harmless

## Known Pre-existing TypeScript Errors (23 errors to ignore)
- LudoGame, DiceGame, UnoGame, not-found, group/[id], MentionInput
- Filter these when checking new errors with: `grep -v "LudoGame\|DiceGame\|UnoGame\|not-found\|group/\[id\]\|MentionInput"`

**Why:** AppContext is a large file (4273+ lines). All commerce state is local AsyncStorage. No Supabase integration for products yet (Supabase `user_interactions` table still needs running in SQL Editor).
