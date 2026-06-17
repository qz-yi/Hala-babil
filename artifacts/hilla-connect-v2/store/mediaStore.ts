import { create } from "zustand";

export interface PendingMedia {
  mediaUrl: string;
  mediaType: "image" | "video";
  sourceType: "reel" | "post" | "story" | "picker";
  sourceId?: string;
  caption?: string;
  creatorName?: string;
  creatorId?: string;
  creatorAvatar?: string;
}

interface MediaStore {
  pending: PendingMedia | null;
  setPending: (media: PendingMedia) => void;
  clear: () => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  pending: null,
  setPending: (media) => set({ pending: media }),
  clear: () => set({ pending: null }),
}));
