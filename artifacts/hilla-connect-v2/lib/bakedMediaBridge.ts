/**
 * In-memory bridge for handing the editor's baked media to the Finalize screen.
 *
 * The UniversalEditor produces a freshly-rendered image (a PNG capture of the
 * canvas with filters and text overlays burned in). For native platforms this
 * is a `file://` URI; for web it's a base64 `data:` URI which can be several
 * megabytes. Passing such URIs through Expo Router params is unreliable —
 * the URL-encoded string gets truncated or rejected.
 *
 * Instead we stash the payload in a module-level ref that both screens can
 * read. The Finalize screen consumes (and clears) it on mount; the editor
 * sets it immediately before navigating.
 */
export type BakedMediaPayload = {
  mediaUri: string;
  mediaType: "image" | "video" | "none";
  filter: string;          // applied at viewer time for videos only
  mentions: string[];
  mode: "post" | "reel";
};

let pending: BakedMediaPayload | null = null;

export function setBakedMedia(payload: BakedMediaPayload) {
  pending = payload;
}

export function consumeBakedMedia(): BakedMediaPayload | null {
  const p = pending;
  pending = null;
  return p;
}

export function peekBakedMedia(): BakedMediaPayload | null {
  return pending;
}
