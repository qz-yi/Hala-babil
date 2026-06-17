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
- `app/(tabs)/restaurants.tsx` — full marketplace (search, category filter, 2-col grid with parallax, Quick View sheet, shimmer loading, floating particle add-to-cart animation, Live Stock badge)
- `app/(tabs)/my-merchant.tsx` — merchant dashboard (stats, tier, catalog CRUD with 5-image gallery, StoreProfileModal for logo/cover, order management)
- `app/(tabs)/my-restaurant.tsx` — just a redirect to my-merchant (uses `as any` for type)

## Reels Shoppable Integration (v2 — Advanced)
- `ReelPlayerItem` has `onShopNow` prop — green "تسوق الآن" pill appears for reels with linkedProductIds
- Merchant "+" button in reels shows `ReelModePickerSheet` — two options: regular reel vs Shoppable
- `ShoppableReelModal` — 2-step animated flow: Step 1 video pick + title + filter, Step 2 mandatory product tag selection (radio single-select from merchant's active products)
- `addReel(..., [selectedProductId])` called on publish → "تسوق الآن" button auto-appears on the published reel
- Merchant "+" button displays an amber→red gradient shopping bag icon (vs plain white "+" for non-merchants)
- `SCREEN_WIDTH` is the screen width constant name in reels.tsx (NOT `SW`)

## UX "Giant Store" Features (restaurants.tsx)
- **Shimmer loading**: 1.4s skeleton cards on mount (6 cards, opacity loop animation)
- **Parallax scroll**: `Animated.ScrollView` + `scrollY.interpolate` per card → `translateY ±20` on images
- **Quick View sheet**: `ProductQuickViewSheet` with image carousel (dots), merchant badge, low-stock warning, spring slide-in/out animation
- **Live Stock badge**: shown on card and in Quick View when `product.stock > 0 && product.stock <= 5`
- **Floating particle animation**: green cart icon flies upward + toward cart button on "أضف" tap, via `Animated.timing` + translateX/Y/scale/opacity interpolations
- **Image count badge**: overlay badge on product card when `product.images.length > 1`

## Static Build Pattern
- App is served via `artifacts/hilla-connect-v2/server/serve.js` on port 5000
- After any code changes, must run: `cd artifacts/hilla-connect-v2 && npx expo export --platform web --output-dir static-build`
- Then restart "Hilla Connect" workflow
- The "artifacts/hilla-connect-v2: expo" workflow ALWAYS fails (port conflict) — expected, harmless

## Known Pre-existing TypeScript Errors (ignore)
- LudoGame, DiceGame, UnoGame, not-found, group/[id], MentionInput
