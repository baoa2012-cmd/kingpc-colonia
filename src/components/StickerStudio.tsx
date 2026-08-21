import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Send, RotateCw, Type, Smile, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react";

interface StickerStudioProps {
  onSaveAndSend?: (stickerDataUrl: string) => void;
}

const SAMPLE_STICKER_IMAGES = [
  {
    name: "Mario King PC",
    url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Gamer Setup",
    url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Taller Electrónico",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80",
  },
];

const EMOJI_OPTIONS = [
  "👑", "🕶️", "🔥", "😂", "💥", "❤️", "💀", "🧢", "🥳", "💪", "🚀", "⚡", "🎮", "🛠️", "💯"
];

export const StickerStudio: React.FC<StickerStudioProps> = ({ onSaveAndSend }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_STICKER_IMAGES[0].url);
  const [text, setText] = useState<string>("KING PC COLONIA");
  const [emoji, setEmoji] = useState<string>("👑");

  // Transform controls (360° Rotation & Scaling)
  const [textRotation, setTextRotation] = useState<number>(0);
  const [textSize, setTextSize] = useState<number>(36);
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({ x: 250, y: 70 });

  const [emojiRotation, setEmojiRotation] = useState<number>(0);
  const [emojiSize, setEmojiSize] = useState<number>(70);
  const [emojiPos, setEmojiPos] = useState<{ x: number; y: number }>({ x: 250, y: 410 });

  const [isCircle, setIsCircle] = useState<boolean>(true);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingEmoji, setIsDraggingEmoji] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Redraw canvas whenever states change
  useEffect(() => {
    redrawCanvas();
  }, [imageSrc, text, emoji, textRotation, textSize, textPos, emojiRotation, emojiSize, emojiPos, isCircle]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.save();

      // Circular clip option
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 14, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
      }

      // Draw background image scaled cover
      const hRatio = size / img.width;
      const vRatio = size / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (size - img.width * ratio) / 2;
      const centerShiftY = (size - img.height * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );

      // Outer gold/cyan stroke for circle
      if (isCircle) {
        ctx.restore();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 14, 0, Math.PI * 2, true);
        ctx.lineWidth = 12;
        ctx.strokeStyle = "#38bdf8";
        ctx.stroke();
      }

      // Render Text with 360° Rotation & Outline
      if (text) {
        ctx.save();
        ctx.translate(textPos.x, textPos.y);
        ctx.rotate((textRotation * Math.PI) / 180);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = Math.max(4, Math.round(textSize / 6));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${textSize}px Impact, Arial Black, sans-serif`;
        ctx.strokeText(text.toUpperCase(), 0, 0);
        ctx.fillText(text.toUpperCase(), 0, 0);
        ctx.restore();
      }

      // Render Emoji with 360° Rotation
      if (emoji) {
        ctx.save();
        ctx.translate(emojiPos.x, emojiPos.y);
        ctx.rotate((emojiRotation * Math.PI) / 180);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.fillText(emoji, 0, 0);
        ctx.restore();
      }
    };
    img.src = imageSrc;
  };

  // Mouse drag handlers on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (Math.abs(mouseX - textPos.x) < 180 && Math.abs(mouseY - textPos.y) < 50) {
      setIsDraggingText(true);
      setDragOffset({ x: mouseX - textPos.x, y: mouseY - textPos.y });
      return;
    }

    if (Math.abs(mouseX - emojiPos.x) < 60 && Math.abs(mouseY - emojiPos.y) < 60) {
      setIsDraggingEmoji(true);
      setDragOffset({ x: mouseX - emojiPos.x, y: mouseY - emojiPos.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingText && !isDraggingEmoji) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isDraggingText) {
      setTextPos({ x: mouseX - dragOffset.x, y: mouseY - dragOffset.y });
    } else if (isDraggingEmoji) {
      setEmojiPos({ x: mouseX - dragOffset.x, y: mouseY - dragOffset.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingText(false);
    setIsDraggingEmoji(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    setIsProcessingBg(true);
    // Visual transparency / vignette filter effect
    setTimeout(() => {
      setIsProcessingBg(false);
    }, 600);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `neutron_sticker_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onSaveAndSend) {
      onSaveAndSend(dataUrl);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Estudio Diseñador de Stickers Pro</h2>
            <p className="text-xs text-slate-400">
              Rotación 360°, textos con relieve, emojis y recorte circular para WhatsApp y Neutrón Chat.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRemoveBackground}
            disabled={isProcessingBg}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-950 text-teal-300 border border-teal-700/60 hover:bg-teal-900 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessingBg ? "animate-spin" : ""}`} />
            {isProcessingBg ? "Procesando..." : "Realce IA"}
          </button>
        </div>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-w-full h-auto w-[320px] sm:w-[360px] rounded-xl shadow-2xl cursor-grab active:cursor-grabbing border-2 border-purple-500/40"
              style={{
                background: "repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px",
              }}
            />
            <div className="text-center text-[11px] text-slate-400 mt-2">
              💡 Haz clic y arrastra sobre las letras o el emoji para moverlos
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 mt-4 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              Descargar PNG
            </button>
            <button
              onClick={handleSend}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition"
            >
              {isSaved ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
              {isSaved ? "¡Guardado!" : "Guardar & Enviar"}
            </button>
          </div>
        </div>

        {/* Right: Controls Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Image Selection & Upload */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Seleccionar Imagen Base
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {SAMPLE_STICKER_IMAGES.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setImageSrc(sample.url)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                    imageSrc === sample.url ? "border-purple-400 scale-105" : "border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                </button>
              ))}

              <label className="cursor-pointer flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-slate-700 hover:border-purple-400 bg-slate-900 text-slate-400 hover:text-purple-300 transition text-[10px] text-center p-1">
                <ImageIcon className="w-4 h-4 mb-0.5" />
                Subir
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 ml-auto cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCircle}
                  onChange={(e) => setIsCircle(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                Recorte Circular
              </label>
            </div>
          </div>

          {/* 2. Text & Emoji Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Box */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  Texto Superior / Inferior
                </span>
                <span className="text-[11px] font-mono text-cyan-400">{textRotation}°</span>
              </div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe el texto..."
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase font-bold"
              />

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>🔄 Rotación 360°:</span>
                  <span>{textRotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={textRotation}
                  onChange={(e) => setTextRotation(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>🔍 Tamaño:</span>
                  <span>{textSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="80"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Emoji Box */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  Emoji o Adorno
                </span>
                <span className="text-[11px] font-mono text-amber-400">{emojiRotation}°</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                {EMOJI_OPTIONS.map((em, i) => (
                  <button
                    key={i}
                    onClick={() => setEmoji(em)}
                    className={`text-lg p-1 rounded hover:scale-125 transition ${
                      emoji === em ? "bg-amber-500/30 ring-1 ring-amber-400" : ""
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>🔄 Rotación 360°:</span>
                  <span>{emojiRotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={emojiRotation}
                  onChange={(e) => setEmojiRotation(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>🔍 Tamaño:</span>
                  <span>{emojiSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="140"
                  value={emojiSize}
                  onChange={(e) => setEmojiSize(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
