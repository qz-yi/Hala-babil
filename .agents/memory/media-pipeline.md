---
name: Media Pipeline Architecture
description: How Reel-to-Story media persists through the editor to publish
---

## Rule
Reel-to-Story sharing uses two parallel persistence mechanisms:
1. `sharedContentBridge` (lib/sharedContentBridge.ts) — module-level variable, consumed ONCE on editor mount via `consumeSharedContent()`
2. `useMediaStore` (store/mediaStore.ts) — Zustand store, persists until `clear()` is called after successful publish

## Why
A single bridge that clears on mount meant navigating away and back caused loss of media URL. The mediaStore guarantees the Publish button always reads the canonical media URL regardless of timing.

## How to apply
- `AppContext.shareContentToStory` populates BOTH bridge and mediaStore
- `create-story.tsx` publish reads from `useMediaStore.getState().pending?.mediaUrl` (canonical) with fallback to `sharedPost.mediaUrl`
- After successful `addStory()`, call `useMediaStore.getState().clear()`

## Video path rules
- For shared video (reel repost): NEVER bake through ViewShot — forward original URL
- `VideoPreview` on web: uses native `<video crossOrigin="anonymous" preload="metadata">` to prevent CORS black-screen errors
- Crop/rotate/flip sidebar tools are hidden when `isShareVideo` is true
