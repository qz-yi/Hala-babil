---
name: Call Timer Rule
description: When the call duration timer starts in the calling engine
---

## Rule
Timer (`startTimer()`) MUST start ONLY via `onConnectionEstablished()` callback — never on dialing/ringing/offer-received.

## Why
Starting on dialing shows incorrect duration. User-visible call time should only count from the moment the peer answers.

## How to apply
- `onConnectionEstablished()` is a single useCallback that calls: `playConnected()`, `stopAll()`, `setStatus("active")`, `startTimer()`, `setActiveCall()`
- Web path: called from `pc.ontrack` handler (both caller and callee)
- The `offer` socket handler (callee side) does NOT start the timer — it only sends the answer; `ontrack` fires when P2P is actually established
- Native path (Expo Go, no real WebRTC): `setStatus("ringing")` + `startRinging()` on init, then `setTimeout(onConnectionEstablished, 2500)` to simulate connection

## Audio rules
- Web: Web Audio API oscillators (already implemented)
- Native: `Vibration` from react-native — `Vibration.vibrate([200,100,200,100,200,1500], true)` for ring, `Vibration.vibrate([80,40,80])` for connected, `Vibration.vibrate([100,80,100,80,100])` for disconnect
- `stopAll()` must cancel both web oscillators AND native `Vibration.cancel()`
