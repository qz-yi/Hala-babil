/**
 * In-memory bridge for handing a "share to my story" payload from the
 * source screen (feed post, reel, story viewer) to the UniversalEditor.
 *
 * Why a bridge instead of router params?
 *   The shared media URL can be:
 *     • a freshly-baked PNG `data:` URI (multiple MB on web), or
 *     • a long `file://` path on native devices,
 *   either of which exceeds practical URL/router-param length limits.
 *   Expo Router serializes params into the navigation state and through a
 *   URL on web — huge values get truncated or URL-encoded into garbage,
 *   which then arrives in the editor as an empty / broken `sharedMediaUrl`.
 *   The editor then renders nothing for the shared sticker, and on publish
 *   the story is saved with an empty mediaUrl → the viewer shows a black
 *   canvas. This bridge keeps the full payload in module-level memory so
 *   the editor receives byte-for-byte what the source screen sent.
 *
 * Lifetime contract:
 *   - The source screen calls `setSharedContent(payload)` and then
 *     `router.push("/create-story", { sharedFromBridge: "1" })`.
 *   - The editor consumes the payload exactly once on mount, then clears
 *     the bridge so a subsequent navigation doesn't accidentally re-use
 *     stale data.
 */
export type SharedContentPayload = {
  type: "post" | "reel" | "story";
  id: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  caption?: string;
  creatorName?: string;
  creatorId?: string;
  creatorAvatar?: string;
  originalStoryId?: string;
};

let pending: SharedContentPayload | null = null;

export function setSharedContent(payload: SharedContentPayload) {
  pending = payload;
}

export function consumeSharedContent(): SharedContentPayload | null {
  const p = pending;
  pending = null;
  return p;
}

export function peekSharedContent(): SharedContentPayload | null {
  return pending;
}
