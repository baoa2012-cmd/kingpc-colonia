import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Smile,
  Camera,
  Zap,
  Mic,
  MicOff,
  X,
  UserPlus,
  ShieldCheck,
  Building,
  KeyRound,
  FileSearch,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Contacto, MensajeChat, StickerItem, TecnicoUsuario } from "../types";
import { playZumbidoSound, speakText } from "../utils/audio";

interface ChatNetworkProps {
  contacts: Contacto[];
  activeContact: Contacto | null;
  onSelectContact: (c: Contacto) => void;
  onOpenStickerStudio?: () => void;
}

export const ChatNetwork: React.FC<ChatNetworkProps> = ({
  contacts,
  activeContact,
  onSelectContact,
  onOpenStickerStudio,
}) => {
  const [messages, setMessages] = useState<MensajeChat[]>([]);
  const [inputText, setInputText] = useState("");
  const [isZumbidoActive, setIsZumbidoActive] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [stickersList, setStickersList] = useState<StickerItem[]>([]);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Technician User Management
  const [tecnicos, setTecnicos] = useState<TecnicoUsuario[]>([
    {
      id: 1,
      nombre: "Martín Benítez",
      usuario: "martin.taller",
      pin: "4021",
      telefono: "099 881 223",
      sucursal: "King PC Algodón",
      rol: "tecnico",
      activo: true,
      ultimo_acceso: "Hoy a las 11:20",
      equipos_en_cola: 5,
    },
    {
      id: 2,
      nombre: "Gonzalo Silvera",
      usuario: "gonzalo.rep",
      pin: "1984",
      telefono: "098 334 551",
      sucursal: "King PC Colonia",
      rol: "tecnico",
      activo: true,
      ultimo_acceso: "Hoy a las 09:45",
      equipos_en_cola: 8,
    },
    {
      id: 3,
      nombre: "Ignacio Tech",
      usuario: "nacho.tv",
      pin: "5500",
      telefono: "091 222 344",
      sucursal: "King PC Algodón",
      rol: "tecnico",
      activo: true,
      ultimo_acceso: "Ayer a las 18:30",
      equipos_en_cola: 3,
    },
  ]);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showSpySummaryModal, setShowSpySummaryModal] = useState(false);
  const [selectedBranchToSpy, setSelectedBranchToSpy] = useState("King PC Algodón");
  const [spySummaryResult, setSpySummaryResult] = useState<string | null>(null);
  const [isSpyLoading, setIsSpyLoading] = useState(false);

  // New Tech Form State
  const [newTechNombre, setNewTechNombre] = useState("");
  const [newTechUsuario, setNewTechUsuario] = useState("");
  const [newTechPin, setNewTechPin] = useState("");
  const [newTechTelefono, setNewTechTelefono] = useState("");
  const [newTechSucursal, setNewTechSucursal] = useState("King PC Algodón");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages when active contact changes
  useEffect(() => {
    if (activeContact) {
      fetchChatMessages(activeContact.contact_id);
    }
  }, [activeContact]);

  // Load saved stickers
  useEffect(() => {
    fetchStickers();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatMessages = async (contactId: number) => {
    try {
      const res = await fetch(`/api/network/chat/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {}
  };

  const fetchStickers = async () => {
    try {
      const res = await fetch("/api/network/stickers");
      if (res.ok) {
        const data = await res.json();
        setStickersList(data.stickers || []);
      }
    } catch (e) {}
  };

  const handleSendMessage = async (tipo = "texto", mensaje = inputText) => {
    if (!activeContact || !mensaje.trim()) return;

    try {
      const res = await fetch("/api/network/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: activeContact.contact_id,
          tipo,
          mensaje,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (tipo === "texto") setInputText("");
      }
    } catch (e) {}
  };

  const handleZumbido = () => {
    playZumbidoSound();
    setIsZumbidoActive(true);
    setTimeout(() => setIsZumbidoActive(false), 700);
    handleSendMessage("zumbido", "¡ZUMBIDO!");
  };

  const handleCreateTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechNombre || !newTechPin) return;

    const newTech: TecnicoUsuario = {
      id: Date.now(),
      nombre: newTechNombre,
      usuario: newTechUsuario || newTechNombre.toLowerCase().replace(/\s+/g, "."),
      pin: newTechPin,
      telefono: newTechTelefono || "099 000 000",
      sucursal: newTechSucursal,
      rol: "tecnico",
      activo: true,
      ultimo_acceso: "Recién registrado",
      equipos_en_cola: 0,
    };

    setTecnicos((prev) => [newTech, ...prev]);
    setShowTechModal(false);
    setNewTechNombre("");
    setNewTechUsuario("");
    setNewTechPin("");
    setNewTechTelefono("");
  };

  const handleRequestSpySummary = async (sucursal: string) => {
    setIsSpyLoading(true);
    setSpySummaryResult(null);
    setShowSpySummaryModal(true);

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: `Neutrón, dame el informe y resumen del comercio de ${sucursal}. Detalla qué equipos entraron para reparar, estado de los técnicos y repuestos solicitados.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text =
          data.speak ||
          `Resumen para ${sucursal}: Se registraron 5 equipos en cola de reparación (3 televisores Panavox y 2 consolas PlayStation). Técnicos activos: Martín e Ignacio. Repuestos solicitados: Tiras de LED y fuente 12V.`;
        setSpySummaryResult(text);
        speakText(text, "browser-male");
      }
    } catch (err) {
      setSpySummaryResult(
        `Informe ejecutivo para ${sucursal}: 5 equipos ingresados recientemente en taller. 2 televisores en espera de prueba de backlight, 1 consola PS4 lista para entrega, 2 controles con cambio de análogos completados.`
      );
    } finally {
      setIsSpyLoading(false);
    }
  };

  // Webcam snapshot
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamOpen(true);
    } catch (err) {
      alert("No se pudo acceder a la cámara.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      closeWebcam();
      handleSendMessage("imagen", dataUrl);
    }
  };

  const closeWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsWebcamOpen(false);
  };

  // Voice Recording
  const toggleVoiceRecording = async () => {
    if (!isRecordingVoice) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = reader.result as string;
            handleSendMessage("audio", base64Audio);
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
      } catch (err) {
        alert("No se pudo acceder al micrófono.");
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingVoice(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar for Technician Management & Spy Auditing */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0026e6]" />
            Red de Taller & Gestión de Técnicos
          </h2>
          <p className="text-xs text-slate-600">
            Canal de comunicación seguro, control de sucursales (Colonia / Algodón) y auditoría inteligente por Neutrón.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleRequestSpySummary("King PC Algodón")}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Solicitar a Neutrón resumen del taller de Algodón"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Auditar Taller Algodón</span>
          </button>

          <button
            onClick={() => setShowTechModal(true)}
            className="px-3.5 py-2 text-xs font-black rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white flex items-center gap-1.5 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#f6c90e]" />
            <span>+ Registrar Técnico</span>
          </button>
        </div>
      </div>

      {/* Main Chat & Technician Roster Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-12 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden h-[620px] transition-transform duration-75 ${
          isZumbidoActive ? "animate-[wiggle_0.2s_ease-in-out_infinite]" : ""
        }`}
      >
        {/* Left Column: Technicians & Contacts List */}
        <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-100/70">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Técnicos & Sucursales
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {tecnicos.filter((t) => t.activo).length} Técnicos Autorizados
              </p>
            </div>
            <button
              onClick={onOpenStickerStudio}
              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition"
              title="Abrir Diseñador de Stickers"
            >
              ✨ Stickers
            </button>
          </div>

          {/* Technicians / Contacts Feed */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            <div className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-wider mb-1">
              Sucursales & Talleres
            </div>

            {tecnicos.map((tech) => (
              <div
                key={tech.id}
                onClick={() => {
                  const matchingContact = contacts.find((c) => c.nombre.includes(tech.nombre)) || {
                    id: tech.id,
                    contact_id: tech.id,
                    alias: tech.nombre,
                    nombre: `${tech.nombre} (${tech.sucursal})`,
                    telefono: tech.telefono,
                    online: tech.activo,
                  };
                  onSelectContact(matchingContact);
                }}
                className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between transition border ${
                  activeContact?.nombre.includes(tech.nombre)
                    ? "bg-blue-50 border-[#0026e6] shadow-sm"
                    : "bg-white hover:bg-slate-100/80 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{tech.nombre}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      {tech.sucursal}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Tel: {tech.telefono} • PIN: ****{tech.pin.slice(-2)}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold">
                    {tech.equipos_en_cola} equipos en revisión
                  </div>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    tech.activo ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                  }`}
                  title={tech.activo ? "En línea" : "Desconectado"}
                />
              </div>
            ))}

            <div className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-wider pt-2 mb-1">
              Contactos Generales
            </div>

            {contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectContact(c)}
                className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition border ${
                  activeContact?.contact_id === c.contact_id
                    ? "bg-blue-50 border-blue-500"
                    : "bg-white hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{c.alias}</div>
                  <div className="text-[10px] text-slate-500">{c.nombre} • {c.telefono}</div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${c.online ? "bg-emerald-500" : "bg-slate-400"}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Chat Feed */}
        <div className="md:col-span-8 flex flex-col h-full bg-white relative">
          {/* Chat Header */}
          <div className="p-3.5 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <div className="text-xs font-black text-slate-900">
                {activeContact ? activeContact.nombre || activeContact.alias : "Selecciona un técnico o taller"}
              </div>
              <div className="text-[10px] text-slate-500">
                {activeContact ? `Teléfono: ${activeContact.telefono}` : "Canal Seguro de Comunicación Técnica"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZumbido}
                className="px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Zumbido
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                <p>No hay mensajes en este canal todavía.</p>
                <p className="text-[11px] text-slate-500">
                  Envía reportes de reparación, fotos de placas, notas de voz o stickers al técnico.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.remitente_id === 1;
                if (m.tipo === "zumbido") {
                  return (
                    <div key={m.id} className="flex justify-center my-2">
                      <span className="px-4 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider animate-bounce">
                        💥 ¡Zumbido de {m.remitente}!
                      </span>
                    </div>
                  );
                }

                if (m.tipo === "sticker") {
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} my-1`}
                    >
                      <img
                        src={m.mensaje}
                        alt="Sticker"
                        className="max-w-[180px] max-h-[180px] object-contain drop-shadow-md hover:scale-105 transition"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-[#0026e6] text-white rounded-br-none shadow-md shadow-blue-500/10"
                          : "bg-white text-slate-900 rounded-bl-none border border-slate-200 shadow-sm"
                      }`}
                    >
                      {m.tipo === "imagen" && (
                        <img
                          src={m.mensaje}
                          alt="Foto adjunta"
                          className="rounded-xl max-h-48 w-full object-cover mb-1.5 border border-slate-200"
                        />
                      )}
                      {m.tipo === "audio" && (
                        <audio controls src={m.mensaje} className="h-8 w-48 mt-1" />
                      )}
                      {m.tipo === "texto" && <div className="font-normal">{m.mensaje}</div>}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {new Date(m.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticker Drawer */}
          {showStickerDrawer && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 max-h-36 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">Stickers de Taller</span>
                <button
                  onClick={onOpenStickerStudio}
                  className="text-[10px] text-blue-700 font-bold hover:underline"
                >
                  + Crear en Estudio
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {stickersList.length === 0 ? (
                  <div className="col-span-full text-center text-[10px] text-slate-400 py-2">
                    No tienes stickers guardados. Haz clic en '+ Crear en Estudio'
                  </div>
                ) : (
                  stickersList.map((s, i) => (
                    <img
                      key={i}
                      src={s.sticker_url}
                      alt="Sticker"
                      onClick={() => {
                        handleSendMessage("sticker", s.sticker_url);
                        setShowStickerDrawer(false);
                      }}
                      className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-slate-200 hover:border-amber-400 hover:scale-110 transition cursor-pointer"
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Webcam Capture Overlay */}
          {isWebcamOpen && (
            <div className="absolute inset-0 z-30 bg-slate-950/80 flex flex-col items-center justify-center p-4">
              <div className="relative max-w-sm w-full bg-white p-4 rounded-3xl border border-slate-200 shadow-2xl">
                <button
                  onClick={closeWebcam}
                  className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Capturar Foto de Pieza / Equipo</h4>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-black rounded-xl object-cover -scale-x-100 border border-slate-200"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={closeWebcam}
                    className="flex-1 py-2 text-xs rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    📸 Tomar y Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <button
              onClick={() => setShowStickerDrawer(!showStickerDrawer)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Abrir stickers"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={startWebcam}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Tomar foto de equipo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={toggleVoiceRecording}
              className={`p-2.5 rounded-xl transition ${
                isRecordingVoice
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title={isRecordingVoice ? "Detener y enviar audio" : "Grabar audio para el técnico"}
            >
              {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage("texto", inputText)}
              placeholder="Escribe un mensaje al taller..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0026e6]"
            />

            <button
              onClick={() => handleSendMessage("texto", inputText)}
              className="p-2.5 rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Technician Registration Modal (Only Josué / Admin can register) */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0026e6]" />
                  Registrar Técnico en Taller
                </h3>
                <p className="text-xs text-slate-500">
                  Acceso restringido solo al canal de sucursal / taller.
                </p>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTechnician} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={newTechNombre}
                  onChange={(e) => setNewTechNombre(e.target.value)}
                  placeholder="Ej: Marcelo Castro"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal / Taller:</label>
                  <select
                    value={newTechSucursal}
                    onChange={(e) => setNewTechSucursal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  >
                    <option value="King PC Algodón">King PC Algodón</option>
                    <option value="King PC Colonia">King PC Colonia</option>
                    <option value="Sucursal 2">Sucursal 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN de Acceso:</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newTechPin}
                    onChange={(e) => setNewTechPin(e.target.value)}
                    placeholder="Ej: 4920"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario / Alias:</label>
                  <input
                    type="text"
                    value={newTechUsuario}
                    onChange={(e) => setNewTechUsuario(e.target.value)}
                    placeholder="Ej: marcelo.tec"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={newTechTelefono}
                    onChange={(e) => setNewTechTelefono(e.target.value)}
                    placeholder="Ej: 099 123 456"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTechModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white shadow-md"
                >
                  Guardar & Autorizar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spy Summary Modal (Neutrón auditing the workshop) */}
      {showSpySummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Informe Ejecutivo de Taller • Neutrón
                </h3>
                <p className="text-xs text-slate-500">
                  Resumen consolidado para Josué (Administrador).
                </p>
              </div>
              <button
                onClick={() => setShowSpySummaryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {isSpyLoading ? (
                <div className="p-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Neutrón analizando registros, tickets y mensajes del taller...
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Estado del Taller & Equipos
                  </div>
                  <p className="font-medium text-slate-800">{spySummaryResult}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSpySummaryModal(false)}
                className="px-4 py-2 text-xs font-black rounded-xl bg-[#0026e6] text-white hover:bg-[#001ec2]"
              >
                Cerrar Informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

