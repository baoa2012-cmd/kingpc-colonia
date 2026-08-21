import React from "react";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";

interface VoiceSphereProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onToggleListen: () => void;
  onStopSpeech: () => void;
  onSubmitListen?: () => void;
  onCancelListen?: () => void;
  lastSpokenText: string;
  transcript: string;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  onToggleListen,
  onSubmitListen,
  onCancelListen,
  transcript,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      {/* Floating draggable clean Blue Neutrón Button */}
      <motion.div
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative my-2 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 select-none"
        title="Arrastra a cualquier parte de la pantalla o haz clic para activar"
      >
        {/* Animated Ripple Waves when Active */}
        {(isListening || isSpeaking || isProcessing) && (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className={`absolute w-36 h-36 rounded-full border-2 pointer-events-none ${
                isListening ? "border-emerald-500" : isSpeaking ? "border-[#0026e6]" : "border-[#f6c90e]"
              }`}
            />
            <motion.div
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.3 }}
              className={`absolute w-44 h-44 rounded-full border pointer-events-none ${
                isListening ? "border-green-400" : isSpeaking ? "border-sky-500" : "border-yellow-400"
              }`}
            />
          </>
        )}

        {/* Pure Solid Blue Sphere - No icons, no text, no white borders */}
        <button
          id="btn-voice-sphere"
          onClick={onToggleListen}
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full cursor-pointer shadow-2xl transition-all duration-300 relative overflow-hidden flex items-center justify-center outline-none ${
            isListening
              ? "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700 shadow-green-500/60 ring-4 ring-green-400/40"
              : isSpeaking
              ? "bg-gradient-to-br from-[#0055ff] via-[#0026e6] to-[#001780] shadow-blue-500/70 animate-pulse ring-4 ring-blue-400/30"
              : isProcessing
              ? "bg-gradient-to-br from-[#f6c90e] to-amber-500 shadow-yellow-500/50 animate-pulse ring-4 ring-yellow-400/30"
              : "bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] shadow-blue-600/60 hover:shadow-blue-500/80"
          }`}
          title={isListening ? "Neutrón escuchando (Haz clic para pausar)" : "Toca para hablar con Neutrón"}
        >
          {/* Subtle realistic inner 3D sphere gradient highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 via-transparent to-white/30 pointer-events-none" />
          <div className="w-8 h-8 rounded-full bg-white/20 blur-sm pointer-events-none -mt-8 -ml-8" />

          {/* Animated Equalizer Wave Bars inside Sphere when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-1 z-10 pointer-events-none">
              {[0.4, 0.8, 1.2, 0.6, 0.9].map((delay, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: ["8px", "24px", "8px"] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                  className="w-1.5 bg-[#f6c90e] rounded-full shadow-sm"
                />
              ))}
            </div>
          )}

          {/* Animated Wave Bars inside Sphere when processing */}
          {isProcessing && (
            <div className="flex items-center gap-1 z-10 pointer-events-none">
              {[0.2, 0.5, 0.8].map((delay, idx) => (
                <motion.div
                  key={idx}
                  animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay }}
                  className="w-2.5 h-2.5 bg-slate-950 rounded-full"
                />
              ))}
            </div>
          )}
        </button>
      </motion.div>

      {/* Floating Listening Action Bar */}
      {isListening && (
        <div className="w-full max-w-xs mt-2 flex items-center justify-center gap-2 z-20">
          <button
            id="btn-process-now"
            onClick={onSubmitListen || onToggleListen}
            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Enviar orden</span>
          </button>

          {onCancelListen && (
            <button
              id="btn-cancel-voice"
              onClick={onCancelListen}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
              title="Pausar conversación"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Pausar</span>
            </button>
          )}
        </div>
      )}

      {/* Live transcript bubble */}
      {transcript && (
        <div className="w-full max-w-md text-center mt-2 z-20">
          <div className="w-full text-left bg-emerald-950/80 p-3 rounded-2xl border border-emerald-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
              <span>🎙️ Neutrón te escucha:</span>
              <span className="text-[10px] text-emerald-300/80">Pausa para procesar</span>
            </div>
            <p className="text-xs text-white font-medium leading-relaxed">
              "{transcript}"<span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse" />
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


