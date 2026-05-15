import { create } from "zustand";

export interface ActiveCallState {
  callRoomId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  callType: "audio" | "video";
  startedAt: number;
  conversationId: string;
}

interface CallStore {
  activeCall: ActiveCallState | null;
  setActiveCall: (call: ActiveCallState | null) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
}));
