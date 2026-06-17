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

export interface IncomingCallState {
  callRoomId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  callType: "audio" | "video";
}

interface CallStore {
  activeCall: ActiveCallState | null;
  setActiveCall: (call: ActiveCallState | null) => void;

  incomingCall: IncomingCallState | null;
  setIncomingCall: (call: IncomingCallState | null) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),

  incomingCall: null,
  setIncomingCall: (call) => set({ incomingCall: call }),
}));
