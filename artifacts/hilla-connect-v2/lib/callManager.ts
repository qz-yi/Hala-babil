// Global singleton that keeps WebRTC state alive while navigating away
class CallManager {
  pc: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  localVideoEl: HTMLVideoElement | null = null;
  remoteVideoEl: HTMLVideoElement | null = null;

  cleanup() {
    try { this.localStream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.pc?.close(); } catch {}
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.localVideoEl = null;
    this.remoteVideoEl = null;
  }

  attachLocalVideo(el: HTMLVideoElement | null) {
    this.localVideoEl = el;
    if (el && this.localStream) el.srcObject = this.localStream;
  }

  attachRemoteVideo(el: HTMLVideoElement | null) {
    this.remoteVideoEl = el;
    if (el && this.remoteStream) el.srcObject = this.remoteStream;
  }
}

export const callManager = new CallManager();
