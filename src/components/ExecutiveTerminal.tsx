import React, { useState } from "react";
import { Terminal, Sparkles, Copy, Check } from "lucide-react";

interface ExecutiveTerminalProps {
  onLearnPersonality: (rule: string) => void;
  onLearnMemory: (memory: string) => void;
  generatedCode?: string | null;
}

export const ExecutiveTerminal: React.FC<ExecutiveTerminalProps> = ({
  onLearnPersonality,
  onLearnMemory,
  generatedCode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"terminal" | "personalidad" | "sql">("terminal");
  const [personalityInput, setPersonalityInput] = useState("");
  const [memoryInput, setMemoryInput] = useState("");
  const [copied, setCopied] = useState(false);

  const defaultConsoleOutput = `[Neutrón Kernel v8.0] Sistema de Taller y Voz KING PC Inicializado.
- Contenedor Docker: aee65829842a (root@v2202606366012467898)
- Base de datos MySQL: kingpc_db (tavl_reparaciones, tavl_clientes, articulos, tavl_facturas)
- Host MySQL: 127.0.0.1:3306 (Usuario: root)
- Motor TTS: gemini-3.1-flash-tts-preview & Web Speech API (24000Hz PCM)
- Servidor: Express + Vite Full Stack Port 3000
- Endpoint Comandos: POST /neutron/api/command & /api/command
- Script Térmica: /scripts/imprimir_termica.sh (ESC/POS 80mm)
- Sincronización: kingpccolonia.com/neutron`;

  const handleCopyCode = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#0026e6]" />
          <h3 className="font-black text-slate-900 text-sm">Terminal & Cerebro Neutrón</h3>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab("terminal")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "terminal"
                ? "bg-[#0026e6] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💻 Consola / Código
          </button>
          <button
            onClick={() => setActiveSubTab("personalidad")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "personalidad"
                ? "bg-[#0026e6] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🧠 Memoria & Voz
          </button>
          <button
            onClick={() => setActiveSubTab("sql")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "sql"
                ? "bg-[#0026e6] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🗄️ Esquema DB
          </button>
        </div>
      </div>

      {/* Tab 1: Terminal & Code Block */}
      {activeSubTab === "terminal" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Salida de Consola & Scripting:</span>
            {generatedCode && (
              <button
                onClick={() => handleCopyCode(generatedCode)}
                className="flex items-center gap-1 text-blue-700 font-bold hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiado" : "Copiar Código"}
              </button>
            )}
          </div>

          <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-64 leading-relaxed select-all">
            {generatedCode || defaultConsoleOutput}
          </pre>
        </div>
      )}

      {/* Tab 2: Memory & Personality Trainer */}
      {activeSubTab === "personalidad" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Entrenar Tono y Personalidad
            </h4>
            <p className="text-[11px] text-slate-600">
              Indica directrices de conducta, modismos de Colonia o saludos para Neutrón.
            </p>
            <textarea
              rows={3}
              value={personalityInput}
              onChange={(e) => setPersonalityInput(e.target.value)}
              placeholder="Ej: 'Siempre saluda diciendo: Bienvenido al laboratorio de King PC Colonia...'"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0026e6]"
            />
            <button
              onClick={() => {
                if (personalityInput.trim()) {
                  onLearnPersonality(personalityInput.trim());
                  setPersonalityInput("");
                }
              }}
              className="w-full py-2 bg-[#0026e6] hover:bg-[#001ec2] text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
            >
              Guardar Regla de Personalidad
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-blue-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Guardar Dato en Memoria a Largo Plazo
            </h4>
            <p className="text-[11px] text-slate-600">
              Registra información clave sobre clientes frecuentes, horarios o repuestos.
            </p>
            <textarea
              rows={3}
              value={memoryInput}
              onChange={(e) => setMemoryInput(e.target.value)}
              placeholder="Ej: 'El cliente Gustavo siempre pide que le prueben las tiras LED antes de retirar...'"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0026e6]"
            />
            <button
              onClick={() => {
                if (memoryInput.trim()) {
                  onLearnMemory(memoryInput.trim());
                  setMemoryInput("");
                }
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
            >
              Fijar en Memoria de Neutrón
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: SQL Schema */}
      {activeSubTab === "sql" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-mono">
            Esquema Relacional MySQL (kingpccolonia.com):
          </div>
          <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-64 leading-relaxed">
{`-- Tablas sincronizadas con www.kingpccolonia.com/neutron
CREATE TABLE tavl_reparaciones (
  ticket_num VARCHAR(30) PRIMARY KEY,
  cliente VARCHAR(150) NOT NULL,
  telefono VARCHAR(50),
  ci VARCHAR(30),
  dispositivo VARCHAR(150),
  modelo VARCHAR(100),
  n_serie VARCHAR(100),
  falla TEXT,
  presupuesto DECIMAL(10,2),
  abono DECIMAL(10,2),
  saldo DECIMAL(10,2),
  estado VARCHAR(40),
  tecnico_asignado VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  modelo VARCHAR(100),
  n_serie VARCHAR(100),
  stock INT DEFAULT 0,
  stock_minimo INT DEFAULT 2,
  precio DECIMAL(10,2) NOT NULL,
  precio_costo DECIMAL(10,2),
  detalles TEXT
);`}
          </pre>
        </div>
      )}
    </div>
  );
};
