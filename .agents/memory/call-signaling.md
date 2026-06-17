---
name: Call Signaling Architecture
description: Presence Manager, IncomingCallOverlay, cross-device dismiss, and all Socket.IO signal flow decisions for Zentram calling system
---

## The Core Problem (before fix)
Caller navigated to `/call/[id]` without emitting any signal to the callee. The callee only found out about a call if THEY were already on the call screen and joined the same socket room — making cold calls invisible. There was no IncomingCallOverlay component at all.

## Signal Flow (post-fix)

### Initiating a call (caller side)
1. Chat screen emits `initiate-call` to server BEFORE navigating to `/call/[id]`
2. Server's Presence Manager broadcasts `incoming-call` to ALL sockets in `user_{targetId}`
3. Caller navigates to `/call/[id]` (no `callee` param) → shows ringing state
4. If caller hangs up while ringing → emits `cancel-call` → server broadcasts `call-cancelled` to `user_{targetId}`

### Answering a call (callee side)
1. `_layout.tsx`'s `CallSetup` component listens globally for `incoming-call`
2. Sets `callStore.incomingCall` → `IncomingCallOverlay` renders full-screen
3. Accept → emits `accept-call` → server notifies caller (`call-accepted`) + dismisses other callee devices (`call-dismissed`)
4. Callee navigates to `/call/[id]` with `callee=1` param → skips ringing state, shows "connecting"
5. Decline → emits `decline-call` → server notifies caller (`call-declined`) → caller gets `playDisconnected()` + cleanup

### Presence Manager (server)
- `presenceMap: Map<userId, Set<socketId>>` maintained in server memory
- Populated by `register-user` event, cleaned up on `disconnect`
- Used to broadcast `call-dismissed` to all OTHER devices of callee when one device answers

## Key Implementation Files
- Server: `artifacts/api-server/src/index.ts` — presenceMap + all 5 new events
- Store: `artifacts/hilla-connect-v2/store/callStore.ts` — `incomingCall` state added
- New component: `artifacts/hilla-connect-v2/components/IncomingCallOverlay.tsx`
- Socket helpers: `artifacts/hilla-connect-v2/hooks/useSocket.ts` — `initiateCallSignal`, `acceptCallSignal`, `declineCallSignal`, `cancelCallSignal`
- Global listener: `artifacts/hilla-connect-v2/app/_layout.tsx` — `CallSetup` component
- Call screen: `artifacts/hilla-connect-v2/app/call/[id].tsx` — `callee` param, `call-declined`/`call-dismissed` handlers

**Why:**
The previous architecture had `invite-to-call` for in-call multi-party invites only. Cold-call initiation was entirely missing — the caller just navigated locally with no signal to the other side.

**How to apply:**
Any new call initiation point (groups, rooms, profile) should call `initiateCallSignal()` before navigating. The `CallSetup` in `_layout.tsx` handles receiving on ALL screens automatically.
