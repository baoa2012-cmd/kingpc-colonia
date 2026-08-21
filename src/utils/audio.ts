// Audio utility for Web Speech API & Gemini TTS
// Prioritizes masculine / male voices from the browser with robust multi-browser fallbacks

let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let keepAliveInterval: any = null;

// Retain utterance in global window to prevent Chrome V8 garbage collection during speech
declare global {
  interface Window {
    __activeUtterance?: SpeechSynthesisUtterance | null;
  }
}

export function stopCurrentAudio() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch (e) {}
    activeSourceNode = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (typeof window !== "undefined") {
    window.__activeUtterance = null;
  }
}

// Converts Base64 16-bit PCM (24000Hz, mono) into an AudioBuffer and plays it
export async function playPcmAudioBase64(base64Pcm: string, sampleRate = 24000): Promise<void> {
  stopCurrentAudio();

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!activeAudioCtx || activeAudioCtx.state === "closed") {
      activeAudioCtx = new AudioContextClass({ sampleRate });
    }
    if (activeAudioCtx.state === "suspended") {
      await activeAudioCtx.resume();
    }

    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert 16-bit signed integer buffer to float [-1.0, 1.0]
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = activeAudioCtx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    const source = activeAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(activeAudioCtx.destination);
    activeSourceNode = source;

    return new Promise((resolve) => {
      source.onended = () => {
        activeSourceNode = null;
        resolve();
      };
      source.start();
    });
  } catch (err) {
    console.warn("Error playing PCM audio, falling back to Web Speech:", err);
  }
}

// Get voices with asynchronous promise support for Chrome/Edge on Windows
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load
    let resolved = false;
    const handleVoicesChanged = () => {
      if (resolved) return;
      resolved = true;
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = null;
      resolve(voices || []);
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    // Timeout fallback if onvoiceschanged doesn't fire within 500ms
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      voices = window.speechSynthesis.getVoices();
      resolve(voices || []);
    }, 500);
  });
}

// Selects the best voice: Preferred masculine Spanish -> Any Spanish -> System default
export async function getBestSpanishVoice(): Promise<{ voice: SpeechSynthesisVoice | null; lang: string }> {
  const voices = await getAvailableVoices();
  if (!voices || voices.length === 0) {
    return { voice: null, lang: "es-ES" };
  }

  // 1. Male Spanish Voice
  const maleKeywords = [
    "male", "hombre", "jorge", "diego", "raul", "alvaro", "enrique", 
    "miguel", "carlos", "pablo", "microsoft alvaro", "microsoft jorge", 
    "microsoft raul", "google español", "antonio", "tomas", "gonzalo"
  ];

  const maleSpanish = voices.find((v) => {
    const lang = (v.lang || "").toLowerCase();
    const name = (v.name || "").toLowerCase();
    const isSpanish = lang.startsWith("es") || lang.includes("es-") || lang.includes("es_");
    return isSpanish && maleKeywords.some((k) => name.includes(k));
  });

  if (maleSpanish) {
    return { voice: maleSpanish, lang: maleSpanish.lang || "es-ES" };
  }

  // 2. Any Spanish Voice (e.g. Sabina, Helena, Laura, Monica, etc.)
  const anySpanish = voices.find((v) => {
    const lang = (v.lang || "").toLowerCase();
    return lang.startsWith("es") || lang.includes("es-") || lang.includes("es_");
  });

  if (anySpanish) {
    return { voice: anySpanish, lang: anySpanish.lang || "es-ES" };
  }

  // 3. Fallback to default voice
  const defaultVoice = voices.find((v) => v.default) || voices[0];
  return { voice: defaultVoice || null, lang: defaultVoice?.lang || "es-ES" };
}

// Web Speech API execution with Chrome-bug resilience & resume loop
export async function speakWebSpeech(text: string, voiceRate = 1.0): Promise<void> {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  // Clean text of technical markup, excessive markdown, asterisks, brackets
  const clean = text
    .replace(/[\*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return;

  // Stop previous audio
  stopCurrentAudio();

  // Give Chrome a short 60ms breath after cancel to prevent dropping utterance
  await new Promise((r) => setTimeout(r, 60));

  const { voice, lang } = await getBestSpanishVoice();

  return new Promise((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = voiceRate;
      utter.pitch = 0.95; // Confident male tone
      utter.lang = lang;

      if (voice) {
        utter.voice = voice;
      }

      // Prevent garbage collection by storing on window
      window.__activeUtterance = utter;

      const cleanup = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        window.__activeUtterance = null;
        resolve();
      };

      utter.onend = cleanup;
      utter.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        cleanup();
      };

      // Chrome keep-alive: prevent long texts from freezing
      keepAliveInterval = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 5000);

      // Resume if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("Error invoking speechSynthesis.speak:", err);
      resolve();
    }
  });
}

// Primary speak function: Web Speech Male Voice by default
export async function speakText(text: string, voiceEngine: string = "browser-male"): Promise<void> {
  if (!text) return;

  if (voiceEngine === "browser-male" || voiceEngine === "Navegador Masculina" || !voiceEngine) {
    await speakWebSpeech(text);
    return;
  }

  // If Gemini TTS is chosen
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceName: voiceEngine || "Fenrir" }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        await playPcmAudioBase64(data.audioBase64, data.sampleRate || 24000);
        return;
      }
    }
  } catch (e) {
    console.warn("Gemini TTS unreachable, fallback to browser voice");
  }

  await speakWebSpeech(text);
}

// Retro Messenger Zumbido sound generator
export function playZumbidoSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(170, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.55);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}
