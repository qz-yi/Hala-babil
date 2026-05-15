import { useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";

function createAudioContext(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

export function useCallAudio() {
  const acRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOscillators = useRef<OscillatorNode[]>([]);

  const stopAll = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    activeOscillators.current.forEach((osc) => {
      try { osc.stop(); } catch {}
    });
    activeOscillators.current = [];
  }, []);

  const getAC = useCallback((): AudioContext | null => {
    if (!acRef.current) {
      acRef.current = createAudioContext();
    }
    // Resume suspended context (browser autoplay policy)
    if (acRef.current?.state === "suspended") {
      acRef.current.resume().catch(() => {});
    }
    return acRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, durationMs: number, gain = 0.28, delayS = 0) => {
      const ac = getAC();
      if (!ac) return;
      const now = ac.currentTime + delayS;

      const osc = ac.createOscillator();
      const gainNode = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + 0.02);
      gainNode.gain.setValueAtTime(gain, now + durationMs / 1000 - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

      osc.connect(gainNode);
      gainNode.connect(ac.destination);
      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.01);
      activeOscillators.current.push(osc);
      osc.onended = () => {
        activeOscillators.current = activeOscillators.current.filter((o) => o !== osc);
      };
    },
    [getAC],
  );

  // Ringing tone — two-tone alternating pattern (like a phone)
  const startRinging = useCallback(() => {
    if (Platform.OS !== "web") return;
    stopAll();

    const playRingCycle = () => {
      playTone(480, 400, 0.25, 0);
      playTone(440, 400, 0.25, 0.05);
      playTone(480, 400, 0.25, 0.5);
      playTone(440, 400, 0.25, 0.55);
    };

    playRingCycle();
    ringIntervalRef.current = setInterval(playRingCycle, 2500);
  }, [stopAll, playTone]);

  // Connected — crisp ascending chime (C5 → E5 → G5)
  const playConnected = useCallback(() => {
    if (Platform.OS !== "web") return;
    stopAll();
    playTone(523, 100, 0.3, 0);
    playTone(659, 100, 0.3, 0.11);
    playTone(784, 220, 0.3, 0.22);
  }, [stopAll, playTone]);

  // Disconnected — short descending fade (G4 → E4 → C4)
  const playDisconnected = useCallback(() => {
    if (Platform.OS !== "web") return;
    stopAll();
    playTone(392, 180, 0.25, 0);
    playTone(330, 180, 0.22, 0.2);
    playTone(262, 350, 0.18, 0.4);
  }, [stopAll, playTone]);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return { startRinging, playConnected, playDisconnected, stopAll };
}
