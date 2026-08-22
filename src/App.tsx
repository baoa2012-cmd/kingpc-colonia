import React, { useState, useEffect, useRef } from "react";
import {
  Wrench,
  Receipt,
  Sparkles,
  MessageSquare,
  Terminal as TerminalIcon,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Printer,
  Edit,
  ShieldAlert,
  Play,
  RotateCcw,
  Users,
  Package,
  Layers,
  Bot,
  User,
  Trash2,
} from "lucide-react";
import { VoiceSphere } from "./components/VoiceSphere";
import { ThermalTicket } from "./components/ThermalTicket";
import { WorkshopGrid } from "./components/WorkshopGrid";
import { InvoicesList } from "./components/InvoicesList";
import { CustomersList } from "./components/CustomersList";
import { InventoryList } from "./components/InventoryList";
import { ChatNetwork } from "./components/ChatNetwork";
import { ExecutiveTerminal } from "./components/ExecutiveTerminal";
import { TicketEditorModal } from "./components/TicketEditorModal";
import { KingPcLogo } from "./components/KingPcLogo";
import { Ticket, Factura, Contacto, Cliente, InventarioItem, VoiceCommandResponse } from "./types";
import { speakText, stopCurrentAudio, unlockAudio, getAllSpanishVoices } from "./utils/audio";

interface ChatMessage {
  id: string;
  sender: "user" | "neutron";
  text: string;
  time: string;
  ticketUpdated?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "asistente" | "ordenes" | "clientes" | "inventario" | "facturas" | "chat" | "terminal"
  >("asistente");

  // App State - Connected to 15e Colony Database
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [activeFactura, setActiveFactura] = useState<Factura | null>(null);
  const [contacts, setContacts] = useState<Contacto[]>([]);
  const [activeContact, setActiveContact] = useState<Contacto | null>(null);

  // Chat Log with Neutrón in the platform
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "neutron",
      text: "¡Hola señor! Asistente Neutrón a la orden para King PC Colonia. ¿Qué necesita que hagamos hoy?",
      time: new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  // Voice & Interaction State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");
  const [inputText, setInputText] = useState("");
  const [lastResponseText, setLastResponseText] = useState(
    "A la orden Josué, asistente Neutrón conectado a la base de datos de 15e Colony. Listo para generar tickets de taller, gestionar clientes y controlar inventario."
  );
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string>("browser-male");
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initial Data Fetch & Voice loader
  useEffect(() => {
    fetchInitialData(true);
    setupSpeechRecognition();
    getAllSpanishVoices().then((v) => {
      if (v && v.length > 0) setSystemVoices(v);
    });
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        getAllSpanishVoices().then((v) => {
          if (v && v.length > 0) setSystemVoices(v);
        });
      };
    }
  }, []);

  const fetchInitialData = async (isInitialMount = false) => {
    try {
      const [resTickets, resFacturas, resClientes, resInventario, resContacts] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/facturas"),
        fetch("/api/clientes"),
        fetch("/api/inventario"),
        fetch("/api/network/contacts"),
      ]);

      if (resTickets.ok) {
        const d = await resTickets.json();
        setTickets(d.tickets || []);
        if (isInitialMount && d.tickets?.length > 0) {
          setActiveTicket((curr) => curr || d.tickets[0]);
        }
      }

      if (resClientes.ok) {
        const d = await resClientes.json();
        setClientes(d.clientes || []);
      }

      if (resInventario.ok) {
        const d = await resInventario.json();
        setInventario(d.inventario || []);
      }

      if (resFacturas.ok) {
        const d = await resFacturas.json();
        setFacturas(d.facturas || []);
        if (isInitialMount && d.facturas?.length > 0) {
          setActiveFactura((curr) => curr || d.facturas[0]);
        }
      }

      if (resContacts.ok) {
        const d = await resContacts.json();
        setContacts(d.contacts || []);
        if (d.contacts?.length > 0 && !activeContact) {
          setActiveContact(d.contacts[0]);
        }
      }
    } catch (e) {
      console.warn("Error fetching initial state:", e);
    }
  };

  const silenceTimerRef = useRef<any>(null);
  const recognitionActiveRef = useRef<boolean>(false);
  const conversationModeRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Regional dialect support (UY / AR / ES / 419)
      const userLang = navigator.language || "es-UY";
      recognition.lang = userLang.startsWith("es") ? userLang : "es-419";

      recognition.onstart = () => {
        setIsListening(true);
        recognitionActiveRef.current = true;
      };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return; // Do not transcribe while Neutrón is speaking

        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        fullTranscript = fullTranscript.trim();
        setTranscript(fullTranscript);
        transcriptRef.current = fullTranscript;

        // Reset silence timer on every new word detected
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Conversational pause: 1.8 seconds of silence after talking triggers automatic response
        if (fullTranscript.length >= 3) {
          silenceTimerRef.current = setTimeout(() => {
            if (conversationModeRef.current && transcriptRef.current.trim().length >= 3) {
              handleStopAndSubmitListening();
            }
          }, 1800);
        }
      };

      recognition.onend = () => {
        // If conversation mode is still active and we are not speaking/processing, resume listening
        if (conversationModeRef.current && recognitionActiveRef.current && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (conversationModeRef.current && !isSpeakingRef.current) {
                try {
                  recognition.start();
                } catch (err) {}
              }
            }, 300);
          }
        } else if (!recognitionActiveRef.current) {
          setIsListening(false);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === "not-allowed") {
          setIsListening(false);
          recognitionActiveRef.current = false;
          conversationModeRef.current = false;
          alert("El micrófono está bloqueado. Haz clic en el icono del candado o configuración del sitio en tu navegador y selecciona 'Permitir micrófono'.");
          return;
        }
        if ((e.error === "no-speech" || e.error === "network") && conversationModeRef.current) {
          // Keep listening for user's next words in conversation mode
          return;
        }
      };

      recognitionRef.current = recognition;
    }
  };

  const startListeningMicrophone = () => {
    if (!conversationModeRef.current) return;
    setTranscript("");
    transcriptRef.current = "";
    recognitionActiveRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      try {
        recognitionRef.current?.stop();
        setTimeout(() => {
          if (conversationModeRef.current) {
            recognitionActiveRef.current = true;
            recognitionRef.current?.start();
            setIsListening(true);
          }
        }, 150);
      } catch (err) {}
    }
  };

  const pauseListeningMicrophone = () => {
    recognitionActiveRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    setIsListening(false);
  };

  const handleStopAndSubmitListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    pauseListeningMicrophone();

    const spoken = transcriptRef.current.trim();
    if (spoken) {
      executeCommand(spoken);
    }
  };

  const handleCancelListening = () => {
    conversationModeRef.current = false;
    pauseListeningMicrophone();
    stopCurrentAudio();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setTranscript("");
    transcriptRef.current = "";
  };

  const toggleListen = async () => {
    if (conversationModeRef.current) {
      // Deactivate conversation mode
      handleCancelListening();
    } else {
      // Prompt user for microphone permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.warn("Microphone permission denied:", err);
          alert("Por favor permite el acceso al micrófono en tu navegador para hablar con Neutrón.");
          return;
        }
      }

      // Activate conversation mode
      conversationModeRef.current = true;
      unlockAudio();
      stopCurrentAudio();
      setTranscript("");
      transcriptRef.current = "";

      const greeting = "¡Hola señor! Asistente Neutrón a la orden. ¿Qué coordinamos hoy?";
      setLastResponseText(greeting);
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      try {
        await speakText(greeting, voiceName);
      } catch (e) {
        console.warn("Greeting audio error:", e);
      } finally {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // As soon as Neutrón finishes speaking, stay listening in GREEN mode
        if (conversationModeRef.current) {
          startListeningMicrophone();
        }
      }
    }
  };

  const executeCommand = async (textToRun: string) => {
    if (!textToRun.trim()) return;
    unlockAudio();

    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: textToRun,
      time: new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatLog((prev) => [...prev, userMessage]);

    setIsProcessing(true);
    setInputText("");

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToRun,
          current_ticket: activeTicket?.ticket_num || null,
        }),
      });

      if (res.ok) {
        const data: VoiceCommandResponse = await res.json();
        setIsProcessing(false);

        if (data.ticket) {
          setActiveTicket(data.ticket);
          setTickets((prev) => [data.ticket!, ...prev.filter((t) => t.ticket_num !== data.ticket!.ticket_num)]);
          setActiveTab("asistente");
        }

        if (data.factura) {
          setActiveFactura(data.factura);
          setFacturas((prev) => [data.factura!, ...prev.filter((f) => f.factura_num !== data.factura!.factura_num)]);
          setActiveTab("facturas");
        }

        if (data.texto_escrito) {
          setGeneratedCode(data.texto_escrito);
          setActiveTab("terminal");
        }

        fetchInitialData();

        if (data.speak) {
          setLastResponseText(data.speak);
          const botMessage: ChatMessage = {
            id: "bot-" + Date.now(),
            sender: "neutron",
            text: data.speak,
            time: new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
            ticketUpdated:
              data.intent === "actualizar_ticket" || data.intent === "crear_ticket"
                ? data.ticket?.ticket_num
                : undefined,
          };
          setChatLog((prev) => [...prev, botMessage]);

          setIsSpeaking(true);
          isSpeakingRef.current = true;
          pauseListeningMicrophone();

          try {
            await speakText(data.speak, voiceName);
          } catch (e) {
            console.warn("Audio speech error:", e);
          } finally {
            setIsSpeaking(false);
            isSpeakingRef.current = false;

            // If the user explicitly requested deactivation ("desactívate neutrón", "apágate")
            if (data.intent === "desactivar") {
              handleCancelListening();
            } else if (conversationModeRef.current) {
              // CRITICAL: Fluid continuous conversation loop - never stop listening unless told "desactívate neutrón"
              startListeningMicrophone();
            }
          }
        } else {
          const botMessage: ChatMessage = {
            id: "bot-" + Date.now(),
            sender: "neutron",
            text: "Entendido señor. Operación procesada.",
            time: new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
          };
          setChatLog((prev) => [...prev, botMessage]);

          if (data.intent === "desactivar") {
            handleCancelListening();
          } else if (conversationModeRef.current) {
            startListeningMicrophone();
          }
        }
      } else {
        setIsProcessing(false);
        if (conversationModeRef.current) {
          startListeningMicrophone();
        }
      }
    } catch (err) {
      setIsProcessing(false);
      console.error("Error executing command:", err);
      if (conversationModeRef.current) {
        startListeningMicrophone();
      }
    }
  };

  const handleStopSpeech = () => {
    stopCurrentAudio();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    if (conversationModeRef.current) {
      startListeningMicrophone();
    }
  };

  const handleOpenEditTicket = (t: Ticket) => {
    setEditingTicket(t);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTicket = async (updated: Ticket) => {
    try {
      const res = await fetch(`/api/tickets/${updated.ticket_num}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const d = await res.json();
        setActiveTicket(d.ticket);
        fetchInitialData();
        const msg = `Orden ${updated.ticket_num} actualizada correctamente.`;
        setLastResponseText(msg);
        speakText(msg, voiceName);
      }
    } catch (e) {}
  };

  const handleDeleteTicket = async (ticketNum: string) => {
    if (!confirm(`¿Eliminar ticket ${ticketNum}?`)) return;
    try {
      await fetch(`/api/tickets/${ticketNum}`, { method: "DELETE" });
      fetchInitialData();
      if (activeTicket?.ticket_num === ticketNum) {
        setActiveTicket(null);
      }
    } catch (e) {}
  };

  const handleCreateNewTicket = (prefill?: Partial<Ticket>) => {
    const dummyTicket: Ticket = {
      ticket_num: "ST-NUEVO",
      fecha: new Date().toISOString(),
      cliente: prefill?.cliente || "Particular",
      ci: prefill?.ci || "S/N",
      telefono: prefill?.telefono || "099 000 000",
      dispositivo: prefill?.dispositivo || "TELEVISOR PANAVOX 40 PULGADAS",
      falla: prefill?.falla || "Revisión técnica / Para reparar",
      presupuesto: null,
      abono: 0,
      saldo: null,
      revision_pagada: "NO",
      estado: "recibido",
    };
    setEditingTicket(dummyTicket);
    setIsEditModalOpen(true);
  };

  const handleSaveStickerToChat = (stickerUrl: string) => {
    if (activeContact) {
      fetch("/api/network/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: activeContact.contact_id,
          tipo: "sticker",
          mensaje: stickerUrl,
        }),
      });
      setActiveTab("chat");
    }
  };

  return (
    <div className="min-h-screen bg-[#050a24] text-slate-100 flex flex-col font-sans selection:bg-[#f6c90e] selection:text-black">
      {/* Clean King PC Minimal Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#060b24]/95 backdrop-blur-md border-b border-[#16296b] px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-2.5">
          {/* Main Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveTab("asistente")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "asistente"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              🎙️ Asistente & Mesa
            </button>

            <button
              onClick={() => setActiveTab("ordenes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "ordenes"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <Wrench className="w-4 h-4" />
              📋 Registro de Órdenes ({tickets.length})
            </button>

            <button
              onClick={() => setActiveTab("clientes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "clientes"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <Users className="w-4 h-4" />
              👥 Base 15e Clientes ({clientes.length})
            </button>

            <button
              onClick={() => setActiveTab("inventario")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "inventario"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <Package className="w-4 h-4" />
              📦 Repuestos & Stock ({inventario.length})
            </button>

            <button
              onClick={() => setActiveTab("facturas")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "facturas"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <Receipt className="w-4 h-4" />
              🧾 Facturas & Caja ({facturas.length})
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "chat"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              💬 Red Chat Taller
            </button>

            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-[#f6c90e] text-slate-950 font-black shadow-md shadow-yellow-500/20"
                  : "text-slate-200 hover:text-[#f6c90e] hover:bg-[#0a1545]"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
              💻 Cerebro Neutrón
            </button>
          </div>

          {/* Voice selector & Test button */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#04081c] border border-[#16296b] text-xs shrink-0">
            <span className="text-slate-400 font-medium">Voz:</span>
            <select
              value={voiceName}
              onChange={(e) => {
                setVoiceName(e.target.value);
                unlockAudio();
              }}
              className="bg-transparent text-[#f6c90e] font-bold focus:outline-none cursor-pointer text-xs max-w-[150px] truncate"
            >
              <option value="browser-male" className="bg-[#060e2e] text-white">Voz Neutrón (Auto)</option>
              {systemVoices.map((v) => (
                <option key={v.name} value={v.name} className="bg-[#060e2e] text-white">
                  {v.name.replace(/Microsoft|Google/gi, "").trim()}
                </option>
              ))}
              <option value="Fenrir" className="bg-[#060e2e] text-white">Fenrir (Gemini)</option>
              <option value="Zephyr" className="bg-[#060e2e] text-white">Zephyr (Gemini)</option>
              <option value="Puck" className="bg-[#060e2e] text-white">Puck (Gemini)</option>
            </select>
            <button
              id="btn-test-voice"
              onClick={() => {
                unlockAudio();
                speakText("Hola señor, la voz de Neutrón está activa y lista para operar en King PC.", voiceName);
              }}
              className="ml-1 px-2 py-0.5 bg-[#0026e6] hover:bg-[#003be6] text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow active:scale-95"
              title="Probar audio de Neutrón"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Probar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* ================= TAB 1: ASISTENTE & TALLER ================= */}
        {activeTab === "asistente" && (
          <div className="space-y-6">
            {/* Top Assistant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Voice Sphere & Direct Interactive Chat Panel */}
              <div className="md:col-span-5 space-y-4">
                <VoiceSphere
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isProcessing={isProcessing}
                  onToggleListen={toggleListen}
                  onStopSpeech={handleStopSpeech}
                  onSubmitListen={handleStopAndSubmitListening}
                  onCancelListen={handleCancelListening}
                  lastSpokenText={lastResponseText}
                  transcript={transcript}
                />

                {/* Live Chat with Neutrón in Platform */}
                <div className="bg-[#060e2e]/95 border border-[#16296b] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                  {/* Chat Header */}
                  <div className="p-3 bg-[#04081c] border-b border-[#16296b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-[#f6c90e] uppercase tracking-wider flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#f6c90e]" />
                        Chat con Neutrón (King PC IA)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setChatLog([
                          {
                            id: "init-" + Date.now(),
                            sender: "neutron",
                            text: "Chat reiniciado señor. ¿En qué le puedo colaborar?",
                            time: new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
                          },
                        ])
                      }
                      className="text-slate-400 hover:text-red-400 p-1 transition cursor-pointer"
                      title="Limpiar historial de chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="p-3 space-y-2.5 max-h-56 min-h-[140px] overflow-y-auto bg-[#030617]/70 scrollbar-thin">
                    {chatLog.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-[#0026e6] text-white rounded-br-none shadow-md shadow-blue-500/20"
                              : "bg-[#0a1545] text-slate-100 border border-[#16296b] rounded-bl-none shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-0.5 text-[10px] opacity-75 font-semibold">
                            {msg.sender === "user" ? (
                              <div className="flex items-center gap-1">
                                <span>Usted (Señor)</span>
                                <User className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1">
                                  <Bot className="w-3 h-3 text-[#f6c90e]" />
                                  <span className="text-[#f6c90e] font-bold">Neutrón</span>
                                </div>
                                <button
                                  onClick={() => speakText(msg.text, voiceName)}
                                  className="text-slate-400 hover:text-[#f6c90e] transition p-0.5 rounded cursor-pointer"
                                  title="Reproducir audio"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="font-normal">{msg.text}</p>
                          {msg.ticketUpdated && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
                              Ticket {msg.ticketUpdated} Actualizado
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                          {msg.time}
                        </span>
                      </div>
                    ))}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Direct Typing Input inside Chat Box */}
                  <div className="p-2.5 bg-[#04081c] border-t border-[#16296b] flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && executeCommand(inputText)}
                      placeholder="Escribe a Neutrón (ej: 'El motivo es cambio de placa main')..."
                      className="flex-1 px-3.5 py-2 text-xs bg-[#060e2e] border border-[#16296b] rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f6c90e]"
                    />
                    <button
                      id="btn-chat-send"
                      onClick={() => executeCommand(inputText)}
                      disabled={isProcessing}
                      className="p-2.5 bg-[#f6c90e] hover:bg-[#e5b60e] active:scale-95 text-slate-950 rounded-xl shadow-md font-bold transition cursor-pointer disabled:opacity-50"
                      title="Enviar mensaje a Neutrón"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Ticket Thermal Preview & 1-Click Print Options */}
              <div className="md:col-span-7 space-y-4">
                {activeTicket ? (
                  <ThermalTicket
                    ticket={activeTicket}
                    onEdit={handleOpenEditTicket}
                    onGenerateInvoice={(fac) => {
                      setActiveFactura(fac);
                      setFacturas((prev) => [fac, ...prev.filter((f) => f.factura_num !== fac.factura_num)]);
                      setActiveTab("facturas");
                      fetchInitialData();
                    }}
                  />
                ) : (
                  <div className="bg-[#060e2e]/95 border border-[#16296b] rounded-2xl p-10 text-center text-slate-400 text-sm space-y-3 shadow-xl">
                    <p className="font-semibold">No hay ticket en mesa activo.</p>
                    <button
                      onClick={() => handleCreateNewTicket()}
                      className="px-4 py-2 rounded-xl bg-[#f6c90e] hover:bg-[#e5b60e] text-slate-950 font-black text-xs shadow-lg shadow-yellow-500/20"
                    >
                      + Crear Nueva Orden
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: REGISTRO DE ÓRDENES ================= */}
        {activeTab === "ordenes" && (
          <WorkshopGrid
            tickets={tickets}
            onSelectTicket={(t) => {
              setActiveTicket(t);
              setActiveTab("asistente");
            }}
            onEditTicket={handleOpenEditTicket}
            onNewTicket={() => handleCreateNewTicket()}
            onDeleteTicket={handleDeleteTicket}
            onSaveInline={handleSaveEditedTicket}
          />
        )}

        {/* ================= TAB 3: BASE DE CLIENTES 15E COLONY ================= */}
        {activeTab === "clientes" && (
          <CustomersList
            clientes={clientes}
            tickets={tickets}
            onRefresh={fetchInitialData}
            onNewTicketForCustomer={(c) => {
              handleCreateNewTicket({
                cliente: c.nombre,
                ci: c.ci,
                telefono: c.telefono,
              });
            }}
          />
        )}

        {/* ================= TAB 4: INVENTARIO & REPUESTOS ================= */}
        {activeTab === "inventario" && (
          <InventoryList
            items={inventario}
            onRefresh={fetchInitialData}
            onEmitInvoice={(fac) => {
              setActiveFactura(fac);
              setFacturas((prev) => [fac, ...prev.filter((f) => f.factura_num !== fac.factura_num)]);
              setActiveTab("facturas");
              fetchInitialData();
            }}
          />
        )}

        {/* ================= TAB 5: FACTURACIÓN ================= */}
        {activeTab === "facturas" && (
          <InvoicesList
            facturas={facturas}
            activeFactura={activeFactura}
            onSelectFactura={(f) => setActiveFactura(f)}
          />
        )}

        {/* ================= TAB 6: RED CHAT TALLER ================= */}
        {activeTab === "chat" && (
          <ChatNetwork
            contacts={contacts}
            activeContact={activeContact}
            onSelectContact={(c) => setActiveContact(c)}
          />
        )}

        {/* ================= TAB 7: TERMINAL & CEREBRO ================= */}
        {activeTab === "terminal" && (
          <ExecutiveTerminal
            onLearnPersonality={(r) => executeCommand(`Aprende que: ${r}`)}
            onLearnMemory={(m) => executeCommand(`Acordate que: ${m}`)}
            generatedCode={generatedCode}
          />
        )}
      </main>

      {/* King PC Official Footer with Aparicio Saravia */}
      <footer className="bg-[#030617] border-t border-[#16296b] py-4 px-4 text-center text-xs text-slate-400 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KingPcLogo theme="dark" width={110} height={30} />
            <span className="text-slate-500 font-bold">|</span>
            <span className="text-slate-300 font-medium">Av. Aparicio Saravia 884 • Colonia del Sacramento • Tel: 091 606 108 / 4523 7187</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Copyright © KING PC COLONIA - 2020 - 2026 | Tienda Online & Servicio Técnico
          </div>
        </div>
      </footer>

      {/* Ticket Edit Modal */}
      <TicketEditorModal
        ticket={editingTicket}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEditedTicket}
      />
    </div>
  );
}
