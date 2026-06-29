import { Audio } from "expo-av";

type SoundName = "place" | "win" | "lose" | "draw" | "tick" | "join" | "start";

const _cache = new Map<SoundName, Audio.Sound>();

async function load(name: SoundName, uri: string): Promise<Audio.Sound | null> {
  try {
    if (_cache.has(name)) return _cache.get(name)!;
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    _cache.set(name, sound);
    return sound;
  } catch {
    return null;
  }
}

async function play(sound: Audio.Sound | null) {
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // silent fallback
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
// Sound files should be placed in assets/sounds/ for production.
// Falls back silently if files are missing.

const FILES: Record<SoundName, string> = {
  place:  "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
  win:    "https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg",
  lose:   "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
  draw:   "https://actions.google.com/sounds/v1/cartoon/dun_dun_dunnn.ogg",
  tick:   "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
  join:   "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
  start:  "https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg",
};

export const gameSounds = {
  async playPlace()  { play(await load("place", FILES.place)); },
  async playWin()    { play(await load("win",   FILES.win)); },
  async playLose()   { play(await load("lose",  FILES.lose)); },
  async playDraw()   { play(await load("draw",  FILES.draw)); },
  async playTick()   { play(await load("tick",  FILES.tick)); },
  async playJoin()   { play(await load("join",  FILES.join)); },
  async playStart()  { play(await load("start", FILES.start)); },

  async preload() {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      await Promise.all(
        (Object.keys(FILES) as SoundName[]).map((k) => load(k, FILES[k])),
      );
    } catch {
      // silent
    }
  },

  async unloadAll() {
    for (const [, sound] of _cache) {
      try { await sound.unloadAsync(); } catch { /* noop */ }
    }
    _cache.clear();
  },
};
